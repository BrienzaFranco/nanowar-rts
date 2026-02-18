import * as PIXI from 'pixi.js';
import { PLAYER_COLORS, GAME_SETTINGS } from '../../shared/GameConfig.js';

export class PixiRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.sprites = new Map();
        
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
        this.nodeLayer = new PIXI.Graphics();
        this.unitLayer = new PIXI.Container();
        this.glowLayer = new PIXI.Container();
        this.effectsLayer = new PIXI.Graphics();
        
        this.world.addChild(this.gridLayer);
        this.world.addChild(this.nodeLayer);
        this.world.addChild(this.glowLayer);
        this.world.addChild(this.unitLayer);
        this.world.addChild(this.effectsLayer);
        
        this.glowCache = new Map();
        
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
        this.nodeLayer.clear();
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
        this.world.scale.set(camera.zoom);
        this.world.position.set(
            -camera.x * camera.zoom,
            -camera.y * camera.zoom
        );
        
        this._drawGrid(camera);
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
    
    _hexToInt(hex) {
        if (!hex || typeof hex !== 'string') return 0x757575;
        const c = hex.replace('#', '');
        if (c.length !== 6) return 0x757575;
        const num = parseInt(c, 16);
        return isNaN(num) ? 0x757575 : num;
    }
    
    _drawNodes(camera, nodes, selection) {
        const screenW = this.width / camera.zoom;
        const screenH = this.height / camera.zoom;
        
        this.nodeLayer.clear();
        
        for (const node of nodes) {
            const isSelected = selection?.isSelected(node);
            
            const baseColor = node.getColor() || '#757575';
            const colorInt = this._hexToInt(baseColor);
            const c = baseColor.replace('#', '');
            const r = parseInt(c.slice(0, 2), 16) || 117;
            const g = parseInt(c.slice(2, 4), 16) || 117;
            const b = parseInt(c.slice(4, 6), 16) || 117;
            const areaColor = [r, g, b].join(',');
            
            const screen = camera.worldToScreen(node.x, node.y);
            const sr = node.radius * camera.zoom;
            const sir = node.influenceRadius * camera.zoom;
            
            const margin = sir * 2;
            if (screen.x < -margin || screen.x > screenW + margin || screen.y < -margin || screen.y > screenH + margin) {
                continue;
            }
            
            this.nodeLayer.beginFill(colorInt, 0.08);
            this.nodeLayer.drawCircle(node.x, node.y, sir);
            this.nodeLayer.endFill();
            
            this.nodeLayer.lineStyle(1.5 * camera.zoom, colorInt, 0.25);
            this.nodeLayer.drawCircle(node.x, node.y, sir);
            
            if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
                const rx = node.rallyPoint.x;
                const ry = node.rallyPoint.y;
                this.nodeLayer.lineStyle(4 * camera.zoom, colorInt, 0.5);
                this.nodeLayer.moveTo(node.x, node.y);
                this.nodeLayer.lineTo(rx, ry);
                this.nodeLayer.lineStyle(0);
                this.nodeLayer.beginFill(colorInt, 0.7);
                this.nodeLayer.drawCircle(rx, ry, 5 * camera.zoom);
                this.nodeLayer.endFill();
            }
            
            if (node.owner !== -1 && node.spawnProgress > 0) {
                const isFull = node.baseHp >= node.maxHp;
                let progressColor = isFull ? colorInt : 0xFFFFFF;
                
                if (node.enemyPressure) {
                    const flash = Math.sin(Date.now() / 150) > 0;
                    progressColor = flash ? 0xFF0000 : progressColor;
                }
                
                let progress = Math.min(1.0, node.spawnProgress);
                if (node.spawnEffect > 0.3) progress = 1.0;
                
                const lineW = isFull ? 3 * camera.zoom : 2 * camera.zoom;
                this.nodeLayer.lineStyle(lineW, progressColor, 1);
                this.nodeLayer.arc(node.x, node.y, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            }
            
            const totalHp = node.getTotalHp();
            const hpPercent = Math.max(0, Math.min(1, totalHp / node.maxHp));
            const currentRadius = sr * hpPercent;
            
            let brightness = 1;
            if (node.owner !== -1) {
                brightness = 1 + Math.min(totalHp * 0.01, 0.5);
            } else {
                brightness = 1 + (node.baseHp / node.maxHp) * 0.3;
            }
            
            this.nodeLayer.beginFill(0x282828, 0.4);
            this.nodeLayer.drawCircle(node.x, node.y, sr);
            this.nodeLayer.endFill();
            this.nodeLayer.lineStyle(1 * camera.zoom, 0xFFFFFF, 0.1);
            this.nodeLayer.drawCircle(node.x, node.y, sr);
            
            if (hpPercent > 0) {
                const brightR = Math.min(255, Math.floor(r * brightness));
                const brightG = Math.min(255, Math.floor(g * brightness));
                const brightB = Math.min(255, Math.floor(b * brightness));
                const brightColor = (brightR << 16) | (brightG << 8) | brightB;
                
                this.nodeLayer.beginFill(brightColor, 1);
                this.nodeLayer.drawCircle(node.x, node.y, currentRadius);
                this.nodeLayer.endFill();
            }
            
            const borderColor = isSelected ? 0xFFFFFF : colorInt;
            const borderAlpha = isSelected ? 0.9 : 0.5;
            this.nodeLayer.lineStyle(isSelected ? 3 * camera.zoom : 1.5 * camera.zoom, borderColor, borderAlpha);
            this.nodeLayer.drawCircle(node.x, node.y, sr);
            
            if (node.hitFlash > 0) {
                this.nodeLayer.lineStyle(5 * camera.zoom, 0xFF6464, node.hitFlash);
                this.nodeLayer.drawCircle(node.x, node.y, sr);
            }
            
            if (node.spawnEffect > 0) {
                this.nodeLayer.lineStyle(3 * camera.zoom, 0xFFFFFF, node.spawnEffect * 1.5);
                this.nodeLayer.drawCircle(node.x, node.y, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6));
            }
        }
    }
    
    _drawEntities(camera, entities, selection) {
        const currentIds = new Set();
        const screenW = this.width / camera.zoom;
        const screenH = this.height / camera.zoom;
        
        this.effectsLayer.clear();
        
        for (const ent of entities) {
            if (ent.dead) continue;
            
            currentIds.add(ent.id);
            
            const sr = ent.radius * camera.zoom;
            
            if (ent.x < camera.x - screenW - sr || ent.x > camera.x + screenW + sr ||
                ent.y < camera.y - screenH - sr || ent.y > camera.y + screenH + sr) {
                continue;
            }
            
            const playerColor = PLAYER_COLORS[ent.owner % PLAYER_COLORS.length] || '#757575';
            const colorInt = this._hexToInt(playerColor);
            
            let spriteData = this.sprites.get(ent.id);
            if (!spriteData) {
                const texture = PIXI.Texture.WHITE;
                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                
                const glowSprite = new PIXI.Sprite(PIXI.Texture.WHITE);
                glowSprite.anchor.set(0.5);
                glowSprite.blendMode = PIXI.BLEND_MODES.ADD;
                glowSprite.visible = false;
                
                this.unitLayer.addChild(sprite);
                this.glowLayer.addChild(glowSprite);
                
                spriteData = { sprite, glowSprite };
                this.sprites.set(ent.id, spriteData);
            }
            
            const { sprite, glowSprite } = spriteData;
            
            if (ent.dying) {
                sprite.visible = false;
                glowSprite.visible = false;
                
                const progress = ent.deathTime / 0.4;
                
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
                }
                continue;
            }
            
            sprite.visible = true;
            sprite.x = ent.x;
            sprite.y = ent.y;
            sprite.scale.set(sr * 2);
            sprite.tint = colorInt;
            
            let entityAlpha = 1;
            if (ent.outsideWarning) {
                const flash = Math.sin(Date.now() * 0.015) > 0;
                entityAlpha = flash ? 1 : 0.3;
                
                this.effectsLayer.beginFill(0xFFFF64, flash ? 0.8 : 0.3);
                this.effectsLayer.drawCircle(ent.x, ent.y, sr * 2.5);
                this.effectsLayer.endFill();
            }
            
            sprite.alpha = entityAlpha;
            
            const smoothedBoost = ent.speedBoost * ent.speedBoost;
            if (smoothedBoost > 0.1) {
                glowSprite.visible = true;
                glowSprite.x = ent.x;
                glowSprite.y = ent.y;
                const glowRadius = sr * (1.2 + smoothedBoost * 1.5);
                glowSprite.scale.set(glowRadius * 2 / 64);
                glowSprite.alpha = smoothedBoost;
                glowSprite.tint = colorInt;
            } else {
                glowSprite.visible = false;
            }
            
            if (selection?.isSelected(ent)) {
                this.effectsLayer.lineStyle(0.8 * camera.zoom, 0xFFFFFF, 0.7);
                this.effectsLayer.drawCircle(ent.x, ent.y, sr + 2 * camera.zoom);
            }
        }
        
        for (const [id, spriteData] of this.sprites) {
            if (!currentIds.has(id)) {
                this.unitLayer.removeChild(spriteData.sprite);
                this.glowLayer.removeChild(spriteData.glowSprite);
                spriteData.sprite.destroy();
                spriteData.glowSprite.destroy();
                this.sprites.delete(id);
            }
        }
    }
    
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
        const color = PLAYER_COLORS[wl.owner % PLAYER_COLORS.length] || '#757575';
        const r = parseInt(color.slice(1, 3), 16) || 117;
        const g = parseInt(color.slice(3, 5), 16) || 117;
        const b = parseInt(color.slice(5, 7), 16) || 117;
        
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
