import { Camera } from './Camera.js';
import { PixiRenderer } from './PixiRenderer.js';
import * as PIXI from 'pixi.js';
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
        this.ctx = null; // Not used with Pixi
        this.camera = new Camera();
        this.renderer = new PixiRenderer(this.canvas, this);
        this.state = new GameState();
        this.particles = [];
        this.commandIndicators = [];
        this.waypointLines = [];

        this.running = false;
        this.gameOverShown = false;
        this.healSoundCooldown = 0;
        this.healSoundDelay = 5; // Don't play heal sounds first 5 seconds
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.camera.zoomToFit(this.state.worldWidth, this.state.worldHeight, this.canvas.width, this.canvas.height);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.renderer && this.renderer.resize) {
            this.renderer.resize(window.innerWidth, window.innerHeight);
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.healSoundCooldown = 0;
        this.healSoundDelay = 5; // 5 second delay before heal sounds

        const game = this;
        const loop = (now) => {
            if (!game.running) return;
            const dt = Math.min((now - game.lastTime) / 1000, 0.05);
            game.lastTime = now;

            game.update(dt);
            game.draw(dt);

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
        // Set player index for sounds
        sounds.setPlayerIndex(this.controller?.playerIndex ?? 0);

        // Track node owners and HP before update for capture detection
        const nodeOwnersBefore = new Map();
        const nodeHpBefore = new Map();
        const playerIdx = this.controller?.playerIndex ?? 0;

        this.state.nodes.forEach(n => {
            nodeOwnersBefore.set(n.id, n.owner);
            nodeHpBefore.set(n.id, n.baseHp);
        });

        // Track entities before update for collision detection
        // Use cached counts from previous frame (or init) to avoid O(N) filter
        const playerEntitiesBefore = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

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

        // Only play sounds if we have a valid player index (>= 0)
        const isValidPlayer = playerIdx >= 0;

        // Check for node captures - ONLY FOR OUR NODES
        this.state.nodes.forEach(n => {
            const oldOwner = nodeOwnersBefore.get(n.id);

            // Node was captured by US (from neutral)
            if (isValidPlayer && oldOwner !== undefined && oldOwner === -1 && n.owner === playerIdx) {
                sounds.playCapture();
            }
        });

        // Check for OUR cell collisions - play when OUR units die
        const playerEntitiesNow = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        // If OUR units died, play collision sound
        if (playerEntitiesNow < playerEntitiesBefore && isValidPlayer) {
            sounds.playCollision();
        }
    }

    draw(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;
        this.renderer.setPlayerIndex(playerIdx);

        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.canvas.width, this.canvas.height, this.camera);

        this.state.nodes.forEach(node => {
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, this.camera, isSelected);
        });

        // First pass: Queue and draw trails (batch rendered for performance)
        this.state.entities.forEach(entity => {
            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, this.camera, isSelected);
        });
        this.renderer.renderTrails(this.camera, dt);

        // Third pass (already done by drawEntity): Bodies
        // Wait, my drawEntity already draws the bodies. 
        // So trails will be ON TOP unless I restructure more.
        // User said "bolota", glowing clouds look fine on top or bottom.
        // Let's keep it as is for simplicity, or move trails before entities.

        this.particles.forEach(p => this.renderer.drawParticle(p, this.camera));
        this.commandIndicators.forEach(ci => this.renderer.drawCommandIndicator(ci, this.camera));

        // Only show waypoint lines for our player
        this.waypointLines.filter(wl => wl.owner === playerIdx).forEach(wl => this.renderer.drawWaypointLine(wl, this.camera));

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

        // Draw waypoints for selected units (only our own)
        this.state.entities.filter(e => e.owner === playerIdx).forEach(e => {
            if (this.systems.selection.isSelected(e) && e.waypoints.length > 0) {
                // Combine current position with waypoints for a complete line
                this.renderer.drawPath([e, ...e.waypoints], this.camera, 'rgba(255, 255, 255, 0.15)', 1.2, true);

                // Draw a small indicator at the current target
                const target = e.currentTarget || e.waypoints[0];
                const screen = this.camera.worldToScreen(target.x, target.y);
                
                // Use renderer to draw indicator
                const indicator = new PIXI.Graphics();
                indicator.beginFill(0xFFFFFF, 0.3);
                indicator.drawCircle(0, 0, 2 * this.camera.zoom);
                indicator.endFill();
                indicator.x = screen.x;
                indicator.y = screen.y;
                this.renderer.uiContainer.addChild(indicator);
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
        if (this.particles.length > 100) return; // Hard cap on particles for performance
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 2 + 1, type));
        }
    }
}
