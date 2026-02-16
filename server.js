import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './src/server/RoomManager.js';
import { GameServer } from './src/server/GameServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));

const roomManager = new RoomManager();

const broadcastRoomList = () => {
    const rooms = roomManager.listRooms();
    io.emit('roomList', rooms);
};

const broadcastLobbyUpdate = (roomId) => {
    const game = roomManager.getRoom(roomId);
    if (game) {
        const players = game.playerSockets.map(s => ({
            id: s.id,
            nickname: s.nickname || 'Anónimo',
            ready: s.ready || false
        }));
        io.to(roomId).emit('lobbyUpdate', { players });
    }
};

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);
    socket.nickname = 'Player_' + socket.id.substr(0, 4);
    socket.ready = false;

    // Send current rooms on connect
    socket.emit('roomList', roomManager.listRooms());

    socket.on('setNickname', (nickname) => {
        socket.nickname = nickname.substring(0, 15);
        if (socket.roomId) broadcastLobbyUpdate(socket.roomId);
    });

    socket.on('listRooms', () => {
        socket.emit('roomList', roomManager.listRooms());
    });

    socket.on('createRoom', (data, callback) => {
        const roomId = 'room_' + Date.now();
        const maxPlayers = parseInt(data.maxPlayers) || 4;
        const gameServer = new GameServer(roomId, io, maxPlayers);

        roomManager.createRoom(roomId, gameServer);

        const playerIndex = gameServer.addPlayer(socket);
        socket.join(roomId);
        socket.roomId = roomId;
        socket.ready = false;

        console.log(`Room created: ${roomId} by ${socket.id} (Player ${playerIndex})`);

        callback({ success: true, roomId, playerIndex });
        broadcastRoomList();
        broadcastLobbyUpdate(roomId);
    });

    socket.on('joinRoom', (data, callback) => {
        const { roomId } = data;
        const game = roomManager.getRoom(roomId);

        if (game) {
            const playerIndex = game.addPlayer(socket);
            if (playerIndex === -1) {
                return callback({ success: false, message: 'Room full' });
            }

            socket.join(roomId);
            socket.roomId = roomId;
            socket.ready = false;
            console.log(`Player ${socket.id} joined room ${roomId} (Player ${playerIndex})`);

            callback({ success: true, playerIndex });
            broadcastRoomList();
            broadcastLobbyUpdate(roomId);
        } else {
            callback({ success: false, message: 'Room not found' });
        }
    });

    socket.on('toggleReady', () => {
        if (!socket.roomId) return;
        socket.ready = !socket.ready;
        broadcastLobbyUpdate(socket.roomId);

        // Check if all are ready
        const game = roomManager.getRoom(socket.roomId);
        if (game && game.playerSockets.length >= 2) {
            const allReady = game.playerSockets.every(s => s.ready);
            if (allReady) {
                game.start();
                io.to(socket.roomId).emit('gameStart', game.state.getState());
            }
        }
    });

    socket.on('gameAction', (action) => {
        if (socket.roomId) {
            const game = roomManager.getRoom(socket.roomId);
            if (game) {
                game.handleAction(socket.id, action);
            }
        }
    });

    socket.on('surrender', () => {
        if (socket.roomId) {
            const game = roomManager.getRoom(socket.roomId);
            if (game) {
                game.handleSurrender(socket.id);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        if (socket.roomId) {
            const game = roomManager.getRoom(socket.roomId);
            if (game) {
                game.removePlayer(socket.id);
                if (game.playerSockets.length === 0) {
                    roomManager.removeRoom(socket.roomId);
                } else {
                    broadcastLobbyUpdate(socket.roomId);
                }
            }
            broadcastRoomList();
        }
    });
});

// Periodic broadcast (every 5s) to catch up status
setInterval(broadcastRoomList, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
