import { MapGenerator } from '../shared/MapGenerator.js';
import { SharedMemory, MEMORY_LAYOUT } from '../shared/SharedMemory.js';
import { EntityData, DEATH_TYPES } from '../shared/EntityData.js';
import { NodeData } from '../shared/NodeData.js';
import { GameEngine } from '../shared/GameEngine.js';

export class GameServer {
    constructor(roomId, io, maxPlayers = 4) {
        this.roomId = roomId;
        this.io = io;
        this.maxPlayers = maxPlayers;

        // DO setup
        this.buffer = new ArrayBuffer(MEMORY_LAYOUT.TOTAL_SIZE);
        this.sharedMemory = new SharedMemory(this.buffer);
        this.entityData = new EntityData(this.sharedMemory);
        this.nodeData = new NodeData(this.sharedMemory);

        this.playerSockets = [];
        this.gameStarted = false;
        this.gameEnded = false;
        this.GAME_TIME_LIMIT = 15 * 60; // 15 minutes in seconds
        this.gameSettings = {
            speedMultiplier: 1,
            acceleration: true,
            showProduction: true
        };
        this.gameEngine = new GameEngine(this.sharedMemory, this.entityData, this.nodeData, this.gameSettings);

        this.elapsedTime = 0;

        // Simple stats tracking
        this.stats = {
            startTime: Date.now(),
            produced: {},
            lost: {},
            captured: {}
        };
    }

    applySettings(settings) {
        this.gameSettings = { ...this.gameSettings, ...settings };
        this.gameEngine.setGameSettings(this.gameSettings);
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
            for (let i = 0; i < this.nodeData.getCount(); i++) {
                if (this.nodeData.getOwner(i) === removedPlayerIndex) {
                    this.nodeData.setOwner(i, -1);
                    this.nodeData.setBaseHp(i, this.nodeData.getMaxHp(i) * 0.1);
                }
            }

            // Kill all entities from disconnected player
            for (let i = 0; i < this.entityData.getCount(); i++) {
                if (!this.entityData.isDead(i) && this.entityData.getOwner(i) === removedPlayerIndex) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, DEATH_TYPES.EXPLOSION);
                    this.entityData.setDeathTime(i, 0);
                }
            }
        }
        if (this.playerSockets.length === 0) {
            this.gameStarted = false;
            this.gameEnded = false;
        }
    }

    handleAction(socketId, action) {
        const playerIndex = this.playerSockets.findIndex(s => s.id === socketId);
        if (playerIndex === -1) return;

        if (this.playerSockets[playerIndex]?.defeated) {
            if (action.type === 'path' || action.type === 'rally') return;
        }

        if (action.type === 'move') {
            const { targetNodeId, targetX, targetY, unitIds } = action;
            const targetId = (targetNodeId !== null && targetNodeId !== undefined) ? Number(targetNodeId) : -1;

            if (unitIds && unitIds.length > 0) {
                unitIds.forEach(id => {
                    const idNum = Number(id);
                    if (idNum >= 0 && idNum < this.entityData.getCount() && !this.entityData.isDead(idNum)) {
                        if (this.entityData.getOwner(idNum) === playerIndex) {
                            this.entityData.setTargetNodeId(idNum, targetId);
                            this.entityData.setTargetX(idNum, targetX);
                            this.entityData.setTargetY(idNum, targetY);
                            this.entityData.setHasTarget(idNum, true);
                            this.entityData.setFlockId(idNum, -1);
                        }
                    }
                });
            }
        }
        else if (action.type === 'path') {
            const { unitIds, path } = action;
            if (path && path.length > 0) {
                const targetPoint = path[path.length - 1]; // Just send to last point
                unitIds.forEach(id => {
                    const idNum = Number(id);
                    if (idNum >= 0 && idNum < this.entityData.getCount() && !this.entityData.isDead(idNum)) {
                        if (this.entityData.getOwner(idNum) === playerIndex) {
                            this.entityData.setTargetNodeId(idNum, -1);
                            this.entityData.setTargetX(idNum, targetPoint.x);
                            this.entityData.setTargetY(idNum, targetPoint.y);
                            this.entityData.setHasTarget(idNum, true);
                            this.entityData.setFlockId(idNum, -1);
                        }
                    }
                });
            }
        }
        else if (action.type === 'rally') {
            const { nodeIds, targetX, targetY, targetNodeId } = action;
            const targetId = (targetNodeId !== null && targetNodeId !== undefined) ? Number(targetNodeId) : -1;
            nodeIds.forEach(id => {
                const idNum = Number(id);
                if (idNum >= 0 && idNum < this.nodeData.getCount()) {
                    if (this.nodeData.getOwner(idNum) === playerIndex) {
                        this.nodeData.setRallyTargetNodeId(idNum, targetId);
                        this.nodeData.setRallyX(idNum, targetX);
                        this.nodeData.setRallyY(idNum, targetY);
                    }
                }
            });
        }
        else if (action.type === 'stop') {
            const { unitIds } = action;
            unitIds.forEach(id => {
                const idNum = Number(id);
                if (idNum >= 0 && idNum < this.entityData.getCount() && !this.entityData.isDead(idNum)) {
                    if (this.entityData.getOwner(idNum) === playerIndex) {
                        this.entityData.setHasTarget(idNum, false);
                    }
                }
            });
        }
    }

    handleSurrender(socketId) {
        const playerIndex = this.playerSockets.findIndex(s => s.id === socketId);
        if (playerIndex === -1) return;

        const player = this.playerSockets[playerIndex];
        player.defeated = true;
        player.surrendered = true;

        for (let i = 0; i < this.nodeData.getCount(); i++) {
            if (this.nodeData.getOwner(i) === playerIndex) {
                this.nodeData.setOwner(i, -1);
                this.nodeData.setBaseHp(i, this.nodeData.getMaxHp(i) * 0.1);
            }
        }

        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (!this.entityData.isDead(i) && this.entityData.getOwner(i) === playerIndex) {
                this.entityData.setDying(i, true);
                this.entityData.setDeathType(i, DEATH_TYPES.EXPLOSION);
                this.entityData.setDeathTime(i, 0);
            }
        }

        console.log(`Player ${playerIndex} surrendered - nodes neutralized, units killed`);
        this.io.to(this.roomId).emit('playerDefeated', { playerIndex, surrendered: true });
    }

    checkPlayerDefeated(playerIndex) {
        const player = this.playerSockets[playerIndex];
        if (!player || player.defeated) return;

        let hasNodes = false;
        for (let i = 0; i < this.nodeData.getCount(); i++) {
            if (this.nodeData.getOwner(i) === playerIndex) {
                hasNodes = true;
                break;
            }
        }

        if (!hasNodes) {
            player.defeated = true;
            console.log(`Player ${playerIndex} defeated - no nodes`);
            this.io.to(this.roomId).emit('playerDefeated', { playerIndex, surrendered: false });
        }
    }

    getStats() {
        // Minimal stats needed by clients to avoid crashing
        let current = {};
        for (let i = 0; i < this.playerSockets.length; i++) current[i] = 0;

        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (!this.entityData.isDead(i) && !this.entityData.isDying(i)) {
                let owner = this.entityData.getOwner(i);
                if (owner !== -1) {
                    current[owner] = (current[owner] || 0) + 1;
                }
            }
        }

        const producedMapped = {};
        for (let pid in this.stats.produced) {
            producedMapped[pid] = { total: this.stats.produced[pid] };
        }

        return {
            elapsed: this.elapsedTime / 60,
            produced: producedMapped,
            current: current,
            lost: {},
            captured: this.stats.captured,
            history: [],
            nodeHistory: [],
            productionHistory: [],
            events: []
        };
    }

    checkWinCondition() {
        if (this.gameEnded) return;

        if (this.elapsedTime >= this.GAME_TIME_LIMIT) {
            this.gameEnded = true;
            const stats = this.getStats();

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
        for (let i = 0; i < this.playerSockets.length; i++) {
            if (this.playerSockets[i].surrendered) continue;
            let hasNodes = false;
            for (let n = 0; n < this.nodeData.getCount(); n++) {
                if (this.nodeData.getOwner(n) === i) {
                    hasNodes = true;
                    break;
                }
            }
            if (hasNodes) {
                activePlayers.push(i);
            }
        }

        if (activePlayers.length === 1 && this.playerSockets.length > 1) {
            this.gameEnded = true;
            const winnerIndex = activePlayers[0];
            console.log(`Game Over! Winner: Player ${winnerIndex}`);
            this.io.to(this.roomId).emit('gameOver', {
                winner: winnerIndex,
                stats: this.getStats()
            });
            return;
        }

        if (activePlayers.length === 0) {
            this.gameEnded = true;
            this.io.to(this.roomId).emit('gameOver', {
                winner: -1,
                stats: this.getStats()
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
            this.elapsedTime += dt;

            // Step physics
            this.gameEngine.step(dt);

            // Process events (spawns, deaths) from SharedMemory
            this.processEvents();

            this.sharedMemory.incrementFrameCounter();

            // Send partial specific data instead of the full buffer to save bandwidth
            this.sendSyncState();

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

    processEvents() {
        // Collect deaths for stats
        const deathEvents = this.sharedMemory.getDeathEvents();
        for (const ev of deathEvents) {
            if (ev.owner !== -1) {
                this.stats.lost[ev.owner] = (this.stats.lost[ev.owner] || 0) + 1;
            }
        }

        // Process spawns - add to EntityData (which keeps entityData.count in sync)
        const spawnEvents = this.sharedMemory.getSpawnEvents();
        for (const ev of spawnEvents) {
            const index = this.entityData.allocate(ev.x, ev.y, ev.owner, 0);
            if (index !== -1) {
                // Set entity ID = its buffer index so client can resolve selections
                this.entityData.setId(index, index);
                const angle = Math.random() * Math.PI * 2;
                const speed = 50 + Math.random() * 50;

                this.entityData.setVx(index, Math.cos(angle) * speed);
                this.entityData.setVy(index, Math.sin(angle) * speed);
                this.entityData.setRadius(index, 3.5);
                this.entityData.setMaxSpeed(index, 90 + Math.random() * 20);
                this.entityData.setFriction(index, 0.98);

                if (ev.targetX !== 0 || ev.targetY !== 0 || ev.targetNodeId !== -1) {
                    this.entityData.setTargetNodeId(index, ev.targetNodeId);
                    this.entityData.setTargetX(index, ev.targetX);
                    this.entityData.setTargetY(index, ev.targetY);
                } else {
                    this.entityData.setHasTarget(index, false);
                }

                this.stats.produced[ev.owner] = (this.stats.produced[ev.owner] || 0) + 1;
            }
        }

        this.sharedMemory.clearEvents();
    }

    sendSyncState() {
        const entityCount = this.entityData.getCount();
        const nodeCount = this.nodeData.getCount();

        // Send one contiguous buffer: header + entity SOA block + node SOA block.
        // CLIENT reconstructs SharedMemory views at the same layout offsets.
        const NODE_SECTION_BYTES = 19 * 4 * MEMORY_LAYOUT.MAX_NODES;
        const syncBuffer = this.buffer.slice(0, MEMORY_LAYOUT.NODE_DATA_START + NODE_SECTION_BYTES);

        this.io.to(this.roomId).volatile.emit('syncStateDO', {
            entityCount,
            nodeCount,
            syncBuffer,
            playerCount: this.playerSockets.length,
            elapsedTime: this.elapsedTime,
            stats: this.getStats(),
            gameSettings: this.gameSettings
        });
    }

    initLevel() {
        const actualPlayers = this.playerSockets.length;

        // Reset counts both in SharedMemory header AND EntityData/NodeData instance counts
        this.sharedMemory.setEntityCount(0);
        this.entityData.count = 0;
        this.sharedMemory.setNodeCount(0);
        this.nodeData.count = 0;
        this.sharedMemory.clearEvents();

        // Generate map with actual player count
        const mapNodes = MapGenerator.generate(
            actualPlayers,
            2560, // worldWidth
            1440  // worldHeight
        );

        // NodeData.setNodeCount syncs the count from header, set it here too
        this.sharedMemory.setNodeCount(mapNodes.length);
        this.nodeData.count = mapNodes.length;
        // Map OOP Node string types to NodeData numeric enum
        const typeMap = { 'small': 0, 'medium': 1, 'large': 2 };
        mapNodes.forEach((n, i) => {
            const typeEnum = typeMap[n.type] !== undefined ? typeMap[n.type] : 1; // default medium
            this.nodeData.setId(i, n.id);
            this.nodeData.setType(i, typeEnum);
            this.nodeData.setOwner(i, n.owner);
            this.nodeData.setX(i, n.x);
            this.nodeData.setY(i, n.y);
            this.nodeData.setRadius(i, n.radius);
            // Use the influenceRadius from the OOP Node object (it varies by type+randomness)
            this.nodeData.setInfluenceRadius(i, n.influenceRadius);
            this.nodeData.setBaseHp(i, n.baseHp);
            this.nodeData.setMaxHp(i, n.maxHp);

            this.nodeData.setSpawnInterval(i, n.spawnInterval);
            this.nodeData.setSpawnTimer(i, 0);
            this.nodeData.setHitFlash(i, 0);
            this.nodeData.setSpawnEffect(i, 0);
            this.nodeData.setRallyTargetNodeId(i, -1);
            this.nodeData.setRallyX(i, 0);
            this.nodeData.setRallyY(i, 0);
        });

        // Spawn initial entities - 20 units per owned node
        for (let i = 0; i < this.nodeData.getCount(); i++) {
            const owner = this.nodeData.getOwner(i);
            if (owner !== -1) {
                const nodeX = this.nodeData.getX(i);
                const nodeY = this.nodeData.getY(i);
                const nodeRadius = this.nodeData.getRadius(i);

                for (let j = 0; j < 20; j++) {
                    const index = this.entityData.allocate(
                        nodeX + Math.cos(Math.random() * Math.PI * 2) * (nodeRadius + 30),
                        nodeY + Math.sin(Math.random() * Math.PI * 2) * (nodeRadius + 30),
                        owner,
                        0
                    );
                    if (index === -1) break;

                    // Set entity ID = its buffer index so client can resolve selections
                    this.entityData.setId(index, index);
                    this.entityData.setVx(index, 0);
                    this.entityData.setVy(index, 0);
                    this.entityData.setRadius(index, 3.5);
                    this.entityData.setMaxSpeed(index, 90 + Math.random() * 20);
                    this.entityData.setFriction(index, 0.98);
                    this.entityData.setHasTarget(index, false);
                }
            }
        }

        // Setup bounds properly
        this.entityData.setWorldBounds(2560 / 2, 1440 / 2, Math.max(2560, 1440) / 2 + 300);
    }
}
