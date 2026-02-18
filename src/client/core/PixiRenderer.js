import * as PIXI from 'pixi.js';
import { PLAYER_COLORS, GAME_SETTINGS } from '../../shared/GameConfig.js';

const PLAYER_COLORS_HEX = PLAYER_COLORS.map(c => parseInt(c.slice(1), 16));
const NEUTRAL_COLOR = 0x757575;

export class PixiRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.sprites = new Map();
        this.spritePool = [];
        
        this.app = new PIXI.Application({
            view: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x151515,
            antialias: false,
            resolution: 1,
            autoDensity: true,
        });
        
        this.world = new PIXI.Container();
        this.app.stage.addChild(this.world);
        
        this.gridLayer = new PIXI.Graphics();
        this.nodeLayer = new PIXI.Container();
        this.unitLayer = new PIXI.ParticleContainer(10000, {
            scale: true,
            position: true,
            rotation: false,
            uvs: false,
            alpha: true,
            tint: true
        });
        this.glowLayer = new PIXI.Container();
        this.uiLayer = new PIXI.Container();
        
        this.world.addChild(this.gridLayer);
        this.world.addChild(this.nodeLayer);
        this.world.addChild(this.glowLayer);
        this.world.addChild(this.unitLayer);
        this.world.addChild(this.uiLayer);
        
        this.generateTextures();
        
        this.setupNodeSprites();
        
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
        gr.beginFill(0xFFFFFF);
        gr.drawCircle(0, 0, 16);
        gr.endFill();
        this.unitTexture = this.app.renderer.generateTexture(gr);
        
        this.glowTextures = new Map();
        for (let i = 0; i < PLAYER_COLORS.length; i++) {
            const color = PLAYER_COLORS[i];
            const size = 64;
            const c = document.createElement('canvas');
            c.width = size;
            c.height = size;
            const ctx = c.getContext('2d');
            
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            
            const gradient = ctx.createRadialGradient(size/2, size/2, 4, size/2, size/2, size/2 - 2);
            gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.6)`);
            gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.3)`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillRect(0, 0, size, size);
            
            this.glowTextures.set(i, PIXI.Texture.from(c));
        }
        
        this.selectionGraphics = new PIXI.Graphics();
        this.uiLayer.addChild(this.selectionGraphics);
    }
    
    setupNodeSprites() {
        this.nodeCache = new Map();
    }
    
    _getNodeSprite(nodeId) {
        if (!this.nodeCache.has(nodeId)) {
            const container = new PIXI.Container();
            const aura = new PIXI.Graphics();
            const body = new PIXI.Graphics();
            const progress = new PIXI.Graphics();
            const border = new PIXI.Graphics();
            
            container.addChild(aura);
            container.addChild(body);
            container.addChild(progress);
            container.addChild(border);
            
            this.nodeCache.set(nodeId, { container, aura, body, progress, border });
        }
        return this.nodeCache.get(nodeId);
    }
    
    resize(width, height) {
        this.app.renderer.resize(width, height);
        if (this.uiCanvas) {
            this.uiCanvas.width = width;
            this.uiCanvas.height = height;
        }
    }
    
    clear(width, height) {
        this.width = width;
        this.height = height;
        
        if (this.ctx) {
            this.ctx.clearRect(0, 0, width, height);
        }
    }
    
    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }
    
    draw(camera, state, systems) {
        this.world.scale.set(1);
        this.world.position.set(0, 0);
        
        this._drawGrid(camera);
        this._drawNodes(camera, state.nodes, systems?.selection);
        this._drawEntities(camera, state.entities, systems?.selection);
        this._drawUI(camera, state, systems);
        
        return true;
    }
    
    _drawGrid(camera) {
        this.gridLayer.clear();
        
        if (camera.zoom < 0.15) return;
        
        const gridSize = 100 * camera.zoom;
        const offsetX = ((-camera.x * camera.zoom) % gridSize + gridSize) % gridSize;
        const offsetY = ((-camera.y * camera.zoom) % gridSize + gridSize) % gridSize;
        
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
        if (this.game?.state?.entities) {
            for (const ent of this.game.state.entities) {
                if (ent.dead || ent.dying) continue;
                const dx = ent.x - centerX;
                const dy = ent.y - centerY;
                if (dx * dx + dy * dy > (worldRadius - 300) ** 2) {
                    nearBoundary = true;
                    break;
                }
            }
        }
        
        if (nearBoundary) {
            const screenCenter = camera.worldToScreen(centerX, centerY);
            this.gridLayer.lineStyle(3, 0xFFFFFF, 0.5);
            this.gridLayer.drawCircle(screenCenter.x, screenCenter.y, worldRadius * camera.zoom);
        }
    }
    
    _drawNodes(camera, nodes, selection) {
        const screenW = this.width;
        const screenH = this.height;
        
        const nodeIds = new Set();
        
        for (const node of nodes) {
            nodeIds.add(node.id);
            
            const baseColor = node.owner === -1 ? NEUTRAL_COLOR : PLAYER_COLORS_HEX[node.owner % PLAYER_COLORS.length];
            const colorHex = node.getColor();
            const c = colorHex.replace('#', '');
            const r = parseInt(c.slice(0, 2), 16) || 117;
            const g = parseInt(c.slice(2, 4), 16) || 117;
            const b = parseInt(c.slice(4, 6), 16) || 117;
            
            const screen = camera.worldToScreen(node.x, node.y);
            const sr = node.radius * camera.zoom;
            const sir = node.influenceRadius * camera.zoom;
            
            const margin = sir * 2;
            if (screen.x < -margin || screen.x > screenW + margin || screen.y < -margin || screen.y > screenH + margin) {
                continue;
            }
            
            const ns = this._getNodeSprite(node.id);
            const { aura, body, progress, border } = ns;
            
            aura.clear();
            aura.beginFill(baseColor, 0.08);
            aura.drawCircle(0, 0, sir);
            aura.endFill();
            aura.lineStyle(1.5 * camera.zoom, baseColor, 0.25);
            aura.drawCircle(0, 0, sir);
            
            if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
                const rs = camera.worldToScreen(node.rallyPoint.x, node.rallyPoint.y);
                aura.lineStyle(4 * camera.zoom, baseColor, 0.5);
                aura.moveTo(0, 0);
                aura.lineTo(rs.x - screen.x, rs.y - screen.y);
                aura.lineStyle(0);
                aura.beginFill(baseColor, 0.7);
                aura.drawCircle(rs.x - screen.x, rs.y - screen.y, 5 * camera.zoom);
                aura.endFill();
            }
            
            progress.clear();
            if (node.owner !== -1 && node.spawnProgress > 0) {
                const isFull = node.baseHp >= node.maxHp;
                let progressColor = isFull ? baseColor : 0xFFFFFF;
                
                if (node.enemyPressure) {
                    progressColor = Math.sin(Date.now() / 150) > 0 ? 0xFF0000 : progressColor;
                }
                
                let prog = Math.min(1.0, node.spawnProgress);
                if (node.spawnEffect > 0.3) prog = 1.0;
                
                const lineW = isFull ? 3 * camera.zoom : 2 * camera.zoom;
                progress.lineStyle(lineW, progressColor, 1);
                progress.arc(0, 0, sr + 5 * camera.zoom, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
            }
            
            body.clear();
            const hpPercent = Math.max(0, Math.min(1, node.getTotalHp() / node.maxHp));
            const currentRadius = sr * hpPercent;
            
            let brightness = 1;
            if (node.owner !== -1) {
                brightness = 1 + Math.min(node.getTotalHp() * 0.01, 0.5);
            } else {
                brightness = 1 + (node.baseHp / node.maxHp) * 0.3;
            }
            
            body.beginFill(0x282828, 0.4);
            body.drawCircle(0, 0, sr);
            body.endFill();
            body.lineStyle(1 * camera.zoom, 0xFFFFFF, 0.1);
            body.drawCircle(0, 0, sr);
            
            if (hpPercent > 0) {
                const brightR = Math.min(255, Math.floor(r * brightness));
                const brightG = Math.min(255, Math.floor(g * brightness));
                const brightB = Math.min(255, Math.floor(b * brightness));
                const brightColor = (brightR << 16) | (brightG << 8) | brightB;
                
                body.beginFill(brightColor, 1);
                body.drawCircle(0, 0, currentRadius);
                body.endFill();
            }
            
            border.clear();
            const isSelected = selection?.isSelected(node);
            const borderColor = isSelected ? 0xFFFFFF : baseColor;
            const borderAlpha = isSelected ? 0.9 : 0.5;
            border.lineStyle(isSelected ? 3 * camera.zoom : 1.5 * camera.zoom, borderColor, borderAlpha);
            border.drawCircle(0, 0, sr);
            
            if (node.hitFlash > 0) {
                border.lineStyle(5 * camera.zoom, 0xFF6464, node.hitFlash);
                border.drawCircle(0, 0, sr);
            }
            
            if (node.spawnEffect > 0) {
                border.lineStyle(3 * camera.zoom, 0xFFFFFF, node.spawnEffect * 1.5);
                border.drawCircle(0, 0, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6));
            }
            
            ns.container.position.set(screen.x, screen.y);
            ns.container.visible = true;
        }
        
        for (const [id, ns] of this.nodeCache) {
            if (!nodeIds.has(id)) {
                ns.container.visible = false;
            }
        }
    }
    
    _drawEntities(camera, entities, selection) {
        const currentIds = new Set();
        const screenW = this.width;
        const screenH = this.height;
        
        for (const ent of entities) {
            if (ent.dead) continue;
            
            currentIds.add(ent.id);
            
            const screen = camera.worldToScreen(ent.x, ent.y);
            const sr = ent.radius * camera.zoom;
            
            if (screen.x < -sr || screen.x > screenW + sr || screen.y < -sr || screen.y > screenH + sr) {
                continue;
            }
            
            const colorIdx = ent.owner % PLAYER_COLORS.length;
            const colorInt = PLAYER_COLORS_HEX[colorIdx];
            
            let spriteData = this.sprites.get(ent.id);
            if (!spriteData) {
                let sprite;
                if (this.spritePool.length > 0) {
                    sprite = this.spritePool.pop();
                    sprite.visible = true;
                } else {
                    sprite = new PIXI.Sprite(this.unitTexture);
                    sprite.anchor.set(0.5);
                }
                
                let glowSprite;
                if (this.spritePool.length > 0 && this.spritePoolGlow?.length > 0) {
                    glowSprite = this.spritePoolGlow.pop();
                    glowSprite.visible = true;
                } else {
                    glowSprite = new PIXI.Sprite(this.glowTextures.get(colorIdx) || this.unitTexture);
                    glowSprite.anchor.set(0.5);
                    glowSprite.blendMode = PIXI.BLEND_MODES.ADD;
                }
                
                spriteData = { sprite, glowSprite };
                this.unitLayer.addChild(sprite);
                this.glowLayer.addChild(glowSprite);
                this.sprites.set(ent.id, spriteData);
            }
            
            const { sprite, glowSprite } = spriteData;
            
            if (ent.dying) {
                sprite.visible = false;
                glowSprite.visible = false;
                continue;
            }
            
            sprite.visible = true;
            sprite.x = screen.x;
            sprite.y = screen.y;
            sprite.scale.set(sr / 16);
            sprite.tint = colorInt;
            
            if (ent.outsideWarning) {
                sprite.alpha = Math.sin(Date.now() * 0.015) > 0 ? 1 : 0.3;
            } else {
                sprite.alpha = 1;
            }
            
            const smoothedBoost = ent.speedBoost * ent.speedBoost;
            if (smoothedBoost > 0.1) {
                glowSprite.visible = true;
                glowSprite.texture = this.glowTextures.get(colorIdx) || this.unitTexture;
                glowSprite.x = screen.x;
                glowSprite.y = screen.y;
                const glowRadius = sr * (1.2 + smoothedBoost * 1.5);
                glowSprite.scale.set(glowRadius / 32);
                glowSprite.alpha = smoothedBoost;
                glowSprite.tint = colorInt;
            } else {
                glowSprite.visible = false;
            }
        }
        
        for (const [id, spriteData] of this.sprites) {
            if (!currentIds.has(id)) {
                const { sprite, glowSprite } = spriteData;
                sprite.visible = false;
                glowSprite.visible = false;
                this.spritePool.push(sprite);
                if (!this.spritePoolGlow) this.spritePoolGlow = [];
                this.spritePoolGlow.push(glowSprite);
                this.sprites.delete(id);
            }
        }
    }
    
    _drawUI(camera, state, systems) {
        this.selectionGraphics.clear();
        
        const selection = systems?.selection;
        if (!selection) return;
        
        if (selection.isSelectingBox) {
            const boxStart = selection.boxStart;
            const boxEnd = systems.input?.mouse;
            if (boxStart && boxEnd) {
                const x = Math.min(boxStart.x, boxEnd.x);
                const y = Math.min(boxStart.y, boxEnd.y);
                const w = Math.abs(boxStart.x - boxEnd.x);
                const h = Math.abs(boxStart.y - boxEnd.y);
                
                this.selectionGraphics.beginFill(0x4CAF50, 0.1);
                this.selectionGraphics.drawRect(x, y, w, h);
                this.selectionGraphics.endFill();
                this.selectionGraphics.lineStyle(1.5, 0x4CAF50, 0.5);
                this.selectionGraphics.drawRect(x, y, w, h);
            }
        }
        
        if (selection.currentPath.length > 0) {
            const points = selection.currentPath;
            this.selectionGraphics.lineStyle(3 * camera.zoom, 0xFFFFFF, 0.6);
            this.selectionGraphics.moveTo(
                (points[0].x - camera.x) * camera.zoom,
                (points[0].y - camera.y) * camera.zoom
            );
            for (let i = 1; i < points.length; i++) {
                this.selectionGraphics.lineTo(
                    (points[i].x - camera.x) * camera.zoom,
                    (points[i].y - camera.y) * camera.zoom
                );
            }
        }
        
        const playerIdx = this.playerIndex;
        state.entities.filter(e => e.owner === playerIdx).forEach(e => {
            if (selection.isSelected(e) && e.waypoints.length > 0) {
                const path = [e, ...e.waypoints];
                this.selectionGraphics.lineStyle(1.2 * camera.zoom, 0xFFFFFF, 0.15);
                this.selectionGraphics.moveTo(
                    (path[0].x - camera.x) * camera.zoom,
                    (path[0].y - camera.y) * camera.zoom
                );
                for (let i = 1; i < path.length; i++) {
                    this.selectionGraphics.lineTo(
                        (path[i].x - camera.x) * camera.zoom,
                        (path[i].y - camera.y) * camera.zoom
                    );
                }
                
                const target = e.currentTarget || e.waypoints[0];
                const ts = camera.worldToScreen(target.x, target.y);
                this.selectionGraphics.beginFill(0xFFFFFF, 0.3);
                this.selectionGraphics.drawCircle(ts.x, ts.y, 2 * camera.zoom);
                this.selectionGraphics.endFill();
            }
        });
    }
    
    drawGrid() { }
    drawNode() { }
    drawEntity() { }
    renderTrails() { }
    drawParticle() { }
    drawCommandIndicator() { }
    drawSelectionBox() { }
    drawPath() { }
    drawWaypointLine() { }
    
    render() { }
}
