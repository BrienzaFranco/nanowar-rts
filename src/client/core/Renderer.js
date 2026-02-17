import { PLAYER_COLORS } from '../../shared/GameConfig.js';
import { hexToRgba } from '../utils/helpers.js';

export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.playerIndex = 0;
    }

    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }

    clear(width, height) {
        this.width = width;
        this.height = height;
        this.ctx.fillStyle = '#151515';
        this.ctx.fillRect(0, 0, width, height);
    }

    drawGrid(width, height, camera) {
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
    }

    drawNode(node, camera, isSelected = false) {
        const screen = camera.worldToScreen(node.x, node.y);
        const sr = node.radius * camera.zoom;
        const sir = node.influenceRadius * camera.zoom;
        const baseColor = node.getColor();

        const c = baseColor.slice(1);
        const areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');

        // Aura
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sir, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${areaColor},0.08)`;
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sir, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(${areaColor},0.25)`;
        this.ctx.lineWidth = 1.5 * camera.zoom;
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

            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + node.spawnProgress * Math.PI * 2);
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
        const sr = entity.radius * camera.zoom;

        // Culling
        if (this.width && (screen.x < -sr || screen.x > this.width + sr || screen.y < -sr || screen.y > this.height + sr)) {
            return;
        }

        if (entity.dying) {
            const progress = entity.deathTime / 0.4;
            if (entity.deathType === 'explosion') {
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
            } else if (entity.deathType === 'attack') {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, sr * (1 + progress * 2), 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 100, 100, ${flash * 0.4 * (1 - progress)})`;
                this.ctx.fill();
            } else if (entity.deathType === 'sacrifice' && entity.absorbTarget) {
                // Absorption animation - move toward node center and fade out
                const node = entity.absorbTarget;

                // Calculate position moving toward node center
                const startX = entity.x;
                const startY = entity.y;
                const targetX = node.x;
                const targetY = node.y;

                // Quadratic easing for acceleration effect
                const easeProgress = progress * progress;
                const currentX = startX + (targetX - startX) * easeProgress;
                const currentY = startY + (targetY - startY) * easeProgress;

                const absorbScreen = camera.worldToScreen(currentX, currentY);

                // Shrink and fade
                const currentRadius = sr * (1 - progress * 0.7); // Shrink to 30%
                const alpha = 1 - progress; // Fade out

                // Get player color
                const playerColor = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
                const r = parseInt(playerColor.slice(1, 3), 16);
                const g = parseInt(playerColor.slice(3, 5), 16);
                const b = parseInt(playerColor.slice(5, 7), 16);

                // Draw entity with player color
                this.ctx.beginPath();
                this.ctx.arc(absorbScreen.x, absorbScreen.y, currentRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                this.ctx.fill();

                // Trail effect
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`;
                this.ctx.lineWidth = 2 * camera.zoom;
                this.ctx.stroke();
            }
            return;
        }

        // Shadow
        this.ctx.beginPath();
        this.ctx.arc(screen.x + 1, screen.y + 1, sr, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.fill();

        // Body
        this.ctx.beginPath();
        this.ctx.arc(screen.x, screen.y, sr, 0, Math.PI * 2);
        this.ctx.fillStyle = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
        this.ctx.fill();

        // Highlight
        this.ctx.beginPath();
        this.ctx.arc(screen.x - sr * 0.3, screen.y - sr * 0.3, sr * 0.4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fill();

        if (isSelected) {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, sr + 2 * camera.zoom, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.lineWidth = 0.8 * camera.zoom;
            this.ctx.stroke();
        }
    }

    drawParticle(p, camera) {
        const screen = camera.worldToScreen(p.x, p.y);
        this.ctx.globalAlpha = p.life / p.maxLife;
        this.ctx.fillStyle = p.color;

        if (p.type === 'hit') {
            this.ctx.beginPath();
            this.ctx.moveTo(screen.x, screen.y);
            this.ctx.lineTo(screen.x - p.vx * 0.1, screen.y - p.vy * 0.1);
            this.ctx.strokeStyle = p.color;
            this.ctx.lineWidth = 2 * camera.zoom;
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, p.size * 0.6 * camera.zoom, 0, Math.PI * 2);
            this.ctx.fill();
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
