import { sounds } from './SoundManager.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.mouse = { x: 0, y: 0, down: false, rightDown: false, drag: false };
        this.mouseDownPos = { x: 0, y: 0 };
        this.isPanning = false;
        this.spaceDown = false;
        this.nodeUnderMouse = null; // Track if mouse is over a node
        this.keys = {}; // Track active keys for continuous movement
        this.setupEvents();
    }

    setupEvents() {
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouseDownPos = { x: this.mouse.x, y: this.mouse.y };

        if (this.spaceDown || e.button === 1) {
            this.isPanning = true;
            return;
        }

        // Check if mouse is over a node using selection manager's method
        const worldPos = this.game.camera.screenToWorld(this.mouse.x, this.mouse.y);
        const nodeIdx = this.game.systems.selection.findNodeAtWorld(worldPos.x, worldPos.y, 10);
        if (nodeIdx >= 0) {
            const view = this.game.sharedView;
            if (view) {
                const nodeId = view.getNodeId(nodeIdx);
                this.nodeUnderMouse = this.game.state.nodes.find(n => n.id === nodeId) || null;
            } else {
                this.nodeUnderMouse = this.game.state.nodes[nodeIdx] || null;
            }
        } else {
            this.nodeUnderMouse = null;
        }

        if (e.button === 0) this.mouse.down = true;
        if (e.button === 2) this.mouse.rightDown = true;

        this.game.systems.selection.handleMouseDown(this.mouse, e);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (this.isPanning) {
            const dx = mx - this.mouse.x;
            const dy = my - this.mouse.y;
            this.game.camera.pan(dx, dy);
        } else if (this.mouse.down || this.mouse.rightDown) {
            const dx = mx - this.mouseDownPos.x;
            const dy = my - this.mouseDownPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) this.mouse.drag = true;
        }

        this.mouse.x = mx;
        this.mouse.y = my;

        if (!this.isPanning) {
            this.game.systems.selection.handleMouseMove(this.mouse, e);
        }
    }

    onMouseUp(e) {
        this.isPanning = false;
        if (e.button === 0) this.mouse.down = false;
        if (e.button === 2) this.mouse.rightDown = false;

        this.game.systems.selection.handleMouseUp(this.mouse, e);
        this.mouse.drag = false;
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.8 : 1.2; // Increase speed slightly
        this.game.camera.zoomAt(this.mouse.x, this.mouse.y, delta);
    }

    onKeyDown(e) {
        this.keys[e.code] = true;

        if (e.code === 'Space') {
            this.spaceDown = true;
            e.preventDefault();
        }
        
        // Rally point with T or E - only if we have nodes selected
        if (e.code === 'KeyT' || e.code === 'KeyE') {
            const sel = this.game.systems.selection;
            if (sel.selectedNodes.size > 0) {
                sel.rallyMode = true;
            }
        }

        // Escape - cancel selection and rally mode
        if (e.code === 'Escape') {
            const sel = this.game.systems.selection;
            sel.clear();
            sel.rallyMode = false;
        }

        // Q - Select all units on screen
        if (e.code === 'KeyQ') {
            const sel = this.game.systems.selection;
            const playerIdx = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
            
            // Get all units currently in view
            const entitiesInView = sel.getEntitiesInViewScreenRect(0, 0, window.innerWidth, window.innerHeight, playerIdx);
            
            if (entitiesInView.length > 0) {
                // Clear existing selection first? (Standard RTS behavior is Q selects all units)
                if (!e.shiftKey) sel.clear();
                
                for (const eIdx of entitiesInView) {
                    sel.selectedEntities.add(sel.getEntityId(eIdx));
                }
                sounds.playSelect();
            }
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
        if (e.code === 'Space') {
            this.spaceDown = false;
        }
    }

    update(dt) {
        // WASD Camera movement
        const panSpeed = 800 * dt; // Adjust speed as needed
        let dx = 0;
        let dy = 0;

        if (this.keys['KeyW']) dy += panSpeed;
        if (this.keys['KeyS']) dy -= panSpeed;
        if (this.keys['KeyA']) dx += panSpeed;
        if (this.keys['KeyD']) dx -= panSpeed;

        if (dx !== 0 || dy !== 0) {
            this.game.camera.pan(dx, dy);
        }
    }
}
