import { AIController } from '../../shared/AIController.js';
import { Node } from '../../shared/Node.js';
import { Entity } from '../../shared/Entity.js';
import { MapGenerator } from '../../shared/MapGenerator.js';
import { sounds } from '../systems/SoundManager.js';

export class SingleplayerController {
    constructor(game) {
        this.game = game;
        this.ais = [];
        this.gameOverShown = false;
    }

    setup(playerCount = 1, difficulty = 'intermediate', testMode = false) {
        this.game.state.playerCount = playerCount;

        // In test mode, force easy difficulty but respect player count
        if (testMode) {
            difficulty = 'easy';
        }

        this.game.state.difficulty = difficulty;
        this.testMode = testMode;
        this.playerIndex = 0;
        this.createLevel();
        this.createInitialEntities(testMode);

        // Center camera on human player's home node
        const homeNode = this.game.state.nodes.find(n => n.owner === this.playerIndex);
        if (homeNode && !this.game.skipCameraReset) {
            this.game.camera.zoom = 0.45; // Start zoomed out for a wide tactical view of the local node system
            this.game.camera.centerOn(homeNode.x, homeNode.y, this.game.canvas.width, this.game.canvas.height);
        }

        const difficultyMap = {
            'easy': 'Easy',
            'intermediate': 'Intermediate',
            'normal': 'Normal',
            'hard': 'Hard',
            'expert': 'Expert',
            'impossible': 'Impossible'
        };

        // Create AIs for CPUs (indices > 0)
        for (let i = 1; i < playerCount; i++) {
            const aiDifficulty = difficultyMap[difficulty] || 'Normal';
            this.ais.push(new AIController(this.game, i, aiDifficulty));
        }
    }

    createLevel() {
        const width = this.game.state.worldWidth;
        const height = this.game.state.worldHeight;
        this.game.state.nodes = MapGenerator.generate(this.game.state.playerCount, width, height);
    }

    createInitialEntities(testMode = false) {
        const initialCount = testMode ? 500 : 15;

        this.game.state.nodes.forEach(node => {
            if (node.owner !== -1) {
                for (let i = 0; i < initialCount; i++) {
                    // Spawn units tightly clustered around the node center
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * (node.radius + 20);
                    const ent = new Entity(
                        node.x + Math.cos(angle) * dist,
                        node.y + Math.sin(angle) * dist,
                        node.owner
                    );
                    this.game.state.entities.push(ent);
                }
            }
        });
    }

    surrender() {
        if (!this.gameOverShown) {
            this.showGameOver(false);
        }
    }

    sendAction(action) {
        const { type, unitIds, nodeIds, targetX, targetY, targetNodeId, path } = action;

        if (type === 'path' && path && unitIds) {
            unitIds.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent) {
                    ent.waypoints = [...path];
                    ent.targetNode = targetNodeId ? this.game.state.nodes.find(n => n.id === targetNodeId) : null;
                    // Start moving to first waypoint immediately
                    const first = ent.waypoints[0];
                    this.game.setEntityTarget(id, first.x, first.y, ent.targetNode ? ent.targetNode.id : -1);
                }
            });
        } else if (type === 'move' && unitIds) {
            unitIds.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent) {
                    ent.waypoints = []; // Clear previous path
                    ent.targetNode = targetNodeId ? this.game.state.nodes.find(n => n.id === targetNodeId) : null;
                    this.game.setEntityTarget(id, targetX, targetY, targetNodeId || -1);
                }
            });
        } else if (type === 'rally' && nodeIds) {
            nodeIds.forEach(id => {
                const node = this.game.state.nodes.find(n => n.id === id);
                if (node) {
                    const targetNode = targetNodeId ? this.game.state.nodes.find(n => n.id === targetNodeId) : null;
                    node.setRallyPoint(targetX, targetY, targetNode);
                }
            });
        } else if (type === 'stop' && unitIds) {
            unitIds.forEach(id => {
                const ent = this.game.state.entities.find(e => e.id === id);
                if (ent) {
                    ent.stop();
                    this.game.setEntityTarget(id, 0, 0, -1);
                }
            });
        }
    }

    update(dt) {
        this.ais.forEach(ai => ai.update(dt));

        // Path-following logic for singleplayer (feeder for worker)
        if (this.game.useWorker) {
            this.game.state.entities.forEach(ent => {
                if (!ent.dead && !ent.dying && ent.waypoints && ent.waypoints.length > 0) {
                    // If entity has no current target in worker or is very close to current target, feed next waypoint
                    const dx = ent.x - ent.waypoints[0].x;
                    const dy = ent.y - ent.waypoints[0].y;
                    const distSq = dx * dx + dy * dy;

                    // If reached waypoint (within 20px)
                    if (distSq < 400) {
                        ent.waypoints.shift();
                        if (ent.waypoints.length > 0) {
                            const next = ent.waypoints[0];
                            this.game.setEntityTarget(ent.id, next.x, next.y, ent.targetNode ? ent.targetNode.id : -1);
                        } else {
                            // Path finished, let it settle or continue to target node
                            if (!ent.targetNode) {
                                // No node target, stop at last point
                            }
                        }
                    }
                }
            });
        }

        if (this.gameOverShown) return;

        const playerNodes = this.game.state.nodes.filter(n => n.owner === 0);
        const enemyNodes = this.game.state.nodes.filter(n => n.owner > 0);

        const playerUnits = this.game.state.entities.filter(e => !e.dead && !e.dying && e.owner === 0);
        const enemyUnits = this.game.state.entities.filter(e => !e.dead && !e.dying && e.owner > 0);

        const playerHasNodes = playerNodes.length > 0;
        const enemiesHaveNodes = enemyNodes.length > 0;

        const playerAlive = playerHasNodes || playerUnits.length > 0;
        const enemiesAlive = enemiesHaveNodes || enemyUnits.length > 0;

        if (!playerHasNodes && playerAlive) {
            if (!this.playerLostNodesWarning) {
                this.playerLostNodesWarning = true;
                const notif = document.createElement('div');
                notif.style.cssText = `
                    position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
                    background: rgba(255,152,0,0.9); color: white; padding: 10px 20px;
                    border-radius: 4px; z-index: 100; font-family: monospace; font-weight: bold;
                `;
                notif.textContent = 'SIN NODOS - Tus unidades están pereciendo. Captura un nodo rápido!';
                document.body.appendChild(notif);
                setTimeout(() => notif.remove(), 5000);
            }
        } else if (playerHasNodes) {
            this.playerLostNodesWarning = false;
        }

        if (!playerAlive) {
            this.showGameOver(false);
        } else if (!enemiesAlive) {
            this.showGameOver(true);
        }
    }

    showGameOver(won) {
        this.gameOverShown = true;
        this.game.gameOverShown = true;

        if (won) {
            sounds.playWin();
        } else {
            sounds.playLose();
        }

        const msg = won ? '¡VICTORIA!' : 'DERROTA';
        const color = won ? '#4CAF50' : '#f44336';
        const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

        // Generate stats HTML
        let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px; max-height: 200px; overflow-y: auto;">';

        const stats = this.game.state.getStats();

        if (stats && stats.produced) {
            statsHTML += `<p style="color: #888; margin-bottom: 10px;">Duración: ${Math.floor(stats.elapsed)}m ${Math.floor((stats.elapsed % 1) * 60)}s</p>`;

            for (let pid in stats.produced) {
                const p = parseInt(pid);
                const pColor = playerColors[p % playerColors.length];
                const pName = p === 0 ? 'TÚ' : `CPU ${p}`;
                const produced = stats.produced[pid]?.total || 0;
                const lostUnits = stats.lost[pid]?.total || 0;
                const current = stats.current[pid] || 0;
                const captured = stats.captured[pid] || 0;
                const prodPerMin = stats.produced[pid]?.perMinute || 0;

                statsHTML += `
                    <div style="color: ${pColor}; margin: 10px 0; padding: 12px 15px; background: rgba(255,255,255,0.03); border-radius: 6px; border-left: 4px solid ${pColor}; display: flex; flex-direction: column; gap: 6px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <strong style="font-size: 15px; letter-spacing: 1px;">${pName}</strong>
                            <span style="font-size: 10px; color: rgba(255,255,255,0.4); letter-spacing: 1px;">NODOS: ${captured}</span>
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

        // Generate graph
        // ... existing stats HTML generation ...

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
                    <canvas id="stats-graph-sp" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); border-radius: 4px; cursor: crosshair;"></canvas>
                    <button onclick="window.downloadGraph()" style="position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.05); color: #666; border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; font-size: 9px; padding: 4px 8px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.color='#fff';this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.color='#666';this.style.background='rgba(255,255,255,0.05)'">EXPORTAR PNG</button>
                </div>
            </div>
        `;

        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 1000;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: 'Courier New', monospace;
            backdrop-filter: blur(5px);
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
            <h1 style="color: ${color}; font-size: 48px; margin: 0 0 5px 0; letter-spacing: 8px; font-weight: 900; text-shadow: 0 0 30px ${color}44;">${msg}</h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 11px; margin-bottom: 30px; letter-spacing: 4px; text-transform: uppercase;">REGISTRO DE OPERACIONES COMPLETADO</p>
            
            ${graphUI}
            <div style="height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent); margin: 25px 0;"></div>
            ${statsHTML}
            
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                <button onclick="location.reload()" style="
                    padding: 14px 35px; background: ${color}; border: none; border-radius: 4px;
                    color: white; font-family: 'Courier New', monospace; font-weight: bold;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s; box-shadow: 0 4px 15px ${color}33;">
                    REINTENTAR
                </button>
                <button onclick="location.href='index.html'" style="
                    padding: 14px 35px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px; color: #aaa; font-family: 'Courier New', monospace;
                    font-size: 13px; cursor: pointer; letter-spacing: 2px;
                    transition: all 0.2s;">
                    SALIR
                </button>
            </div>
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
            const canvas = document.getElementById('stats-graph-sp');
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
                // Try to show at least one point if exists
                if (dataArray.length === 0) {
                    ctx.fillStyle = '#444';
                    ctx.textAlign = 'center';
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

            // TOTAL TIME in MINUTES for scaling
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
                    if (ev.type === 'big_battle') ctx.fillText('⚔️', x + 10, padTop + 15);
                    else if (ev.type === 'capture') {
                        ctx.fillStyle = playerColors[ev.playerId % playerColors.length];
                        ctx.fillText('🚩', x + 10, padTop + 30);
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

                // Fill area
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
            const canvas = document.getElementById('stats-graph-sp');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `nanowar-stats-${Date.now()}.png`;
                link.href = canvas.toDataURL();
                link.click();
            }
        };

        // Interaction logic
        setTimeout(() => {
            const canvas = document.getElementById('stats-graph-sp');
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

                // Zoom relative to center or mouse? Let's do simple center
                const oldScale = this.graphState.scale;
                this.graphState.scale *= zoomFactor;
                this.graphState.scale = Math.max(1.0, Math.min(this.graphState.scale, 10));

                // Adjust offset to keep same point under mouse?
                // For now, just scale. User can pan.
                if (this.graphState.scale === 1.0) this.graphState.offset = 0;

                window.updateGraph();
            });

            window.updateGraph('production');
        }, 100);
    }
}
