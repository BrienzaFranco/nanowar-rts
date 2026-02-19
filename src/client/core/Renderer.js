import { PLAYER_COLORS, GAME_SETTINGS } from '../../shared/GameConfig.js';
import { hexToRgba } from '../utils/helpers.js';

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
        const key = `${color}_${r}`;

        if (this.unitSpriteCache.has(key)) {
            return this.unitSpriteCache.get(key);
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

        this.unitSpriteCache.set(key, canvas);
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
            const boundaryRadius = worldRadius * camera.zoom;

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
        const screen = camera.worldToScreen(node.x, node.y);
        const sr = node.radius * camera.zoom;
        const sir = node.influenceRadius * camera.zoom;

        // Culling for nodes - skip if completely off screen
        const margin = sir * 2;
        if (this.width && (screen.x < -margin || screen.x > this.width + margin || screen.y < -margin || screen.y > this.height + margin)) {
            return;
        }

        const baseColor = node.getColor();

        const c = baseColor.slice(1);
        const areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');

        // Aura - Optimized with sprite-based rendering and reduced alpha
        const glowData = this._getOrCreateGlow(baseColor);
        const auraAlpha = 0.05; // Reduced from 0.08 for "subtle" look

        this.ctx.save();
        this.ctx.globalAlpha = auraAlpha;
        this.ctx.drawImage(
            glowData.canvas,
            screen.x - sir,
            screen.y - sir,
            sir * 2,
            sir * 2
        );
        this.ctx.restore();

        // Dashed border (kept as vector for sharpness, but subtle)
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sir, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${areaColor},0.2)`;
        this.ctx.lineWidth = 1.2 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Rally Line - only show for our own nodes
        if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
            const rx = (node.rallyPoint.x - camera.x) * camera.zoom;
            const ry = (node.rallyPoint.y - camera.y) * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, screen.y);
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

            // Cap at 1.0 to prevent visual overflow/looping
            let progress = Math.min(1.0, node.spawnProgress);

            // VISUAL FIX: If node just spawned (spawnEffect high), show full ring
            // This prevents the "99% -> 0%" visual gap, making it feel perfectly synced
            if (node.spawnEffect > 0.3) {
                progress = 1.0;
            }

            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            this.ctx.strokeStyle = progressColor;
            this.ctx.lineWidth = lineWidth;
            this.ctx.stroke();
        }

        // Node Body (Radial Fill)
        const totalHp = node.getTotalHp();
        const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
        const currentRadius = sr * hpPercent;

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
        this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(40,40,40,0.4)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.lineWidth = 1 * camera.zoom;
        this.ctx.stroke();

        if (hpPercent > 0) {
            const grad = this.ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, currentRadius);
            grad.addColorStop(0, `rgba(${r * 0.8}, ${g * 0.8}, ${b * 0.8}, 1)`);
            grad.addColorStop(1, brightColor);

            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, currentRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();
        }

        const borderColorStr = isSelected ? 'rgba(255,255,255,0.9)' : `rgba(${areaColor},0.5)`;
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
        this.ctx.strokeStyle = borderColorStr;
        this.ctx.lineWidth = isSelected ? 3 * camera.zoom : 1.5 * camera.zoom;
        this.ctx.stroke();

        if (node.hitFlash > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,100,100,${node.hitFlash})`;
            this.ctx.lineWidth = 5 * camera.zoom;
            this.ctx.stroke();
        }
        if (node.spawnEffect > 0) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255,255,255,${node.spawnEffect * 1.5})`;
            this.ctx.lineWidth = 3 * camera.zoom;
            this.ctx.stroke();
        }
    }

    drawEntity(entity, camera, isSelected = false) {
        if (entity.dead) return;
        const screen = camera.worldToScreen(entity.x, entity.y);
        const margin = entity.radius * camera.zoom + 5;

        // Culling: If off screen, skip drawing (Performance)
        if (this.width && (
            screen.x < -margin || screen.x > this.width + margin ||
            screen.y < -margin || screen.y > this.height + margin
        )) {
            return;
        }

        const deathType = entity.deathType;
        const deathTypeStr = typeof deathType === 'number' ? 
            ['none', 'attack', 'explosion', 'absorbed', 'sacrifice', 'outOfBounds'][deathType] : 
            deathType;

        // Dying animation handling
        if (entity.dying) {
            const progress = entity.deathTime / 0.4;
            const sr = entity.radius * camera.zoom;
            if (deathTypeStr === 'explosion') {
                const maxRadius = sr * 4;
                const currentRadius = sr + (maxRadius - sr) * progress;
                const alpha = 1 - progress;

                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
                this.ctx.fill();

                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, sr * (1 - progress * 0.8), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                this.ctx.fill();
            } else if (deathTypeStr === 'attack') {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, sr * (1 + progress * 2), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 100, 100, ${flash * 0.4 * (1 - progress)})`;
                this.ctx.fill();
            } else if (deathTypeStr === 'sacrifice' && entity.absorbTarget) {
                const node = entity.absorbTarget;
                const easeProgress = progress * progress;
                const currentX = entity.x + (node.x - entity.x) * easeProgress;
                const currentY = entity.y + (node.y - entity.y) * easeProgress;
                const absorbScreen = camera.worldToScreen(currentX, currentY);
                const currentRadius = sr * (1 - progress * 0.7);
                const alpha = 1 - progress;

                const playerColor = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
                const r = parseInt(playerColor.slice(1, 3), 16);
                const g = parseInt(playerColor.slice(3, 5), 16);
                const b = parseInt(playerColor.slice(5, 7), 16);

                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.beginPath();
                this.ctx.arc(absorbScreen.x, absorbScreen.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        this.ctx.drawImage(sprite, (screen.x - offset) | 0, (screen.y - offset) | 0);

        // Selection circle
        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, renderRadius + 2, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 1;
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
                screen.x - glowRadius,
                screen.y - glowRadius,
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
        const screen = camera.worldToScreen(p.x, p.y);

        // Culling
        if (this.width && (screen.x < -20 || screen.x > this.width + 20 || screen.y < -20 || screen.y > this.height + 20)) {
            return;
        }

        this.ctx.globalAlpha = p.life / p.maxLife;

        if (p.type === 'hit') {
            // Hit particles are lines, keeping vector for now as they are few, 
            // but optimized with globalAlpha
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, screen.y);
            this.ctx.lineTo(screen.x - p.vx * 0.1, screen.y - p.vy * 0.1);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.stroke();
        } else {
            // Explosions/Death particles: Sprite-based
            const sprite = this._getOrCreateParticleSprite(p.color);
            const renderSize = p.size * 1.2 * camera.zoom;

            // Speed-based particle glow (Restore requested beauty)
            const speedSq = p.vx * p.vx + p.vy * p.vy;
            if (speedSq > 4000 && p.color) { // Only for fast moving particles with color
                const glowData = this._getOrCreateGlow(p.color);
                const glowRadius = renderSize * 2.5;
                this.ctx.save();
                this.ctx.globalCompositeOperation = 'lighter';
                this.ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
                this.ctx.drawImage(
                    glowData.canvas,
                    screen.x - glowRadius,
                    screen.y - glowRadius,
                    glowRadius * 2,
                    glowRadius * 2
                );
                this.ctx.restore();
            }

            // Fast bit blit
            this.ctx.drawImage(
                sprite,
                screen.x - renderSize / 2,
                screen.y - renderSize / 2,
                renderSize,
                renderSize
            );
        }
        this.ctx.globalAlpha = 1.0;
    }

    drawCommandIndicator(ci, camera) {
        const screen = camera.worldToScreen(ci.x, ci.y);
        const alpha = Math.max(0, ci.life / ci.maxLife);
        const size = 10 * camera.zoom;

        if (ci.type === 'attack') {
            this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x - size, screen.y - size);
            this.ctx.lineTo(screen.x + size, screen.y + size);
            this.ctx.moveTo(screen.x + size, screen.y - size);
            this.ctx.lineTo(screen.x - size, screen.y + size);
            this.ctx.stroke();
        } else {
            this.ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, size * (1 - alpha), 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    drawSelectionBox(x1, y1, x2, y2) {
        const x = Math.min(x1, x2), y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2), h = Math.abs(y1 - y2);
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x, y, w, h);
    }

    drawPath(points, camera, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 2, dashed = false) {
        if (points.length < 2) return;
        this.ctx.beginPath();
        const start = camera.worldToScreen(points[0].x, points[0].y);
        this.ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            const p = camera.worldToScreen(points[i].x, points[i].y);
            this.ctx.lineTo(p.x, p.y);
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
        const start = camera.worldToScreen(wl.points[0].x, wl.points[0].y);
        this.ctx.moveTo(start.x, start.y);

        for (let i = 1; i < wl.points.length; i++) {
            const p = camera.worldToScreen(wl.points[i].x, wl.points[i].y);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        wl.points.forEach((point, i) => {
            const screen = camera.worldToScreen(point.x, point.y);
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, (i === wl.points.length - 1 ? 6 : 3) * camera.zoom, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (i === wl.points.length - 1 ? 1 : 0.6)})`;
            this.ctx.fill();
        });
    }
}
