import { sounds } from './SoundManager.js';

export class SelectionManager {
    constructor(game) {
        this.game = game;
        this.selectedNodes = new Set();
        this.selectedEntities = new Set();
        this.isSelectingBox = false;
        this.boxStart = { x: 0, y: 0 };
        this.currentPath = [];
        this._rallyMode = false;
    }

    get rallyMode() {
        return this._rallyMode;
    }

    set rallyMode(value) {
        this._rallyMode = value;
        if (this.game.canvas) {
            this.game.canvas.style.cursor = value ? 'crosshair' : 'default';
        }
    }

    get view() {
        return this.game.sharedView || null;
    }

    getNodeCount() {
        const view = this.view;
        return view ? view.getNodeCount() : this.game.state.nodes.length;
    }

    getEntityCount() {
        const view = this.view;
        return view ? view.getEntityCount() : this.game.state.entities.length;
    }

    getNodeOwner(idx) {
        const view = this.view;
        return view ? view.getNodeOwner(idx) : this.game.state.nodes[idx].owner;
    }

    getNodeX(idx) {
        const view = this.view;
        return view ? view.getNodeX(idx) : this.game.state.nodes[idx].x;
    }

    getNodeY(idx) {
        const view = this.view;
        return view ? view.getNodeY(idx) : this.game.state.nodes[idx].y;
    }

    getNodeRadius(idx) {
        const view = this.view;
        return view ? view.getNodeRadius(idx) : this.game.state.nodes[idx].radius;
    }

    getNodeInfluenceRadius(idx) {
        const view = this.view;
        return view ? view.getNodeInfluenceRadius(idx) : this.game.state.nodes[idx].influenceRadius;
    }

    getNodeId(idx) {
        const view = this.view;
        return view ? view.getNodeId(idx) : this.game.state.nodes[idx].id;
    }

    getEntityOwner(idx) {
        const view = this.view;
        return view ? view.getEntityOwner(idx) : this.game.state.entities[idx].owner;
    }

    getEntityX(idx) {
        const view = this.view;
        return view ? view.getEntityX(idx) : this.game.state.entities[idx].x;
    }

    getEntityY(idx) {
        const view = this.view;
        return view ? view.getEntityY(idx) : this.game.state.entities[idx].y;
    }

    getEntityRadius(idx) {
        const view = this.view;
        return view ? view.getEntityRadius(idx) : this.game.state.entities[idx].radius;
    }

    getEntityId(idx) {
        const view = this.view;
        return view ? view.getEntityId(idx) : this.game.state.entities[idx].id;
    }

    isEntityDead(idx) {
        const view = this.view;
        return view ? view.isEntityDead(idx) : this.game.state.entities[idx].dead;
    }

    isEntityDying(idx) {
        const view = this.view;
        return view ? view.isEntityDying(idx) : this.game.state.entities[idx].dying;
    }

    findNodeAtScreen(mx, my) {
        const camera = this.game.camera;
        const count = this.getNodeCount();
        const worldPos = camera.screenToWorld(mx, my);

        for (let i = 0; i < count; i++) {
            const nx = this.getNodeX(i);
            const ny = this.getNodeY(i);
            const radius = this.getNodeRadius(i);
            const dx = worldPos.x - nx;
            const dy = worldPos.y - ny;
            if (dx * dx + dy * dy < radius * radius) {
                return i;
            }
        }
        return -1;
    }

    findEntityAtScreen(mx, my) {
        const camera = this.game.camera;
        const count = this.getEntityCount();
        const worldPos = camera.screenToWorld(mx, my);

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);
            // In screen space, radius was (r + 5) * zoom.
            // In world space, the hit radius equivalent is just (r + 5).
            const radius = this.getEntityRadius(i) + 5;

            const dx = worldPos.x - ex;
            const dy = worldPos.y - ey;

            if (dx * dx + dy * dy < radius * radius) {
                return i;
            }
        }
        return -1;
    }

    findNodeAtWorld(x, y, radius) {
        const view = this.view;
        if (view) {
            return view.findNodeByPosition(x, y, radius);
        }
        const node = this.game.state.nodes.find(n => {
            const dx = n.x - x, dy = n.y - y;
            return Math.sqrt(dx * dx + dy * dy) < n.radius + radius;
        });
        return node ? this.game.state.nodes.indexOf(node) : -1;
    }

    getEntitiesInNodeArea(nodeIdx) {
        const view = this.view;
        const nx = this.getNodeX(nodeIdx);
        const ny = this.getNodeY(nodeIdx);
        const radius = this.getNodeInfluenceRadius(nodeIdx);
        const owner = this.getNodeOwner(nodeIdx);

        if (view) {
            return view.getEntitiesInRadius(nx, ny, radius, owner);
        }

        const result = [];
        this.game.state.entities.forEach((e, i) => {
            if (e.owner === owner && !e.dead && !e.dying) {
                const dx = e.x - nx, dy = e.y - ny;
                if (dx * dx + dy * dy <= radius * radius) {
                    result.push(i);
                }
            }
        });
        return result;
    }

    getEntitiesInScreenRect(x1, y1, x2, y2, owner) {
        const view = this.view;
        const camera = this.game.camera;

        const w1 = camera.screenToWorld(x1, y1);
        const w2 = camera.screenToWorld(x2, y2);
        const minX = Math.min(w1.x, w2.x);
        const maxX = Math.max(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const maxY = Math.max(w1.y, w2.y);

        if (view) {
            return view.getEntitiesInRect(minX, minY, maxX, maxY, owner);
        }

        const result = [];
        this.game.state.entities.forEach((e, i) => {
            if (owner !== undefined && e.owner !== owner) return;
            if (e.dead || e.dying) return;
            const radius = e.radius + 5;
            if (e.x + radius >= minX && e.x - radius <= maxX &&
                e.y + radius >= minY && e.y - radius <= maxY) {
                result.push(i);
            }
        });
        return result;
    }

    getEntitiesInViewScreenRect(x1, y1, x2, y2, owner) {
        const camera = this.game.camera;
        const result = [];

        const w1 = camera.screenToWorld(x1, y1);
        const w2 = camera.screenToWorld(x2, y2);
        const minX = Math.min(w1.x, w2.x);
        const maxX = Math.max(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const maxY = Math.max(w1.y, w2.y);

        const count = this.getEntityCount();
        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (owner !== undefined && this.getEntityOwner(i) !== owner) continue;

            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);
            const radius = this.getEntityRadius(i) + 5;

            if (ex + radius >= minX && ex - radius <= maxX && ey + radius >= minY && ey - radius <= maxY) {
                result.push(i);
            }
        }
        return result;
    }

    getNodesInRect(x1, y1, x2, y2) {
        const camera = this.game.camera;
        const count = this.getNodeCount();
        const result = [];

        const w1 = camera.screenToWorld(x1, y1);
        const w2 = camera.screenToWorld(x2, y2);
        const minX = Math.min(w1.x, w2.x);
        const maxX = Math.max(w1.x, w2.x);
        const minY = Math.min(w1.y, w2.y);
        const maxY = Math.max(w1.y, w2.y);

        for (let i = 0; i < count; i++) {
            const nx = this.getNodeX(i);
            const ny = this.getNodeY(i);
            const radius = this.getNodeRadius(i);
            if (nx + radius >= minX && nx - radius <= maxX &&
                ny + radius >= minY && ny - radius <= maxY) {
                result.push(this.getNodeId(i));
            }
        }
        return result;
    }

    isSelected(obj) {
        if (obj.radius > 10) {
            return this.selectedNodes.has(obj.id);
        }
        return this.selectedEntities.has(obj.id);
    }

    handleMouseDown(mouse, event) {
        const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);

        if (event.button === 0) {
            const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
            if (this.rallyMode && this.selectedNodes.size > 0) {
                const targetNodeIdx = this.findNodeAtWorld(worldPos.x, worldPos.y, 10);
                const targetNodeId = targetNodeIdx >= 0 ? this.getNodeId(targetNodeIdx) : null;

                if (this.game.controller.sendAction) {
                    this.game.controller.sendAction({
                        type: 'rally',
                        nodeIds: Array.from(this.selectedNodes),
                        targetX: worldPos.x,
                        targetY: worldPos.y,
                        targetNodeId: targetNodeId
                    });
                } else {
                    this.selectedNodes.forEach(id => {
                        const node = this.game.state.nodes.find(n => n.id === id);
                        if (node && node.sharedNodeData) {
                            const targetNode = targetNodeIdx >= 0 ? this.game.state.nodes.find(n => n.id === this.getNodeId(targetNodeIdx)) : null;
                            node.setRallyPoint(worldPos.x, worldPos.y, targetNode);
                        } else if (node) {
                            const targetNode = targetNodeIdx >= 0 ? this.game.state.nodes.find(n => n.id === this.getNodeId(targetNodeIdx)) : null;
                            node.rallyPoint = { x: worldPos.x, y: worldPos.y };
                            node.rallyTargetNode = targetNode;
                        }
                    });
                }
                this.rallyMode = false;
                return;
            }

            if (!event.shiftKey) {
                this.clear();
            }
            this.boxStart = { x: mouse.x, y: mouse.y };

            if (event.detail === 2) {
                this.handleDoubleClick(mouse.x, mouse.y);
                return;
            }
        }

        if (event.button === 2) {
            this.currentPath = [worldPos];
            this.handleRightClick(worldPos.x, worldPos.y);
        }
    }

    findNodeById(id) {
        const view = this.view;
        if (view) {
            return view.findNodeById(id);
        }
        const node = this.game.state.nodes.find(n => n.id === id);
        return node ? this.game.state.nodes.indexOf(node) : -1;
    }

    findEntityById(id) {
        const view = this.view;
        if (view) {
            return view.findEntityById(id);
        }
        const entity = this.game.state.entities.find(e => e.id === id);
        return entity ? this.game.state.entities.indexOf(entity) : -1;
    }

    handleDoubleClick(mx, my) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const clickedNodeIdx = this.findNodeAtScreen(mx, my);

        if (clickedNodeIdx >= 0) {
            const owner = this.getNodeOwner(clickedNodeIdx);
            const count = this.getNodeCount();
            for (let i = 0; i < count; i++) {
                if (this.getNodeOwner(i) === owner) {
                    this.selectedNodes.add(this.getNodeId(i));
                    if (owner === playerIndex) {
                        const entityIdxs = this.getEntitiesInNodeArea(i);
                        for (const eIdx of entityIdxs) {
                            this.selectedEntities.add(this.getEntityId(eIdx));
                        }
                    }
                }
            }
            return;
        }

        const clickedEntityIdx = this.findEntityAtScreen(mx, my);
        if (clickedEntityIdx >= 0) {
            const owner = this.getEntityOwner(clickedEntityIdx);
            if (owner === playerIndex) {
                const entityIdxs = this.getEntitiesInViewScreenRect(0, 0, window.innerWidth, window.innerHeight, owner);
                for (const eIdx of entityIdxs) {
                    this.selectedEntities.add(this.getEntityId(eIdx));
                }
            }
        }
    }

    handleMouseMove(mouse, event) {
        if (mouse.down && mouse.drag) {
            this.isSelectingBox = true;
        }
        if (mouse.rightDown) {
            const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
            const lastPoint = this.currentPath[this.currentPath.length - 1];
            if (lastPoint) {
                const dx = worldPos.x - lastPoint.x;
                const dy = worldPos.y - lastPoint.y;

                if (Math.sqrt(dx * dx + dy * dy) > 30) {
                    this.currentPath.push(worldPos);
                }
            }
        }
    }

    selectAt(mx, my) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const clickedNodeIdx = this.findNodeAtScreen(mx, my);

        if (clickedNodeIdx >= 0) {
            this.selectedNodes.add(this.getNodeId(clickedNodeIdx));
            if (this.getNodeOwner(clickedNodeIdx) === playerIndex) {
                const entityIdxs = this.getEntitiesInNodeArea(clickedNodeIdx);
                for (const eIdx of entityIdxs) {
                    this.selectedEntities.add(this.getEntityId(eIdx));
                }
            }
            return;
        }

        const clickedEntityIdx = this.findEntityAtScreen(mx, my);
        if (clickedEntityIdx >= 0) {
            if (this.getEntityOwner(clickedEntityIdx) === playerIndex) {
                this.selectedEntities.add(this.getEntityId(clickedEntityIdx));
            }
            return;
        }
    }

    selectInBox(x1, y1, x2, y2) {
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;

        const entityIdxs = this.getEntitiesInScreenRect(x1, y1, x2, y2, playerIndex);
        for (const eIdx of entityIdxs) {
            this.selectedEntities.add(this.getEntityId(eIdx));
        }

        const nodeIds = this.getNodesInRect(x1, y1, x2, y2);
        for (const id of nodeIds) {
            const idx = this.findNodeById(id);
            if (idx >= 0 && this.getNodeOwner(idx) === playerIndex) {
                this.selectedNodes.add(id);
                // We no longer auto-select nested entities for box selections. 
                // Only units explicitly caught in the getEntitiesInScreenRect bounds are selected.
            }
        }
    }

    handleRightClick(worldX, worldY) {
        const targetNodeIdx = this.findNodeAtWorld(worldX, worldY, 20);

        if (this.selectedEntities.size > 0) {
            let targetNode = null;
            if (targetNodeIdx >= 0) {
                targetNode = { id: this.getNodeId(targetNodeIdx), owner: this.getNodeOwner(targetNodeIdx) };
            }
            this.executeCommand(worldX, worldY, targetNode);
        }
    }

    handleMouseUp(mouse, event) {
        if (event.button === 0) {
            if (mouse.drag && this.selectedNodes.size > 0) {
                const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
                const targetNodeIdx = this.findNodeAtWorld(worldPos.x, worldPos.y, 15);
                const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;

                const dragDist = Math.sqrt(
                    Math.pow(mouse.x - this.game.systems.input.mouseDownPos.x, 2) +
                    Math.pow(mouse.y - this.game.systems.input.mouseDownPos.y, 2)
                );

                if (dragDist > 20) {
                    if (this.game.controller.sendAction) {
                        this.game.controller.sendAction({
                            type: 'rally',
                            nodeIds: Array.from(this.selectedNodes),
                            targetX: worldPos.x,
                            targetY: worldPos.y,
                            targetNodeId: targetNodeIdx >= 0 ? this.getNodeId(targetNodeIdx) : null
                        });
                    } else {
                        this.selectedNodes.forEach(id => {
                            const idx = this.findNodeById(id);
                            if (idx >= 0 && this.getNodeOwner(idx) === playerIndex) {
                                const node = this.game.state.nodes.find(n => n.id === id);
                                const targetNode = targetNodeIdx >= 0 ? this.game.state.nodes.find(n => n.id === this.getNodeId(targetNodeIdx)) : null;
                                if (node) node.setRallyPoint(worldPos.x, worldPos.y, targetNode);
                            }
                        });
                    }
                    this.game.systems.input.nodeUnderMouse = null;
                    this.isSelectingBox = false;
                    this.rallyMode = false; // Reset rally mode after drag-setting
                    return;
                }
            }

            if (this.isSelectingBox) {
                this.selectInBox(
                    this.game.systems.input.mouseDownPos.x,
                    this.game.systems.input.mouseDownPos.y,
                    mouse.x,
                    mouse.y
                );
                this.isSelectingBox = false;
            } else {
                this.selectAt(mouse.x, mouse.y);
            }
            if (this.selectedEntities.size > 0 || this.selectedNodes.size > 0) {
                sounds.playSelect();
            }
        }
        if (event.button === 2) {
            if (this.currentPath.length > 2 && this.selectedEntities.size > 0) {
                const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
                this.game.spawnWaypointLine([...this.currentPath], playerIndex);

                if (this.game.controller.sendAction) {
                    this.game.controller.sendAction({
                        type: 'path',
                        unitIds: Array.from(this.selectedEntities),
                        path: this.currentPath
                    });
                } else {
                    this.selectedEntities.forEach(id => {
                        const entity = this.game.state.entities.find(e => e.id === id);
                        if (entity) {
                            entity.waypoints = [...this.currentPath];
                            entity.currentTarget = null;
                            if (this.game.setEntityTarget) {
                                const target = this.currentPath[this.currentPath.length - 1];
                                this.game.setEntityTarget(id, target.x, target.y, null);
                            }
                        }
                    });
                }
                sounds.playMove();
            }
            this.currentPath = [];
        }
        this.game.systems.input.nodeUnderMouse = null;
    }

    applyPathToSelection() {
        const ids = Array.from(this.selectedEntities);
        for (const id of ids) {
            const idx = this.findEntityById(id);
            if (idx >= 0 && !this.isEntityDead(idx)) {
                const entity = this.game.state.entities.find(e => e.id === id);
                if (entity) {
                    entity.waypoints = [...this.currentPath];
                    entity.currentTarget = null;
                }
            }
        }
    }

    executeCommand(worldX, worldY, targetNode) {
        this.game.spawnCommandIndicator(worldX, worldY, targetNode ? 'attack' : 'move');

        if (targetNode && targetNode.owner !== -1 && targetNode.owner !== (this.game.controller.playerIndex || 0)) {
            sounds.playAttack();
        } else {
            sounds.playMove();
        }

        if (this.game.controller.sendAction) {
            this.game.controller.sendAction({
                type: 'move',
                sourceNodeId: null,
                targetNodeId: targetNode ? targetNode.id : null,
                targetX: worldX,
                targetY: worldY,
                unitIds: Array.from(this.selectedEntities)
            });
        } else {
            const targetNodeId = targetNode ? targetNode.id : null;
            if (this.game.setMultipleEntityTargets) {
                this.game.setMultipleEntityTargets(Array.from(this.selectedEntities), worldX, worldY, targetNodeId);
            }
        }
    }

    clear() {
        this.selectedNodes.clear();
        this.selectedEntities.clear();
        this.rallyMode = false;
    }

    onEntityDead(id) {
        this.selectedEntities.delete(id);
    }

    onNodeDead(id) {
        this.selectedNodes.delete(id);
    }
}
