import * as PIXI from 'pixi.js';
import { PLAYER_COLORS, GAME_SETTINGS } from '../../shared/GameConfig.js';

export class PixiRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.sprites = new Map();
        this.nodeSprites = new Map();
        
        this.app = new PIXI.Application({
            view: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x151515,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        
        this.world = new PIXI.Container();
        this.app.stage.addChild(this.world);
        
        this.gridLayer = new PIXI.Graphics();
        this.boundaryLayer = new PIXI.Graphics();
        this.nodeLayer = new PIXI.Container();
        this.unitLayer = new PIXI.Container();
        this.effectsLayer = new PIXI.Graphics();
        
        this.world.addChild(this.gridLayer);
        this.world.addChild(this.boundaryLayer);
        this.world.addChild(this.nodeLayer);
        this.world.addChild(this.unitLayer);
        this.world.addChild(this.effectsLayer);
        
        this.generateTextures();
        
        this.uiCanvas = document.createElement('canvas');
        this.uiCanvas.style.position = 'absolute';
        this.uiCanvas.style.top = '0';
        this.uiCanvas.style.left = '0';
        this.uiCanvas.style.width = '100%';
        this.uiCanvas.style.height = '100%';
        this.uiCanvas.style.pointerEvents = 'none';
        this.uiCanvas.style.zIndex = '10';
        canvas.parentElement.appendChild(this.uiCanvas);
        this.ctx = this.uiCanvas.getContext('2d');
    }
    
    generateTextures() {
        const gr = new PIXI.Graphics();
        
        gr.clear();
        gr.beginFill(0xFFFFFF);
        gr.drawCircle(0, 0, 16);
        gr.endFill();
        this.unitTexture = this.app.renderer.generateTexture(gr);

        this.colorTextures = new Map();
        for (let i = 0; i < PLAYER_COLORS.length; i++) {
            const color = PLAYER_COLORS[i];
            const colorInt = parseInt(color.slice(1), 16);
            const sprite = new PIXI.Sprite(this.unitTexture);
            sprite.tint = colorInt;
            this.colorTextures.set(i, this.app.renderer.generateTexture(sprite));
        }
        
        this.glowCache = new Map();
    }
    
    _getOrCreateGlow(color) {
        if (this.glowCache.has(color)) {
            return this.glowCache.get(color);
        }
        
        const size = 64;
        const center = size / 2;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const gradient = ctx.createRadialGradient(center, center, 4, center, center, size / 2 - 2);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillRect(0, 0, size, size);
        
        const texture = PIXI.Texture.from(c);
        this.glowCache.set(color, texture);
        return texture;
    }
    
    resize(width, height) {
        this.app.renderer.resize(width, height);
        this.uiCanvas.width = width;
        this.uiCanvas.height = height;
    }
    
    clear(width, height) {
        this.width = width;
        this.height = height;
        
        this.gridLayer.clear();
        this.boundaryLayer.clear();
        this.effectsLayer.clear();
        
        if (this.ctx) {
            this.ctx.fillStyle = '#151515';
            this.ctx.fillRect(0, 0, width, height);
        }
    }
    
    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }
    
    draw(camera, state, systems) {
        const playerIdx = this.playerIndex;
        
        this.world.scale.set(camera.zoom);
        this.world.position.set(
            -camera.x * camera.zoom,
            -camera.y * camera.zoom
        );
        
        this._drawGrid(camera);
        this._drawBoundary(camera, state.entities);
        this._drawNodes(camera, state.nodes, systems?.selection);
        this._drawEntities(camera, state.entities, systems?.selection);
        
        return true;
    }
    
    _drawGrid(camera) {
        if (camera.zoom < 0.15) return;
        
        const gridSize = 100 * camera.zoom;
        const offsetX = (-camera.x * camera.zoom) % gridSize;
        const offsetY = (-camera.y * camera.zoom) % gridSize;
        
        this.gridLayer.lineStyle(1, 0xFFFFFF, 0.015);
        
        for (let x = offsetX; x < this.width; x += gridSize) {
            this.gridLayer.moveTo(x, 0);
            this.gridLayer.lineTo(x, this.height);
        }
        for (let y = offsetY; y < this.height; y += gridSize) {
            this.gridLayer.moveTo(0, y);
            this.gridLayer.lineTo(this.width, y);
        }
        
        const worldRadius = GAME_SETTINGS.WORLD_RADIUS || 1800;
        const centerX = (GAME_SETTINGS.WORLD_WIDTH || 2400) / 2;
        const centerY = (GAME_SETTINGS.WORLD_HEIGHT || 1800) / 2;
        
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
            
            this.gridLayer.lineStyle(3, 0xFFFFFF, 0.5);
            this.gridLayer.drawCircle(screenCenter.x, screenCenter.y, boundaryRadius);
        }
    }
    
    _drawBoundary(camera, entities) {
        // Boundary is drawn in _drawGrid
    }
    
    _drawNodes(camera, nodes, selection) {
        const screenW = this.width / camera.zoom;
        const screenH = this.height / camera.zoom;
        
        // Clear and rebuild node graphics
        this.nodeLayer.removeChildren();
        
        for (const node of nodes) {
            const isSelected = selection?.isSelected(node);
            
            const baseColor = node.getColor();
            const c = baseColor.slice(1);
            const r = parseInt(c.slice(0, 2), 16);
            const g = parseInt(c.slice(2, 4), 16);
            const b = parseInt(c.slice(4, 6), 16);
            const areaColor = [r, g, b].join(',');
            
            const screen = camera.worldToScreen(node.x, node.y);
            const sr = node.radius * camera.zoom;
            const sir = node.influenceRadius * camera.zoom;
            
            const margin = sir * 2;
            if (screen.x < -margin || screen.x > screenW + margin || screen.y < -margin || screen.y > screenH + margin) {
                continue;
            }
            
            const gfx = new PIXI.Graphics();
            
            // Aura
            gfx.beginFill(parseInt(`0x${c}`), 0.08);
            gfx.drawCircle(node.x, node.y, sir);
            gfx.endFill();
            
            gfx.lineStyle(1.5 * camera.zoom, parseInt(`0x${c}`), 0.25);
            gfx.drawCircle(node.x, node.y, sir);
            
            // Rally line
            if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
                const rx = node.rallyPoint.x;
                const ry = node.rallyPoint.y;
                gfx.lineStyle(4 * camera.zoom, parseInt(`0x${c}`), 0.5);
                gfx.moveTo(node.x, node.y);
                gfx.lineTo(rx, ry);
                gfx.lineStyle(0);
                gfx.beginFill(parseInt(`0x${c}`), 0.7);
                gfx.drawCircle(rx, ry, 5 * camera.zoom);
                gfx.endFill();
            }
            
            // Spawn progress
            if (node.owner !== -1 && node.spawnProgress > 0) {
                const isFull = node.baseHp >= node.maxHp;
                let progressColor = isFull ? baseColor : '#ffffff';
                
                if (node.enemyPressure) {
                    const flash = Math.sin(Date.now() / 150) > 0;
                    progressColor = flash ? '#ff0000' : progressColor;
                }
                
                let progress = Math.min(1.0, node.spawnProgress);
                if (node.spawnEffect > 0.3) progress = 1.0;
                
                const lineW = isFull ? 3 * camera.zoom : 2 * camera.zoom;
                gfx.lineStyle(lineW, parseInt(progressColor.slice(1), 16), 1);
                gfx.arc(node.x, node.y, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            }
            
            // Node body
            const totalHp = node.getTotalHp();
            const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
            const currentRadius = sr * hpPercent;
            
            let brightness = 1;
            if (node.owner !== -1) {
                brightness = 1 + Math.min(totalHp * 0.01, 0.5);
            } else {
                brightness = 1 + (node.baseHp / node.maxHp) * 0.3;
            }
            
            // Background
            gfx.beginFill(0x282828, 0.4);
            gfx.drawCircle(node.x, node.y, sr);
            gfx.endFill();
            gfx.lineStyle(1 * camera.zoom, 0xFFFFFF, 0.1);
            gfx.drawCircle(node.x, node.y, sr);
            
            if (hpPercent > 0) {
                const brightR = Math.min(255, Math.floor(r * brightness));
                const brightG = Math.min(255, Math.floor(g * brightness));
                const brightB = Math.min(255, Math.floor(b * brightness));
                const brightColor = (brightR << 16) | (brightG << 8) | brightB;
                
                gfx.beginFill(brightColor, 1);
                gfx.drawCircle(node.x, node.y, currentRadius);
                gfx.endFill();
            }
            
            // Border
            const borderColorStr = isSelected ? 'rgba(255,255,255,0.9)' : `rgba(${areaColor},0.5)`;
            const borderColor = parseInt(borderColorStr.slice(1, 7), 16);
            const borderAlpha = isSelected ? 0.9 : 0.5;
            gfx.lineStyle(isSelected ? 3 * camera.zoom : 1.5 * camera.zoom, borderColor, borderAlpha);
            gfx.drawCircle(node.x, node.y, sr);
            
            // Hit flash
            if (node.hitFlash > 0) {
                gfx.lineStyle(5 * camera.zoom, 0xFF6464, node.hitFlash);
                gfx.drawCircle(node.x, node.y, sr);
            }
            
            // Spawn effect
            if (node.spawnEffect > 0) {
                gfx.lineStyle(3 * camera.zoom, 0xFFFFFF, node.spawnEffect * 1.5);
                gfx.drawCircle(node.x, node.y, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6));
            }
            
            this.nodeLayer.addChild(gfx);
        }
    }
    
    _drawEntities(camera, entities, selection) {
        const currentIds = new Set();
        const screenW = this.width / camera.zoom;
        const screenH = this.height / camera.zoom;
        
        for (const ent of entities) {
            if (ent.dead) continue;
            
            currentIds.add(ent.id);
            
            const screen = camera.worldToScreen(ent.x, ent.y);
            const sr = ent.radius * camera.zoom;
            
            if (screen.x < -sr || screen.x > screenW + sr || screen.y < -sr || screen.y > screenH + sr) {
                continue;
            }
            
            const playerColor = PLAYER_COLORS[ent.owner % PLAYER_COLORS.length];
            const colorInt = parseInt(playerColor.slice(1), 16);
            const c = playerColor.slice(1);
            const r = parseInt(c.slice(0, 2), 16);
            const g = parseInt(c.slice(2, 4), 16);
            const b = parseInt(c.slice(4, 6), 16);
            
            let spriteData = this.sprites.get(ent.id);
            if (!spriteData) {
                const texture = this.colorTextures.get(ent.owner % PLAYER_COLORS.length) || this.unitTexture;
                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                
                const glowSprite = new PIXI.Sprite(this._getOrCreateGlow(playerColor));
                glowSprite.anchor.set(0.5);
                glowSprite.blendMode = PIXI.BLEND_MODES.ADD;
                glowSprite.visible = false;
                
                spriteData = { sprite, glowSprite };
                this.sprites.set(ent.id, spriteData);
            }
            
            const { sprite, glowSprite } = spriteData;
            
            // Handle dying
            if (ent.dying) {
                const progress = ent.deathTime / 0.4;
                sprite.visible = false;
                glowSprite.visible = false;
                
                if (ent.deathType === 'explosion') {
                    const maxRadius = sr * 4;
                    const currentR = sr + (maxRadius - sr) * progress;
                    const alpha = 1 - progress;
                    
                    this.effectsLayer.beginFill(0xFFC832, alpha * 0.3);
                    this.effectsLayer.drawCircle(ent.x, ent.y, currentR);
                    this.effectsLayer.endFill();
                    
                    this.effectsLayer.beginFill(0xFFFFC8, alpha);
                    this.effectsLayer.drawCircle(ent.x, ent.y, sr * (1 - progress * 0.8));
                    this.effectsLayer.endFill();
                } else if (ent.deathType === 'attack') {
                    const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                    this.effectsLayer.beginFill(0xFF6464, flash * 0.4 * (1 - progress));
                    this.effectsLayer.drawCircle(ent.x, ent.y, sr * (1 + progress * 2));
                    this.effectsLayer.endFill();
                } else if (ent.deathType === 'sacrifice' && ent.absorbTarget) {
                    const node = ent.absorbTarget;
                    const startX = ent.x;
                    const startY = ent.y;
                    const targetX = node.x;
                    const targetY = node.y;
                    const easeProgress = progress * progress;
                    const currentX = startX + (targetX - startX) * easeProgress;
                    const currentY = startY + (targetY - startY) * easeProgress;
                    const alpha = 1 - progress;
                    
                    this.effectsLayer.beginFill(colorInt, alpha);
                    this.effectsLayer.drawCircle(currentX, currentY, sr * (1 - progress * 0.7));
                    this.effectsLayer.endFill();
                }
                continue;
            }
            
            sprite.visible = true;
            sprite.x = ent.x;
            sprite.y = ent.y;
            sprite.scale.set(sr / 16);
            sprite.tint = colorInt;
            
            // Warning when outside
            let entityAlpha = 1;
            if (ent.outsideWarning) {
                const flash = Math.sin(Date.now() * 0.015) > 0;
                entityAlpha = flash ? 1 : 0.3;
                
                this.effectsLayer.beginFill(0xFFFF64, flash ? 0.8 : 0.3);
                this.effectsLayer.drawCircle(ent.x, ent.y, sr * 2.5);
                this.effectsLayer.endFill();
            }
            
            sprite.alpha = entityAlpha;
            
            // Glow for speed boost
            const smoothedBoost = ent.speedBoost * ent.speedBoost;
            if (smoothedBoost > 0.1) {
                glowSprite.visible = true;
                glowSprite.x = ent.x;
                glowSprite.y = ent.y;
                const glowRadius = sr * (1.2 + smoothedBoost * 1.5);
                glowSprite.scale.set((glowRadius * 2) / 64);
                glowSprite.alpha = smoothedBoost;
                glowSprite.tint = colorInt;
            } else {
                glowSprite.visible = false;
            }
            
            // Selection
            if (selection?.isSelected(ent)) {
                this.effectsLayer.lineStyle(0.8 * camera.zoom, 0xFFFFFF, 0.7);
                this.effectsLayer.drawCircle(ent.x, ent.y, sr + 2 * camera.zoom);
            }
        }
        
        // Remove dead sprites
        for (const [id, spriteData] of this.sprites) {
            if (!currentIds.has(id)) {
                this.unitLayer.removeChild(spriteData.sprite);
                this.unitLayer.removeChild(spriteData.glowSprite);
                spriteData.sprite.destroy();
                spriteData.glowSprite.destroy();
                this.sprites.delete(id);
            }
        }
    }
    
    // Legacy methods
    drawGrid() { }
    drawNode() { }
    drawEntity() { }
    renderTrails() { }
    drawParticle() { }
    drawCommandIndicator() { }
    drawSelectionBox(x1, y1, x2, y2) {
        if (!this.ctx) return;
        const x = Math.min(x1, x2), y = Math.min(y1, y2);
        const w = Math.abs(x1 - x2), h = Math.abs(y1 - y2);
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x, y, w, h);
    }
    drawPath(points, camera, color = 'rgba(255, 255, 255, 0.4)', lineWidth = 2, dashed = false) {
        if (!this.ctx || points.length < 2) return;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth * camera.zoom;
        if (dashed) this.ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);
        this.ctx.beginPath();
        const start = camera.worldToScreen(points[0].x, points[0].y);
        this.ctx.moveTo(start.x, start.y);
        for (let i = 1; i < points.length; i++) {
            const p = camera.worldToScreen(points[i].x, points[i].y);
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        if (dashed) this.ctx.setLineDash([]);
    }
    drawWaypointLine(wl, camera) {
        if (!this.ctx || wl.points.length < 2) return;
        const alpha = Math.max(0, wl.life / wl.maxLife) * 0.7;
        const color = PLAYER_COLORS[wl.owner % PLAYER_COLORS.length];
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        this.ctx.lineWidth = 4 * camera.zoom;
        this.ctx.setLineDash([8 * camera.zoom, 6 * camera.zoom]);
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
    
    render() { }
}
