// Nanowar Multiplayer Client v4.5.0
const PLAYER_COLORS = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerId = null;
        this.gameState = null;
        this.selectedNodes = [];
        this.selectedEntities = [];
        this.particles = [];
        this.commandIndicators = [];
        this.waypointLines = []; 
        this.waypointLinePoints = [];
        
        this.rightMouseDown = false;
        this.isDragging = false;
        this.rallyMode = false;
        this.mouseDownPos = { x: 0, y: 0 };
        this.mousePos = { x: 0, y: 0 };
        
        this.running = false;
        this.connected = false;
        this.lastStateTime = 0;
        this.initialZoomDone = false;
        
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
        }
        return !!this.ctx;
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (!this.initialZoomDone && this.canvas.width > 0) {
            this.zoomToFit();
            this.initialZoomDone = true;
        }
    }
    
    zoomToFit() {
        if (!this.canvas) return;
        const padding = 150;
        const zoomX = this.canvas.width / (this.worldWidth + padding * 2);
        const zoomY = this.canvas.height / (this.worldHeight + padding * 2);
        this.camera.zoom = Math.min(zoomX, zoomY);
        if (this.camera.zoom <= 0) this.camera.zoom = 0.5;
        this.camera.x = (this.worldWidth / 2) - (this.canvas.width / 2 / this.camera.zoom);
        this.camera.y = (this.worldHeight / 2) - (this.canvas.height / 2 / this.camera.zoom);
    }

    connect() {
        if (this.socket) return;
        this.socket = io({ transports: ['websocket', 'polling'] });
        
        this.socket.on('connect', () => {
            this.connected = true;
            this.socket.emit('getRooms');
        });

        this.socket.on('roomList', (rooms) => {
            this.rooms = rooms;
            this.updateRoomListUI();
        });

        this.socket.on('playerJoined', (data) => {
            console.log("Lobby Update:", data);
            this.updateLobbyUI(data.players);
        });

        this.socket.on('gameState', (state) => {
            this.gameState = state;
            this.lastStateTime = Date.now();
            if (state.events) {
                state.events.forEach(ev => this.spawnLocalParticles(ev.x, ev.y, ev.color, 6, ev.type));
            }
            if (!this.running) this.start();
        });

        this.socket.on('gameStart', () => {
            console.log("GAME STARTING!");
            showGameScreen();
        });
        
        this.socket.on('disconnect', () => { 
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
                <button class="btn-secondary join-btn" data-room="${room.id}">Unirse</button>
            </div>
        `).join('');

        document.querySelectorAll('.join-btn').forEach(btn => {
            btn.onclick = (e) => {
                const rId = e.target.getAttribute('data-room');
                this.joinRoom(rId, (res) => {
                    if (res.success) {
                        showLobbyScreen();
                        this.updateLobbyUI(res.players);
                    } else alert('Error: ' + res.error);
                });
            };
        });
    }

    updateLobbyUI(players) {
        const lobbyEl = document.getElementById('lobby-players');
        if (!lobbyEl || !players) return;
        
        lobbyEl.innerHTML = players.map(p => `
            <div class="player-item ${p.ready ? 'ready' : ''}">
                <div class="player-color" style="background: ${PLAYER_COLORS[p.id % PLAYER_COLORS.length]}"></div>
                <div class="player-name">Jugador ${p.id + 1} ${p.id === this.playerId ? '(TÚ)' : ''}</div>
                <div class="player-status">${p.ready ? 'LISTO' : 'Esperando...'}</div>
            </div>
        `).join('');
    }

    sendAction(action) {
        if (!this.socket || !this.connected) return;
        this.socket.emit('gameAction', action);
    }

    setupEvents() {
        document.addEventListener('mousedown', (e) => { if (this.canvas && e.target === this.canvas) this.onMouseDown(e); });
        document.addEventListener('mousemove', (e) => { if (this.canvas) this.onMouseMove(e); });
        document.addEventListener('mouseup', (e) => { if (this.canvas) this.onMouseUp(e); });
        document.addEventListener('dblclick', (e) => { if (this.canvas && e.target === this.canvas) this.onDoubleClick(e); });
        document.addEventListener('wheel', (e) => { if (this.canvas && e.target === this.canvas) this.onWheel(e); }, { passive: false });
        document.addEventListener('keydown', (e) => { 
            if (e.key === 's' || e.key === 'S') this.sendAction({ type: 'stop' }); 
            if (e.key === 't' || e.key === 'T') { 
                if (this.selectedNodes.length > 0) this.rallyMode = true; 
            }
            if (e.key === 'Escape') { 
                this.clearSelection(); 
                this.rallyMode = false; 
            }
        });
        document.addEventListener('contextmenu', (e) => { if (this.canvas && e.target === this.canvas) e.preventDefault(); });
    }

    onMouseDown(e) {
        if (!this.gameState) return;
        const rect = this.canvas.getBoundingClientRect();
        const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        this.mouseDownPos = { ...pos };
        this.mousePos = { ...pos };
        const world = this.screenToWorld(pos.x, pos.y);

        // Handle rally point setting (T key mode)
        if (this.rallyMode && this.selectedNodes.length > 0 && e.button === 0) {
            this.selectedNodes.forEach(nodeId => {
                const node = this.gameState.nodes.find(n => n.id === nodeId);
                if (node) {
                    this.sendAction({ type: 'setRally', nodeId: nodeId, rallyX: world.x, rallyY: world.y });
                }
            });
            this.rallyMode = false;
            return;
        }

        if (e.button === 0) {
            this.isDragging = true;
        } else if (e.button === 2) {
            this.rightMouseDown = true;
            this.waypointLinePoints = [{ x: world.x, y: world.y }];
            
            // Send command immediately for right click
            let targetNode = this.gameState.nodes.find(n => Math.sqrt((world.x - n.x)**2 + (world.y - n.y)**2) < n.radius);
            this.commandIndicators.push({ x: world.x, y: world.y, life: 1.0, type: targetNode ? 'attack' : 'move' });
            this.sendAction({ type: 'command', target: world, targetNodeId: targetNode ? targetNode.id : null });
        }
    }

    onMouseMove(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        if (e.buttons === 4 || (e.buttons === 1 && e.shiftKey)) {
            this.camera.x -= e.movementX / this.camera.zoom;
            this.camera.y -= e.movementY / this.camera.zoom;
        }

        if (this.rightMouseDown && (this.selectedEntities.length > 0 || this.selectedNodes.length > 0)) {
            const worldPos = this.screenToWorld(this.mousePos.x, this.mousePos.y);
            const lastPoint = this.waypointLinePoints[this.waypointLinePoints.length - 1];
            if (Math.sqrt((worldPos.x - lastPoint.x)**2 + (worldPos.y - lastPoint.y)**2) > 30) {
                this.waypointLinePoints.push({ x: worldPos.x, y: worldPos.y });
            }
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.isDragging = false;
            const dx = Math.abs(this.mousePos.x - this.mouseDownPos.x);
            const dy = Math.abs(this.mousePos.y - this.mouseDownPos.y);

            if (dx < 10 && dy < 10) {
                this.handleSimpleSelection(this.screenToWorld(this.mouseDownPos.x, this.mouseDownPos.y), e.shiftKey);
            } else {
                this.handleBoxSelection(e.shiftKey);
            }
        } else if (e.button === 2) {
            this.rightMouseDown = false;
            if (this.waypointLinePoints.length > 1) {
                this.waypointLines.push({ points: [...this.waypointLinePoints], life: 2.0 });
                const lastPoint = this.waypointLinePoints[this.waypointLinePoints.length - 1];
                let targetNode = this.gameState.nodes.find(n => Math.sqrt((lastPoint.x - n.x)**2 + (lastPoint.y - n.y)**2) < n.radius);
                this.sendAction({ type: 'command', target: lastPoint, waypoints: [...this.waypointLinePoints], targetNodeId: targetNode ? targetNode.id : null });
            }
            this.waypointLinePoints = [];
        }
    }

    handleSimpleSelection(world, isShift) {
        let clickedNode = this.gameState.nodes.find(n => Math.sqrt((world.x - n.x)**2 + (world.y - n.y)**2) < n.radius);

        if (clickedNode) {
            if (isShift) {
                const idx = this.selectedNodes.indexOf(clickedNode.id);
                if (idx === -1) this.selectedNodes.push(clickedNode.id);
                else this.selectedNodes.splice(idx, 1);
            } else {
                this.selectedNodes = [clickedNode.id];
            }
            if (clickedNode.owner === this.playerId) {
                const sir = clickedNode.influenceRadius || clickedNode.radius * 3;
                this.selectedEntities = this.gameState.entities
                    .filter(ent => ent.owner === this.playerId && Math.sqrt((ent.x - clickedNode.x)**2 + (ent.y - clickedNode.y)**2) < sir)
                    .map(ent => ent.id);
            } else {
                this.selectedEntities = [];
            }
        } else {
            let clickedEntity = this.gameState.entities.find(ent => Math.sqrt((world.x - ent.x)**2 + (world.y - ent.y)**2) < ent.radius + 5);
            if (clickedEntity && clickedEntity.owner === this.playerId) {
                if (isShift) {
                    const idx = this.selectedEntities.indexOf(clickedEntity.id);
                    if (idx === -1) this.selectedEntities.push(clickedEntity.id);
                    else this.selectedEntities.splice(idx, 1);
                } else {
                    this.selectedEntities = [clickedEntity.id];
                }
                this.selectedNodes = [];
            } else if (!isShift) {
                this.selectedNodes = [];
                this.selectedEntities = [];
            }
        }
        this.sendAction({ type: 'select', nodeIds: this.selectedNodes, entityIds: this.selectedEntities });
    }

    handleBoxSelection(isShift) {
        const p1 = this.screenToWorld(this.mouseDownPos.x, this.mouseDownPos.y);
        const p2 = this.screenToWorld(this.mousePos.x, this.mousePos.y);
        const xMin = Math.min(p1.x, p2.x), xMax = Math.max(p1.x, p2.x);
        const yMin = Math.min(p1.y, p2.y), yMax = Math.max(p1.y, p2.y);

        const boxEnts = this.gameState.entities
            .filter(ent => ent.owner === this.playerId && ent.x >= xMin && ent.x <= xMax && ent.y >= yMin && ent.y <= yMax)
            .map(ent => ent.id);

        if (isShift) {
            boxEnts.forEach(id => { if (!this.selectedEntities.includes(id)) this.selectedEntities.push(id); });
        } else {
            this.selectedEntities = boxEnts;
            this.selectedNodes = [];
        }
        this.sendAction({ type: 'select', nodeIds: this.selectedNodes, entityIds: this.selectedEntities });
    }

    onDoubleClick(e) {
        if (!this.gameState) return;
        const world = this.screenToWorld(e.clientX - this.canvas.getBoundingClientRect().left, e.clientY - this.canvas.getBoundingClientRect().top);
        let clickedNode = this.gameState.nodes.find(n => Math.sqrt((world.x - n.x)**2 + (world.y - n.y)**2) < n.radius);
        if (clickedNode && clickedNode.owner === this.playerId) {
            this.selectedNodes = this.gameState.nodes.filter(n => n.owner === this.playerId).map(n => n.id);
            this.selectedEntities = [];
        } else {
            this.selectedNodes = this.gameState.nodes.filter(n => n.owner === this.playerId).map(n => n.id);
            this.selectedEntities = this.gameState.entities.filter(ent => ent.owner === this.playerId).map(ent => ent.id);
        }
        this.sendAction({ type: 'select', nodeIds: this.selectedNodes, entityIds: this.selectedEntities });
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const worldBefore = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        this.camera.zoom = Math.max(0.1, Math.min(5, this.camera.zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
        const worldAfter = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        this.camera.x += worldBefore.x - worldAfter.x;
        this.camera.y += worldBefore.y - worldAfter.y;
    }

    screenToWorld(sx, sy) { return { x: sx / this.camera.zoom + this.camera.x, y: sy / this.camera.zoom + this.camera.y }; }

    spawnLocalParticles(x, y, color, count, type) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2, speed = Math.random() * (type === 'explosion' ? 120 : 60);
            this.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: 0.8, maxLife: 0.8 });
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        const loop = () => { this.render(); if (this.running) requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
    }

    render() {
        if (!this.tryInitCanvas()) return;
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height, dt = 1/60;
        ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, w, h);
        this.drawGrid(ctx, w, h);
        if (this.gameState) {
            if (this.gameState.nodes) for (const n of this.gameState.nodes) this.drawNode(ctx, n, dt);
            if (this.gameState.entities) for (const e of this.gameState.entities) this.drawEntity(ctx, e, dt);
            if (this.isDragging && !this.rightMouseDown) {
                const x = Math.min(this.mouseDownPos.x, this.mousePos.x), y = Math.min(this.mouseDownPos.y, this.mousePos.y);
                const boxW = Math.abs(this.mousePos.x - this.mouseDownPos.x), boxH = Math.abs(this.mousePos.y - this.mouseDownPos.y);
                if (boxW > 5 || boxH > 5) {
                    ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)'; ctx.lineWidth = 2; ctx.strokeRect(x, y, boxW, boxH);
                    ctx.fillStyle = 'rgba(76, 175, 80, 0.1)'; ctx.fillRect(x, y, boxW, boxH);
                }
            }
            if (this.rightMouseDown && this.waypointLinePoints.length > 1) this.drawWaypointLine(ctx, this.waypointLinePoints, 1.0);
            this.waypointLines = this.waypointLines.filter(line => {
                line.life -= dt;
                if (line.life > 0) { this.drawWaypointLine(ctx, line.points, line.life / 2.0); return true; }
                return false;
            });
            this.particles = this.particles.filter(p => {
                p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
                if (p.life > 0) {
                    const sx = (p.x - this.camera.x) * this.camera.zoom, sy = (p.y - this.camera.y) * this.camera.zoom;
                    ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(sx, sy, 2 * this.camera.zoom, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1.0; return true;
                }
                return false;
            });
            this.commandIndicators = this.commandIndicators.filter(ci => {
                ci.life -= dt;
                if (ci.life > 0) {
                    const sx = (ci.x - this.camera.x) * this.camera.zoom, sy = (ci.y - this.camera.y) * this.camera.zoom;
                    ctx.strokeStyle = ci.type === 'attack' ? `rgba(255,100,100,${ci.life})` : `rgba(100,200,255,${ci.life})`;
                    ctx.lineWidth = 2 * this.camera.zoom; const size = 10 * this.camera.zoom;
                    if (ci.type === 'attack') { ctx.beginPath(); ctx.moveTo(sx-size, sy-size); ctx.lineTo(sx+size, sy+size); ctx.moveTo(sx+size, sy-size); ctx.lineTo(sx-size, sy+size); ctx.stroke(); }
                    else { ctx.beginPath(); ctx.arc(sx, sy, size * (1-ci.life), 0, Math.PI * 2); ctx.stroke(); }
                    return true;
                }
                return false;
            });
        }
        this.drawUI(ctx, w, h);
    }

    drawGrid(ctx, w, h) {
        const gridSize = 100 * this.camera.zoom;
        const offsetX = (-this.camera.x * this.camera.zoom) % gridSize, offsetY = (-this.camera.y * this.camera.zoom) % gridSize;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'; ctx.lineWidth = 1;
        for (let x = offsetX; x < w; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
        for (let y = offsetY; y < h; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    }

    drawNode(ctx, node, dt) {
        const sx = (node.x - this.camera.x) * this.camera.zoom, sy = (node.y - this.camera.y) * this.camera.zoom;
        const sr = node.radius * this.camera.zoom, sir = (node.influenceRadius || node.radius * 3) * this.camera.zoom;
        const color = node.owner === -1 ? '#757575' : PLAYER_COLORS[node.owner % PLAYER_COLORS.length];
        ctx.beginPath(); ctx.arc(sx, sy, sir, 0, Math.PI * 2); ctx.fillStyle = hexToRgba(color, 0.05); ctx.fill();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = hexToRgba(color, 0.1); ctx.stroke(); ctx.setLineDash([]);
        if (node.rallyPoint && node.owner === this.playerId) {
            const rx = (node.rallyPoint.x - this.camera.x) * this.camera.zoom, ry = (node.rallyPoint.y - this.camera.y) * this.camera.zoom;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(rx, ry); ctx.strokeStyle = hexToRgba(color, 0.3); ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        }
        if (node.hitFlash > 0) { ctx.beginPath(); ctx.arc(sx, sy, sr + 5*this.camera.zoom, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255, 100, 100, ${node.hitFlash})`; ctx.lineWidth = 4*this.camera.zoom; ctx.stroke(); }
        if (node.spawnEffect > 0) { ctx.beginPath(); ctx.arc(sx, sy, sr * (1 + (0.5 - node.spawnEffect)*2), 0, Math.PI * 2); ctx.strokeStyle = `rgba(255, 255, 255, ${node.spawnEffect})`; ctx.lineWidth = 2*this.camera.zoom; ctx.stroke(); }
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = '#1e1e1e'; ctx.fill();
        const maxHp = node.maxHp || (node.type === 'small' ? 12 : node.type === 'large' ? 35 : 22);
        const fillPercent = Math.min(1, (node.baseHp + Math.floor((node.stock || 0) * 0.5)) / maxHp);
        if (fillPercent > 0) { ctx.beginPath(); ctx.arc(sx, sy, sr * fillPercent, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
        if (node.owner !== -1 && node.spawnProgress > 0) { ctx.beginPath(); ctx.arc(sx, sy, sr + 3*this.camera.zoom, -Math.PI/2, -Math.PI/2 + node.spawnProgress * Math.PI*2); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2*this.camera.zoom; ctx.stroke(); }
        const isSelected = this.selectedNodes.includes(node.id);
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.strokeStyle = isSelected ? 'white' : hexToRgba(color, 0.5); ctx.lineWidth = isSelected ? 3 : 2; ctx.stroke();
    }

    drawEntity(ctx, entity, dt) {
        if (entity.dying && entity.deathTime > 0.4) return;
        const sx = (entity.x - this.camera.x) * this.camera.zoom, sy = (entity.y - this.camera.y) * this.camera.zoom;
        const sr = entity.radius * this.camera.zoom, color = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
        if (entity.dying) {
            const p = entity.deathTime / 0.4; ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.arc(sx, sy, sr * (1+p*2), 0, Math.PI * 2);
            ctx.fillStyle = entity.deathType === 'attack' ? '#f00' : color; ctx.fill(); ctx.globalAlpha = 1.0; return;
        }
        ctx.beginPath(); ctx.arc(sx+1, sy+1, sr, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
        if (Math.abs(entity.vx) > 0.1 || Math.abs(entity.vy) > 0.1) {
            const angle = Math.atan2(entity.vy, entity.vx); ctx.beginPath(); ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(angle) * sr * 1.5, sy + Math.sin(angle) * sr * 1.5); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1; ctx.stroke();
        }
        if (this.selectedEntities.includes(entity.id)) { ctx.beginPath(); ctx.arc(sx, sy, sr + 2, 0, Math.PI * 2); ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke(); }
    }

    drawUI(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, h - 100, 220, 90);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(10, h - 100, 220, 90);

        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        
        const playerColor = this.playerId !== null ? PLAYER_COLORS[this.playerId % PLAYER_COLORS.length] : '#fff';
        ctx.fillStyle = playerColor;
        ctx.fillText(`TÚ: JUGADOR ${this.playerId ?? '-'}`, 20, h - 80);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`Sala: ${this.roomId ? this.roomId.slice(-6) : '-'}`, 20, h - 60);
        ctx.fillText(`Unidades: ${this.gameState?.entities?.filter(e => e.owner === this.playerId).length || 0}`, 20, h - 40);
        ctx.fillText(`Seleccionados: ${this.selectedNodes.length}n / ${this.selectedEntities.length}u`, 20, h - 20);
        
        ctx.textAlign = 'right'; 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('Arrastrar Click Izq: Caja Selección', w - 20, h - 60);
        ctx.fillText('Click Der: Mover | Doble Click: Todo', w - 20, h - 40);
        ctx.fillText('Shift: Multi-select | Ruedita: Zoom', w - 20, h - 20);
        
        if (this.lastStateTime > 0) {
            const lag = Date.now() - this.lastStateTime; 
            ctx.textAlign = 'right';
            ctx.fillStyle = lag > 500 ? '#f44336' : 'rgba(255, 255, 255, 0.5)'; 
            ctx.fillText(`Ping: ${lag}ms`, w - 20, 30);
        }
    }

    drawWaypointLine(ctx, points, alpha) {
        if (points.length < 2) return;
        const color = PLAYER_COLORS[this.playerId % PLAYER_COLORS.length];
        ctx.strokeStyle = hexToRgba(color, alpha * 0.5); ctx.lineWidth = 3 * this.camera.zoom;
        ctx.setLineDash([8 * this.camera.zoom, 6 * this.camera.zoom]); ctx.beginPath();
        ctx.moveTo((points[0].x - this.camera.x) * this.camera.zoom, (points[0].y - this.camera.y) * this.camera.zoom);
        for (let i = 1; i < points.length; i++) ctx.lineTo((points[i].x - this.camera.x) * this.camera.zoom, (points[i].y - this.camera.y) * this.camera.zoom);
        ctx.stroke(); ctx.setLineDash([]);
    }
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

let client = null;
function showLobbyScreen() { document.getElementById('menu-screen').style.display = 'none'; document.getElementById('lobby-screen').style.display = 'block'; }
function showGameScreen() { document.getElementById('lobby-screen').style.display = 'none'; document.getElementById('game-screen').style.display = 'block'; if (client) { client.tryInitCanvas(); client.resize(); } }

document.addEventListener('DOMContentLoaded', () => {
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    if (multiplayerBtn) { 
        multiplayerBtn.onclick = () => { 
            // Show sections first (replaces showMultiplayer in HTML)
            document.querySelector('.mode-selection').style.display = 'none';
            document.querySelector('.rooms-section').style.display = 'block';
            document.querySelector('.menu-buttons').style.display = 'block';
            
            // Then connect
            if (!client) { client = new MultiplayerClient(); client.connect(); } 
        }; 
    }
    const createBtn = document.getElementById('create-room-btn');
    if (createBtn) { createBtn.onclick = () => { if (!client) return; client.createRoom((response) => { if (response.success) showLobbyScreen(); }); }; }
    const refreshBtn = document.getElementById('refresh-rooms-btn');
    if (refreshBtn) refreshBtn.onclick = () => { if (client) client.socket.emit('getRooms'); };
    const readyBtn = document.getElementById('ready-btn');
    if (readyBtn) {
        let isReady = false;
        readyBtn.onclick = () => {
            if (client && client.socket) {
                isReady = !isReady;
                client.socket.emit('setReady', isReady);
                readyBtn.style.backgroundColor = isReady ? '#4CAF50' : '';
                readyBtn.innerText = isReady ? 'ESPERANDO...' : 'LISTO';
            }
        };
    }
});
