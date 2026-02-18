import * as PIXI from 'pixi.js';
import { PLAYER_COLORS, PLAYER_COLORS_HEX, NEUTRAL_COLOR, GAME_SETTINGS } from '../../shared/GameConfig.js';

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
        
        this.gridLayer = new PIXI.Container();
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
        
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = 100;
        gridCanvas.height = 100;
        const gctx = gridCanvas.getContext('2d');
        gctx.strokeStyle = 'rgba(255,255,255,0.03)';
        gctx.lineWidth = 1;
        gctx.beginPath();
        gctx.moveTo(50, 0);
        gctx.lineTo(50, 100);
        gctx.moveTo(0, 50);
        gctx.lineTo(100, 50);
        gctx.stroke();
        this.gridTexture = PIXI.Texture.from(gridCanvas);
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
            
            this.nodeLayer.addChild(container);
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
        
        this._updateGrid(camera);
        this._syncNodes(camera, state.nodes, systems?.selection);
        this._syncEntities(camera, state.entities, systems?.selection);
        
        return true;
    }
    
    _updateGrid(camera) {
        if (!this.gridSprite) {
            this.gridSprite = new PIXI.TilingSprite(
                this.gridTexture,
                this.width || window.innerWidth,
                this.height || window.innerHeight
            );
            this.gridLayer.addChild(this.gridSprite);
        }
        
        if (camera.zoom < 0.15) {
            this.gridSprite.visible = false;
        } else {
            this.gridSprite.visible = true;
            const gridSize = 100 * camera.zoom;
            this.gridSprite.tileScale.set(camera.zoom);
            this.gridSprite.tilePosition.set(
                -camera.x * camera.zoom % gridSize,
                -camera.y * camera.zoom % gridSize
            );
            this.gridSprite.width = this.width;
            this.gridSprite.height = this.height;
        }
    }
    
    _syncNodes(camera, nodes, selection) {
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
            const sr = Math.max(node.radius * camera.zoom, 8);
            const sir = Math.max(node.influenceRadius * camera.zoom, 30);
            const minBorder = 2;
            
            const ns = this._getNodeSprite(node.id);
            const { aura, body, progress, border } = ns;
            
            aura.clear();
            aura.beginFill(baseColor, 0.08);
            aura.drawCircle(0, 0, sir);
            aura.endFill();
            aura.lineStyle(Math.max(1.5 * camera.zoom, minBorder), baseColor, 0.25);
            aura.drawCircle(0, 0, sir);
            
            if (node.rallyPoint && node.owner !== -1 && node.owner === this.playerIndex) {
                const rs = camera.worldToScreen(node.rallyPoint.x, node.rallyPoint.y);
                aura.lineStyle(Math.max(4 * camera.zoom, minBorder), baseColor, 0.5);
                aura.moveTo(0, 0);
                aura.lineTo(rs.x - screen.x, rs.y - screen.y);
                aura.lineStyle(0);
                aura.beginFill(baseColor, 0.7);
                aura.drawCircle(rs.x - screen.x, rs.y - screen.y, Math.max(5 * camera.zoom, 3));
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
                
                const lineW = Math.max(isFull ? 3 * camera.zoom : 2 * camera.zoom, minBorder);
                progress.lineStyle(lineW, progressColor, 1);
                progress.arc(0, 0, sr + Math.max(5 * camera.zoom, 3), -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
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
            body.lineStyle(Math.max(1 * camera.zoom, 1), 0xFFFFFF, 0.1);
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
            border.lineStyle(Math.max(isSelected ? 3 * camera.zoom : 1.5 * camera.zoom, minBorder), borderColor, borderAlpha);
            border.drawCircle(0, 0, sr);
            
            if (node.hitFlash > 0) {
                border.lineStyle(Math.max(5 * camera.zoom, minBorder), 0xFF6464, node.hitFlash);
                border.drawCircle(0, 0, sr);
            }
            
            if (node.spawnEffect > 0) {
                border.lineStyle(Math.max(3 * camera.zoom, minBorder), 0xFFFFFF, node.spawnEffect * 1.5);
                border.drawCircle(0, 0, sr * (1.3 + (0.5 - node.spawnEffect) * 0.6));
            }
            
            ns.container.position.set(screen.x, screen.y);
            ns.container.cullable = true;
            ns.container.visible = true;
        }
        
        for (const [id, ns] of this.nodeCache) {
            if (!nodeIds.has(id)) {
                ns.container.visible = false;
            }
        }
    }
    
    _syncEntities(camera, entities, selection) {
        const currentIds = new Set();
        const screenW = this.width;
        const screenH = this.height;
        
        for (const ent of entities) {
            if (ent.dead) continue;
            
            currentIds.add(ent.id);
            
            const screen = camera.worldToScreen(ent.x, ent.y);
            const sr = ent.radius * camera.zoom;
            
            if (screen.x < -sr || screen.x > screenW + sr || screen.y < -sr || screen.y > screenH + sr) {
                const existing = this.sprites.get(ent.id);
                if (existing) {
                    existing.sprite.visible = false;
                    existing.glowSprite.visible = false;
                }
                continue;
            }
            
            const colorIdx = ent.owner % PLAYER_COLORS.length;
            const colorInt = PLAYER_COLORS_HEX[colorIdx];
            
            let spriteData = this.sprites.get(ent.id);
            if (!spriteData) {
                const sprite = new PIXI.Sprite(this.unitTexture);
                sprite.anchor.set(0.5);
                
                const glowSprite = new PIXI.Sprite(this.glowTextures.get(colorIdx) || this.unitTexture);
                glowSprite.anchor.set(0.5);
                glowSprite.blendMode = PIXI.BLEND_MODES.ADD;
                glowSprite.visible = false;
                
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
                this.unitLayer.removeChild(sprite);
                this.glowLayer.removeChild(glowSprite);
                sprite.destroy();
                glowSprite.destroy();
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
    drawSelectionBox() { }
    drawPath() { }
    drawWaypointLine() { }
    
    render() { }
}
