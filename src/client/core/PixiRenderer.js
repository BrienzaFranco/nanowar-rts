import * as PIXI from 'pixi.js';
import { PLAYER_COLORS, GAME_SETTINGS } from '../../shared/GameConfig.js';

export class PixiRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;
        this.sprites = new Map();
        
        // Create PixiJS Application - v7 async init
        this.app = new PIXI.Application();
        this._init(canvas);
    }
    
    async _init(canvas) {
        await this.app.init({
            view: canvas,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x151515,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });
        
        // Containers
        this.world = new PIXI.Container();
        this.app.stage.addChild(this.world);
        
        // Layers (ordered)
        this.gridLayer = new PIXI.Container();
        this.boundaryLayer = new PIXI.Container();
        this.nodeLayer = new PIXI.Container();
        this.unitLayer = new PIXI.Container();
        this.effectLayer = new PIXI.Container();
        
        this.world.addChild(this.gridLayer);
        this.world.addChild(this.boundaryLayer);
        this.world.addChild(this.nodeLayer);
        this.world.addChild(this.unitLayer);
        this.world.addChild(this.effectLayer);
        
        // Generate base texture (white circle)
        this._generateBaseTexture();
        
        // Cache for colored unit textures
        this.unitTextureCache = new Map();
    }
    
    _generateBaseTexture() {
        const gr = new PIXI.Graphics();
        gr.beginFill(0xFFFFFF);
        gr.drawCircle(0, 0, 16); // High resolution base
        gr.endFill();
        this.baseUnitTexture = this.app.renderer.generateTexture(gr);
    }
    
    _getUnitTexture(owner) {
        const colorHex = PLAYER_COLORS[owner % PLAYER_COLORS.length];
        if (this.unitTextureCache.has(colorHex)) {
            return this.unitTextureCache.get(colorHex);
        }
        
        // Create tinted texture
        const colorInt = parseInt(colorHex.slice(1), 16);
        const sprite = new PIXI.Sprite(this.baseUnitTexture);
        sprite.tint = colorInt;
        
        const texture = this.app.renderer.generateTexture(sprite);
        this.unitTextureCache.set(colorHex, texture);
        return texture;
    }
    
    resize(width, height) {
        this.app.renderer.resize(width, height);
    }
    
    clear(width, height) {
        // Clear all layers
        this.gridLayer.removeChildren();
        this.boundaryLayer.removeChildren();
        this.nodeLayer.removeChildren();
        this.unitLayer.removeChildren();
        this.effectLayer.removeChildren();
    }
    
    setPlayerIndex(idx) {
        this.playerIndex = idx;
    }
    
    // Called every frame - sync game state to Pixi sprites
    sync(camera, state) {
        // Update camera (world transform)
        this.world.scale.set(camera.zoom);
        this.world.position.set(
            -camera.x * camera.zoom + this.app.screen.width / 2,
            -camera.y * camera.zoom + this.app.screen.height / 2
        );
        
        // Sync entities
        this._syncEntities(state.entities, state.nodes);
        
        // Draw grid and boundary (simple graphics)
        this._drawGrid(camera);
        this._drawBoundary(camera, state.entities);
    }
    
    _syncEntities(entities, nodes) {
        const currentIds = new Set();
        
        // Create/update sprites
        for (const ent of entities) {
            if (ent.dead) continue;
            
            currentIds.add(ent.id);
            let sprite = this.sprites.get(ent.id);
            
            if (!sprite) {
                const texture = this._getUnitTexture(ent.owner);
                sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                this.unitLayer.addChild(sprite);
                this.sprites.set(ent.id, sprite);
            }
            
            // Update position
            sprite.x = ent.x;
            sprite.y = ent.y;
            
            // Scale based on radius (base texture is radius 16)
            sprite.scale.set(ent.radius / 16);
            
            // Alpha for dying entities
            if (ent.dying) {
                sprite.alpha = 1 - (ent.deathTime / 0.4);
            } else {
                sprite.alpha = 1;
            }
        }
        
        // Remove dead sprites
        for (const [id, sprite] of this.sprites) {
            if (!currentIds.has(id)) {
                this.unitLayer.removeChild(sprite);
                sprite.destroy();
                this.sprites.delete(id);
            }
        }
        
        // Sync nodes
        this._syncNodes(nodes, currentIds);
    }
    
    _syncNodes(nodes, entityIds) {
        // Nodes are simpler - just recreate their graphics each frame
        // This is fine since there are only ~15 nodes
        const nodeIds = new Set();
        
        for (const node of nodes) {
            nodeIds.add('node_' + node.id);
            
            let graphics = this.nodeLayer.getChildByName('node_' + node.id);
            if (!graphics) {
                graphics = new PIXI.Graphics();
                graphics.name = 'node_' + node.id;
                this.nodeLayer.addChild(graphics);
            }
            
            // Draw node
            graphics.clear();
            
            const colorHex = node.getColor();
            const colorInt = parseInt(colorHex.slice(1), 16);
            
            // Aura
            graphics.beginFill(colorInt, 0.08);
            graphics.drawCircle(node.x, node.y, node.influenceRadius);
            graphics.endFill();
            
            // Body
            const hpPercent = Math.max(0, Math.min(1, node.getTotalHp() / node.maxHp));
            const currentRadius = node.radius * hpPercent;
            
            if (hpPercent > 0) {
                graphics.beginFill(colorInt, 1);
                graphics.drawCircle(node.x, node.y, currentRadius);
                graphics.endFill();
            }
            
            // Border
            graphics.lineStyle(1.5, colorInt, 0.5);
            graphics.drawCircle(node.x, node.y, node.radius);
        }
        
        // Remove dead node graphics
        for (let i = this.nodeLayer.children.length - 1; i >= 0; i--) {
            const child = this.nodeLayer.children[i];
            if (!nodeIds.has(child.name)) {
                child.destroy();
            }
        }
    }
    
    _drawGrid(camera) {
        // Simplified grid - only draw when zoomed in enough
        if (camera.zoom < 0.15) return;
        
        const gridGraphics = new PIXI.Graphics();
        const gridSize = 100;
        
        gridGraphics.lineStyle(1, 0xFFFFFF, 0.015);
        
        const startX = Math.floor((camera.x - (this.app.screen.width / 2) / camera.zoom) / gridSize) * gridSize;
        const endX = startX + (this.app.screen.width / camera.zoom) + gridSize * 2;
        const startY = Math.floor((camera.y - (this.app.screen.height / 2) / camera.zoom) / gridSize) * gridSize;
        const endY = startY + (this.app.screen.height / camera.zoom) + gridSize * 2;
        
        for (let x = startX; x < endX; x += gridSize) {
            gridGraphics.moveTo(x, startY);
            gridGraphics.lineTo(x, endY);
        }
        
        for (let y = startY; y < endY; y += gridSize) {
            gridGraphics.moveTo(startX, y);
            gridGraphics.lineTo(endX, y);
        }
        
        this.gridLayer.addChild(gridGraphics);
    }
    
    _drawBoundary(camera, entities) {
        const worldRadius = GAME_SETTINGS.WORLD_RADIUS || 1800;
        const centerX = (GAME_SETTINGS.WORLD_WIDTH || 2400) / 2;
        const centerY = (GAME_SETTINGS.WORLD_HEIGHT || 1800) / 2;
        
        // Only draw if any unit is near
        let nearBoundary = false;
        if (entities) {
            for (const ent of entities) {
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
            const graphics = new PIXI.Graphics();
            graphics.lineStyle(3, 0xFFFFFF, 0.5);
            graphics.drawCircle(centerX, centerY, worldRadius);
            this.boundaryLayer.addChild(graphics);
        }
    }
    
    // Legacy methods for compatibility
    drawGrid() { /* handled in sync */ }
    drawNode() { /* handled in sync */ }
    drawEntity() { /* handled in sync */ }
    renderTrails() { /* not implemented */ }
    
    render() {
        // Pixi auto-renders
    }
}
