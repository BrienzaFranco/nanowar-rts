const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

// Cargar clases del juego dinámicamente
const gameClasses = require('./game.js');
const Game = gameClasses.Game;
const PLAYER_COLORS = gameClasses.PLAYER_COLORS;

const rooms = new Map();

class GameServer {
    constructor(roomId) {
        this.roomId = roomId;
        this.game = null;
        this.playerSockets = [];
    }

    start() {
        this.game = new Game(null);
        this.game.playerCount = Math.max(2, this.playerSockets.length);
        
        let lastTime = Date.now();
        const loop = () => {
            const now = Date.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            this.game.update(dt);
            io.to(this.roomId).emit('gameState', this.game.getState());
            setTimeout(loop, 1000 / 60);
        };
        loop();
    }

    addPlayer(socket) {
        const playerId = this.playerSockets.length;
        this.playerSockets.push(socket.id);
        socket.join(this.roomId);
        
        if (!this.game) {
            this.start();
        }

        return playerId;
    }

    removePlayer(socketId) {
        const idx = this.playerSockets.indexOf(socketId);
        if (idx !== -1) {
            this.playerSockets.splice(idx, 1);
        }
    }

    handleAction(socketId, action) {
        if (!this.game) return;
        
        const playerIdx = this.playerSockets.indexOf(socketId);
        if (playerIdx === -1) return;

        switch (action.type) {
            case 'select':
                this.game.selectedNodes = this.game.nodes.filter(n => 
                    action.nodeIds && action.nodeIds.includes(n.id)
                );
                this.game.selectedEntities = this.game.entities.filter(e =>
                    action.entityIds && action.entityIds.includes(e.id)
                );
                break;
            case 'command':
                const target = action.target;
                this.game.selectedEntities.forEach(ent => {
                    ent.setTarget(target.x, target.y);
                });
                this.game.selectedNodes.forEach(node => {
                    if (node.owner === playerIdx) {
                        this.game.entities.forEach(ent => {
                            if (ent.owner === playerIdx) {
                                const dx = ent.x - node.x, dy = ent.y - node.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                if (dist <= node.influenceRadius) {
                                    ent.setTarget(target.x, target.y);
                                }
                            }
                        });
                    }
                });
                break;
            case 'stop':
                this.game.selectedEntities.forEach(ent => ent.stop());
                break;
        }
    }
}

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Enviar lista de rooms disponibles
    socket.emit('roomList', Array.from(rooms.values()).map(r => ({
        id: r.roomId,
        players: r.playerSockets.length,
        maxPlayers: 4
    })));

    socket.on('getRooms', () => {
        socket.emit('roomList', Array.from(rooms.values()).map(r => ({
            id: r.roomId,
            players: r.playerSockets.length,
            maxPlayers: 4
        })));
    });

    socket.on('createRoom', (data, callback) => {
        const roomId = 'room_' + Date.now();
        const gameServer = new GameServer(roomId);
        rooms.set(roomId, gameServer);
        
        const playerId = gameServer.addPlayer(socket);
        socket.roomId = roomId;
        socket.playerId = playerId;
        
        // Broadcast rooms update
        io.emit('roomList', Array.from(rooms.values()).map(r => ({
            id: r.roomId,
            players: r.playerSockets.length,
            maxPlayers: 4
        })));
        
        callback({ success: true, roomId, playerId });
    });

    socket.on('joinRoom', (data, callback) => {
        const { roomId } = data;
        const gameServer = rooms.get(roomId);
        
        if (!gameServer) {
            callback({ success: false, error: 'Room not found' });
            return;
        }

        const playerId = gameServer.addPlayer(socket);
        socket.roomId = roomId;
        socket.playerId = playerId;

        callback({ success: true, playerId });
    });

    socket.on('gameAction', (action) => {
        const gameServer = rooms.get(socket.roomId);
        if (gameServer) {
            gameServer.handleAction(socket.id, action);
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const gameServer = rooms.get(socket.roomId);
        if (gameServer) {
            gameServer.removePlayer(socket.id);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
