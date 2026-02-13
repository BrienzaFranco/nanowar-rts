// Nanowar Multiplayer Client
class MultiplayerGame {
    constructor() {
        this.socket = null;
        this.currentRoom = null;
        this.playerName = '';
        this.playerId = null;
        this.players = [];
        this.isConnected = false;
        this.gameState = 'menu'; // menu, lobby, playing, ended
        
        // Elementos del DOM
        this.menuScreen = document.getElementById('menu-screen');
        this.lobbyScreen = document.getElementById('lobby-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.roomListEl = document.getElementById('room-list');
        this.playerListEl = document.getElementById('lobby-players');
        
        // Canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Estado del juego
        this.nodes = [];
        this.units = [];
        this.selectedNode = null;
        this.isDragging = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.setupEventListeners();
    }

    connect() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Conectado al servidor');
            this.isConnected = true;
            this.playerId = this.socket.id;
        });

        this.socket.on('disconnect', () => {
            console.log('Desconectado del servidor');
            this.isConnected = false;
            this.showMenu();
        });

        // Eventos del servidor
        this.socket.on('roomList', (rooms) => {
            this.updateRoomList(rooms);
        });

        this.socket.on('playerList', (players) => {
            this.players = players;
            this.updatePlayerList();
        });

        this.socket.on('gameStarted', (data) => {
            this.nodes = data.nodes;
            this.players = data.players;
            this.startGame();
        });

        this.socket.on('gameUpdate', (data) => {
            this.nodes = data.nodes;
            this.units = data.units;
        });

        this.socket.on('gameEnded', () => {
            this.gameState = 'ended';
            alert('La partida ha terminado');
            this.showMenu();
        });

        this.socket.on('gameWon', (data) => {
            this.gameState = 'ended';
            if (data.winnerId === this.playerId) {
                alert('¡Felicidades! ¡Has ganado!');
            } else {
                alert(`¡${data.winner} ha ganado la partida!`);
            }
            this.showMenu();
        });
    }

    setupEventListeners() {
        // Menú principal
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.showCreateRoomDialog();
        });

        document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
            if (this.socket) {
                this.socket.emit('getRooms');
            }
        });

        // Diálogo crear sala
        document.getElementById('confirm-create-room').addEventListener('click', () => {
            this.createRoom();
        });

        document.getElementById('cancel-create-room').addEventListener('click', () => {
            this.hideCreateRoomDialog();
        });

        // Lobby
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.toggleReady();
        });

        document.getElementById('leave-lobby-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Juego
        document.getElementById('leave-game-btn').addEventListener('click', () => {
            this.leaveRoom();
        });

        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        });
        this.canvas.addEventListener('touchend', (e) => this.handleMouseUp(e));

        window.addEventListener('resize', () => this.resize());
    }

    showCreateRoomDialog() {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Por favor ingresa tu nombre');
            return;
        }
        this.playerName = playerName;
        document.getElementById('create-room-dialog').style.display = 'block';
    }

    hideCreateRoomDialog() {
        document.getElementById('create-room-dialog').style.display = 'none';
    }

    createRoom() {
        const roomName = document.getElementById('room-name').value.trim();
        const maxPlayers = parseInt(document.getElementById('max-players').value);

        if (!roomName) {
            alert('Por favor ingresa un nombre para la sala');
            return;
        }

        this.socket.emit('createRoom', {
            roomName,
            playerName: this.playerName,
            maxPlayers
        }, (response) => {
            if (response.success) {
                this.currentRoom = response.roomId;
                this.hideCreateRoomDialog();
                this.showLobby();
            } else {
                alert(response.error || 'Error al crear la sala');
            }
        });
    }

    joinRoom(roomId) {
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Por favor ingresa tu nombre');
            return;
        }
        this.playerName = playerName;

        this.socket.emit('joinRoom', { roomId, playerName }, (response) => {
            if (response.success) {
                this.currentRoom = response.roomId;
                this.showLobby();
            } else {
                alert(response.error || 'Error al unirse a la sala');
            }
        });
    }

    leaveRoom() {
        if (this.socket) {
            this.socket.emit('leaveRoom');
        }
        this.currentRoom = null;
        this.players = [];
        this.nodes = [];
        this.units = [];
        this.showMenu();
    }

    toggleReady() {
        const btn = document.getElementById('ready-btn');
        const isReady = btn.classList.contains('ready');
        this.socket.emit('playerReady', !isReady);
        btn.classList.toggle('ready');
        btn.textContent = isReady ? 'Estoy Listo' : 'No Estoy Listo';
    }

    updateRoomList(rooms) {
        this.roomListEl.innerHTML = '';
        
        if (rooms.length === 0) {
            this.roomListEl.innerHTML = '<p class="no-rooms">No hay salas disponibles</p>';
            return;
        }

        rooms.forEach(room => {
            const roomEl = document.createElement('div');
            roomEl.className = 'room-item';
            roomEl.innerHTML = `
                <div class="room-info">
                    <h3>${room.name}</h3>
                    <span>${room.players}/${room.maxPlayers} jugadores</span>
                </div>
                <button ${room.players >= room.maxPlayers || room.state !== 'waiting' ? 'disabled' : ''}>
                    ${room.state === 'waiting' ? 'Unirse' : 'En juego'}
                </button>
            `;
            
            const joinBtn = roomEl.querySelector('button');
            if (!joinBtn.disabled) {
                joinBtn.addEventListener('click', () => this.joinRoom(room.id));
            }
            
            this.roomListEl.appendChild(roomEl);
        });
    }

    updatePlayerList() {
        this.playerListEl.innerHTML = '';
        
        this.players.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = `player-item ${player.ready ? 'ready' : ''}`;
            playerEl.innerHTML = `
                <span class="player-color" style="background: ${player.color}"></span>
                <span class="player-name">${player.name}</span>
                <span class="player-status">${player.ready ? '✓ Listo' : 'Esperando...'}</span>
            `;
            this.playerListEl.appendChild(playerEl);
        });
    }

    showMenu() {
        this.gameState = 'menu';
        this.menuScreen.style.display = 'block';
        this.lobbyScreen.style.display = 'none';
        this.gameScreen.style.display = 'none';
    }

    showLobby() {
        this.gameState = 'lobby';
        this.menuScreen.style.display = 'none';
        this.lobbyScreen.style.display = 'block';
        this.gameScreen.style.display = 'none';
        
        // Reset ready button
        const btn = document.getElementById('ready-btn');
        btn.classList.remove('ready');
        btn.textContent = 'Estoy Listo';
    }

    startGame() {
        this.gameState = 'playing';
        this.menuScreen.style.display = 'none';
        this.lobbyScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        
        this.resize();
        this.gameLoop();
    }

    // Input handling
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;
        
        const pos = this.getMousePos(e);
        this.mouseX = pos.x;
        this.mouseY = pos.y;

        // Buscar nodo clickeado
        const clickedNode = this.nodes.find(node => {
            const dx = pos.x - node.x;
            const dy = pos.y - node.y;
            return Math.sqrt(dx * dx + dy * dy) < node.radius;
        });

        if (clickedNode && clickedNode.owner === this.playerId && clickedNode.units > 1) {
            this.selectedNode = clickedNode;
            this.isDragging = true;
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
    }

    handleMouseUp(e) {
        if (this.selectedNode && this.isDragging) {
            const pos = this.getMousePos(e);
            
            // Buscar nodo destino
            const targetNode = this.nodes.find(node => {
                if (node.id === this.selectedNode.id) return false;
                const dx = pos.x - node.x;
                const dy = pos.y - node.y;
                return Math.sqrt(dx * dx + dy * dy) < node.radius;
            });

            if (targetNode) {
                this.socket.emit('playerAction', {
                    type: 'sendUnits',
                    fromNodeId: this.selectedNode.id,
                    toNodeId: targetNode.id
                });
            }
        }

        this.selectedNode = null;
        this.isDragging = false;
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    // Rendering
    draw() {
        // Limpiar canvas
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar grid
        this.drawGrid();

        // Dibujar línea de arrastre
        if (this.isDragging && this.selectedNode) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.selectedNode.x, this.selectedNode.y);
            this.ctx.lineTo(this.mouseX, this.mouseY);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }

        // Dibujar unidades en movimiento
        this.units.forEach(unit => {
            this.ctx.fillStyle = unit.color;
            const dots = Math.min(unit.count, 5);
            for (let i = 0; i < dots; i++) {
                const angle = (i / dots) * Math.PI * 2;
                const offset = 5;
                this.ctx.beginPath();
                this.ctx.arc(
                    unit.x + Math.cos(angle) * offset,
                    unit.y + Math.sin(angle) * offset,
                    3, 0, Math.PI * 2
                );
                this.ctx.fill();
            }

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Math.floor(unit.count), unit.x, unit.y - 10);
        });

        // Dibujar nodos
        this.nodes.forEach(node => {
            const player = this.players.find(p => p.id === node.owner);
            const color = player ? player.color : '#9E9E9E';

            // Círculo del nodo
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();

            // Borde
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Unidades
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(Math.floor(node.units), node.x, node.y);
        });

        // Dibujar indicador de selección
        if (this.selectedNode) {
            this.ctx.beginPath();
            this.ctx.arc(this.selectedNode.x, this.selectedNode.y, this.selectedNode.radius + 5, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 50;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Iniciar cuando cargue la página
window.onload = () => {
    const game = new MultiplayerGame();
    game.connect();
};
