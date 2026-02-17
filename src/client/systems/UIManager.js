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

        // --- PLAYER INFO (Bottom Left) ---
        const playerColor = [
            '#4CAF50', '#f44336', '#2196F3', '#FF9800',
            '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
        ][playerIndex % 8];

        ctx.fillStyle = playerColor;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`ERES JUGADOR ${playerIndex + 1}`, 20, h - 40);

        // Game timer
        const elapsed = this.game.state.elapsedTime || 0;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(`TIEMPO: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, h - 20);

        // --- SELECTION INFO (Top Right - Below DOM Header) ---
        const selectionCount = this.game.systems.selection.selectedEntities.size;

        // Background for selection (shifted down to avoid top bar buttons)
        const selBoxY = 70;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(w - 220, selBoxY, 210, 40);
        ctx.strokeStyle = playerColor;
        ctx.strokeRect(w - 220, selBoxY, 210, 40);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`SELECCIONADOS: ${selectionCount}`, w - 20, selBoxY + 25);


        // --- STATS PANEL (Bottom Right) ---
        // Combine Production Rates and Unit Counts
        const showProduction = this.game.state.showProduction;
        const playerCount = this.game.state.playerCount;

        // Calculate height based on players
        // Header (30) + Player Rows (24 * count) - Increased spacing
        const panelHeight = 45 + (playerCount * 24);
        const panelWidth = 280; // Wider for larger text
        const panelX = w - panelWidth - 20;
        const panelY = h - panelHeight - 20; // More padding from bottom

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; // Darker
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        // Header
        ctx.fillStyle = '#bbb';
        ctx.font = 'bold 13px monospace'; // Larger header
        ctx.textAlign = 'left';
        ctx.fillText('ESTADÍSTICAS (PROD/MIN | TOT)', panelX + 15, panelY + 25);

        // Separator
        ctx.beginPath();
        ctx.moveTo(panelX + 10, panelY + 35);
        ctx.lineTo(panelX + panelWidth - 10, panelY + 35);
        ctx.strokeStyle = '#777';
        ctx.stroke();

        const colors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

        ctx.font = 'bold 14px monospace'; // Larger body font
        for (let i = 0; i < playerCount; i++) {
            const isMe = i === playerIndex;
            const pColor = colors[i % colors.length];

            // Production Rate
            const rawRate = this.game.state.productionRates?.[i] || 0;
            const ratePerMin = Math.round(rawRate * 60);

            // Total Produced
            const stats = this.game.state.stats;
            const produced = stats?.unitsProduced?.[i]?.total || (typeof stats?.unitsProduced?.[i] === 'number' ? stats.unitsProduced[i] : 0);

            // Current Units (Active)
            const current = stats?.unitsCurrent?.[i] || 0;

            ctx.fillStyle = pColor;
            const label = isMe ? 'TÚ' : `P${i + 1}`;

            // Format: "P1: 120/m | 500 (200)"
            // Rate | Total (Active)
            const text = `${label}: ${ratePerMin}/m | ${produced} (${current})`;

            ctx.fillText(text, panelX + 15, panelY + 58 + (i * 24));
        }

        // --- RALLY MODE ---
        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MODO RALLY: T para punto de spawn', w / 2, h - 50);
        }
    }
}
