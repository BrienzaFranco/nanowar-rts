import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { GameState } from '../../shared/GameState.js';
import { GAME_SETTINGS } from '../../shared/GameConfig.js';
import { Particle } from './Particle.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera();
        this.renderer = new Renderer(this.ctx);
        this.state = new GameState();
        this.particles = [];
        this.commandIndicators = [];
        this.waypointLines = [];

        this.running = false;
        this.gameOverShown = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.camera.zoomToFit(this.state.worldWidth, this.state.worldHeight, this.canvas.width, this.canvas.height);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        
        const game = this;
        const loop = (now) => {
            if (!game.running) return;
            const dt = Math.min((now - game.lastTime) / 1000, 0.05);
            game.lastTime = now;

            game.update(dt);
            game.draw();

            game.animationId = requestAnimationFrame(loop);
        };
        game.animationId = requestAnimationFrame(loop);
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    update(dt) {
        this.state.update(dt, this);
        if (this.controller && this.controller.update) {
            this.controller.update(dt);
        }
        if (this.systems && this.systems.input) {
            this.systems.input.update(dt);
        }
        this.particles = this.particles.filter(p => p.update(dt));
        this.commandIndicators = this.commandIndicators.filter(ci => ci.update(dt));
        this.waypointLines = this.waypointLines.filter(wl => wl.update(dt));

        // Check win/lose condition for singleplayer
        if (this.controller && this.controller.playerIndex !== undefined) {
            this.checkWinCondition();
        }
    }

    checkWinCondition() {
        // Only check win condition in singleplayer mode
        if (!this.controller || this.controller.playerIndex === undefined || this.controller.playerIndex === -1) {
            return;
        }
        
        // Prevent multiple checks
        if (this.gameOverShown) return;
        
        const playerIndex = this.controller.playerIndex;
        const playerNodes = this.state.nodes.filter(n => n.owner === playerIndex);
        const enemyNodes = this.state.nodes.filter(n => n.owner !== -1 && n.owner !== playerIndex);
        const playerEntities = this.state.entities.filter(e => e.owner === playerIndex && !e.dead && !e.dying);

        // Lose: no nodes and no entities
        if (playerNodes.length === 0 && playerEntities.length === 0) {
            this.gameOverShown = true;
            this.showGameOver(false);
            return;
        }

        // Win: no enemy nodes left
        if (enemyNodes.length === 0) {
            this.gameOverShown = true;
            this.showGameOver(true);
            return;
        }
    }

    showGameOver(won) {
        this.stop();
        const msg = won ? '¡VICTORIA!' : 'DERROTA';
        const color = won ? '#4CAF50' : '#f44336';
        
        const stats = this.state.getStats();
        const playerColors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4'];
        
        // Generate stats HTML
        let statsHTML = '<div style="margin: 20px 0; text-align: left; font-size: 12px;">';
        statsHTML += `<p style="color: #888; margin-bottom: 10px;">Duración: ${Math.floor(stats.elapsed)}m ${Math.floor((stats.elapsed % 1) * 60)}s</p>`;
        
        for (let pid in stats.produced) {
            const p = parseInt(pid);
            const pColor = playerColors[p % playerColors.length];
            const pName = p === this.controller.playerIndex ? 'TÚ' : `IA ${p}`;
            const produced = stats.produced[pid]?.total || 0;
            const lost = stats.lost[pid]?.total || 0;
            const current = stats.current[pid] || 0;
            const prodPerMin = stats.produced[pid]?.perMinute || 0;
            
            statsHTML += `
                <div style="color: ${pColor}; margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
                    <strong>${pName}</strong><br>
                    Producidas: ${produced} (${prodPerMin}/min)<br>
                    Perdidas: ${lost}<br>
                    Actuales: ${current}
                </div>
            `;
        }
        statsHTML += '</div>';
        
        // Generate graph
        const graphWidth = 400;
        const graphHeight = 150;
        let graphHTML = `<canvas id="stats-graph" width="${graphWidth}" height="${graphHeight}" style="margin: 15px 0; border: 1px solid #333; background: rgba(0,0,0,0.3);"></canvas>`;
        
        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); display: flex;
            justify-content: center; align-items: center; z-index: 1000;
        `;
        
        const box = document.createElement('div');
        box.style.cssText = `
            padding: 30px 40px; background: #141419;
            border: 3px solid ${color}; border-radius: 12px;
            text-align: center; max-width: 500px; max-height: 80vh; overflow-y: auto;
        `;
        
        box.innerHTML = `
            <h1 style="color: ${color}; font-size: 42px; margin: 0 0 15px 0; letter-spacing: 4px;">${msg}</h1>
            ${statsHTML}
            <h3 style="color: #888; margin: 15px 0 5px 0;">Unidades por Jugador</h3>
            ${graphHTML}
            <button id="restart-btn" style="
                background: ${color}; color: white; border: none;
                padding: 12px 30px; font-size: 16px; cursor: pointer;
                border-radius: 4px; font-family: 'Courier New', monospace; margin-top: 15px;
            ">JUGAR DE NUEVO</button>
        `;
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        // Draw graph
        setTimeout(() => {
            const canvas = document.getElementById('stats-graph');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                const history = stats.history;
                if (history.length > 0) {
                    const maxTime = Math.max(...history.map(h => h.time));
                    const maxCount = Math.max(...history.map(h => h.count), 10);
                    
                    ctx.clearRect(0, 0, graphWidth, graphHeight);
                    
                    // Draw grid
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    for (let i = 0; i <= 5; i++) {
                        const y = (graphHeight / 5) * i;
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(graphWidth, y);
                        ctx.stroke();
                    }
                    
                    // Draw lines for each player
                    const players = [...new Set(history.map(h => h.playerId))];
                    players.forEach(pid => {
                        const pColor = playerColors[pid % playerColors.length];
                        ctx.strokeStyle = pColor;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        
                        const playerData = history.filter(h => h.playerId === pid).sort((a, b) => a.time - b.time);
                        playerData.forEach((point, idx) => {
                            const x = (point.time / maxTime) * graphWidth;
                            const y = graphHeight - (point.count / maxCount) * graphHeight;
                            if (idx === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        });
                        ctx.stroke();
                    });
                    
                    // Legend
                    ctx.font = '10px monospace';
                    players.forEach((pid, i) => {
                        const pColor = playerColors[pid % playerColors.length];
                        const label = pid === this.controller.playerIndex ? 'TÚ' : `IA ${pid}`;
                        ctx.fillStyle = pColor;
                        ctx.fillRect(10, 10 + i * 14, 8, 8);
                        ctx.fillStyle = '#fff';
                        ctx.fillText(label, 22, 17 + i * 14);
                    });
                }
            }
        }, 100);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            overlay.remove();
            location.reload();
        });
    }

    draw() {
        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.canvas.width, this.canvas.height, this.camera);

        this.state.nodes.forEach(node => {
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, this.camera, isSelected);
        });

        this.state.entities.forEach(entity => {
            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, this.camera, isSelected);
        });

        this.particles.forEach(p => this.renderer.drawParticle(p, this.camera));
        this.commandIndicators.forEach(ci => this.renderer.drawCommandIndicator(ci, this.camera));
        this.waypointLines.forEach(wl => this.renderer.drawWaypointLine(wl, this.camera));

        // Draw selection box
        if (this.systems.selection.isSelectingBox) {
            const input = this.systems.input;
            this.renderer.drawSelectionBox(
                this.systems.selection.boxStart.x,
                this.systems.selection.boxStart.y,
                input.mouse.x,
                input.mouse.y
            );
        }

        // Draw current drawing path
        if (this.systems.selection.currentPath.length > 0) {
            this.renderer.drawPath(this.systems.selection.currentPath, this.camera, 'rgba(255, 255, 255, 0.6)', 3);
        }

        // Draw waypoints for selected units
        this.state.entities.forEach(e => {
            if (this.systems.selection.isSelected(e) && e.waypoints.length > 0) {
                // Combine current position with waypoints for a complete line
                this.renderer.drawPath([e, ...e.waypoints], this.camera, 'rgba(255, 255, 255, 0.15)', 1.2, true);

                // Draw a small indicator at the current target
                const target = e.currentTarget || e.waypoints[0];
                const screen = this.camera.worldToScreen(target.x, target.y);
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, 2 * this.camera.zoom, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fill();
            }
        });

        // Draw HUD/UI via systems if initialized
        if (this.systems && this.systems.ui) {
            this.systems.ui.draw(this.renderer);
        }
    }

    spawnCommandIndicator(x, y, type) {
        // Simple indicator logic
        const ci = {
            x, y, type, life: 1.0, maxLife: 1.0,
            update: function (dt) { this.life -= dt; return this.life > 0; }
        };
        this.commandIndicators.push(ci);
    }

    spawnWaypointLine(points, owner) {
        const wl = {
            points, owner, life: 2.0, maxLife: 2.0,
            update: function (dt) { this.life -= dt; return this.life > 0; }
        };
        this.waypointLines.push(wl);
    }

    spawnParticles(x, y, color, count, type) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 2 + 1, type));
        }
    }
}
