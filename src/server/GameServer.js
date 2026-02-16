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

    start() {
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
