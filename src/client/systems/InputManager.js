import { sounds } from './SoundManager.js';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.canvas = game.canvas;
        this.mouse = { x: 0, y: 0, down: false, rightDown: false, drag: false };
        this.mouseDownPos = { x: 0, y: 0 };
        this.isPanning = false;
        this.spaceDown = false;
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
        if (e.code === 'Space') {
            this.spaceDown = true;
            e.preventDefault();
        }
        if (e.code === 'KeyT') {
            this.game.systems.selection.rallyMode = true;
        }
        if (e.code === 'KeyS') {
            const sel = this.game.systems.selection;
            if (this.game.controller.sendAction) {
                this.game.controller.sendAction({
                    type: 'stop',
                    unitIds: Array.from(sel.selectedEntities)
                });
            } else {
                sel.selectedEntities.forEach(id => {
                    const ent = this.game.state.entities.find(e => e.id === id);
                    if (ent) ent.stop();
                });
            }
        }
    }

    onKeyUp(e) {
        if (e.code === 'Space') {
            this.spaceDown = false;
        }
    }

    update(dt) {
    }
}
