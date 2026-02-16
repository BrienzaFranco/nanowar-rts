export class UIManager {
    constructor(game) {
        this.game = game;
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        const h = this.game.canvas.height;
        const w = this.game.canvas.width;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, h - 100, 220, 90);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(10, h - 100, 220, 90);

        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';

        ctx.fillText(`UNIDADES: ${this.game.state.entities.filter(e => e.owner === 0).length}`, 20, h - 80);
        ctx.fillText(`SELECCIONADOS: ${this.game.systems.selection.selectedEntities.size}`, 20, h - 60);

        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.fillStyle = '#ff0';
            ctx.fillText('MODO RALLY: T para punto de spawn', 20, h - 40);
        }
    }
}
