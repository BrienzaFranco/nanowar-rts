const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Almacenamiento de salas y jugadores
const rooms = new Map();
const players = new Map();

// Clase Room para manejar las salas de juego
class GameRoom {
    constructor(id, name, maxPlayers = 4) {
        this.id = id;
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.players = new Map();
        this.gameState = 'waiting'; // waiting, playing, ended
        this.nodes = [];
        this.units = [];
        this.gameLoop = null;
        this.lastUpdate = Date.now();
        this.colors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800'];
    }

    addPlayer(socket, playerName) {
        if (this.players.size >= this.maxPlayers) {
            return false;
        }

        const playerColor = this.colors[this.players.size];
        this.players.set(socket.id, {
            id: socket.id,
            name: playerName,
            color: playerColor,
            ready: false,
            nodes: 0
        });

        socket.join(this.id);
        this.broadcastPlayerList();
        return true;
    }

    removePlayer(socketId) {
        this.players.delete(socketId);
        
        // Si el juego está en curso y quedan jugadores, reasignar nodos
        if (this.gameState === 'playing') {
            this.nodes.forEach(node => {
                if (node.owner === socketId) {
                    node.owner = 'neutral';
                    node.units = Math.floor(Math.random() * 15) + 5;
                    node.productionRate = 0;
                }
            });
        }

        if (this.players.size === 0) {
            this.stopGame();
        } else {
            this.broadcastPlayerList();
            this.broadcastGameState();
        }
    }

    setPlayerReady(socketId, ready) {
        const player = this.players.get(socketId);
        if (player) {
            player.ready = ready;
            this.broadcastPlayerList();

            // Verificar si todos están listos para iniciar
            if (this.players.size >= 2 && this.allPlayersReady()) {
                this.startGame();
            }
        }
    }

    allPlayersReady() {
        for (const player of this.players.values()) {
            if (!player.ready) return false;
        }
        return true;
    }

    startGame() {
        this.gameState = 'playing';
        this.initializeGame();
        this.broadcast('gameStarted', {
            nodes: this.nodes,
            players: Array.from(this.players.values())
        });
        
        // Iniciar loop de juego
        this.gameLoop = setInterval(() => this.update(), 1000 / 60);
    }

    stopGame() {
        this.gameState = 'ended';
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        this.broadcast('gameEnded');
    }

    initializeGame() {
        this.nodes = [];
        this.units = [];

        const playerArray = Array.from(this.players.values());
        const canvasWidth = 1200;
        const canvasHeight = 800;

        // Crear nodos iniciales para cada jugador
        const positions = this.getPlayerPositions(playerArray.length, canvasWidth, canvasHeight);
        
        playerArray.forEach((player, index) => {
            const pos = positions[index];
            this.nodes.push({
                id: index,
                x: pos.x,
                y: pos.y,
                owner: player.id,
                units: 10,
                maxUnits: 50,
                radius: 30,
                productionRate: 0.5,
                lastProduction: Date.now()
            });
            player.nodes = 1;
        });

        // Crear nodos neutrales
        const neutralCount = 5 + (playerArray.length * 2);
        for (let i = 0; i < neutralCount; i++) {
            let x, y, tooClose;
            let attempts = 0;
            
            do {
                tooClose = false;
                x = Math.random() * (canvasWidth - 200) + 100;
                y = Math.random() * (canvasHeight - 200) + 100;
                
                // Verificar que no esté muy cerca de otros nodos
                for (const node of this.nodes) {
                    const dist = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
                    if (dist < 100) {
                        tooClose = true;
                        break;
                    }
                }
                attempts++;
            } while (tooClose && attempts < 100);

            this.nodes.push({
                id: playerArray.length + i,
                x: x,
                y: y,
                owner: 'neutral',
                units: Math.floor(Math.random() * 15) + 5,
                maxUnits: 50,
                radius: 30,
                productionRate: 0,
                lastProduction: Date.now()
            });
        }
    }

    getPlayerPositions(count, width, height) {
        const positions = [];
        const margin = 150;
        
        if (count === 2) {
            positions.push({ x: width / 2, y: height - margin });
            positions.push({ x: width / 2, y: margin });
        } else if (count === 3) {
            positions.push({ x: margin, y: height - margin });
            positions.push({ x: width - margin, y: height - margin });
            positions.push({ x: width / 2, y: margin });
        } else {
            positions.push({ x: margin, y: margin });
            positions.push({ x: width - margin, y: margin });
            positions.push({ x: margin, y: height - margin });
            positions.push({ x: width - margin, y: height - margin });
        }
        
        return positions;
    }

    update() {
        const now = Date.now();
        const dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        // Actualizar producción de nodos
        this.nodes.forEach(node => {
            if (node.owner !== 'neutral' && node.units < node.maxUnits) {
                const elapsed = (now - node.lastProduction) / 1000;
                if (elapsed >= 1 / node.productionRate) {
                    node.units++;
                    node.lastProduction = now;
                }
            }
        });

        // Actualizar unidades en movimiento
        this.units = this.units.filter(unit => {
            const dx = unit.vx * dt;
            const dy = unit.vy * dt;
            unit.x += dx;
            unit.y += dy;
            unit.traveled += Math.sqrt(dx * dx + dy * dy);

            if (unit.traveled >= unit.totalDistance) {
                this.resolveAttack(unit);
                return false;
            }
            return true;
        });

        // Verificar victoria
        this.checkVictory();

        // Broadcast estado actualizado
        this.broadcast('gameUpdate', {
            nodes: this.nodes,
            units: this.units
        });
    }

    resolveAttack(unit) {
        const targetNode = this.nodes.find(n => n.id === unit.targetNodeId);
        if (!targetNode) return;

        const attacker = this.players.get(unit.owner);
        
        if (targetNode.owner === unit.owner) {
            // Reforzar
            targetNode.units += unit.count;
            if (targetNode.units > targetNode.maxUnits) {
                targetNode.units = targetNode.maxUnits;
            }
        } else {
            // Atacar
            targetNode.units -= unit.count;
            if (targetNode.units <= 0) {
                const previousOwner = targetNode.owner;
                targetNode.units = Math.abs(targetNode.units);
                targetNode.owner = unit.owner;
                targetNode.productionRate = 0.5;
                
                // Actualizar contador de nodos
                if (attacker) {
                    attacker.nodes++;
                }
                if (previousOwner !== 'neutral' && this.players.has(previousOwner)) {
                    this.players.get(previousOwner).nodes--;
                }
            }
        }
    }

    checkVictory() {
        const activePlayers = new Set();
        this.nodes.forEach(node => {
            if (node.owner !== 'neutral') {
                activePlayers.add(node.owner);
            }
        });

        if (activePlayers.size === 1 && this.players.size > 1) {
            const winnerId = Array.from(activePlayers)[0];
            const winner = this.players.get(winnerId);
            if (winner) {
                this.broadcast('gameWon', { winner: winner.name, winnerId: winnerId });
                this.stopGame();
            }
        }
    }

    handlePlayerAction(socketId, action) {
        if (this.gameState !== 'playing') return;

        const player = this.players.get(socketId);
        if (!player) return;

        switch (action.type) {
            case 'sendUnits':
                this.handleSendUnits(socketId, action.fromNodeId, action.toNodeId);
                break;
        }
    }

    handleSendUnits(playerId, fromNodeId, toNodeId) {
        const fromNode = this.nodes.find(n => n.id === fromNodeId);
        const toNode = this.nodes.find(n => n.id === toNodeId);

        if (!fromNode || !toNode || fromNode.owner !== playerId || fromNodeId === toNodeId) {
            return;
        }

        const unitsToSend = Math.floor(fromNode.units / 2);
        if (unitsToSend > 0) {
            fromNode.units -= unitsToSend;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = 200;

            this.units.push({
                id: uuidv4(),
                x: fromNode.x,
                y: fromNode.y,
                vx: (dx / distance) * speed,
                vy: (dy / distance) * speed,
                totalDistance: distance,
                traveled: 0,
                count: unitsToSend,
                owner: playerId,
                targetNodeId: toNodeId,
                color: this.players.get(playerId).color
            });
        }
    }

    broadcast(event, data) {
        io.to(this.id).emit(event, data);
    }

    broadcastPlayerList() {
        this.broadcast('playerList', Array.from(this.players.values()));
    }

    broadcastGameState() {
        this.broadcast('gameState', {
            state: this.gameState,
            nodes: this.nodes,
            units: this.units
        });
    }

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            players: this.players.size,
            maxPlayers: this.maxPlayers,
            state: this.gameState
        };
    }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Nuevo jugador conectado:', socket.id);

    // Enviar lista de salas disponibles
    socket.emit('roomList', Array.from(rooms.values()).map(r => r.getInfo()));

    // Crear nueva sala
    socket.on('createRoom', ({ roomName, playerName, maxPlayers }, callback) => {
        const roomId = uuidv4();
        const room = new GameRoom(roomId, roomName, maxPlayers);
        rooms.set(roomId, room);
        
        if (room.addPlayer(socket, playerName)) {
            players.set(socket.id, { roomId, name: playerName });
            callback({ success: true, roomId });
            io.emit('roomList', Array.from(rooms.values()).map(r => r.getInfo()));
        } else {
            callback({ success: false, error: 'No se pudo unir a la sala' });
        }
    });

    // Unirse a sala existente
    socket.on('joinRoom', ({ roomId, playerName }, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            callback({ success: false, error: 'Sala no encontrada' });
            return;
        }

        if (room.gameState !== 'waiting') {
            callback({ success: false, error: 'El juego ya ha comenzado' });
            return;
        }

        if (room.addPlayer(socket, playerName)) {
            players.set(socket.id, { roomId, name: playerName });
            callback({ success: true, roomId });
            io.emit('roomList', Array.from(rooms.values()).map(r => r.getInfo()));
        } else {
            callback({ success: false, error: 'Sala llena' });
        }
    });

    // Jugador listo
    socket.on('playerReady', (ready) => {
        const player = players.get(socket.id);
        if (player) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.setPlayerReady(socket.id, ready);
            }
        }
    });

    // Acción del jugador
    socket.on('playerAction', (action) => {
        const player = players.get(socket.id);
        if (player) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.handlePlayerAction(socket.id, action);
            }
        }
    });

    // Salir de sala
    socket.on('leaveRoom', () => {
        const player = players.get(socket.id);
        if (player) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.removePlayer(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(player.roomId);
                }
            }
            players.delete(socket.id);
            socket.leave(player.roomId);
            io.emit('roomList', Array.from(rooms.values()).map(r => r.getInfo()));
        }
    });

    // Desconexión
    socket.on('disconnect', () => {
        console.log('Jugador desconectado:', socket.id);
        
        const player = players.get(socket.id);
        if (player) {
            const room = rooms.get(player.roomId);
            if (room) {
                room.removePlayer(socket.id);
                if (room.players.size === 0) {
                    rooms.delete(player.roomId);
                }
            }
            players.delete(socket.id);
            io.emit('roomList', Array.from(rooms.values()).map(r => r.getInfo()));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor Nanowar corriendo en puerto ${PORT}`);
    console.log(`Abre http://localhost:${PORT} en tu navegador`);
});
