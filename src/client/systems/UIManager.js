export class UIManager {
    constructor(game) {
        this.game = game;
    }

    draw(renderer) {
        const ctx = renderer.ctx;
        const h = this.game.canvas.height;
        const w = this.game.canvas.width;

        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const playerColor = [
            '#4CAF50', '#f44336', '#2196F3', '#FF9800',
            '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
        ][playerIndex % 8];

        // Player indicator
        ctx.fillStyle = playerColor;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`ERES JUGADOR ${playerIndex + 1}`, 20, h - 110);

        // Game timer
        const elapsed = this.game.state.elapsedTime || 0;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        ctx.fillText(`TIEMPO: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, h - 130);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, h - 100, 220, 90);
        ctx.strokeStyle = playerColor;
        ctx.strokeRect(10, h - 100, 220, 90);

        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';

        ctx.fillText(`UNIDADES: ${this.game.state.entities.filter(e => e.owner === playerIndex).length}`, 20, h - 80);
        ctx.fillText(`SELECCIONADOS: ${this.game.systems.selection.selectedEntities.size}`, 20, h - 60);

        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.fillStyle = '#ff0';
            ctx.fillText('MODO RALLY: T para punto de spawn', 20, h - 40);
        }
    }
}
