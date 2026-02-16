import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { GameState } from '../../shared/GameState.js';
import { GAME_SETTINGS } from '../../shared/GameConfig.js';
import { Particle } from './Particle.js';
import { sounds } from '../systems/SoundManager.js';

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
        // Track node owners and HP before update for capture detection
        const nodeOwnersBefore = new Map();
        const nodeHpBefore = new Map();
        this.state.nodes.forEach(n => {
            nodeOwnersBefore.set(n.id, n.owner);
            nodeHpBefore.set(n.id, n.baseHp);
        });
        
        // Track entities before update for collision detection
        const entitiesBefore = this.state.entities.length;
        
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

        // Check for node captures and node charging sounds
        this.state.nodes.forEach(n => {
            const oldOwner = nodeOwnersBefore.get(n.id);
            const oldHp = nodeHpBefore.get(n.id);
            
            // Node was captured
            if (oldOwner !== undefined && oldOwner !== n.owner && n.owner !== -1) {
                sounds.playCapture();
            }
            
            // Node is being attacked/damaged - play charging sound based on HP
            if (oldHp !== undefined && n.owner !== -1) {
                const hpPercent = n.baseHp / n.maxHp;
                
                // Play sound when taking damage (HP going down)
                if (n.baseHp < oldHp && hpPercent < 0.9) {
                    sounds.playNodeCharging(hpPercent);
                }
            }
        });

        // Check for enemy cell collisions - play sound when cells die from collision
        // If many entities died this frame, it's likely from collisions
        const entityCountNow = this.state.entities.length;
        const died = entitiesBefore - entityCountNow;
        
        // Track collision sound cooldown
        if (!this.collisionSoundCooldown) this.collisionSoundCooldown = 0;
        this.collisionSoundCooldown -= dt;
        
        // If enemies died from collisions (not all at once, just a few), play sound
        if (this.collisionSoundCooldown <= 0 && died > 0 && died < 10) {
            sounds.playCollision();
            this.collisionSoundCooldown = 0.3;
        }

        // Check win/lose condition for singleplayer
        if (this.controller && this.controller.playerIndex !== undefined) {
            this.checkWinCondition();
        }
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
