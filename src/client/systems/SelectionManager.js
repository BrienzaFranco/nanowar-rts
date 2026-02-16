export class SelectionManager {
    constructor(game) {
        this.game = game;
        this.selectedNodes = new Set();
        this.selectedEntities = new Set();
        this.isSelectingBox = false;
        this.boxStart = { x: 0, y: 0 };
        this.currentPath = [];
        this.rallyMode = false;
    }

    isSelected(obj) {
        if (obj.radius > 10) {
            return this.selectedNodes.has(obj.id);
        }
        return this.selectedEntities.has(obj.id);
    }

    handleMouseDown(mouse, event) {
        const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);

        if (event.button === 0) { // Left Click
            if (this.rallyMode && this.selectedNodes.size > 0) {
                this.selectedNodes.forEach(id => {
                    const node = this.game.state.nodes.find(n => n.id === id);
                    if (node && node.owner === 0) node.setRallyPoint(worldPos.x, worldPos.y);
                });
                this.rallyMode = false;
                return;
            }

            if (!event.shiftKey) {
                this.clear();
            }
            this.boxStart = { x: mouse.x, y: mouse.y };

            if (event.detail === 2) { // Double click
                this.handleDoubleClick(mouse.x, mouse.y);
                return;
            }
        }

        if (event.button === 2) { // Right Click
            this.currentPath = [worldPos];
            this.handleRightClick(worldPos.x, worldPos.y);
        }
    }

    handleDoubleClick(mx, my) {
        const clickedNode = this.game.state.nodes.find(n => n.isPointInside(mx, my, this.game.camera));
        if (clickedNode) {
            this.game.state.nodes.filter(n => n.owner === clickedNode.owner).forEach(n => this.selectedNodes.add(n.id));
            return;
        }
        const clickedEntity = this.game.state.entities.find(e => !e.dead && !e.dying && e.isPointInside(mx, my, this.game.camera));
        if (clickedEntity) {
            this.game.state.entities.filter(e => !e.dead && !e.dying && e.owner === clickedEntity.owner).forEach(e => this.selectedEntities.add(e.id));
        }
    }

    handleMouseMove(mouse, event) {
        if (mouse.down && mouse.drag) {
            this.isSelectingBox = true;
        }
        if (mouse.rightDown) {
            const worldPos = this.game.camera.screenToWorld(mouse.x, mouse.y);
            // Only add if different enough from last point (30 pixels)
            const lastPoint = this.currentPath[this.currentPath.length - 1];
            const dx = worldPos.x - lastPoint.x;
            const dy = worldPos.y - lastPoint.y;

            if (Math.sqrt(dx * dx + dy * dy) > 30) {
                this.currentPath.push(worldPos);
                // Dynamically add to entities
                this.selectedEntities.forEach(id => {
                    const ent = this.game.state.entities.find(e => e.id === id);
                    if (ent && !ent.dead) {
                        ent.addWaypoint(worldPos.x, worldPos.y);
                    }
                });
            }
        }
    }


    selectAt(mx, my) {
        const clickedNode = this.game.state.nodes.find(n => n.isPointInside(mx, my, this.game.camera));
        if (clickedNode) {
            this.selectedNodes.add(clickedNode.id);
            return;
        }

        const clickedEntity = this.game.state.entities.find(e => !e.dead && !e.dying && e.isPointInside(mx, my, this.game.camera));
        if (clickedEntity) {
            this.selectedEntities.add(clickedEntity.id);
            return;
        }
    }

    selectInBox(x1, y1, x2, y2) {
        this.game.state.entities.forEach(e => {
            if (e.owner === 0 && !e.dead && e.isInsideRect(x1, y1, x2, y2, this.game.camera)) {
                this.selectedEntities.add(e.id);
            }
        });
        this.game.state.nodes.forEach(n => {
            if (n.owner === 0 && n.isInsideRect(x1, y1, x2, y2, this.game.camera)) {
                this.selectedNodes.add(n.id);
            }
        });
    }

    handleRightClick(worldX, worldY) {
        const targetNode = this.game.state.nodes.find(n => {
            const dx = n.x - worldX, dy = n.y - worldY;
            return Math.sqrt(dx * dx + dy * dy) < n.radius;
        });

        if (this.selectedEntities.size > 0) {
            this.executeCommand(worldX, worldY, targetNode);
        }
    }

    handleMouseUp(mouse, event) {
        if (event.button === 0) {
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
        }
        if (event.button === 2) {
            if (this.currentPath.length > 2 && this.selectedEntities.size > 0) {
                // Add a visual waypoint line to the game
                this.game.spawnWaypointLine([...this.currentPath], 0);
            }
            this.currentPath = [];
        }
    }

    applyPathToSelection() {
        this.selectedEntities.forEach(id => {
            const ent = this.game.state.entities.find(e => e.id === id);
            if (ent && !ent.dead) {
                ent.waypoints = [...this.currentPath];
                ent.currentTarget = null;
            }
        });
    }

    executeCommand(worldX, worldY, targetNode) {
        this.game.spawnCommandIndicator(worldX, worldY, targetNode ? 'attack' : 'move');
        this.selectedEntities.forEach(id => {
            const ent = this.game.state.entities.find(e => e.id === id);
            if (ent && !ent.dead) {
                ent.setTarget(worldX, worldY, targetNode);
            }
        });
    }

    clear() {
        this.selectedNodes.clear();
        this.selectedEntities.clear();
        this.rallyMode = false;
    }
}
