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
        this.running = false;
        this.connected = false;
        
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.worldWidth = 2400;
        this.worldHeight = 1800;
        
        this.canvas = null;
        this.ctx = null;
        
        this.tryInitCanvas();
        this.setupEvents();
        
        window.addEventListener('resize', () => this.resize());
    }

    tryInitCanvas() {
        if (this.canvas) return;
        
        this.canvas = document.getElementById('game-canvas');
        if (this.canvas) {
            console.log("Canvas found, initializing...");
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            if (!this.running && this.connected) {
                this.start();
            }
        }
    }

    resize() {
        if (!this.canvas) {
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
        }
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.zoomToFit();
    }
    
    zoomToFit() {
        if (!this.canvas) return;
        const padding = 100;
        const zoomX = this.canvas.width / (this.worldWidth + padding * 2);
        const zoomY = this.canvas.height / (this.worldHeight + padding * 2);
        this.camera.zoom = Math.min(zoomX, zoomY);
        this.camera.x = -padding;
        this.camera.y = -padding;
    }

    connect() {
        if (this.socket) return;
        
        console.log("Connecting to server...");
        // On Render, we might be using https, io() handles it automatically
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to socket server');
            this.connected = true;
            this.socket.emit('getRooms');
            this.tryInitCanvas();
            this.start();
        });

        this.socket.on('roomList', (rooms) => {
            console.log('Received room list:', rooms.length, 'rooms');
            this.rooms = rooms;
            this.updateRoomListUI();
        });

        this.socket.on('gameState', (state) => {
            this.gameState = state;
            if (!this.running) this.start();
        });

        this.socket.on('gameStart', () => {
            console.log('Game started by server');
            showGameScreen();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }

    createRoom(callback) {
        this.socket.emit('createRoom', {}, (response) => {
            if (response.success) {
                this.roomId = response.roomId;
                this.playerId = response.playerId;
                this.socket.emit('getRooms');
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
        if (!this.socket) return;
        this.socket.emit('gameAction', action);
    }

    setupEvents() {
        // We'll use global listeners that check for the canvas
        document.addEventListener('mousedown', (e) => {
            if (e.target.id === 'game-canvas') this.onCanvasMouseDown(e);
        });
        document.addEventListener('mousemove', (e) => {
            if (this.canvas) this.onCanvasMouseMove(e);
        });
        document.addEventListener('wheel', (e) => {
            if (e.target.id === 'game-canvas') this.onCanvasWheel(e);
        }, { passive: false });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') {
                this.sendAction({ type: 'stop' });
            }
        });
        
        document.addEventListener('contextmenu', (e) => {
            if (e.target.id === 'game-canvas') e.preventDefault();
        });
    }

    onCanvasMouseDown(e) {
        if (!this.ctx || !this.gameState) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        const world = this.screenToWorld(pos.x, pos.y);

        if (e.button === 0) {
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

            this.sendAction({ type: 'select', nodeIds: this.selectedNodes, entityIds: this.selectedEntities });
            
        } else if (e.button === 2) {
            if (this.selectedEntities.length > 0 || this.selectedNodes.length > 0) {
                let targetNode = null;
                for (const node of this.gameState.nodes) {
                    const dx = world.x - node.x;
                    const dy = world.y - node.y;
                    if (Math.sqrt(dx*dx + dy*dy) < node.radius) {
                        targetNode = node;
                        break;
                    }
                }
                
                this.sendAction({ type: 'command', target: world, targetNodeId: targetNode ? targetNode.id : null });
            }
        }
    }

    onCanvasMouseMove(e) {
        if (!this.canvas) return;
        if (e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) {
            this.camera.x -= e.movementX / this.camera.zoom;
            this.camera.y -= e.movementY / this.camera.zoom;
        }
    }

    onCanvasWheel(e) {
        if (e.target.id !== 'game-canvas') return;
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldBefore = this.screenToWorld(mouseX, mouseY);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoom = Math.max(0.2, Math.min(3, this.camera.zoom * zoomFactor));
        
        const worldAfter = this.screenToWorld(mouseX, mouseY);
        this.camera.x += worldBefore.x - worldAfter.x;
        this.camera.y += worldBefore.y - worldAfter.y;
    }

    screenToWorld(sx, sy) {
        return {
            x: sx / this.camera.zoom + this.camera.x,
            y: sy / this.camera.zoom + this.camera.y
        };
    }

    start() {
        if (this.running || !this.connected) return;
        console.log("Starting render loop");
        this.running = true;
        
        const loop = () => {
            this.render();
            if (this.running) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    render() {
        if (!this.ctx) {
            this.tryInitCanvas();
            return;
        }
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, w, h);
        
        this.drawGrid(ctx, w, h);
        
        if (this.gameState) {
            if (this.gameState.nodes) {
                for (const node of this.gameState.nodes) {
                    this.drawNode(ctx, node);
                }
            }
            if (this.gameState.entities) {
                for (const entity of this.gameState.entities) {
                    this.drawEntity(ctx, entity);
                }
            }
        } else {
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText("Esperando estado del juego...", w/2, h/2);
        }
        
        this.drawUI(ctx, w, h);
    }

    drawGrid(ctx, w, h) {
        const gridSize = 100 * this.camera.zoom;
        const offsetX = (-this.camera.x * this.camera.zoom) % gridSize;
        const offsetY = (-this.camera.y * this.camera.zoom) % gridSize;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        ctx.lineWidth = 1;
        
        for (let x = offsetX; x < w; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = offsetY; y < h; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    drawNode(ctx, node) {
        const sx = (node.x - this.camera.x) * this.camera.zoom;
        const sy = (node.y - this.camera.y) * this.camera.zoom;
        const sr = node.radius * this.camera.zoom;
        const sir = (node.influenceRadius || node.radius * 3) * this.camera.zoom;
        
        const color = node.owner === -1 ? '#757575' : PLAYER_COLORS[node.owner % PLAYER_COLORS.length];
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const maxHp = node.maxHp || 40;
        const stockBonus = Math.floor((node.stock || 0) * 0.5);
        const totalFill = node.baseHp + stockBonus;
        const fillPercent = Math.min(1, totalFill / maxHp);
        
        // Aura
        ctx.beginPath();
        ctx.arc(sx, sy, sir, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
        ctx.fill();
        
        // Background
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30,30,30,0.9)';
        ctx.fill();
        
        // Fill
        if (fillPercent > 0) {
            ctx.beginPath();
            ctx.arc(sx, sy, sr * fillPercent, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
        
        // Border
        const isSelected = this.selectedNodes.includes(node.id);
        ctx.beginPath();
        ctx.arc(sx, sy, sr - 1, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? 'white' : `rgba(${r},${g},${b},0.7)`;
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
    }

    drawEntity(ctx, entity) {
        const sx = (entity.x - this.camera.x) * this.camera.zoom;
        const sy = (entity.y - this.camera.y) * this.camera.zoom;
        const sr = entity.radius * this.camera.zoom;
        const color = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
        
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        if (this.selectedEntities.includes(entity.id)) {
            ctx.beginPath();
            ctx.arc(sx, sy, sr + 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawUI(ctx, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Sala: ${this.roomId ? this.roomId.slice(-6) : '-'} | Jugador ${this.playerId ?? '-'}`, 20, 25);
        ctx.fillText(`Nodos: ${this.gameState?.nodes?.length || 0} | Unidades: ${this.gameState?.entities?.length || 0}`, 20, 45);
    }
}

let client = null;

function showGameScreen() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    if (client) client.resize();
}

document.addEventListener('DOMContentLoaded', () => {
    client = new MultiplayerClient();
    client.connect();
    
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            client.createRoom((res) => { if(res.success) showGameScreen(); });
        });
    }

    const refreshBtn = document.getElementById('refresh-rooms-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            if (client.socket) client.socket.emit('getRooms');
        });
    }
});
