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
        this.lastStateTime = 0;
        
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.worldWidth = 2400;
        this.worldHeight = 1800;
        
        this.canvas = null;
        this.ctx = null;
        
        this.setupEvents();
        window.addEventListener('resize', () => this.resize());
    }

    tryInitCanvas() {
        this.canvas = document.getElementById('game-canvas');
        if (this.canvas && !this.ctx) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            console.log("Canvas initialized", this.canvas.width, this.canvas.height);
        }
        return !!this.ctx;
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.zoomToFit();
    }
    
    zoomToFit() {
        if (!this.canvas || this.canvas.width === 0) return;
        const padding = 150;
        const zoomX = this.canvas.width / (this.worldWidth + padding * 2);
        const zoomY = this.canvas.height / (this.worldHeight + padding * 2);
        this.camera.zoom = Math.min(zoomX, zoomY);
        if (this.camera.zoom <= 0) this.camera.zoom = 0.5;
        
        // Center the world
        this.camera.x = (this.worldWidth / 2) - (this.canvas.width / 2 / this.camera.zoom);
        this.camera.y = (this.worldHeight / 2) - (this.canvas.height / 2 / this.camera.zoom);
    }

    connect() {
        if (this.socket) return;
        
        console.log("Connecting...");
        this.socket = io({
            transports: ['websocket', 'polling']
        });
        
        this.socket.on('connect', () => {
            console.log('Connected!');
            this.connected = true;
            this.socket.emit('getRooms');
            this.start();
        });

        this.socket.on('roomList', (rooms) => {
            this.rooms = rooms;
            this.updateRoomListUI();
        });

        this.socket.on('gameState', (state) => {
            if (!this.gameState) console.log("First gameState received!", state);
            this.gameState = state;
            this.lastStateTime = Date.now();
            if (!this.running) {
                console.log("Starting render loop from gameState");
                this.start();
            }
        });

        this.socket.on('gameStart', () => {
            console.log('Server: Game Start signal received');
            showGameScreen();
        });

        this.socket.on('playerJoined', (data) => {
            console.log('Player joined room:', data);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected');
            this.connected = false;
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
        if (!this.socket || !this.connected) return;
        this.socket.emit('gameAction', action);
    }

    setupEvents() {
        document.addEventListener('mousedown', (e) => {
            if (this.canvas && e.target === this.canvas) this.onCanvasMouseDown(e);
        });
        document.addEventListener('mousemove', (e) => {
            if (this.canvas) this.onCanvasMouseMove(e);
        });
        document.addEventListener('wheel', (e) => {
            if (this.canvas && e.target === this.canvas) this.onCanvasWheel(e);
        }, { passive: false });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' || e.key === 'S') this.sendAction({ type: 'stop' });
        });
        
        document.addEventListener('contextmenu', (e) => {
            if (this.canvas && e.target === this.canvas) e.preventDefault();
        });
    }

    onCanvasMouseDown(e) {
        if (!this.gameState) return;
        
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
                    const idx = this.selectedNodes.indexOf(clickedNode.id);
                    if (idx === -1) this.selectedNodes.push(clickedNode.id);
                    else this.selectedNodes.splice(idx, 1);
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
                        const idx = this.selectedEntities.indexOf(clickedEntity.id);
                        if (idx === -1) this.selectedEntities.push(clickedEntity.id);
                        else this.selectedEntities.splice(idx, 1);
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
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldBefore = this.screenToWorld(mouseX, mouseY);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom * zoomFactor));
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
        if (this.running) return;
        this.running = true;
        const loop = () => {
            this.render();
            if (this.running) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    render() {
        if (!this.tryInitCanvas()) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Debug fill to ensure canvas is actually drawing something
        ctx.fillStyle = '#ff00ff'; 
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#151515';
        ctx.fillRect(0, 0, w, h);
        
        this.drawGrid(ctx, w, h);
        
        if (this.gameState) {
            if (this.gameState.nodes) {
                for (const node of this.gameState.nodes) this.drawNode(ctx, node);
            }
            if (this.gameState.entities) {
                for (const entity of this.gameState.entities) this.drawEntity(ctx, entity);
            }
        } else {
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = '20px monospace';
            ctx.fillText("Esperando estado del juego...", w/2, h/2);
            if (!this.connected) {
                ctx.fillStyle = '#f44336';
                ctx.fillText("Desconectado del servidor", w/2, h/2 + 40);
            }
        }
        
        this.drawUI(ctx, w, h);
    }

    drawGrid(ctx, w, h) {
        const gridSize = 100 * this.camera.zoom;
        const offsetX = (-this.camera.x * this.camera.zoom) % gridSize;
        const offsetY = (-this.camera.y * this.camera.zoom) % gridSize;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
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
        
        // Aura
        ctx.beginPath();
        ctx.arc(sx, sy, sir, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, 0.05);
        ctx.fill();
        
        // Background
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1e1e';
        ctx.fill();
        
        // HP/Stock fill
        const maxHp = node.maxHp || 40;
        const totalFill = node.baseHp + Math.floor((node.stock || 0) * 0.5);
        const fillPercent = Math.min(1, totalFill / maxHp);
        
        if (fillPercent > 0) {
            ctx.beginPath();
            ctx.arc(sx, sy, sr * fillPercent, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
        
        // Border
        const isSelected = this.selectedNodes.includes(node.id);
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.strokeStyle = isSelected ? 'white' : hexToRgba(color, 0.5);
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
        ctx.fillText(`Sala: ${this.roomId ? this.roomId.slice(-6) : '-'} | Jugador ${this.playerId ?? '-'}`, 20, 30);
        ctx.fillText(`Unidades: ${this.gameState?.entities?.length || 0}`, 20, 50);
        
        if (this.lastStateTime > 0) {
            const lag = Date.now() - this.lastStateTime;
            ctx.textAlign = 'right';
            ctx.fillStyle = lag > 500 ? '#f44336' : 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(`Ping: ${lag}ms`, w - 20, 30);
        }
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

let client = null;

function showGameScreen() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    if (client) {
        client.tryInitCanvas();
        client.resize();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    client = new MultiplayerClient();
    client.connect();
    
    document.getElementById('create-room-btn').addEventListener('click', () => {
        client.createRoom((res) => { if(res.success) showGameScreen(); });
    });

    document.getElementById('refresh-rooms-btn').addEventListener('click', () => {
        if (client.socket) client.socket.emit('getRooms');
    });
});
