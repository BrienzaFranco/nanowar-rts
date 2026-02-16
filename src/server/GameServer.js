import { GameState } from '../shared/GameState.js';
import { MapGenerator } from '../shared/MapGenerator.js';

export class GameServer {
    constructor(roomId, io, maxPlayers = 4) {
        this.roomId = roomId;
        this.io = io;
        this.maxPlayers = maxPlayers;
        this.state = new GameState();
        this.playerSockets = [];
        this.gameStarted = false;
    }

    addPlayer(socket) {
        if (this.playerSockets.length < this.maxPlayers) {
            this.playerSockets.push(socket);
            const playerIndex = this.playerSockets.length - 1; // 0 is player, 1-3 are others
            return playerIndex;
        }
        return -1;
    }

    removePlayer(socketId) {
        this.playerSockets = this.playerSockets.filter(s => s.id !== socketId);
        if (this.playerSockets.length === 0) {
            this.gameStarted = false;
        }
    }

    handleAction(socketId, action) {
        // Authoritative action processing
        // Find player index for this socket
        const playerIndex = this.playerSockets.findIndex(s => s.id === socketId);
        if (playerIndex === -1) return;

        if (action.type === 'move') {
            const { sourceNodeId, targetNodeId, unitIds } = action;
            const source = this.state.nodes.find(n => n.id === sourceNodeId);
            const target = this.state.nodes.find(n => n.id === targetNodeId);

            if (source && target && source.owner === playerIndex) {
                // Execute move logic
                unitIds.forEach(id => {
                    const entity = this.state.entities.find(e => e.id === id);
                    if (entity && entity.owner === playerIndex) {
                        entity.setTarget(target.x, target.y, target);
                    }
                });
            }
        }
    }

    start() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.initLevel();

        let lastTime = Date.now();
        const loop = () => {
            if (!this.gameStarted) return;
            const now = Date.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;

            this.state.update(dt, this);
            this.io.to(this.roomId).emit('gameState', this.state.getState());

            setTimeout(loop, 1000 / 30);
        };
        loop();
    }

    initLevel() {
        // Authoritative level creation logic
        this.state.nodes = MapGenerator.generate(
            this.maxPlayers,
            this.state.worldWidth,
            this.state.worldHeight
        );
    }

    spawnParticles(x, y, color, count, type) {
        // On server, we can track events to send to client
        // For now, handled by client prediction or pure authoritative sync
    }
}
