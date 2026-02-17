export class UIManager {
    constructor(game) {
        this.game = game;
        this.lastProductionUpdate = 0;
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

        // Show production rate if enabled
        const showProduction = this.game.state.showProduction;
        let boxHeight = 90;
        let boxY = h - 100;

        if (showProduction && this.game.state.playerCount > 1) {
            const colors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

            // Draw production panel at top
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(w - 180, 10, 170, 20 + this.game.state.playerCount * 18);

            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#888';
            ctx.fillText('PRODUCCIÓN ACTUAL', w - 170, 24);

            ctx.font = '11px monospace';
            for (let i = 0; i < this.game.state.playerCount; i++) {
                // Use live production rate from GameState
                const rawRate = this.game.state.productionRates?.[i] || 0;
                const ratePerMin = Math.round(rawRate * 60);

                const stats = this.game.state.stats;
                const produced = stats?.unitsProduced?.[i]?.total || (typeof stats?.unitsProduced?.[i] === 'number' ? stats.unitsProduced[i] : 0);

                const isMe = i === playerIndex;
                ctx.fillStyle = colors[i % colors.length];
                const label = isMe ? 'TÚ' : `J${i + 1}`;
                ctx.fillText(`${label}: ${ratePerMin}/m (${produced})`, w - 170, 42 + i * 18);
            }

            boxHeight = 90;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, boxY, 220, boxHeight);
        ctx.strokeStyle = playerColor;
        ctx.strokeRect(10, boxY, 220, boxHeight);

        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';

        ctx.fillText(`UNIDADES: ${this.game.state.entities.filter(e => e.owner === playerIndex).length}`, 20, boxY + 20);

        // Live production counter - simple count
        const stats = this.game.state.stats;
        const myProduced = stats?.unitsProduced?.[playerIndex]?.total || (typeof stats?.unitsProduced?.[playerIndex] === 'number' ? stats.unitsProduced[playerIndex] : 0);

        ctx.fillStyle = '#FFD700';
        ctx.fillText(`PRODUCIDAS: ${myProduced}`, 20, boxY + 38);
        ctx.fillStyle = '#fff';

        ctx.fillText(`SELECCIONADOS: ${this.game.systems.selection.selectedEntities.size}`, 20, boxY + 56);

        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.fillStyle = '#ff0';
            ctx.fillText('MODO RALLY: T para punto de spawn', 20, boxY + 60);
        }
    }
}
