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

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('createRoom', (data, callback) => {
        const roomId = 'room_' + Date.now();
        const gameServer = new GameServer(roomId, io);
        roomManager.createRoom(roomId, gameServer);

        socket.join(roomId);
        callback({ success: true, roomId });
    });

    socket.on('gameAction', (action) => {
        // relay to GameServer
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
