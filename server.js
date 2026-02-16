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

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    // Send current rooms on connect
    socket.emit('roomList', roomManager.listRooms());

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

        console.log(`Room created: ${roomId} by ${socket.id} (Player ${playerIndex})`);

        callback({ success: true, roomId, playerIndex });
        broadcastRoomList();
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
            console.log(`Player ${socket.id} joined room ${roomId} (Player ${playerIndex})`);

            callback({ success: true, playerIndex });
            broadcastRoomList();

            // Auto-start if at least 2 players
            if (game.playerSockets.length >= 2) {
                game.start();
                io.to(roomId).emit('gameStart');
            }
        } else {
            callback({ success: false, message: 'Room not found' });
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

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        if (socket.roomId) {
            const game = roomManager.getRoom(socket.roomId);
            if (game) {
                game.removePlayer(socket.id);
                if (game.playerSockets.length === 0) {
                    roomManager.removeRoom(socket.roomId);
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
