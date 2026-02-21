import { PLAYER_COLORS, GAME_SETTINGS } from '../../shared/GameConfig.js';
import { hexToRgba } from '../utils/helpers.js';

const DEATH_TYPES = ['none', 'attack', 'explosion', 'absorbed', 'sacrifice', 'outOfBounds'];

export class Renderer {
    constructor(ctx, game) {
        this.ctx = ctx;
        this.game = game;
        this.playerIndex = 0;
        this.trailQueue = []; // Current frame units (kept for legacy support if needed)

        // Pre-rendered glow cache for each player color
        // Key: "#RRGGBB", Value: { canvas, size }
        this.glowCache = new Map();

        // High-performance unit sprite cache
        this.unitSpriteCache = new Map();

        // High-performance particle sprite cache
        this.particleSpriteCache = new Map();
    }

    /**
     * Pre-render unit sprite for a player color
     * Creates an offscreen canvas with the unit circle, shadow, and highlight cached
     */
    _getOrCreateUnitSprite(color, radius) {
        // Round radius to avoid creating too many cache entries for slight zoom changes
        const r = Math.round(radius);

        let colorCache = this.unitSpriteCache.get(color);
        if (!colorCache) {
            colorCache = new Map();
            this.unitSpriteCache.set(color, colorCache);
        }

        let sprite = colorCache.get(r);
        if (sprite) {
            return sprite;
        }

        // Create offscreen canvas with padding for shadow
        const padding = 2;
        const size = (r + padding) * 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const center = size / 2;

        // 1. Shadow (minimal)
        ctx.beginPath();
        ctx.arc(center + 1, center + 1, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // 2. Unit Body
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // 3. Highlight
        ctx.beginPath();
        ctx.arc(center - r * 0.3, center - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        colorCache.set(r, canvas);
        return canvas;
    }

    /**
     * Pre-render a generic particle sprite
     * Keyed by color, using a fixed reference size for scaling
     */
    _getOrCreateParticleSprite(color) {
        if (this.particleSpriteCache.has(color)) {
            return this.particleSpriteCache.get(color);
        }

        const size = 32; // Fixed reference size
        const center = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.arc(center, center, (size / 2) - 1, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        this.particleSpriteCache.set(color, canvas);
        return canvas;
    }

    /**
     * Pre-render glow sprite for a player color
     * Creates an offscreen canvas with the glow effect cached
     */
    _getOrCreateGlow(color) {
        if (!color || typeof color !== 'string' || !color.startsWith('#') || color.length < 7) {
            return null;
        }

        if (this.glowCache.has(color)) {
            return this.glowCache.get(color);
        }

        // Create offscreen canvas for the glow sprite
        // Size: 64x64 for good resolution with some margin
        const size = 64;
        const center = size / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Parse color components
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);

        // Create glow using radial gradient (once, not per frame!)
        const gradient = ctx.createRadialGradient(center, center, 4, center, center, size / 2 - 2);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        const glowData = { canvas, size };
        this.glowCache.set(color, glowData);
        return glowData;
    }

    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }

    clear(width, height) {
        this.width = width;
        this.height = height;
        this.ctx.clearRect(0, 0, width, height); // Clear the entire canvas
        this.trailQueue = []; // Reset for next frame
        this.ctx.fillStyle = '#151515';
        this.ctx.fillRect(0, 0, width, height);
    }

    drawGrid(width, height, camera) {
        // Skip grid drawing if zoomed out too far (performance)
        if (camera.zoom < 0.15) return;

        const gridSize = 100 * camera.zoom;
        const offsetX = (-camera.x * camera.zoom) % gridSize;
        const offsetY = (-camera.y * camera.zoom) % gridSize;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        this.ctx.lineWidth = 1;
        for (let x = offsetX; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        for (let y = offsetY; y < height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        // Map boundary ring - only visible when units approach
        const worldRadius = GAME_SETTINGS.WORLD_RADIUS || 1800;
        const centerX = (GAME_SETTINGS.WORLD_WIDTH || 2400) / 2;
        const centerY = (GAME_SETTINGS.WORLD_HEIGHT || 1800) / 2;

        // Only draw boundary if any unit is near it
        let nearBoundary = false;
        if (this.game && this.game.state && this.game.state.entities) {
            for (const ent of this.game.state.entities) {
                if (ent.dead || ent.dying) continue;
                const dx = ent.x - centerX;
                const dy = ent.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > worldRadius - 300) {
                    nearBoundary = true;
                    break;
                }
            }
        }

        if (nearBoundary) {
            const screenCenter = camera.worldToScreen(centerX, centerY);
            const boundaryRadius = Math.max(0, worldRadius * camera.zoom);

            this.ctx.beginPath();
            this.ctx.arc(screenCenter.x, screenCenter.y, boundaryRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([10 * camera.zoom, 20 * camera.zoom]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    drawNode(node, camera, isSelected = false) {
        const screenX = (node.x - camera.x) * camera.zoom;
        const screenY = (node.y - camera.y) * camera.zoom;
        const sr = Math.max(0, node.radius * camera.zoom);
        const sir = Math.max(0, node.influenceRadius * camera.zoom);

        // Culling for nodes - skip if completely off screen
        const margin = sir * 2;
        if (this.width && (screenX < -margin || screenX > this.width + margin || screenY < -margin || screenY > this.height + margin)) {
            return;
        }

        const baseColor = node.getColor();

        const c = baseColor.slice(1);
        const areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');

        // Aura - solid fill for territory visibility (no fade out)
        if (node.owner !== -1) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.15;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, sir, 0, Math.PI * 2);
            this.ctx.fillStyle = baseColor;
            this.ctx.fill();
            this.ctx.restore();
        }

        // Dashed border - stronger for territory visibility
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, sir, 0, Math.PI * 2);
        this.ctx.strokeStyle = node.owner !== -1 ? `rgba(${areaColor},0.5)` : `rgba(${areaColor},0.15)`;
        this.ctx.lineWidth = 2 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rally Line - only show for our own nodes
        if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
            const rx = (node.rallyPoint.x - camera.x) * camera.zoom;
            const ry = (node.rallyPoint.y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY);
            this.ctx.lineTo(rx, ry);
            this.ctx.strokeStyle = `rgba(${areaColor},0.5)`;
            this.ctx.setLineDash([4 * camera.zoom, 4 * camera.zoom]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            this.ctx.beginPath();
            this.ctx.arc(rx, ry, 5 * camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(${areaColor},0.7)`;
            this.ctx.fill();
        }

        // Spawn Progress - player color when full, white otherwise
        if (node.owner !== -1 && node.spawnProgress > 0) {
            const isFull = node.baseHp >= node.maxHp;

            // Use player color when full, white otherwise
            let progressColor = isFull ? baseColor : '#ffffff';

            // If under enemy pressure, flash between red and normal
            if (node.enemyPressure) {
                const flash = Math.sin(Date.now() / 150) > 0;
                progressColor = flash ? '#ff0000' : progressColor;
            }

            const lineWidth = isFull ? (3 * camera.zoom) : (2 * camera.zoom);

            // Cap at [0, 1.0] to prevent visual overflow/looping
            let progress = Math.max(0.0, Math.min(1.0, node.spawnProgress));

            // VISUAL FIX: If node just spawned (spawnEffect high), show full ring
            // This prevents the "99% -> 0%" visual gap, making it feel perfectly synced
            if (node.spawnEffect > 0.3) {
                progress = 1.0;
            }

            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, sr + 5 * camera.zoom), -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            this.ctx.strokeStyle = progressColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }

        // Node Body (Radial Fill)
        const totalHp = node.getTotalHp();
        const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
        const currentRadius = Math.max(0, sr * hpPercent);

        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);

        let brightness = 1;
        if (node.owner !== -1) {
            brightness = 1 + Math.min(totalHp * 0.01, 0.5); // Subtle brightness based on hp
        } else {
            brightness = 1 + (node.baseHp / node.maxHp) * 0.3;
        }
        const brightColor = `rgb(${Math.min(255, r * brightness)}, ${Math.min(255, g * brightness)}, ${Math.min(255, b * brightness)})`;

        // Background / Capacity indicator
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, Math.max(0, sr), 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(40,40,40,0.4)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1 * camera.zoom;
        this.ctx.stroke();

        if (hpPercent > 0) {
            const grad = this.ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, currentRadius);
            grad.addColorStop(0, `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, 1)`);
            grad.addColorStop(1, brightColor);

            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();
        }

        const borderColorStr = isSelected ? 'rgba(255,255,255,0.9)' : `rgba(${areaColor},0.5)`;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, Math.max(0, sr), 0, Math.PI * 2);
        this.ctx.strokeStyle = borderColorStr;
        this.ctx.lineWidth = isSelected ? 3 * camera.zoom : 1.5 * camera.zoom;
        this.ctx.stroke();

        if (node.hitFlash > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, sr), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,100,100,${node.hitFlash})`;
            this.ctx.lineWidth = 5 * camera.zoom;
            this.ctx.stroke();
        }
        if (node.spawnEffect > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6)), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,255,255,${node.spawnEffect * 1.5})`;
            this.ctx.lineWidth = 3 * camera.zoom;
            this.ctx.stroke();
        }
    }

    drawEntity(entity, camera, isSelected = false) {
        if (entity.dead) return;
        const screenX = (entity.x - camera.x) * camera.zoom;
        const screenY = (entity.y - camera.y) * camera.zoom;
        const margin = entity.radius * camera.zoom + 5;

        // Culling: If off screen, skip drawing (Performance)
        if (this.width && (
            screenX < -margin || screenX > this.width + margin ||
            screenY < -margin || screenY > this.height + margin
        )) {
            return;
        }

        const deathType = entity.deathType;
        const deathTypeStr = typeof deathType === 'number' ? DEATH_TYPES[deathType] : deathType;

        // Dying animation handling
        if (entity.dying) {
            const progress = Math.min(1.0, entity.deathTime / 0.4);
            const sr = Math.max(0, entity.radius * camera.zoom);
            if (deathTypeStr === 'explosion') {
                const maxRadius = sr * 4;
                const currentRadius = sr + (maxRadius - sr) * progress;
                const alpha = 1 - progress;

                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, Math.max(0, currentRadius), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, Math.max(0, sr * (1 - progress * 0.8)), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                this.ctx.fill();
            } else if (deathTypeStr === 'attack') {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, Math.max(0, sr * (1 + progress * 2)), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 100, 100, ${flash * 0.4 * (1 - progress)})`;
                this.ctx.fill();
            } else if (deathTypeStr === 'sacrifice' || deathTypeStr === 'absorbed') {
                const alpha = 1 - progress;
                const playerColor = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length] || '#FFFFFF';

                // Violent vibration
                const vibX = (Math.random() - 0.5) * 4 * progress;
                const vibY = (Math.random() - 0.5) * 4 * progress;

                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, alpha);
                this.ctx.beginPath();
                this.ctx.arc(screenX + vibX, screenY + vibY, Math.max(0, sr * (1 - progress * 0.5)), 0, Math.PI * 2);
                this.ctx.fillStyle = playerColor;
                this.ctx.fill();

                // Bright core
                this.ctx.beginPath();
                this.ctx.arc(screenX + vibX, screenY + vibY, Math.max(0, sr * (0.3 * (1 - progress))), 0, Math.PI * 2);
                this.ctx.fillStyle = 'white';
                this.ctx.fill();
                this.ctx.restore();
            }
            return;
        }

        const playerColor = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
        const renderRadius = entity.radius * camera.zoom;

        // Optimization: Image-based rendering with cached sprites
        const sprite = this._getOrCreateUnitSprite(playerColor, renderRadius);
        const offset = sprite.width / 2;

        // Quick draw using drawImage (Bit blit is much faster than ctx.arc fill)
        this.ctx.drawImage(sprite, (screenX - offset) | 0, (screenY - offset) | 0);

        // Selection circle
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, renderRadius + 4 * camera.zoom), 0, Math.PI * 2);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.stroke();
        }

        // Speed Boost Glow - Restored and unconditionally enabled for visual satisfaction
        const smoothedBoost = entity.speedBoost * entity.speedBoost;
        if (smoothedBoost > 0.1) {
            const glowData = this._getOrCreateGlow(playerColor);
            const glowRadius = renderRadius * (1.2 + smoothedBoost * 1.5);

            this.ctx.save();
            this.ctx.globalCompositeOperation = 'lighter';
            // Reduced from 0.7 to 0.45 for a cleaner, less saturated screen
            this.ctx.globalAlpha = smoothedBoost * 0.45;
            this.ctx.drawImage(
                glowData.canvas,
                screenX - glowRadius,
                screenY - glowRadius,
                glowRadius * 2,
                glowRadius * 2
            );
            this.ctx.restore();
        }
    }

    renderTrails(camera, dt = 0.016) {
        // Trails removed in favor of direct unit glow for "satisfying" and optimized visuals
        this.trailQueue = [];
    }

    drawParticle(p, camera) {
        if (p.life <= 0) return;
        const screenX = (p.x - camera.x) * camera.zoom;
        const screenY = (p.y - camera.y) * camera.zoom;

        // Culling
        if (this.width && (screenX < -20 || screenX > this.width + 20 || screenY < -20 || screenY > this.height + 20)) {
            return;
        }

        this.ctx.globalAlpha = p.life / p.maxLife;

        if (p.type === 'hit') {
            // Hit particles are lines, keeping vector for now as they are few, 
            // but optimized with globalAlpha
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, screenY);
            this.ctx.lineTo(screenX - p.vx * 0.1, screenY - p.vy * 0.1);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.stroke();
        } else {
            // Explosions/Death particles: Sprite-based
            const sprite = this._getOrCreateParticleSprite(p.color);
            const renderSize = p.size * 1.2 * camera.zoom;

            // Speed-based particle glow (Restore requested beauty)
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > 4000 && p.color) {
                const glowData = this._getOrCreateGlow(p.color);
                if (glowData) {
                    const glowRadius = renderSize * 2.5;
                    this.ctx.save();
                    this.ctx.globalCompositeOperation = 'lighter';
                    this.ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
                    this.ctx.drawImage(
                        glowData.canvas,
                        screenX - glowRadius,
                        screenY - glowRadius,
                        glowRadius * 2,
                        glowRadius * 2
                    );
                    this.ctx.restore();
                }
            }

            // Fast bit blit
            this.ctx.drawImage(
                sprite,
                screenX - renderSize / 2,
                screenY - renderSize / 2,
                renderSize,
                renderSize
            );
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawCommandIndicator(ci, camera) {
        const screenX = (ci.x - camera.x) * camera.zoom;
        const screenY = (ci.y - camera.y) * camera.zoom;
        const alpha = Math.max(0, Math.min(1.0, ci.life / ci.maxLife));
        const size = 10 * camera.zoom;

        if (ci.type === 'attack') {
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX - size, screenY - size);
            this.ctx.lineTo(screenX + size, screenY + size);
            this.ctx.moveTo(screenX + size, screenY - size);
            this.ctx.lineTo(screenX - size, screenY + size);
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, Math.max(0, size * (1 - alpha)), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawSelectionBox(x1, y1, x2, y2) {
        const x = Math.min(x1, x2), y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2), h = Math.abs(y1 - y2);

        // Use player color for selection box
        const playerColor = PLAYER_COLORS[this.playerIndex % PLAYER_COLORS.length];

        this.ctx.fillStyle = playerColor + '1A'; // 0.1 alpha
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = playerColor + '80'; // 0.5 alpha
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawPath(points, camera, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 2, dashed = false) {
        if (points.length < 2) return;
        this.ctx.beginPath();
        const startX = (points[0].x - camera.x) * camera.zoom;
        const startY = (points[0].y - camera.y) * camera.zoom;
        this.ctx.moveTo(startX, startY);
        for (let i = 1; i < points.length; i++) {
            const px = (points[i].x - camera.x) * camera.zoom;
            const py = (points[i].y - camera.y) * camera.zoom;
            this.ctx.lineTo(px, py);
        }
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth * camera.zoom;
        if (dashed) this.ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);
        this.ctx.stroke();
        if (dashed) this.ctx.setLineDash([]);
    }

    drawWaypointLine(wl, camera) {
        if (wl.points.length < 2) return;
        const alpha = Math.max(0, wl.life / wl.maxLife) * 0.7;
        const color = PLAYER_COLORS[wl.owner % PLAYER_COLORS.length];

        // Helper to convert hex to rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;

        this.ctx.lineWidth = 4 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
        this.ctx.strokeStyle = rgba;

        this.ctx.beginPath();
        const startX = (wl.points[0].x - camera.x) * camera.zoom;
        const startY = (wl.points[0].y - camera.y) * camera.zoom;
        this.ctx.moveTo(startX, startY);

        for (let i = 1; i < wl.points.length; i++) {
            const px = (wl.points[i].x - camera.x) * camera.zoom;
            const py = (wl.points[i].y - camera.y) * camera.zoom;
            this.ctx.lineTo(px, py);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        wl.points.forEach((point, i) => {
            const sx = (point.x - camera.x) * camera.zoom;
            const sy = (point.y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, (i === wl.points.length - 1 ? 6 : 3) * camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (i === wl.points.length - 1 ? 1 : 0.6)})`;
            this.ctx.fill();
        });
    }
}
