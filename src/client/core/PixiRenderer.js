import * as PIXI from 'pixi.js';
import { PLAYER_COLORS } from '../../shared/GameConfig.js';

export class PixiRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        
        // Create PixiJS Application
        this.app = new PIXI.Application({
            view: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x151515,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        
        this.playerIndex = 0;
        
        // Keep ctx reference for UIManager compatibility
        this.ctx = this.app.renderer.events.canvas.getContext('2d');
        
        // Containers for different layers
        this.gridContainer = new PIXI.Container();
        this.boundaryContainer = new PIXI.Container();
        this.nodeContainer = new PIXI.Container();
        this.entityContainer = new PIXI.Container();
        this.effectContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();
        
        this.app.stage.addChild(this.gridContainer);
        this.app.stage.addChild(this.boundaryContainer);
        this.app.stage.addChild(this.nodeContainer);
        this.app.stage.addChild(this.entityContainer);
        this.app.stage.addChild(this.effectContainer);
        this.app.stage.addChild(this.uiContainer);
        
        // Pre-rendered textures cache
        this.textureCache = new Map();
        this.glowTextureCache = new Map();
        
        // Create textures
        this._createBaseTextures();
    }
    
    _createBaseTextures() {
        // Create unit circle texture
        const unitGraphics = new PIXI.Graphics();
        unitGraphics.beginFill(0xFFFFFF);
        unitGraphics.drawCircle(0, 0, 5);
        unitGraphics.endFill();
        this.unitTexture = this.app.renderer.generateTexture(unitGraphics);
        
        // Create highlight texture
        const highlightGraphics = new PIXI.Graphics();
        highlightGraphics.beginFill(0xFFFFFF, 0.5);
        highlightGraphics.drawCircle(0, 0, 2);
        highlightGraphics.endFill();
        this.highlightTexture = this.app.renderer.generateTexture(highlightGraphics);
    }
    
    _getGlowTexture(color) {
        if (this.glowTextureCache.has(color)) {
            return this.glowTextureCache.get(color);
        }
        
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const graphics = new PIXI.Graphics();
        graphics.beginFill((r << 16) | (g << 8) | b, 0.6);
        graphics.drawCircle(0, 0, 8);
        graphics.endFill();
        graphics.beginFill((r << 16) | (g << 8) | b, 0.3);
        graphics.drawCircle(0, 0, 16);
        graphics.endFill();
        
        const texture = this.app.renderer.generateTexture(graphics);
        this.glowTextureCache.set(color, texture);
        return texture;
    }
    
    resize(width, height) {
        this.app.renderer.resize(width, height);
    }
    
    clear(width, height) {
        this.width = width;
        this.height = height;
        // Clear all containers
        this.gridContainer.removeChildren();
        this.boundaryContainer.removeChildren();
        this.nodeContainer.removeChildren();
        this.entityContainer.removeChildren();
        this.effectContainer.removeChildren();
        this.uiContainer.removeChildren();
    }
    
    clear() {
        // Clear all containers
        this.gridContainer.removeChildren();
        this.boundaryContainer.removeChildren();
        this.nodeContainer.removeChildren();
        this.entityContainer.removeChildren();
        this.effectContainer.removeChildren();
    }
    
    drawGrid(width, height, camera) {
        const gridGraphics = new PIXI.Graphics();
        
        const gridSize = 100 * camera.zoom;
        const offsetX = (-camera.x * camera.zoom) % gridSize;
        const offsetY = (-camera.y * camera.zoom) % gridSize;
        
        gridGraphics.lineStyle(1, 0xFFFFFF, 0.015);
        
        for (let x = offsetX; x < width; x += gridSize) {
            gridGraphics.moveTo(x, 0);
            gridGraphics.lineTo(x, height);
        }
        for (let y = offsetY; y < height; y += gridSize) {
            gridGraphics.moveTo(0, y);
            gridGraphics.lineTo(width, y);
        }
        
        this.gridContainer.addChild(gridGraphics);
        
        // Boundary ring
        const worldRadius = 1700;
        const centerX = 1200;
        const centerY = 900;
        
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
            
            const boundaryGraphics = new PIXI.Graphics();
            boundaryGraphics.lineStyle(3, 0xFFFFFF, 0.5);
            boundaryGraphics.drawCircle(screenCenter.x, screenCenter.y, boundaryRadius);
            
            // Dashed effect
            // Note: PixiJS doesn't support dashed natively, we draw as solid
            this.boundaryContainer.addChild(boundaryGraphics);
        }
    }
    
    drawNode(node, camera, isSelected = false) {
        const screen = camera.worldToScreen(node.x, node.y);
        const sr = node.radius * camera.zoom;
        const sir = node.influenceRadius * camera.zoom;
        const baseColor = node.getColor();
        
        const c = baseColor.slice(1);
        const r = parseInt(c.slice(0, 2), 16);
        const g = parseInt(c.slice(2, 4), 16);
        const b = parseInt(c.slice(4, 6), 16);
        const color = (r << 16) | (g << 8) | b;
        
        const nodeGraphics = new PIXI.Graphics();
        
        // Aura
        nodeGraphics.beginFill(color, 0.08);
        nodeGraphics.drawCircle(screen.x, screen.y, sir);
        nodeGraphics.endFill();
        
        nodeGraphics.lineStyle(1.5 * camera.zoom, color, 0.25);
        nodeGraphics.drawCircle(screen.x, screen.y, sir);
        
        // Node body
        const totalHp = node.getTotalHp();
        const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
        const currentRadius = sr * hpPercent;
        
        if (hpPercent > 0) {
            nodeGraphics.beginFill(color, 1);
            nodeGraphics.drawCircle(screen.x, screen.y, currentRadius);
            nodeGraphics.endFill();
        }
        
        // Border
        const borderColor = isSelected ? 0xFFFFFF : color;
        const borderAlpha = isSelected ? 0.9 : 0.5;
        nodeGraphics.lineStyle(isSelected ? 3 * camera.zoom : 1.5 * camera.zoom, borderColor, borderAlpha);
        nodeGraphics.drawCircle(screen.x, screen.y, sr);
        
        // Spawn progress
        if (node.owner !== -1 && node.spawnProgress > 0) {
            let progressColor = (node.baseHp >= node.maxHp) ? color : 0xFFFFFF;
            if (node.enemyPressure) {
                const flash = Math.sin(Date.now() / 150) > 0;
                progressColor = flash ? 0xFF0000 : progressColor;
            }
            
            let progress = Math.min(1.0, node.spawnProgress);
            if (node.spawnEffect > 0.3) progress = 1.0;
            
            const lineWidth = (node.baseHp >= node.maxHp) ? (3 * camera.zoom) : (2 * camera.zoom);
            
            nodeGraphics.lineStyle(lineWidth, progressColor, 1);
            nodeGraphics.arc(screen.x, screen.y, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
        }
        
        // Hit flash
        if (node.hitFlash > 0) {
            nodeGraphics.lineStyle(5 * camera.zoom, 0xFF6464, node.hitFlash);
            nodeGraphics.drawCircle(screen.x, screen.y, sr);
        }
        
        // Spawn effect
        if (node.spawnEffect > 0) {
            nodeGraphics.lineStyle(3 * camera.zoom, 0xFFFFFF, node.spawnEffect * 1.5);
            nodeGraphics.drawCircle(screen.x, screen.y, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6));
        }
        
        this.nodeContainer.addChild(nodeGraphics);
    }
    
    drawEntity(entity, camera, isSelected = false) {
        if (entity.dead) return;
        
        const screen = camera.worldToScreen(entity.x, entity.y);
        const sr = entity.radius * camera.zoom;
        
        // Culling
        if (this.app.screen.width && (screen.x < -sr * 2 || screen.x > this.app.screen.width + sr * 2 || screen.y < -sr * 2 || screen.y > this.app.screen.height + sr * 2)) {
            return;
        }
        
        const playerColor = PLAYER_COLORS[entity.owner % PLAYER_COLORS.length];
        const c = playerColor.slice(1);
        const r = parseInt(c.slice(0, 2), 16);
        const g = parseInt(c.slice(2, 4), 16);
        const b = parseInt(c.slice(4, 6), 16);
        const color = (r << 16) | (g << 8) | b;
        
        const entityContainer = new PIXI.Container();
        entityContainer.x = screen.x;
        entityContainer.y = screen.y;
        
        // Glow (for units with speed boost)
        const smoothedBoost = entity.speedBoost * entity.speedBoost;
        if (!entity.dying && smoothedBoost > 0.1) {
            const glowTexture = this._getGlowTexture(playerColor);
            const glowSprite = new PIXI.Sprite(glowTexture);
            glowSprite.anchor.set(0.5);
            const glowScale = (sr * (1.2 + smoothedBoost * 1.5) * camera.zoom) / 16;
            glowSprite.scale.set(glowScale);
            glowSprite.alpha = smoothedBoost * 0.5;
            glowSprite.blendMode = PIXI.BLEND_MODES.ADD;
            entityContainer.addChild(glowSprite);
        }
        
        // Warning glow when outside boundary
        if (entity.outsideWarning) {
            const flash = Math.sin(Date.now() * 0.015) > 0;
            const warningGlow = new PIXI.Graphics();
            warningGlow.beginFill(0xFFFF64, flash ? 0.8 : 0.3);
            warningGlow.drawCircle(0, 0, sr * 2);
            warningGlow.endFill();
            entityContainer.addChild(warningGlow);
        }
        
        if (entity.dying) {
            const progress = entity.deathTime / 0.4;
            
            if (entity.deathType === 'explosion') {
                const maxRadius = sr * 4;
                const currentRadius = sr + (maxRadius - sr) * progress;
                const alpha = 1 - progress;
                
                const explosion = new PIXI.Graphics();
                explosion.beginFill(0xFFC832, alpha * 0.3);
                explosion.drawCircle(0, 0, currentRadius);
                explosion.endFill();
                explosion.beginFill(0xFFFFC8, alpha);
                explosion.drawCircle(0, 0, sr * (1 - progress * 0.8));
                explosion.endFill();
                entityContainer.addChild(explosion);
            } else if (entity.deathType === 'attack') {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                const attack = new PIXI.Graphics();
                attack.beginFill(0xFF6464, flash * 0.4 * (1 - progress));
                attack.drawCircle(0, 0, sr * (1 + progress * 2));
                attack.endFill();
                entityContainer.addChild(attack);
            }
            
            this.entityContainer.addChild(entityContainer);
            return;
        }
        
        // Body
        const body = new PIXI.Graphics();
        body.beginFill(color, 1);
        body.drawCircle(0, 0, sr);
        body.endFill();
        entityContainer.addChild(body);
        
        // Highlight
        const highlight = new PIXI.Graphics();
        highlight.beginFill(0xFFFFFF, 0.5);
        highlight.drawCircle(-sr * 0.3, -sr * 0.3, sr * 0.4);
        highlight.endFill();
        entityContainer.addChild(highlight);
        
        // Selection
        if (isSelected) {
            const selection = new PIXI.Graphics();
            selection.lineStyle(0.8 * camera.zoom, 0xFFFFFF, 0.7);
            selection.drawCircle(0, 0, sr + 2 * camera.zoom);
            entityContainer.addChild(selection);
        }
        
        this.entityContainer.addChild(entityContainer);
    }
    
    drawParticle(p, camera) {
        const screen = camera.worldToScreen(p.x, p.y);
        
        const particle = new PIXI.Graphics();
        const alpha = p.life / p.maxLife;
        
        if (p.type === 'hit') {
            particle.lineStyle(2 * camera.zoom, parseInt(p.color.slice(1), 16), alpha);
            particle.moveTo(screen.x, screen.y);
            particle.lineTo(screen.x - p.vx * 0.1, screen.y - p.vy * 0.1);
        } else {
            particle.beginFill(parseInt(p.color.slice(1), 16), alpha);
            particle.drawCircle(screen.x, screen.y, p.size * 0.6 * camera.zoom);
            particle.endFill();
        }
        
        this.effectContainer.addChild(particle);
    }
    
    drawCommandIndicator(ci, camera) {
        const screen = camera.worldToScreen(ci.x, ci.y);
        const alpha = Math.max(0, ci.life / ci.maxLife);
        const size = 10 * camera.zoom;
        
        const indicator = new PIXI.Graphics();
        
        if (ci.type === 'attack') {
            indicator.lineStyle(2 * camera.zoom, 0xFF6464, alpha);
            indicator.moveTo(screen.x - size, screen.y - size);
            indicator.lineTo(screen.x + size, screen.y + size);
            indicator.moveTo(screen.x + size, screen.y - size);
            indicator.lineTo(screen.x - size, screen.y + size);
        } else {
            indicator.lineStyle(2 * camera.zoom, 0x64C8FF, alpha);
            indicator.drawCircle(screen.x, screen.y, size * (1 - alpha));
        }
        
        this.effectContainer.addChild(indicator);
    }
    
    drawSelectionBox(x1, y1, x2, y2) {
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2);
        const h = Math.abs(y1 - y2);
        
        const box = new PIXI.Graphics();
        box.beginFill(0x4CAF50, 0.1);
        box.drawRect(x, y, w, h);
        box.endFill();
        box.lineStyle(1.5, 0x4CAF50, 0.5);
        box.drawRect(x, y, w, h);
        
        this.uiContainer.addChild(box);
    }
    
    drawPath(points, camera, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 2, dashed = false) {
        if (points.length < 2) return;
        
        const pathGraphics = new PIXI.Graphics();
        const c = color.slice(1, 7);
        const alpha = color.includes(',') ? parseFloat(color.split(',').pop().trim()) : 1;
        const colorInt = parseInt(c, 16);
        
        pathGraphics.lineStyle(lineWidth * camera.zoom, colorInt, alpha);
        
        const start = camera.worldToScreen(points[0].x, points[0].y);
        pathGraphics.moveTo(start.x, start.y);
        
        for (let i = 1; i < points.length; i++) {
            const p = camera.worldToScreen(points[i].x, points[i].y);
            pathGraphics.lineTo(p.x, p.y);
        }
        
        this.uiContainer.addChild(pathGraphics);
    }
    
    drawWaypointLine(wl, camera) {
        if (wl.points.length < 2) return;
        
        const alpha = Math.max(0, wl.life / wl.maxLife) * 0.7;
        const color = PLAYER_COLORS[wl.owner % PLAYER_COLORS.length];
        const c = color.slice(1, 7);
        const colorInt = parseInt(c, 16);
        
        const lineGraphics = new PIXI.Graphics();
        lineGraphics.lineStyle(4 * camera.zoom, colorInt, alpha);
        
        const start = camera.worldToScreen(wl.points[0].x, wl.points[0].y);
        lineGraphics.moveTo(start.x, start.y);
        
        for (let i = 1; i < wl.points.length; i++) {
            const p = camera.worldToScreen(wl.points[i].x, wl.points[i].y);
            lineGraphics.lineTo(p.x, p.y);
        }
        
        this.uiContainer.addChild(lineGraphics);
        
        // Draw points
        wl.points.forEach((point, i) => {
            const screen = camera.worldToScreen(point.x, point.y);
            const pointSize = (i === wl.points.length - 1 ? 6 : 3) * camera.zoom;
            
            const pointGraphics = new PIXI.Graphics();
            pointGraphics.beginFill(0xFFFFFF, alpha * (i === wl.points.length - 1 ? 1 : 0.6));
            pointGraphics.drawCircle(screen.x, screen.y, pointSize);
            pointGraphics.endFill();
            
            this.uiContainer.addChild(pointGraphics);
        });
    }
    
    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }
    
    renderTrails(camera, dt = 0.016) {
        // Trails not implemented in Pixi version - can add later if needed
    }
    
    render(dt) {
        // PixiJS automatically renders with requestAnimationFrame
        // We just need to update the stage
    }
}
