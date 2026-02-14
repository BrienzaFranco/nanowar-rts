const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname)));

// Load game.js in server context
const gameCode = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
const gameCodeServer = gameCode
    .replace('window.onload = () => {', 'if (false) { //')
    .replace('game.start();', '// game.start()')
    .replace('};', '}');  // Close the if

const sandbox = { 
    console: console, 
    setTimeout: setTimeout, 
    clearTimeout: clearTimeout,
    Math: Math,
    Date: Date,
    performance: { now: () => Date.now() },
    requestAnimationFrame: (fn) => setTimeout(fn, 16),
    document: { 
        getElementById: () => null, 
        addEventListener: () => {},
        body: {}
    },
    window: {},
    Object: Object,
    Array: Array,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    JSON: JSON
};
vm.createContext(sandbox);
vm.runInContext(gameCodeServer, sandbox);

const Game = sandbox.Game;

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
        this.game.serverStart((state) => {
            this.broadcast(state);
        });
    }

    broadcast(state) {
        io.to(this.roomId).emit('gameState', state);
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

    socket.on('createRoom', (data, callback) => {
        const roomId = 'room_' + Date.now();
        const gameServer = new GameServer(roomId);
        rooms.set(roomId, gameServer);
        
        const playerId = gameServer.addPlayer(socket);
        socket.roomId = roomId;
        socket.playerId = playerId;
        
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
