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
                        <div style="color: ${pColor}; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid ${pColor};">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <strong style="font-size: 14px;">${pName}</strong>
                                <span style="font-size: 10px; opacity: 0.7;">CAPTURAS: ${captured}</span>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px; opacity: 0.8;">
                                <span>Producidas: ${produced}</span>
                                <span>Promedio: ${prodPerMin}/m</span>
                                <span>Perdidas: ${lostUnits}</span>
                                <span>Actuales: ${current}</span>
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
                <div style="margin: 15px 0;">
                    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
                        <button id="btn-graph-prod" onclick="window.updateGraph('production')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Producción</button>
                        <button id="btn-graph-units" onclick="window.updateGraph('units')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Unidades</button>
                        <button id="btn-graph-nodes" onclick="window.updateGraph('nodes')" style="background: rgba(255,255,255,0.1); border: 1px solid #444; color: #888; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Territorio</button>
                    </div>
                    <div style="position: relative;">
                        <canvas id="stats-graph" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid #333; background: rgba(0,0,0,0.3); border-radius: 4px;"></canvas>
                        <button onclick="window.downloadGraph()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 3px; font-size: 10px; padding: 4px 8px; cursor: pointer;">⬇️ IMG</button>
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
                padding: 40px 60px; background: #141419;
                border: 3px solid ${color}; border-radius: 12px;
                text-align: center; position: relative;
            `;

            box.innerHTML = `
                <button onclick="this.parentElement.parentElement.remove(); location.href='index.html';" style="
                    position: absolute; top: 10px; right: 15px;
                    background: none; border: none; color: #888;
                    font-size: 24px; cursor: pointer; line-height: 1;
                ">&times;</button>
                <h1 style="color: ${color}; font-size: 48px; margin: 0 0 20px 0; letter-spacing: 4px;">${msg}</h1>
                ${graphUI}
                ${statsHTML}
                <p style="color: #888; margin-bottom: 20px;">${lost ? 'Puedes seguir jugando mientras esperas...' : ''}</p>
                <button id="restart-btn" style="
                    background: ${color}; color: white; border: none;
                    padding: 12px 30px; font-size: 16px; cursor: pointer;
                    border-radius: 4px; font-family: 'Courier New', monospace;
                ">VOLVER AL MENU</button>
            `;

            overlay.appendChild(box);
            document.body.appendChild(overlay);

            // Define graph update function globally so buttons can call it
            window.updateGraph = (type) => {
                const canvas = document.getElementById('stats-graph');
                if (!canvas) return;
                const ctx = canvas.getContext('2d');
                const w = canvas.width;
                const h = canvas.height;

                ctx.clearRect(0, 0, w, h);

                let dataArray = [];
                let title = '';
                let timeScale = 1; // Divide time by this to get minutes

                // Update active button style
                ['prod', 'units', 'nodes'].forEach(t => {
                    const btn = document.getElementById(`btn-graph-${t}`);
                    if (btn) btn.style.borderColor = t === type ? color : '#444';
                    if (btn) btn.style.color = t === type ? color : '#888';
                });

                if (type === 'production') {
                    dataArray = stats.productionHistory || [];
                    title = 'PRODUCCIÓN (Unidades/Min)';
                    timeScale = 1; // Already in minutes
                } else if (type === 'units') {
                    dataArray = stats.history || [];
                    title = 'EJÉRCITO TOTAL';
                    timeScale = 60; // Seconds to minutes
                } else if (type === 'nodes') {
                    dataArray = stats.nodeHistory || [];
                    title = 'TERRITORIO (Nodos)';
                    timeScale = 60; // Seconds to minutes
                }

                if (!dataArray || dataArray.length === 0) {
                    ctx.fillStyle = '#444';
                    ctx.textAlign = 'center';
                    ctx.fillText('No hay datos disponibles', w / 2, h / 2);
                    return;
                }

                // Find max value
                let maxVal = 0;
                dataArray.forEach(p => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    if (val > maxVal) maxVal = val;
                });

                // Round nicely for massive numbers (e.g. 800 unit cap -> 1000 graph ceiling)
                if (maxVal > 100) {
                    const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
                    maxVal = Math.ceil((maxVal * 1.1) / magnitude) * magnitude;
                } else {
                    maxVal = Math.ceil(Math.max(maxVal, 5) * 1.1); // Min 5, 10% padding
                }

                // Draw Grid
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i <= 4; i++) {
                    const y = h - (i / 4) * h * 0.9 - 5;
                    ctx.moveTo(0, y);
                    ctx.lineTo(w, y);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.font = '10px monospace';
                    ctx.fillText(Math.round((i / 4) * maxVal), 5, y - 2);
                }
                ctx.stroke();

                // Group by player
                const playerData = {};
                dataArray.forEach(p => {
                    if (!playerData[p.playerId]) playerData[p.playerId] = [];
                    playerData[p.playerId].push(p);
                });

                // Draw Lines
                const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

                for (let pid in playerData) {
                    const data = playerData[pid];
                    data.sort((a, b) => a.time - b.time);

                    const pC = playerColors[parseInt(pid) % playerColors.length];
                    ctx.strokeStyle = pC;
                    ctx.lineWidth = 2;
                    ctx.lineJoin = 'round';
                    ctx.beginPath();

                    data.forEach((p, i) => {
                        const val = p.rate !== undefined ? p.rate : p.count;
                        const t = (p.time / timeScale);
                        const x = (t / (stats.elapsed || 1)) * w;
                        const y = h - (val / maxVal) * h * 0.9 - 5;

                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    });
                    ctx.stroke();

                    if (data.length < 50) {
                        ctx.fillStyle = pC;
                        data.forEach(p => {
                            const val = p.rate !== undefined ? p.rate : p.count;
                            const t = (p.time / timeScale);
                            const x = (t / (stats.elapsed || 1)) * w;
                            const y = h - (val / maxVal) * h * 0.9 - 5;
                            ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
                        });
                    }
                }

                // Title
                ctx.fillStyle = '#888';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(title, w / 2, 15);
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
            const nodeSrc = new Uint8Array(serverState.syncBuffer, MEMORY_LAYOUT.NODE_DATA_START, nodeBytes);
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
                    this.game.camera.zoom = 1.0; // Start closer to the home node instead of fully zoomed out
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
