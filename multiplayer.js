// Nanowar Multiplayer Client
const PLAYER_COLORS = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerId = null;
        this.gameState = null;
        this.selectedNodes = [];
        this.selectedEntities = [];
        
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.setupEvents();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    connect() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected');
            // Request rooms list
            this.socket.emit('getRooms');
        });

        this.socket.on('roomList', (rooms) => {
            this.rooms = rooms;
            this.updateRoomListUI();
        });

        this.socket.on('gameState', (state) => {
            this.gameState = state;
            this.render();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected');
            alert('Desconectado del servidor');
        });
    }

    createRoom(callback) {
        this.socket.emit('createRoom', {}, (response) => {
            if (response.success) {
                this.roomId = response.roomId;
                this.playerId = response.playerId;
            }
            if (callback) callback(response);
        });
    }

    joinRoom(roomId, callback) {
        this.socket.emit('joinRoom', { roomId }, (response) => {
            if (response.success) {
                this.roomId = roomId;
                this.playerId = response.playerId;
                showGameScreen();
            }
            if (callback) callback(response);
        });
    }

    updateRoomListUI() {
        const roomListEl = document.getElementById('room-list');
        if (!roomListEl || !this.rooms) return;
        
        if (this.rooms.length === 0) {
            roomListEl.innerHTML = '<p class="no-rooms">No hay salas disponibles</p>';
            return;
        }
        
        roomListEl.innerHTML = this.rooms.map(room => `
            <div class="room-item">
                <div class="room-info">
                    <h3>Sala ${room.id.slice(-6)}</h3>
                    <span>${room.players}/${room.maxPlayers} jugadores</span>
                </div>
                <button class="btn-secondary" onclick="client && client.joinRoom('${room.id}')">Unirse</button>
            </div>
        `).join('');
    }

    sendAction(action) {
        this.socket.emit('gameAction', action);
    }

    setupEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') {
                this.sendAction({ type: 'stop' });
            }
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    screenToWorld(sx, sy) {
        return {
            x: sx / this.camera.zoom + this.camera.x,
            y: sy / this.camera.zoom + this.camera.y
        };
    }

    onMouseDown(e) {
        if (!this.gameState) return;
        
        const pos = this.getMousePos(e);
        const world = this.screenToWorld(pos.x, pos.y);

        if (e.button === 0) { // Left click
            let clickedNode = null;
            let clickedEntity = null;

            for (const node of this.gameState.nodes) {
                const dx = world.x - node.x;
                const dy = world.y - node.y;
                if (Math.sqrt(dx*dx + dy*dy) < node.radius) {
                    clickedNode = node;
                    break;
                }
            }

            if (clickedNode) {
                if (e.shiftKey) {
                    if (!this.selectedNodes.includes(clickedNode.id)) {
                        this.selectedNodes.push(clickedNode.id);
                    }
                } else {
                    this.selectedNodes = [clickedNode.id];
                }
                this.selectedEntities = [];
            } else {
                for (const entity of this.gameState.entities) {
                    const dx = world.x - entity.x;
                    const dy = world.y - entity.y;
                    if (Math.sqrt(dx*dx + dy*dy) < entity.radius + 5) {
                        clickedEntity = entity;
                        break;
                    }
                }

                if (clickedEntity) {
                    if (e.shiftKey) {
                        if (!this.selectedEntities.includes(clickedEntity.id)) {
                            this.selectedEntities.push(clickedEntity.id);
                        }
                    } else {
                        this.selectedEntities = [clickedEntity.id];
                    }
                    this.selectedNodes = [];
                } else {
                    this.selectedNodes = [];
                    this.selectedEntities = [];
                }
            }

            this.sendAction({
                type: 'select',
                nodeIds: this.selectedNodes,
                entityIds: this.selectedEntities
            });
        } else if (e.button === 2) { // Right click
            if (this.selectedEntities.length > 0 || this.selectedNodes.length > 0) {
                this.sendAction({
                    type: 'command',
                    target: world
                });
            }
        }
    }

    onMouseMove(e) {
        if (e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) {
            this.camera.x -= e.movementX / this.camera.zoom;
            this.camera.y -= e.movementY / this.camera.zoom;
        }
    }

    onMouseUp(e) {}

    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoom = Math.max(0.2, Math.min(3, this.camera.zoom * zoomFactor));
    }

    render() {
        if (!this.gameState) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);
        
        this.drawGrid(ctx, w, h);
        
        // Draw nodes
        for (const node of this.gameState.nodes) {
            this.drawNode(ctx, node);
        }
        
        // Draw entities
        for (const entity of this.gameState.entities) {
            this.drawEntity(ctx, entity);
        }
        
        // Draw UI
        this.drawUI(ctx, w, h);
    }

    drawGrid(ctx, w, h) {
        const gridSize = 100 * this.camera.zoom;
        const offsetX = (-this.camera.x * this.camera.zoom) % gridSize;
        const offsetY = (-this.camera.y * this.camera.zoom) % gridSize;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        
        for (let x = offsetX; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        
        for (let y = offsetY; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }
    }

    drawNode(ctx, node) {
        const sx = (node.x - this.camera.x) * this.camera.zoom;
        const sy = (node.y - this.camera.y) * this.camera.zoom;
        const sr = node.radius * this.camera.zoom;
        
        const color = node.owner === -1 ? '#757575' : PLAYER_COLORS[node.owner % PLAYER_COLORS.length];
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        // Fill based on HP/stock
        let totalFill = node.baseHp;
        if (node.owner !== -1) {
            totalFill = node.stock || 0;
        }
        const maxStock = node.maxStock || 20;
        const fillPercent = Math.min(1, totalFill / maxStock);
        
        // Background
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30,30,30,0.9)';
        ctx.fill();
        
        // Fill
        if (fillPercent > 0) {
            const fillRadius = sr * fillPercent;
            ctx.beginPath();
            ctx.arc(sx, sy, fillRadius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
        
        // Border
        const isSelected = this.selectedNodes.includes(node.id);
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.9)' : `rgba(${r},${g},${b},0.7)`;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
    }

    drawEntity(ctx, entity) {
        const sx = (entity.x - this.camera.x) * this.camera.zoom;
        const sy = (entity.y - this.camera.y) * this.camera.zoom;
        const sr = entity.radius * this.camera.zoom;
        
        const color = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
        
        // Shadow
        ctx.beginPath();
        ctx.arc(sx + 1, sy + 1, sr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        
        // Body
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Selection
        if (this.selectedEntities.includes(entity.id)) {
            ctx.beginPath();
            ctx.arc(sx, sy, sr + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        }
    }

    drawUI(ctx, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Sala: ${this.roomId || '-'} | Jugador: ${this.playerId ?? '-'}`, 20, 25);
        ctx.fillText(`Nodos: ${this.gameState?.nodes?.length || 0} | Unidades: ${this.gameState?.entities?.length || 0}`, 20, 40);
        ctx.fillText(`Seleccionados: ${this.selectedNodes.length} nodos, ${this.selectedEntities.length} unidades`, 20, 55);
    }
}

// Auto-start when multiplayer screen is shown
let client = null;

function initMultiplayer() {
    if (client) return;
    client = new MultiplayerClient();
    client.connect();
    
    // Create or join room automatically for demo
    client.createRoom((response) => {
        console.log('Room created:', response);
    });
}

    });
}

// Auto init and UI
document.addEventListener('DOMContentLoaded', () => {
    // Botón multiplayer
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    if (multiplayerBtn) {
        multiplayerBtn.addEventListener('click', () => {
            setTimeout(initMultiplayer, 100);
        });
    }

    // Botón crear sala
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (!client) {
                client = new MultiplayerClient();
                client.connect();
            }
            client.createRoom((response) => {
                if (response.success) {
                    showGameScreen();
                }
            });
        });
    }

    // Botón actualizar salas
    const refreshBtn = document.getElementById('refresh-rooms-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (client) client.socket.emit('getRooms');
        });
    }
});

function showGameScreen() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    if (client) client.resize();
}
