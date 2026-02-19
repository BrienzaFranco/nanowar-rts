import { io } from 'socket.io-client';
import { Entity } from '../../shared/Entity.js';
import { Node } from '../../shared/Node.js';
import { GameState } from '../../shared/GameState.js';
import { sounds } from '../systems/SoundManager.js';

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
                window.updateLobbyUI(data.players);
            }
        });

        this.socket.on('gameStart', (initialState) => {
            console.log('Game starting!');

            // Clear existing state and initialize from server
            this.game.state = new GameState();
            this.game.state.nodes = [];
            this.game.state.entities = [];
            this.game.state.playerCount = initialState.playerCount || this.game.state.playerCount;

            // Apply initial state
            if (initialState.nodes) {
                initialState.nodes.forEach(sn => {
                    const node = new Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                    node.baseHp = sn.baseHp;
                    node.maxHp = sn.maxHp;
                    node.stock = sn.stock;
                    node.maxStock = sn.maxStock;
                    node.spawnProgress = sn.spawnProgress;
                    if (sn.rallyPoint) node.rallyPoint = sn.rallyPoint;
                    this.game.state.nodes.push(node);
                });
            }

            // Spawn initial entities for all players - MORE units for multiplayer
            this.game.state.nodes.forEach(node => {
                if (node.owner !== -1) {
                    for (let i = 0; i < 20; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const dist = node.radius + 30;
                        const ent = new Entity(
                            node.x + Math.cos(angle) * dist,
                            node.y + Math.sin(angle) * dist,
                            node.owner,
                            Date.now() + i + (node.owner * 1000)
                        );
                        this.game.state.entities.push(ent);
                    }
                }
            });

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
                notif.textContent = data.surrendered ? 'TE RENDISTE - Solo puedes mover y atacar' : 'SIN NODOS - Solo puedes mover y atacar';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 3000);
            }
        });

        this.socket.on('gameState', (serverState) => {
            // Stop syncing after game over
            if (this.game.gameOverShown) return;

            // Keep syncing always for defeated players who can still play
            if (this.game.running || this.playerDefeated) {
                this.syncState(serverState);
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

            const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4'];

            // Generate stats HTML
            let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px;">';

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
                maxVal = Math.ceil(Math.max(maxVal, 5) * 1.1); // Min 5, 10% padding

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
                const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4'];

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
        const speedSetting = document.getElementById('speed-setting');

        const productionSetting = document.getElementById('production-setting');

        const settings = {
            speedMultiplier: speedSetting ? parseFloat(speedSetting.value) : 1,
            acceleration: false,
            showProduction: productionSetting ? productionSetting.checked : true
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
        console.log('sendAction:', action.type, 'unitIds:', action.unitIds, 'playerIndex:', this.playerIndex);
        if (this.socket && this.connected) {
            this.socket.emit('gameAction', action);
        }
    }

    syncState(serverState) {
        // Sync nodes
        serverState.nodes.forEach(sn => {
            let clientNode = this.game.state.nodes.find(cn => cn.id === sn.id);
            if (!clientNode) {
                clientNode = new Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                this.game.state.nodes.push(clientNode);
            }

            // Check if node was captured
            const oldOwner = clientNode.owner;

            // Update properties from server (ensure maxHp is synced to fix visual fill issues)
            clientNode.owner = sn.owner;
            clientNode.baseHp = sn.baseHp;
            clientNode.maxHp = sn.maxHp;
            clientNode.radius = sn.radius;
            clientNode.influenceRadius = sn.influenceRadius;
            clientNode.stock = sn.stock;
            clientNode.spawnProgress = sn.spawnProgress;
            clientNode.hitFlash = sn.hitFlash;
            clientNode.spawnEffect = sn.spawnEffect;
            clientNode.enemyPressure = sn.enemyPressure;
            if (sn.rallyPoint) {
                clientNode.rallyPoint = sn.rallyPoint;
            }

            // Play capture sound ONLY if WE captured it
            if (oldOwner !== sn.owner && sn.owner === this.playerIndex) {
                sounds.playCapture();
            }
        });

        // Center camera on player's starting node
        if (!this.cameraCentered && this.playerIndex !== -1 && this.game.state.nodes.length > 0) {
            const startNode = this.game.state.nodes.find(n => n.owner === this.playerIndex);
            if (startNode) {
                this.game.camera.centerOn(startNode.x, startNode.y, this.game.canvas.width, this.game.canvas.height);
                this.cameraCentered = true;
            }
        }

        // Sync entities - update existing ones
        const entityMap = new Map();
        this.game.state.entities.forEach(e => entityMap.set(e.id, e));

        serverState.entities.forEach(se => {
            let ent = entityMap.get(se.id);
            if (!ent) {
                ent = new Entity(se.x, se.y, se.owner, se.id);
                this.game.state.entities.push(ent);
            }

            // Update from server (authoritative)
            ent.x = se.x;
            ent.y = se.y;
            ent.vx = se.vx;
            ent.vy = se.vy;
            ent.owner = se.owner;
            ent.dying = se.dying;
            ent.deathType = se.deathType;
            ent.deathTime = se.deathTime;

            entityMap.set(se.id, ent);
        });

        // Remove entities that no longer exist on server
        const serverEntityIds = new Set(serverState.entities.map(e => e.id));
        this.game.state.entities = this.game.state.entities.filter(e => serverEntityIds.has(e.id));

        // Sync elapsed time
        if (serverState.elapsedTime !== undefined) {
            this.game.state.elapsedTime = serverState.elapsedTime;
        }

        // Sync game settings
        if (serverState.speedMultiplier !== undefined) {
            this.game.state.speedMultiplier = serverState.speedMultiplier;
        }
        if (serverState.accelerationEnabled !== undefined) {
            this.game.state.accelerationEnabled = serverState.accelerationEnabled;
        }
        if (serverState.showProduction !== undefined) {
            this.game.state.showProduction = serverState.showProduction;
        }
    }
}
