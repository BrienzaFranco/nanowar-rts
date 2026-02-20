import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { GameState } from '../../shared/GameState.js';
import { GAME_SETTINGS, PLAYER_COLORS } from '../../shared/GameConfig.js';
import { Particle } from './Particle.js';
import { sounds } from '../systems/SoundManager.js';
import { SharedMemory, MEMORY_LAYOUT, calculateBufferSize } from '../../shared/SharedMemory.js';
import { SharedView } from '../../shared/SharedView.js';
import { Entity } from '../../shared/Entity.js';
import { EntityData } from '../../shared/EntityData.js';
import { NodeData } from '../../shared/NodeData.js';
import { GameEngine } from '../../shared/GameEngine.js';
export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        this.camera = new Camera();
        this.renderer = new Renderer(this.ctx, this);
        this.state = new GameState();
        this.particles = [];
        this.commandIndicators = [];
        this.waypointLines = [];

        this.running = false;
        this.gameOverShown = false;
        this.healSoundCooldown = 0;
        this.healSoundDelay = 5;

        this.useWorker = false;
        this.worker = null;
        this.sharedView = null;
        this.workerRunning = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.camera.zoomToFit(this.state.worldWidth, this.state.worldHeight, this.canvas.width, this.canvas.height);
    }

    async initWorker() {
        if (typeof SharedArrayBuffer === 'undefined') {
            console.warn('SharedArrayBuffer not supported, falling back to main thread');
            return false;
        }

        if (window.multiplayer && window.multiplayer.connected) {
            console.log('Multiplayer active, disabling local GameWorker simulation to prevent desync.');
            return false;
        }

        try {
            const bufferSize = calculateBufferSize();
            const sharedBuffer = new SharedArrayBuffer(bufferSize);

            this.sharedView = new SharedView(sharedBuffer);
            this.sharedMemory = new SharedMemory(sharedBuffer);

            this.worker = new Worker(
                new URL('../workers/GameWorker.js', import.meta.url),
                { type: 'module' }
            );

            const self = this;

            this.worker.onmessage = function (e) {
                const { type, data } = e.data;
                if (type === 'initialized') {
                    self.useWorker = true;
                    self.syncStateToWorker();
                } else if (type === 'workerReady') {
                    self.startWorkerLoop();
                } else if (type === 'frameComplete') {
                    self.workerRunning = true;
                }
            };

            this.worker.postMessage({
                type: 'init',
                data: { sharedBuffer: sharedBuffer }
            });

            return true;
        } catch (err) {
            console.error('Failed to init worker:', err);
            return false;
        }
    }

    syncStateToWorker() {
        if (!this.worker || !this.useWorker) return;

        if (!this.sharedNodeData) {
            this.sharedNodeData = new NodeData(this.sharedView.memory);
        }

        for (let i = 0; i < this.state.nodes.length; i++) {
            const node = this.state.nodes[i];
            node.nodeIndex = i;
            node.sharedNodeData = this.sharedNodeData;

            this.worker.postMessage({
                type: 'addNode',
                data: {
                    x: node.x,
                    y: node.y,
                    owner: node.owner,
                    type: node.type,
                    id: node.id
                }
            });
        }

        for (const entity of this.state.entities) {
            this.worker.postMessage({
                type: 'spawnEntity',
                data: {
                    x: entity.x,
                    y: entity.y,
                    owner: entity.owner,
                    targetX: entity.currentTarget ? entity.currentTarget.x : 0,
                    targetY: entity.currentTarget ? entity.currentTarget.y : 0,
                    targetNodeId: entity.targetNode ? entity.targetNode.id : -1,
                    id: entity.id
                }
            });
        }

        this.worker.postMessage({
            type: 'setGameSettings',
            data: {
                speedMultiplier: this.state.speedMultiplier,
                maxEntitiesPerPlayer: this.state.maxEntitiesPerPlayer
            }
        });

        setTimeout(() => {
            this.worker.postMessage({ type: 'syncComplete' });
        }, 100);
    }

    startWorkerLoop() {
        const self = this;

        const workerLoop = () => {
            if (!self.useWorker || !self.running) return;

            const dt = 1 / 60;
            self.worker.postMessage({ type: 'update', data: { dt } });
        };

        this.workerLoop = workerLoop;
        this.lastWorkerUpdate = 0;
        workerLoop();
    }

    updateWorkerLoop() {
        if (!this.useWorker || !this.running) return;

        const now = performance.now();
        const elapsed = now - this.lastWorkerUpdate;

        if (elapsed >= 16) {
            this.lastWorkerUpdate = now;
            const dt = Math.min(elapsed / 1000, 0.05);
            this.worker.postMessage({ type: 'update', data: { dt } });
        }
    }

    spawnEntityInWorker(x, y, owner, targetX, targetY, targetNodeId, entityId) {
        if (!this.worker || !this.useWorker) return;

        this.worker.postMessage({
            type: 'spawnEntity',
            data: {
                x, y, owner, targetX, targetY, targetNodeId,
                id: entityId || (Date.now() + Math.random())
            }
        });
    }

    setEntityTarget(entityId, targetX, targetY, targetNodeId) {
        const ent = this.state.entities.find(e => e.id === entityId);
        if (ent) {
            ent.currentTarget = { x: targetX, y: targetY };
            ent.waypoints = [];
            if (targetNodeId) {
                const targetNode = this.state.nodes.find(n => n.id === targetNodeId);
                ent.targetNode = targetNode || null;
            } else {
                ent.targetNode = null;
            }
        }

        if (this.worker && this.useWorker) {
            this.worker.postMessage({
                type: 'setEntityTargetById',
                data: { entityId, targetX, targetY, targetNodeId }
            });
        }
    }

    setMultipleEntityTargets(entityIds, targetX, targetY, targetNodeId) {
        // Actualizar el estado legacy
        entityIds.forEach(id => {
            const ent = this.state.entities.find(e => e.id === id);
            if (ent) {
                ent.currentTarget = { x: targetX, y: targetY };
                ent.waypoints = [];
                ent.targetNode = (targetNodeId !== null && targetNodeId !== undefined) ? this.state.nodes.find(n => n.id === targetNodeId) : null;
            }
        });

        // Enviar al Worker un ÚNICO postMessage
        if (this.worker && this.useWorker) {
            this.worker.postMessage({
                type: 'setMultipleEntityTargets',
                data: { entityIds, targetX, targetY, targetNodeId }
            });
        }
    }

    setEntityTargetInWorker(entityIndex, targetX, targetY, targetNodeId) {
        if (!this.worker || !this.useWorker) return;

        this.worker.postMessage({
            type: 'setEntityTarget',
            data: { entityIndex, targetX, targetY, targetNodeId }
        });
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
        this.healSoundDelay = 5;

        this.initWorker();

        const game = this;
        const loop = (now) => {
            if (!game.running) return;

            // If more than 100ms passed, the tab was likely backgrounded.
            // Don't try to simulate the massive time gap, rely on server sync.
            const elapsed = now - game.lastTime;
            game.lastTime = now;

            if (elapsed < 500) { // Only update if gap is reasonable
                const dt = Math.min(elapsed / 1000, 0.05);
                game.update(dt);
            }

            game.draw(0.016); // Always draw with a standard small tick

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
        const playerIdx = this.controller?.playerIndex ?? 0;
        sounds.setPlayerIndex(playerIdx);

        if (this.useWorker && this.sharedView) {
            this.updateWorkerLoop();
            this.updateFromWorker(dt, playerIdx);
        } else if (this.isMultiplayerDO && this.sharedView) {
            // No local physics simulation, just visuals and sounds for DO payload
            this.updateFromMultiplayerDO(dt, playerIdx);
        } else {
            this.updateLegacy(dt, playerIdx);
        }

        if (this.controller && this.controller.update) {
            this.controller.update(dt);
        }
        if (this.systems && this.systems.input) {
            this.systems.input.update(dt);
        }
        this.particles = this.particles.filter(p => p.update(dt));
        this.commandIndicators = this.commandIndicators.filter(ci => ci.update(dt));
        this.waypointLines = this.waypointLines.filter(wl => wl.update(dt));
    }

    updateFromWorker(dt, playerIdx) {
        const view = this.sharedView;

        const deathCount = view.getDeathEventsCount();
        for (let i = 0; i < deathCount; i++) {
            const event = view.getDeathEvent(i);
            if (event) {
                const color = PLAYER_COLORS[event.owner % PLAYER_COLORS.length];
                if (event.type === 2) {
                    this.spawnParticles(event.x, event.y, color, 8, 'explosion');
                } else if (event.type === 1) {
                    this.spawnParticles(event.x, event.y, color, 5, 'hit');
                } else if (event.type === 3) {
                    for (let j = 0; j < 4; j++) {
                        this.particles.push(new Particle(event.x, event.y, color, 2, 'absorb', event.targetX, event.targetY));
                    }
                } else if (event.type === 4) {
                    for (let j = 0; j < 4; j++) {
                        this.particles.push(new Particle(event.x, event.y, color, 1.5, 'sacrifice', event.targetX, event.targetY));
                    }
                }
                if (event.type === 1 || event.type === 2) {
                    sounds.playCollision();
                }
            }
        }

        if (!this.state.spawnCounts) this.state.spawnCounts = {};

        const spawnCount = view.getSpawnEventsCount();
        for (let i = 0; i < spawnCount; i++) {
            const event = view.getSpawnEvent(i);
            if (event) {
                const color = PLAYER_COLORS[event.owner % PLAYER_COLORS.length];
                this.spawnParticles(event.x, event.y, color, 6, 'explosion');

                // Accumulate spawn counts for UIManager prod/min tracking
                this.state.spawnCounts[event.owner] = (this.state.spawnCounts[event.owner] || 0) + 1;

                let tx = event.targetX;
                let ty = event.targetY;
                let tnodeId = event.targetNodeId;

                const newId = ++Entity.idCounter;
                const ent = new Entity(event.x, event.y, event.owner, newId);

                if (tx !== 0 || ty !== 0 || tnodeId !== -1) {
                    const targetNodeObj = tnodeId !== -1 ? this.state.nodes.find(n => n.id === tnodeId) : null;
                    ent.setTarget(tx, ty, targetNodeObj);
                }

                this.state.entities.push(ent);
                this.spawnEntityInWorker(event.x, event.y, event.owner, tx, ty, tnodeId, newId);
            }
        }

        const viewEntityCount = view.getEntityCount();
        this.state.entities = this.state.entities.filter(ent => {
            const idx = view.findEntityById(ent.id);
            if (idx === -1) return false;
            return !view.isEntityDead(idx);
        });

        const isValidPlayer = playerIdx >= 0;
        if (isValidPlayer) {
            view.iterateNodes((nodeIndex) => {
                const owner = view.getNodeOwner(nodeIndex);
                const prevOwner = this.workerNodeOwners?.[nodeIndex];
                if (prevOwner === -1 && owner === playerIdx) {
                    sounds.playCapture();
                }
            });
        }

        if (!this.workerNodeOwners) {
            this.workerNodeOwners = new Array(view.getNodeCount()).fill(-1);
        }
        view.iterateNodes((nodeIndex) => {
            this.workerNodeOwners[nodeIndex] = view.getNodeOwner(nodeIndex);
        });

        // --- CÓDIGO NUEVO AQUÍ ---
        // Limpiamos los eventos AHORA, después de haberlos leído con seguridad
        view.memory.clearDeathEvents();
        view.memory.clearSpawnEvents();
    } // Fin de updateFromWorker

    updateFromMultiplayerDO(dt, playerIdx) {
        const view = this.sharedView;
        if (!view) return;

        // Run local physics interpolation so movement is smooth 60fps
        // instead of snapping to 30fps server ticks
        if (!this.sharedEngine) {
            this.sharedEngine = new GameEngine(
                view.memory,
                new EntityData(view.memory),
                new NodeData(view.memory),
                { speedMultiplier: 1 }
            );
        }
        this.sharedEngine.step(dt);

        // Process death events for particles/sounds
        const deathCount = view.getDeathEventsCount();
        for (let i = 0; i < deathCount; i++) {
            const event = view.getDeathEvent(i);
            if (event) {
                const color = PLAYER_COLORS[event.owner % PLAYER_COLORS.length];
                if (event.type === 2) {
                    this.spawnParticles(event.x, event.y, color, 8, 'explosion');
                    sounds.playCollision();
                } else if (event.type === 1) {
                    this.spawnParticles(event.x, event.y, color, 4, 'hit');
                    sounds.playCollision();
                } else if (event.type === 3) {
                    for (let j = 0; j < 3; j++) {
                        this.particles.push(new Particle(event.x, event.y, color, 2, 'absorb', event.targetX, event.targetY));
                    }
                } else if (event.type === 4) {
                    for (let j = 0; j < 3; j++) {
                        this.particles.push(new Particle(event.x, event.y, color, 1.5, 'sacrifice', event.targetX, event.targetY));
                    }
                }
            }
        }

        // Track node owners for capture sound (handled by MultiplayerController.syncStateDO)
        if (!this.workerNodeOwners) {
            this.workerNodeOwners = new Array(Math.max(view.getNodeCount(), 64)).fill(-1);
        }
        view.iterateNodes((nodeIndex) => {
            this.workerNodeOwners[nodeIndex] = view.getNodeOwner(nodeIndex);
        });

        // IMPORTANT: clear events after reading — else they fire every frame
        view.memory.clearDeathEvents();
        view.memory.clearSpawnEvents();
    }

    updateLegacy(dt, playerIdx) {
        const nodeOwnersBefore = new Map();
        const nodeHpBefore = new Map();

        this.state.nodes.forEach(n => {
            nodeOwnersBefore.set(n.id, n.owner);
            nodeHpBefore.set(n.id, n.baseHp);
        });

        const playerEntitiesBefore = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        this.state.update(dt, this);

        const isValidPlayer = playerIdx >= 0;

        this.state.nodes.forEach(n => {
            const oldOwner = nodeOwnersBefore.get(n.id);
            if (isValidPlayer && oldOwner !== undefined && oldOwner === -1 && n.owner === playerIdx) {
                sounds.playCapture();
            }
        });

        const playerEntitiesNow = this.state.unitCounts ? (this.state.unitCounts[playerIdx] || 0) : 0;

        if (playerEntitiesNow < playerEntitiesBefore && isValidPlayer) {
            sounds.playCollision();
        }
    }

    draw(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;
        this.renderer.setPlayerIndex(playerIdx);

        this.renderer.clear(this.canvas.width, this.canvas.height);
        this.renderer.drawGrid(this.canvas.width, this.canvas.height, this.camera);

        if (this.useWorker && this.sharedView) {
            this.drawFromWorker();
        } else if (this.isMultiplayerDO && this.sharedView) {
            this.drawFromWorker();
        } else {
            this.drawLegacy(dt);
        }

        this.particles.forEach(p => this.renderer.drawParticle(p, this.camera));
        this.commandIndicators.forEach(ci => this.renderer.drawCommandIndicator(ci, this.camera));

        this.waypointLines.filter(wl => wl.owner === playerIdx).forEach(wl => this.renderer.drawWaypointLine(wl, this.camera));

        if (this.systems.selection.isSelectingBox) {
            const input = this.systems.input;
            this.renderer.drawSelectionBox(
                this.systems.selection.boxStart.x,
                this.systems.selection.boxStart.y,
                input.mouse.x,
                input.mouse.y
            );
        }

        if (this.systems.selection.currentPath.length > 0) {
            this.renderer.drawPath(this.systems.selection.currentPath, this.camera, 'rgba(255, 255, 255, 0.6)', 3);
        }

        if (this.systems && this.systems.ui) {
            this.systems.ui.draw(this.renderer);
        }
    }

    drawFromWorker() {
        const view = this.sharedView;
        const camera = this.camera;

        view.iterateNodes((nodeIndex) => {
            const owner = view.getNodeOwner(nodeIndex);
            const baseHp = view.getNodeBaseHp(nodeIndex);
            const maxHp = view.getNodeMaxHp(nodeIndex);
            const node = {
                x: view.getNodeX(nodeIndex),
                y: view.getNodeY(nodeIndex),
                owner: owner,
                radius: view.getNodeRadius(nodeIndex),
                influenceRadius: view.getNodeInfluenceRadius(nodeIndex),
                baseHp: baseHp,
                maxHp: maxHp,
                spawnProgress: view.getNodeSpawnProgress(nodeIndex),
                hitFlash: view.getNodeHitFlash(nodeIndex),
                spawnEffect: view.getNodeSpawnEffect(nodeIndex),
                id: view.getNodeId(nodeIndex),
                rallyPoint: this.state.nodes[nodeIndex]?.rallyPoint,
                rallyTargetNode: this.state.nodes[nodeIndex]?.rallyTargetNode,
                getColor: () => owner === -1 ? '#757575' : PLAYER_COLORS[owner % PLAYER_COLORS.length],
                getTotalHp: () => Math.min(maxHp, baseHp),
            };
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, camera, isSelected);
        });

        // Creamos un objeto "fantasma" reutilizable para no saturar la memoria
        if (!this._dummyEntity) this._dummyEntity = { getColor: function () { return PLAYER_COLORS[this.owner % PLAYER_COLORS.length]; } };
        const entity = this._dummyEntity;

        view.iterateEntities((entityIndex) => {
            const owner = view.getEntityOwner(entityIndex);

            // Reutilizamos el mismo objeto para todas las células
            entity.x = view.getEntityX(entityIndex);
            entity.y = view.getEntityY(entityIndex);
            entity.owner = owner;
            entity.radius = view.getEntityRadius(entityIndex);
            entity.dying = view.isEntityDying(entityIndex);
            entity.dead = view.isEntityDead(entityIndex);
            entity.deathTime = view.getEntityDeathTime(entityIndex);
            entity.deathType = view.getEntityDeathType(entityIndex);
            entity.selected = view.isEntitySelected(entityIndex);
            entity.outsideWarning = view.hasEntityOutsideWarning(entityIndex);
            entity.id = view.getEntityId(entityIndex);
            // Recuperar el speedBoost para el brillo de velocidad
            entity.speedBoost = view.memory.entities.speedBoost[entityIndex] || 0;

            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, camera, isSelected);
        });

        // Death events are handled in updateFromWorker and cleared there.
        // Do NOT read them here — they would double-fire particles/sounds.
    }

    drawLegacy(dt) {
        const playerIdx = this.controller?.playerIndex ?? 0;

        this.state.nodes.forEach(node => {
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, this.camera, isSelected);
        });

        this.state.entities.forEach(entity => {
            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, this.camera, isSelected);
        });
        this.renderer.renderTrails(this.camera, dt);

        this.state.entities.filter(e => e.owner === playerIdx).forEach(e => {
            if (this.systems.selection.isSelected(e) && e.waypoints.length > 0) {
                this.renderer.drawPath([e, ...e.waypoints], this.camera, 'rgba(255, 255, 255, 0.15)', 1.2, true);

                const target = e.currentTarget || e.waypoints[0];
                const screen = this.camera.worldToScreen(target.x, target.y);
                this.ctx.beginPath();
                this.ctx.arc(screen.x, screen.y, 2 * this.camera.zoom, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fill();
            }
        });
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
