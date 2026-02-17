import { GameState } from '../shared/GameState.js';
import { MapGenerator } from '../shared/MapGenerator.js';
import { Entity } from '../shared/Entity.js';

export class GameServer {
    constructor(roomId, io, maxPlayers = 4) {
        this.roomId = roomId;
        this.io = io;
        this.maxPlayers = maxPlayers;
        this.state = new GameState();
        this.playerSockets = [];
        this.gameStarted = false;
        this.gameEnded = false;
        this.GAME_TIME_LIMIT = 15 * 60; // 15 minutes in seconds
        this.gameSettings = {
            speedMultiplier: 1,
            acceleration: true,
            showProduction: true
        };
    }

    applySettings(settings) {
        this.gameSettings = { ...this.gameSettings, ...settings };
        // Apply to game state
        this.state.speedMultiplier = this.gameSettings.speedMultiplier;
        this.state.accelerationEnabled = this.gameSettings.acceleration;
        this.state.showProduction = this.gameSettings.showProduction;
    }

    addPlayer(socket) {
        if (this.playerSockets.length < this.maxPlayers) {
            this.playerSockets.push(socket);
            const playerIndex = this.playerSockets.length - 1;
            return playerIndex;
        }
        return -1;
    }

    removePlayer(socketId) {
        const idx = this.playerSockets.findIndex(s => s.id === socketId);
        if (idx !== -1) {
            const removedPlayerIndex = idx;
            this.playerSockets.splice(idx, 1);
            
            // Reassign player indices
            this.playerSockets.forEach((s, i) => s.playerIndex = i);
            
            // Make disconnected player's nodes neutral
            this.state.nodes.forEach(n => {
                if (n.owner === removedPlayerIndex) {
                    n.owner = -1;
                    n.baseHp = n.maxHp;
                }
            });
            
            // Remove all entities from disconnected player
            this.state.entities = this.state.entities.filter(e => e.owner !== removedPlayerIndex);
        }
        if (this.playerSockets.length === 0) {
            this.gameStarted = false;
            this.gameEnded = false;
        }
    }

    handleAction(socketId, action) {
        const playerIndex = this.playerSockets.findIndex(s => s.id === socketId);
        if (playerIndex === -1) return;

        if (action.type === 'move') {
            const { targetNodeId, targetX, targetY, unitIds } = action;
            const target = targetNodeId ? this.state.nodes.find(n => n.id === targetNodeId) : null;

            unitIds.forEach(id => {
                const entity = this.state.entities.find(e => e.id === id);
                if (entity && entity.owner === playerIndex) {
                    entity.setTarget(targetX, targetY, target);
                }
            });
        }
        else if (action.type === 'path') {
            const { unitIds, path } = action;
            unitIds.forEach(id => {
                const entity = this.state.entities.find(e => e.id === id);
                if (entity && entity.owner === playerIndex) {
                    entity.waypoints = [...path];
                    entity.currentTarget = null;
                }
            });
        }
        else if (action.type === 'rally') {
            const { nodeIds, targetX, targetY, targetNodeId } = action;
            const targetNode = targetNodeId ? this.state.nodes.find(n => n.id === targetNodeId) : null;
            nodeIds.forEach(id => {
                const node = this.state.nodes.find(n => n.id === id);
                if (node && node.owner === playerIndex) {
                    node.setRallyPoint(targetX, targetY, targetNode);
                }
            });
        }
        else if (action.type === 'stop') {
            const { unitIds } = action;
            unitIds.forEach(id => {
                const entity = this.state.entities.find(e => e.id === id);
                if (entity && entity.owner === playerIndex) {
                    entity.stop();
                }
            });
        }
        
        // Check if player is defeated - restrict actions
        if (this.playerSockets[playerIndex]?.defeated) {
            // Defeated players can only move/attack, not capture nodes
            // Allow stop and move, but NOT path to neutral/enemy nodes
            if (action.type === 'path') {
                return; // Block waypoint paths
            }
            if (action.type === 'rally') {
                return; // Block rally points
            }
            // Allow move but target node capture is blocked in Node logic
        }
    }

    handleSurrender(socketId) {
        const playerIndex = this.playerSockets.findIndex(s => s.id === socketId);
        if (playerIndex === -1) return;
        
        // Mark player as defeated
        const player = this.playerSockets[playerIndex];
        player.defeated = true;
        player.surrendered = true;
        
        console.log(`Player ${playerIndex} surrendered - can only move/attack now`);
        
        // Notify other players
        this.io.to(this.roomId).emit('playerDefeated', { playerIndex, surrendered: true });
    }

    checkPlayerDefeated(playerIndex) {
        const player = this.playerSockets[playerIndex];
        if (!player || player.defeated) return;
        
        const playerNodes = this.state.nodes.filter(n => n.owner === playerIndex);
        const playerEntities = this.state.entities.filter(e => e.owner === playerIndex && !e.dead && !e.dying);
        
        // Player is defeated if no nodes and no entities
        if (playerNodes.length === 0 && playerEntities.length === 0) {
            player.defeated = true;
            console.log(`Player ${playerIndex} defeated - no nodes or units`);
            this.io.to(this.roomId).emit('playerDefeated', { playerIndex, surrendered: false });
        }
    }

    checkWinCondition() {
        if (this.gameEnded) return;

        // Check time limit - winner by production
        const elapsed = this.state.elapsedTime || 0;
        if (elapsed >= this.GAME_TIME_LIMIT) {
            this.gameEnded = true;
            const stats = this.state.getStats();
            
            // Find player with most produced units
            let maxProduction = -1;
            let winnerIndex = -1;
            for (let pid in stats.produced) {
                const production = stats.produced[pid]?.total || 0;
                if (production > maxProduction) {
                    maxProduction = production;
                    winnerIndex = parseInt(pid);
                }
            }
            
            console.log(`Time's up! Winner by production: Player ${winnerIndex} (${maxProduction} units)`);
            this.io.to(this.roomId).emit('gameOver', { 
                winner: winnerIndex,
                stats: stats,
                reason: 'time'
            });
            return;
        }

        const activePlayers = [];
        const playerCounts = {};
        
        for (let i = 0; i < this.playerSockets.length; i++) {
            // Skip surrendered players
            if (this.playerSockets[i].surrendered) continue;
            
            const playerNodes = this.state.nodes.filter(n => n.owner === i);
            const playerEntities = this.state.entities.filter(e => e.owner === i && !e.dead && !e.dying);
            
            const totalUnits = playerNodes.length * 5 + playerEntities.length;
            playerCounts[i] = totalUnits;
            
            if (playerNodes.length > 0 || playerEntities.length > 0) {
                activePlayers.push(i);
            }
        }

        // If only one non-surrendered player has nodes/units, they win
        if (activePlayers.length === 1 && this.playerSockets.length > 1) {
            this.gameEnded = true;
            const winnerIndex = activePlayers[0];
            console.log(`Game Over! Winner: Player ${winnerIndex}`);
            this.io.to(this.roomId).emit('gameOver', { 
                winner: winnerIndex,
                stats: this.state.getStats()
            });
            return;
        }

        // If no active players left
        if (activePlayers.length === 0) {
            this.gameEnded = true;
            this.io.to(this.roomId).emit('gameOver', { 
                winner: -1,
                stats: this.state.getStats()
            });
        }
    }

    start() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.gameEnded = false;
        this.initLevel();

        let lastTime = Date.now();
        const loop = () => {
            if (!this.gameStarted || this.gameEnded) return;
            const now = Date.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            this.state.update(dt, this);
            this.io.to(this.roomId).emit('gameState', this.state.getState());
            
            // Check if any player is defeated
            for (let i = 0; i < this.playerSockets.length; i++) {
                this.checkPlayerDefeated(i);
            }
            
            // Check win condition every second (every 30 frames)
            this.checkWinCondition();

            if (!this.gameEnded) {
                setTimeout(loop, 1000 / 30);
            }
        };
        loop();
    }

    initLevel() {
        const actualPlayers = this.playerSockets.length;
        this.state.playerCount = actualPlayers;
        
        // Generate map with actual player count
        this.state.nodes = MapGenerator.generate(
            actualPlayers,
            this.state.worldWidth,
            this.state.worldHeight
        );

        // Spawn initial entities - MORE units for multiplayer
        this.state.nodes.forEach(node => {
            if (node.owner !== -1) {
                // Spawn 20 units per node (was 15)
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = node.radius + 30;
                    const ent = new Entity(
                        node.x + Math.cos(angle) * dist,
                        node.y + Math.sin(angle) * dist,
                        node.owner,
                        Date.now() + i + (node.owner * 1000)
                    );
                    this.state.entities.push(ent);
                }
            }
        });
    }

    spawnParticles(x, y, color, count, type) {
    }
}
