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
    constructor(roomId, maxPlayers = 4) {
        this.roomId = roomId;
        this.maxPlayers = maxPlayers;
        this.game = null;
        this.playerSockets = [];
        this.playerReady = {};
        this.gameStarted = false;
        this.playerSelections = {}; // socketId -> { nodeIds: [], entityIds: [] }
    }

    start() {
        this.game = new Game(null);
        this.game.playerCount = this.playerSockets.length;
        
        let lastTime = Date.now();
        const loop = () => {
            if (!this.gameStarted) return;
            const now = Date.now();
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            this.game.update(dt);
            io.to(this.roomId).emit('gameState', this.game.getState());
            setTimeout(loop, 1000 / 60);
        };
        this.gameStarted = true;
        loop();
    }

    addPlayer(socket) {
        const playerId = this.playerSockets.length;
        if (playerId >= this.maxPlayers) return -1;
        
        this.playerSockets.push(socket.id);
        this.playerReady[socket.id] = false;
        this.playerSelections[socket.id] = { nodeIds: [], entityIds: [] };
        socket.join(this.roomId);
        
        // Auto-start when 2+ players
        if (this.playerSockets.length >= 2 && !this.gameStarted) {
            this.start();
            io.to(this.roomId).emit('gameStart');
        }
        
        // Notificar a todos
        io.to(this.roomId).emit('playerJoined', {
            playerId: playerId,
            players: this.playerSockets.map((id, idx) => ({ id: idx, ready: this.playerReady[id] }))
        });

        return playerId;
    }

    setReady(socketId, ready) {
        this.playerReady[socketId] = ready;
        
        // Check if all ready
        const allReady = this.playerSockets.length >= 2 && this.playerSockets.every(id => this.playerReady[id]);
        
        io.to(this.roomId).emit('playerReady', {
            socketId: socketId,
            ready: ready,
            allReady: allReady
        });
        
        if (allReady && !this.gameStarted) {
            this.start();
            io.to(this.roomId).emit('gameStart');
        }
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

        const selection = this.playerSelections[socketId] || { nodeIds: [], entityIds: [] };

        switch (action.type) {
            case 'select':
                selection.nodeIds = action.nodeIds || [];
                selection.entityIds = action.entityIds || [];
                this.playerSelections[socketId] = selection;
                break;
            case 'command':
                const target = action.target;
                const targetNode = action.targetNodeId ? 
                    this.game.nodes.find(n => n.id === action.targetNodeId) : null;
                
                // Unidades seleccionadas directamente
                const selectedEnts = this.game.entities.filter(e => selection.entityIds.includes(e.id));
                selectedEnts.forEach(ent => {
                    if (ent.owner === playerIdx) {
                        ent.setTarget(target.x, target.y, targetNode);
                    }
                });

                // Unidades en nodos seleccionados
                const selectedNodes = this.game.nodes.filter(n => selection.nodeIds.includes(n.id));
                selectedNodes.forEach(node => {
                    if (node.owner === playerIdx) {
                        this.game.entities.forEach(ent => {
                            if (ent.owner === playerIdx) {
                                const dx = ent.x - node.x, dy = ent.y - node.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                if (dist <= node.influenceRadius) {
                                    ent.setTarget(target.x, target.y, targetNode);
                                }
                            }
                        });
                    }
                });
                break;
            case 'stop':
                this.game.entities.forEach(ent => {
                    if (ent.owner === playerIdx && selection.entityIds.includes(ent.id)) {
                        ent.stop();
                    }
                });
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
        if (playerId === -1) {
            callback({ success: false, error: 'Room full' });
            return;
        }
        
        socket.roomId = roomId;
        socket.playerId = playerId;

        callback({ 
            success: true, 
            playerId: playerId,
            players: gameServer.playerSockets.map((id, idx) => ({ id: idx, ready: gameServer.playerReady[id] }))
        });
    });

    socket.on('setReady', (ready) => {
        const gameServer = rooms.get(socket.roomId);
        if (gameServer) {
            gameServer.setReady(socket.id, ready);
        }
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
