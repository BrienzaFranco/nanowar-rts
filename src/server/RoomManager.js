export class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId, gameServer) {
        this.rooms.set(roomId, gameServer);
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    removeRoom(roomId) {
        this.rooms.delete(roomId);
    }

    listRooms() {
        return Array.from(this.rooms.values()).map(r => ({
            id: r.roomId,
            players: r.playerSockets.length,
            maxPlayers: r.maxPlayers
        }));
    }
}
