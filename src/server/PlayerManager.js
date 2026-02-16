export class PlayerManager {
    constructor() {
        this.players = new Map();
    }

    addPlayer(socketId, data) {
        this.players.set(socketId, { id: socketId, ...data, ready: false });
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
    }

    setReady(socketId, ready) {
        const p = this.players.get(socketId);
        if (p) p.ready = ready;
    }

    allReady() {
        const players = Array.from(this.players.values());
        return players.length >= 2 && players.every(p => p.ready);
    }
}
