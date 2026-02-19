import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';
import { GameState } from '../../shared/GameState.js';
import { GAME_SETTINGS, PLAYER_COLORS } from '../../shared/GameConfig.js';
import { Particle } from './Particle.js';
import { sounds } from '../systems/SoundManager.js';
import { SharedMemory, MEMORY_LAYOUT, calculateBufferSize } from '../../shared/SharedMemory.js';
import { SharedView } from '../../shared/SharedView.js';
import { Entity } from '../../shared/Entity.js';
import { NodeData } from '../../shared/NodeData.js';

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
            const dt = Math.min((now - game.lastTime) / 1000, 0.05);
            game.lastTime = now;

            game.update(dt);
            game.draw(dt);

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

        // Sincronizar posiciones del worker a entidades legacy para selección
        this.syncWorkerToLegacy();

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

        const spawnCount = view.getSpawnEventsCount();
        for (let i = 0; i < spawnCount; i++) {
            const event = view.getSpawnEvent(i);
            if (event) {
                const color = PLAYER_COLORS[event.owner % PLAYER_COLORS.length];
                this.spawnParticles(event.x, event.y, color, 6, 'explosion');

                let spawnerNode = null;
                let minDist = Infinity;
                for (const n of this.state.nodes) {
                    if (n.owner === event.owner) {
                        const distSq = (n.x - event.x) ** 2 + (n.y - event.y) ** 2;
                        if (distSq < minDist) {
                            minDist = distSq;
                            spawnerNode = n;
                        }
                    }
                }

                let tx = event.targetX;
                let ty = event.targetY;
                let tnodeId = event.targetNodeId;

                if (spawnerNode && spawnerNode.rallyPoint) {
                    tx = spawnerNode.rallyPoint.x;
                    ty = spawnerNode.rallyPoint.y;
                    tnodeId = spawnerNode.rallyTargetNode ? spawnerNode.rallyTargetNode.id : -1;
                }

                const newId = Date.now() + Math.random();
                const ent = new Entity(event.x, event.y, event.owner, newId);

                if (tx !== 0 || ty !== 0 || tnodeId !== -1) {
                    ent.setTarget(tx, ty, spawnerNode?.rallyTargetNode);
                }

                this.state.entities.push(ent);
                this.spawnEntityInWorker(event.x, event.y, event.owner, tx, ty, tnodeId, newId);
            }
        }

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

    syncWorkerToLegacy() {
        const view = this.sharedView;

        for (let i = 0; i < this.state.nodes.length && i < view.getNodeCount(); i++) {
            const node = this.state.nodes[i];
            node.baseHp = view.getNodeBaseHp(i);
            node.spawnProgress = view.getNodeSpawnProgress(i);
            node.hitFlash = view.getNodeHitFlash(i);
            node.spawnEffect = view.getNodeSpawnEffect(i);
            node.owner = view.getNodeOwner(i);
        }

        for (let i = 0; i < this.state.entities.length && i < view.getEntityCount(); i++) {
            const entity = this.state.entities[i];
            entity.x = view.getEntityX(i);
            entity.y = view.getEntityY(i);
            entity.dying = view.isEntityDying(i);
            entity.dead = view.isEntityDead(i);
            entity.deathTime = view.getEntityDeathTime(i);
            entity.deathType = view.getEntityDeathType(i);
        }
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
                getColor: () => owner === -1 ? '#757575' : PLAYER_COLORS[owner % PLAYER_COLORS.length],
                getTotalHp: () => Math.min(maxHp, baseHp),
            };
            const isSelected = this.systems?.selection?.isSelected(node);
            this.renderer.drawNode(node, camera, isSelected);
        });

        view.iterateEntities((entityIndex) => {
            const owner = view.getEntityOwner(entityIndex);
            const entity = {
                x: view.getEntityX(entityIndex),
                y: view.getEntityY(entityIndex),
                owner: owner,
                radius: view.getEntityRadius(entityIndex),
                dying: view.isEntityDying(entityIndex),
                dead: view.isEntityDead(entityIndex),
                deathTime: view.getEntityDeathTime(entityIndex),
                deathType: view.getEntityDeathType(entityIndex),
                selected: view.isEntitySelected(entityIndex),
                outsideWarning: view.hasEntityOutsideWarning(entityIndex),
                id: view.getEntityId(entityIndex),
                getColor: () => PLAYER_COLORS[owner % PLAYER_COLORS.length],
            };
            const isSelected = this.systems?.selection?.isSelected(entity);
            this.renderer.drawEntity(entity, camera, isSelected);
        });

        const deathCount = view.getDeathEventsCount();
        for (let i = 0; i < deathCount; i++) {
            const event = view.getDeathEvent(i);
            if (event && (event.type === 2 || event.type === 3)) {
                const color = PLAYER_COLORS[event.owner % PLAYER_COLORS.length];
                this.spawnParticles(event.x, event.y, color, event.type === 2 ? 8 : 5, event.type === 2 ? 'explosion' : 'hit');
            }
        }
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
