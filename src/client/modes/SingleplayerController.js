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

    update(dt) {
        this.ais.forEach(ai => ai.update(dt));

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

        // Generate graph
        // ... existing stats HTML generation ...

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
                    <canvas id="stats-graph-sp" width="${graphWidth}" height="${graphHeight}" style="border: 1px solid #333; background: rgba(0,0,0,0.3); border-radius: 4px;"></canvas>
                    <button onclick="window.downloadGraph()" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 3px; font-size: 10px; padding: 4px 8px; cursor: pointer;">⬇️ IMG</button>
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
            padding: 30px 40px; background: #141419;
            border: 2px solid ${color}; border-radius: 12px;
            text-align: center; position: relative;
            max-width: 600px; width: 90%;
            box-shadow: 0 0 50px ${color}40;
        `;

        box.innerHTML = `
            <h1 style="color: ${color}; font-size: 42px; margin: 0 0 10px 0; letter-spacing: 6px; text-shadow: 0 0 20px ${color}60;">${msg}</h1>
            <p style="color: #888; font-size: 12px; margin-bottom: 20px;">${won ? 'Has dominado el mapa' : 'Tus fuerzas han caído'}</p>
            
            ${graphUI}
            ${statsHTML}
            
            <button onclick="location.reload()" style="
                margin-top: 20px; padding: 12px 30px;
                background: ${color}; border: none; border-radius: 4px;
                color: white; font-family: 'Courier New', monospace;
                font-size: 14px; cursor: pointer; letter-spacing: 2px;
                transition: all 0.2s; box-shadow: 0 0 15px ${color}40;">
                JUGAR DE NUEVO
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
            const canvas = document.getElementById('stats-graph-sp');
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
                const fullType = t === 'prod' ? 'production' : (t === 'units' ? 'units' : 'nodes');
                if (btn) btn.style.borderColor = fullType === this.graphState.type ? color : '#444';
                if (btn) btn.style.color = fullType === this.graphState.type ? color : '#888';
            });

            if (this.graphState.type === 'production') {
                dataArray = stats.productionHistory || [];
                title = 'PRODUCCIÓN (Unidades/Min)';
                timeScale = 1;
            } else if (this.graphState.type === 'units') {
                dataArray = stats.history || [];
                title = 'EJÉRCITO TOTAL';
                timeScale = 60;
            } else if (this.graphState.type === 'nodes') {
                dataArray = stats.nodeHistory || [];
                title = 'TERRITORIO (Nodos)';
                timeScale = 60;
            }

            if (!dataArray || dataArray.length === 0) {
                ctx.fillStyle = '#444';
                ctx.textAlign = 'center';
                ctx.fillText('No hay datos disponibles', w / 2, h / 2);
                return;
            }

            // Find max value in current view (simplified to global max for stability)
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
                maxVal = Math.ceil(Math.max(maxVal, 5) * 1.1);
            }

            ctx.save();

            // Apply pan/zoom transformation
            // scale 1.0 means whole game fits in width
            const totalTime = stats.elapsed || 1;
            const basePxPerMin = w / totalTime;

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

            // Coordinate helper: time to x
            const timeToX = (t) => (t * basePxPerMin * this.graphState.scale) + this.graphState.offset;

            // Draw Events (Captures, Battles)
            if (stats.events) {
                stats.events.forEach(ev => {
                    const x = timeToX(ev.time / (timeScale === 60 ? 60 : 1));
                    if (x < 0 || x > w) return;

                    ctx.beginPath();
                    ctx.moveTo(x, 20);
                    ctx.lineTo(x, h - 5);
                    ctx.strokeStyle = ev.type === 'big_battle' ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.1)';
                    ctx.stroke();

                    if (ev.type === 'big_battle') {
                        ctx.fillStyle = '#ff4444';
                        ctx.font = '8px monospace';
                        ctx.fillText('⚔️', x - 5, 25);
                    } else if (ev.type === 'capture') {
                        const pC = playerColors[ev.playerId % playerColors.length];
                        ctx.fillStyle = pC;
                        ctx.fillText('🏳️', x - 5, 35);
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
                ctx.lineWidth = 2;
                ctx.lineJoin = 'round';

                // Gradient fill
                const gradient = ctx.createLinearGradient(0, 0, 0, h);
                gradient.addColorStop(0, pC + '44');
                gradient.addColorStop(1, pC + '00');

                ctx.beginPath();
                let first = true;
                data.forEach((p) => {
                    const val = p.rate !== undefined ? p.rate : p.count;
                    const x = timeToX(p.time);
                    const y = h - (val / maxVal) * h * 0.9 - 5;

                    if (first) { ctx.moveTo(x, y); first = false; }
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();

                // Close and fill
                ctx.lineTo(timeToX(data[data.length - 1].time), h - 5);
                ctx.lineTo(timeToX(data[0].time), h - 5);
                ctx.fillStyle = gradient;
                ctx.fill();
            }

            ctx.restore();

            // Title
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(title, w / 2, 15);
            ctx.fillStyle = '#888';
            ctx.font = '10px monospace';
            ctx.fillText('SCROLL PARA ZOOM • ARRASTRAR PARA MOVER', w / 2, h - 10);
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
