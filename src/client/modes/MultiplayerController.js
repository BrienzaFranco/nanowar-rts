import { io } from 'socket.io-client';
import { GameState } from '../../shared/GameState.js';
import { sounds } from '../systems/SoundManager.js';
import { PLAYER_COLORS } from '../../shared/GameConfig.js';
import { SharedMemory, MEMORY_LAYOUT } from '../../shared/SharedMemory.js';
import { SharedView } from '../../shared/SharedView.js';


export class MultiplayerController {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerIndex = -1;
        this.roomId = null;
        this.cameraCentered = false;
        this.initialStateReceived = false;
        this.gameLost = false;
        this.surrendered = false;
        this.playerDefeated = false;
    }

    connect(url = '/') {
        this.socket = io(url);
        this.setupSocketEvents();
        window.multiplayer = this;
    }

    surrender() {
        if (this.socket && this.connected && !this.surrendered) {
            this.surrendered = true;
            this.socket.emit('surrender');
            alert('Te has rendido. Puedes seguir jugando mientras esperas.');
        }
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('MultiplayerController connected to server');
            this.socket.emit('listRooms');

            const name = localStorage.getItem('nanowar_nickname');
            if (name) this.socket.emit('setNickname', name);
        });

        this.socket.on('roomList', (rooms) => {
            if (window.updateRoomListUI) {
                window.updateRoomListUI(rooms);
            }
        });

        this.socket.on('lobbyUpdate', (data) => {
            console.log('Lobby Update:', data);
            
            // Update our player index based on our position in the players array
            const myIndex = data.players.findIndex(p => p.id === this.socket.id);
            if (myIndex !== -1) {
                this.playerIndex = myIndex;
                console.log('Updated player index to:', this.playerIndex);
            }

            if (window.updateLobbyUI) {
                window.updateLobbyUI(data.players, this.roomId);
            }
        });

        this.socket.on('gameStart', (initialState) => {
            console.log('Game starting!', initialState);

            if (initialState.playerColors) {
                const defaultColors = [...PLAYER_COLORS];
                initialState.playerColors.forEach((colorIdx, i) => {
                    if (colorIdx !== -1 && colorIdx !== undefined) {
                        PLAYER_COLORS[i] = defaultColors[colorIdx % defaultColors.length];
                    }
                });
            }

            // Initialize a fresh GameState (needed for elapsedTime, stats, etc.)
            this.game.state = new GameState();
            this.game.state.nodes = [];
            this.game.state.entities = [];
            this.game.state.playerCount = initialState.playerCount || 2;
            this.game.state.isClient = true;

            // PRE-ALLOCATE SharedMemory and SharedView immediately.
            // drawFromWorker will be called from game.start() and needs sharedView to exist.
            // The actual data will arrive via syncStateDO shortly after.
            if (!this.game.sharedMemory) {
                const buffer = new ArrayBuffer(MEMORY_LAYOUT.TOTAL_SIZE);
                this.game.sharedMemory = new SharedMemory(buffer);
                this.game.sharedView = new SharedView(buffer);
            }
            this.game.isMultiplayerDO = true;
            this.cameraCentered = false;

            const lobby = document.getElementById('lobby-screen');
            const gameScreen = document.getElementById('game-screen');
            if (lobby) lobby.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';

            this.game.resize();
            this.game.start();
        });

        this.socket.on('playerDefeated', (data) => {
            const isMe = data.playerIndex === this.playerIndex;

            if (isMe) {
                this.playerDefeated = true;
                // Show small notification
                const notif = document.createElement('div');
                notif.style.cssText = `
                    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                    background: rgba(244,67,54,0.9); color: white; padding: 10px 20px;
                    border-radius: 4px; z-index: 100; font-family: monospace;
                `;
                notif.textContent = data.surrendered ? 'TE RENDISTE - Ya no puedes controlar unidades' : 'ELIMINADO - Te has quedado sin tropas ni nodos';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 4000);
            }
        });

        this.socket.on('playerLostNodes', () => {
            // Show small non-fatal notification
            const notif = document.createElement('div');
            notif.style.cssText = `
                position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                background: rgba(255,152,0,0.9); color: white; padding: 10px 20px;
                border-radius: 4px; z-index: 100; font-family: monospace; font-weight: bold;
            `;
            notif.textContent = 'SIN NODOS - Tus unidades están pereciendo. Captura un nodo rápido!';
            document.body.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
        });

        this.socket.on('syncStateDO', (serverState) => {
            if (this.game.gameOverShown) return;

            if (this.game.running || this.playerDefeated) {
                this.syncStateDO(serverState);

                if (document.hidden && this.game.running) {
                    this.game.lastTime = performance.now();
                }
            }
        });

        this.socket.on('gameOver', (data) => {
            const won = data.winner === this.playerIndex;
            const lost = data.winner !== -1 && data.winner !== this.playerIndex;

            // Keep game running even if lost - players can still move units
            this.gameLost = lost;

            // Mark game as over to stop receiving states
            if (this.game) this.game.gameOverShown = true;

            // Play win/lose sound
            if (won) {
                sounds.playWin();
            } else {
                sounds.playLose();
            }

            // Show overlay
            const msg = won ? '¡VICTORIA!' : (data.winner === -1 ? 'EMPATE' : 'DERROTA');
            const color = won ? '#4CAF50' : '#f44336';

            const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

            // Generate stats HTML
            let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px; max-height: 200px; overflow-y: auto;">';

            const stats = data.stats || this.game.state.getStats();

            if (stats && stats.produced) {
                statsHTML += `<p style="color: #888; margin-bottom: 10px;">Duración: ${Math.floor(stats.elapsed)}m ${Math.floor((stats.elapsed % 1) * 60)}s</p>`;

                for (let pid in stats.produced) {
                    const p = parseInt(pid);
                    const pColor = playerColors[p % playerColors.length];
                    const pName = p === this.playerIndex ? 'TÚ' : `Jugador ${p + 1}`;
                    const produced = stats.produced[pid]?.total || 0;
                    const lostUnits = stats.lost[pid]?.total || 0;
                    const current = stats.current[pid] || 0;
                    const prodPerMin = stats.produced[pid]?.perMinute || 0;

                    const captured = stats.captured[pid] || 0;

                    statsHTML += `
                        <div style="color: ${pColor}; margin: 10px 0; padding: 12px 15px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 4px solid ${pColor}; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                <strong style="font-size: 15px; letter-spacing: 1px;">${pName}</strong>
                                <span style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1px;">CAPTURAS: ${captured}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 11px; color: rgba(255,255,255,0.6);">
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">PROD</span><span>${produced}</span></div>
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">RITMO</span><span>${prodPerMin}/m</span></div>
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">BAJAS</span><span>${lostUnits}</span></div>
                                <div style="display: flex; flex-direction: column;"><span style="font-size: 9px; opacity: 0.5;">VIVO</span><span>${current}</span></div>
                            </div>
                        </div>
                    `;
                }
            }
            statsHTML += '</div>';

            // Generate graph UI
            const graphWidth = 500;
            const graphHeight = 200;

            let graphUI = `
                <div style="margin: 20px 0;">
                    <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 15px;">
                        <button id="btn-graph-prod" onclick="window.updateGraph('production')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">PRODUCCIÓN</button>
                        <button id="btn-graph-units" onclick="window.updateGraph('units')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">UNIDADES</button>
                        <button id="btn-graph-nodes" onclick="window.updateGraph('nodes')" style="background: transparent; border: 1px solid #333; color: #666; padding: 6px 12px; cursor: pointer; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 11px; transition: all 0.2s;">TERRITORIO</button>
                    </div>
                    <div style="position: relative;">
                        <canvas id="stats-graph" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); border-radius: 4px; cursor: crosshair;"></canvas>
                        <button onclick="window.downloadGraph()" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.05); color: #666; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; font-size: 9px; padding: 4px 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#666';this.style.background='rgba(255,255,255,0.05)'">EXPORTAR PNG</button>
                    </div>
                </div>
            `;

            const overlay = document.createElement('div');
            overlay.id = 'game-over-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85); display: flex;
                justify-content: center; align-items: center; z-index: 1000;
            `;

            const box = document.createElement('div');
            box.style.cssText = `
                padding: 40px 50px; background: #0e0e12;
                border: 1px solid rgba(255,255,255,0.1); border-top: 4px solid ${color};
                border-radius: 8px; text-align: center; position: relative;
                max-width: 650px; width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            `;

            box.innerHTML = `
                <button onclick="this.parentElement.parentElement.remove(); location.href='index.html';" style="
                    position: absolute; top: 15px; right: 20px;
                    background: none; border: none; color: #444;
                    font-size: 24px; cursor: pointer; line-height: 1; transition: color 0.2s;
                " onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#444'">&times;</button>
                <h1 style="color: ${color}; font-size: 48px; margin: 0 0 5px 0; letter-spacing: 8px; font-weight: 900; text-shadow: 0 0 30px ${color}44;">${msg}</h1>
                <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-bottom: 30px; letter-spacing: 4px; text-transform: uppercase;">REGISTRO DE COMBATE FINALIZADO</p>
                
                ${graphUI}
                <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin: 25px 0;"></div>
                ${statsHTML}
                
                <p style="color: #666; font-size: 11px; margin-bottom: 20px;">${lost ? 'OPERACIÓN FALLIDA - PUEDES OBSERVAR EL DESENLACE' : ''}</p>
                <button id="restart-btn" style="
                    padding: 14px 35px; background: ${color}; border: none; border-radius: 4px;
                    color: white; font-family: 'Courier New', monospace; font-weight: bold;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s; box-shadow: 0 4px 15px ${color}33;">
                    VOLVER AL MENÚ
                </button>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            // Initial graph state
            this.graphState = {
                offset: 0,
                scale: 1.0,
                type: 'production'
            };

            // Define graph update function globally so buttons can call it
            window.updateGraph = (type) => {
                if (type) this.graphState.type = type;
                const canvas = document.getElementById('stats-graph');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;
                const padTop = 30;
                const padBottom = 25;
                const padLeft = 40;
                const padRight = 20;
                const graphW = w - padLeft - padRight;
                const graphH = h - padTop - padBottom;

                ctx.clearRect(0, 0, w, h);

                let dataArray = [];
                let title = '';
                let timeScale = 1; 

                // Update active button style
                ['prod', 'units', 'nodes'].forEach(t => {
                    const btn = document.getElementById(`btn-graph-${t}`);
                    const fullType = t === 'prod' ? 'production' : (t === 'units' ? 'units' : 'nodes');
                    if (btn) {
                        btn.style.background = fullType === this.graphState.type ? color + '22' : 'transparent';
                        btn.style.borderColor = fullType === this.graphState.type ? color : '#333';
                        btn.style.color = fullType === this.graphState.type ? color : '#666';
                    }
                });

                if (this.graphState.type === 'production') {
                    dataArray = stats.productionHistory || [];
                    title = 'PRODUCCIÓN (UNID/MIN)';
                    timeScale = 1;
                } else if (this.graphState.type === 'units') {
                    dataArray = stats.history || [];
                    title = 'EJÉRCITO TOTAL';
                    timeScale = 60;
                } else if (this.graphState.type === 'nodes') {
                    dataArray = stats.nodeHistory || [];
                    title = 'TERRITORIO (NODOS)';
                    timeScale = 60;
                }

                if (!dataArray || dataArray.length < 2) {
                    if (dataArray.length === 0) {
                        ctx.fillStyle = '#444';
                        ctx.textAlign = 'center';
                        ctx.font = '12px "Courier New"';
                        ctx.fillText('DATOS INSUFICIENTES', w / 2, h / 2);
                        return;
                    }
                }

                // Find max value
                let maxVal = 0;
                dataArray.forEach(p => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    if (val > maxVal) maxVal = val;
                });

                // Smart scaling
                if (this.graphState.type === 'nodes') maxVal = Math.ceil(Math.max(maxVal, 5) * 1.2);
                else if (maxVal > 100) {
                    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
                    maxVal = Math.ceil((maxVal * 1.1) / magnitude) * magnitude;
                } else {
                    maxVal = Math.ceil(Math.max(maxVal, 10) * 1.2);
                }

                ctx.save();

                // Background grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.lineWidth = 1;
                ctx.textAlign = 'right';
                ctx.font = '10px "Courier New"';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';

                for (let i = 0; i <= 4; i++) {
                    const y = padTop + graphH - (i / 4) * graphH;
                    ctx.beginPath();
                    ctx.moveTo(padLeft, y);
                    ctx.lineTo(padLeft + graphW, y);
                    ctx.stroke();
                    ctx.fillText(Math.round((i / 4) * maxVal), padLeft - 8, y + 3);
                }

                const totalTime = Math.max(stats.elapsed || 0, 0.1); // Min 6 seconds scale
                const timeToX = (t) => padLeft + (t * (graphW / totalTime) * this.graphState.scale) + this.graphState.offset;

                // Clip for scrolling
                ctx.beginPath();
                ctx.rect(padLeft, 0, graphW, h);
                ctx.clip();

                // Draw events markers
                if (stats.events) {
                    stats.events.forEach(ev => {
                        const t = ev.time / (this.graphState.type === 'production' ? 60 : 1);
                        const x = timeToX(t / (timeScale === 60 ? 60 : 1));
                        if (x < padLeft || x > padLeft + graphW) return;

                        ctx.setLineDash([5, 5]);
                        ctx.strokeStyle = ev.type === 'big_battle' ? 'rgba(255,50,50,0.3)' : 'rgba(255,255,255,0.1)';
                        ctx.beginPath();
                        ctx.moveTo(x, padTop);
                        ctx.lineTo(x, padTop + graphH);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        ctx.font = '12px serif';
                        if (ev.type === 'big_battle') ctx.fillText('⚔️', x + 5, padTop + 15);
                        else if (ev.type === 'capture') {
                            ctx.fillStyle = playerColors[ev.playerId % playerColors.length];
                            ctx.fillText('🚩', x + 5, padTop + 30);
                        }
                    });
                }

                // Group by player
                const playerData = {};
                dataArray.forEach(p => {
                    if (!playerData[p.playerId]) playerData[p.playerId] = [];
                    playerData[p.playerId].push(p);
                });

                // Draw Lines
                for (let pid in playerData) {
                    const data = playerData[pid];
                    data.sort((a, b) => a.time - b.time);

                    const pC = playerColors[parseInt(pid) % playerColors.length];
                    ctx.strokeStyle = pC;
                    ctx.lineWidth = 3;
                    ctx.lineJoin = 'round';
                    ctx.lineCap = 'round';

                    const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + graphH);
                    gradient.addColorStop(0, pC + '33');
                    gradient.addColorStop(1, pC + '00');

                    ctx.beginPath();
                    data.forEach((p, i) => {
                        const val = p.rate !== undefined ? p.rate : p.count;
                        const x = timeToX(p.time / (timeScale === 60 ? 60 : 1));
                        const y = padTop + graphH - (val / maxVal) * graphH;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();

                    if (data.length > 0) {
                        ctx.lineTo(timeToX(data[data.length - 1].time / (timeScale === 60 ? 60 : 1)), padTop + graphH);
                        ctx.lineTo(timeToX(data[0].time / (timeScale === 60 ? 60 : 1)), padTop + graphH);
                        ctx.fillStyle = gradient;
                        ctx.fill();
                    }
                }

                ctx.restore();

                // Title and labels
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText(title, w / 2, 18);
                
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.font = '9px "Courier New"';
                ctx.fillText('SCROLL: ZOOM • DRAG: PAN', w / 2, h - 8);
            };

            window.downloadGraph = () => {
                const canvas = document.getElementById('stats-graph');
                if (canvas) {
                    const link = document.createElement('a');
                    link.download = `nanowar-stats-${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                }
            };

            // Interaction logic
            setTimeout(() => {
                const canvas = document.getElementById('stats-graph');
                if (!canvas) return;

                let isDragging = false;
                let lastX = 0;

                canvas.addEventListener('mousedown', (e) => {
                    isDragging = true;
                    lastX = e.clientX;
                });

                window.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;
                    const dx = e.clientX - lastX;
                    this.graphState.offset += dx;
                    lastX = e.clientX;
                    window.updateGraph();
                });

                window.addEventListener('mouseup', () => {
                    isDragging = false;
                });

                canvas.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
                    this.graphState.scale *= zoomFactor;
                    this.graphState.scale = Math.max(1.0, Math.min(this.graphState.scale, 10));
                    if (this.graphState.scale === 1.0) this.graphState.offset = 0;
                    window.updateGraph();
                });

                window.updateGraph('production');
            }, 100);

            window.downloadGraph = () => {
                const canvas = document.getElementById('stats-graph');
                if (canvas) {
                    const link = document.createElement('a');
                    link.download = `nanowar-stats-${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                }
            };

            // Draw initial graph
            setTimeout(() => {
                window.updateGraph('production');
            }, 100);

            // Click outside to close
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    location.href = 'index.html';
                }
            });

            document.getElementById('restart-btn').addEventListener('click', () => {
                overlay.remove();
                location.reload();
            });
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
        });
    }

    createRoom(maxPlayers = 4) {
        this.socket.emit('createRoom', { maxPlayers }, (response) => {
            if (response.success) {
                this.roomId = response.roomId;
                this.playerIndex = response.playerIndex;
                this.showLobby();
            }
        });
    }

    joinRoom(roomId) {
        this.socket.emit('joinRoom', { roomId }, (response) => {
            if (response.success) {
                this.roomId = roomId;
                this.playerIndex = response.playerIndex;
                this.showLobby();
            } else {
                alert('Error: ' + response.message);
            }
        });
    }

    toggleReady() {
        // Get settings from lobby UI
        const speedSetting = document.getElementById('lobby-speed');

        const settings = {
            speedMultiplier: speedSetting ? parseFloat(speedSetting.value) : 1,
            acceleration: false,
            showProduction: true
        };

        if (this.socket) this.socket.emit('toggleReady', settings);
    }

    showLobby() {
        const lobby = document.getElementById('lobby-screen');
        const menu = document.getElementById('menu-screen');
        if (lobby) lobby.style.display = 'block';
        if (menu) menu.style.display = 'none';
    }

    sendAction(action) {
        if (this.socket && this.connected) {
            this.socket.emit('gameAction', action);
        }
    }

    syncStateDO(serverState) {
        if (!this.game.sharedMemory) {
            const buffer = new ArrayBuffer(MEMORY_LAYOUT.TOTAL_SIZE);
            this.game.sharedMemory = new SharedMemory(buffer);
            this.game.sharedView = new SharedView(buffer);
            this.game.isMultiplayerDO = true;
        }

        const view = this.game.sharedView;

        // Remember node owners before overwriting memory to play capture sounds
        const prevOwners = [];
        const nodeCount = view.getNodeCount();
        for (let i = 0; i < nodeCount; i++) {
            prevOwners[i] = view.getNodeOwner(i);
        }

        // Copy the full server buffer (header + node SOA) into client memory, 
        // but softly interpolate entity positions to avoid stuttering against client-side prediction.
        if (serverState.syncBuffer) {
            // The server sends a truncated buffer (header + entities + nodes) to save bandwidth.
            // SharedView expects the full TOTAL_SIZE buffer, so we pad it.
            const fullTempBuf = new ArrayBuffer(MEMORY_LAYOUT.TOTAL_SIZE);
            const tempDest = new Uint8Array(fullTempBuf);
            tempDest.set(new Uint8Array(serverState.syncBuffer));
            const srcView = new SharedView(fullTempBuf);

            // 1. Copy Nodes directly (they don't move)
            const nodeBytes = 19 * 4 * MEMORY_LAYOUT.MAX_NODES; // 19 fields * 4 bytes
            const nodeDest = new Uint8Array(this.game.sharedMemory.buffer, MEMORY_LAYOUT.NODE_DATA_START, nodeBytes);
            const nodeSrc = new Uint8Array(fullTempBuf, MEMORY_LAYOUT.NODE_DATA_START, nodeBytes);
            nodeDest.set(nodeSrc);

            // 2. Softly sync Entities (lerp positions if close, snap if far)
            const serverEntityCount = srcView.getEntityCount();

            // The header in syncBuffer already has correct counts, update them
            this.game.sharedMemory.setEntityCount(serverEntityCount);
            this.game.sharedMemory.setNodeCount(serverState.nodeCount);

            // Make sure the local Engine uses the new count
            if (this.game.sharedEngine && this.game.sharedEngine.entityData) {
                this.game.sharedEngine.entityData.syncCount();
            }

            for (let i = 0; i < serverEntityCount; i++) {
                const sDead = srcView.isEntityDead(i);
                view.memory.setDead(i, sDead);
                if (sDead) continue;

                const sX = srcView.getEntityX(i);
                const sY = srcView.getEntityY(i);
                const sVx = srcView.getEntityVx(i);
                const sVy = srcView.getEntityVy(i);

                const cX = view.getEntityX(i);
                const cY = view.getEntityY(i);

                // If local predicts it's close to server, smoothly blend. If far (e.g. new spawn or teleport), snap.
                const dx = sX - cX;
                const dy = sY - cY;
                const distSq = dx * dx + dy * dy;

                if (distSq > 400 || cX === 0 || cY === 0) { // 20px diff
                    view.memory.entities.x[i] = sX;
                    view.memory.entities.y[i] = sY;
                } else {
                    view.memory.entities.x[i] = cX + dx * 0.3; // Soft lerp
                    view.memory.entities.y[i] = cY + dy * 0.3;
                }

                // Always take server velocity, targets and states
                view.memory.entities.vx[i] = sVx;
                view.memory.entities.vy[i] = sVy;
                view.memory.entities.owner[i] = srcView.getEntityOwner(i);
                view.memory.entities.radius[i] = srcView.getEntityRadius(i);
                view.memory.entities.maxSpeed[i] = srcView.getEntityMaxSpeed(i);
                view.memory.entities.friction[i] = srcView.getEntityFriction(i);
                view.memory.entities.hp[i] = srcView.getEntityHp(i);
                view.memory.entities.speedBoost[i] = srcView.getEntitySpeedBoost(i);
                view.memory.entities.flags[i] = srcView.memory.entities.flags[i];
                view.memory.entities.deathTime[i] = srcView.getEntityDeathTime(i);
                view.memory.entities.deathType[i] = srcView.getEntityDeathType(i);
                view.memory.entities.targetX[i] = srcView.getEntityTargetX(i);
                view.memory.entities.targetY[i] = srcView.getEntityTargetY(i);
                view.memory.entities.targetNodeId[i] = srcView.getEntityTargetNodeId(i);
                view.memory.entities.id[i] = srcView.getEntityId(i);
            }
        }

        // Check for node captures to play sound
        const newNodeCount = view.getNodeCount();
        for (let i = 0; i < newNodeCount; i++) {
            const newOwner = view.getNodeOwner(i);
            const prevOwner = prevOwners[i] !== undefined ? prevOwners[i] : -1;
            if (prevOwner !== newOwner && newOwner === this.playerIndex) {
                sounds.playCapture();
            }
        }

        // Center camera on player's starting node once
        if (!this.cameraCentered && this.playerIndex !== -1 && newNodeCount > 0) {
            for (let i = 0; i < newNodeCount; i++) {
                if (view.getNodeOwner(i) === this.playerIndex) {
                    this.game.camera.zoom = 0.45; // Start zoomed out for a wide tactical view of the local node system
                    this.game.camera.centerOn(view.getNodeX(i), view.getNodeY(i), this.game.canvas.width, this.game.canvas.height);
                    this.cameraCentered = true;
                    break;
                }
            }
        }

        // Restore game settings / state globals
        if (serverState.elapsedTime !== undefined) {
            this.game.state.elapsedTime = serverState.elapsedTime;
        }

        if (serverState.gameSettings) {
            this.game.state.speedMultiplier = serverState.gameSettings.speedMultiplier;
            this.game.state.accelerationEnabled = serverState.gameSettings.accelerationEnabled;
            this.game.state.showProduction = serverState.gameSettings.showProduction;
        }

        if (serverState.stats) {
            this.game.state.stats = serverState.stats;
            // Hack to provide legacy unitCounts map to UI
            this.game.state.unitCounts = serverState.stats.current || {};
        }

        // Map events from Server (explosions etc) directly since Server processEvents clears them
        // Wait, for visuals we can just rely on the GameClient doing simple prediction or nothing
        // Server DO Engine currently drops events into the server's sharedMemory, then processEvents clears them.
        // So client won't see them. We can ignore particles for now or fix later.
    }
}
