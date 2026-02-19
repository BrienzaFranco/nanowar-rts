export class UIManager {
    constructor(game) {
        this.game = game;

        // Local stats tracking (updated every 2s so it works in both worker and non-worker mode)
        this._lastCounts = {};      // entity counts at last sample
        this._ratesCache = {};      // computed rate per player (units/sec)
        this._totalProduced = {};   // cumulative produced per player
        this._currentCounts = {};   // counts at latest sample
        this._lastSampleTime = 0;
    }

    _countEntitiesPerPlayer() {
        const counts = {};
        const view = this.game.sharedView;
        if (view) {
            // Worker mode: read from SharedView
            const n = view.getEntityCount();
            for (let i = 0; i < n; i++) {
                if (view.isEntityDead(i) || view.isEntityDying(i)) continue;
                const owner = view.getEntityOwner(i);
                counts[owner] = (counts[owner] || 0) + 1;
            }
        } else {
            // Non-worker mode (legacy or multiplayer)
            const entities = this.game.state?.entities;
            if (entities) {
                entities.forEach(e => {
                    if (!e.dead && !e.dying) {
                        counts[e.owner] = (counts[e.owner] || 0) + 1;
                    }
                });
            }
        }
        return counts;
    }

    _updateStatsCache() {
        const now = performance.now();
        const dt = (now - this._lastSampleTime) / 1000;
        if (dt < 2) return; // Sample at most every 2 seconds

        const currentCounts = this._countEntitiesPerPlayer();
        const playerCount = this.game.state?.playerCount || 2;

        for (let i = 0; i < playerCount; i++) {
            const cur = currentCounts[i] || 0;
            const prev = this._lastCounts[i] !== undefined ? this._lastCounts[i] : cur;
            const delta = Math.max(0, cur - prev); // new units since last sample

            this._totalProduced[i] = (this._totalProduced[i] || 0) + delta;
            this._ratesCache[i] = dt > 0 ? delta / dt : 0; // units/sec
            this._lastCounts[i] = cur;
        }

        // Override with server-provided values when in multiplayer mode
        const serverRates = this.game.state?.productionRates;
        if (serverRates) {
            for (const pid in serverRates) {
                this._ratesCache[parseInt(pid)] = serverRates[pid];
            }
        }
        const serverProduced = this.game.state?.stats?.unitsProduced;
        if (serverProduced) {
            for (const pid in serverProduced) {
                this._totalProduced[parseInt(pid)] = serverProduced[pid];
            }
        }

        this._currentCounts = currentCounts;
        this._lastSampleTime = now;
    }

    draw(renderer) {
        // Initialize on first frame
        if (this._lastSampleTime === 0) {
            this._currentCounts = this._countEntitiesPerPlayer();
            this._lastCounts = { ...this._currentCounts };
            this._lastSampleTime = performance.now();
        }
        this._updateStatsCache();

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

        // --- SELECTION INFO (Top Right) ---
        const selectionCount = this.game.systems.selection.selectedEntities.size;
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
        const playerCount = this.game.state.playerCount;
        const panelHeight = 45 + (playerCount * 24);
        const panelWidth = 280;
        const panelX = w - panelWidth - 20;
        const panelY = h - panelHeight - 20;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

        ctx.fillStyle = '#bbb';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('ESTADÍSTICAS (PROD/MIN | TOT)', panelX + 15, panelY + 25);

        ctx.beginPath();
        ctx.moveTo(panelX + 10, panelY + 35);
        ctx.lineTo(panelX + panelWidth - 10, panelY + 35);
        ctx.strokeStyle = '#777';
        ctx.stroke();

        const colors = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];

        ctx.font = 'bold 14px monospace';
        for (let i = 0; i < playerCount; i++) {
            const isMe = i === playerIndex;
            const pColor = colors[i % colors.length];

            const rate = this._ratesCache[i] || 0;
            const ratePerMin = Math.round(rate * 60);
            const produced = this._totalProduced[i] || 0;
            const current = this._currentCounts?.[i] || 0;

            ctx.fillStyle = pColor;
            const label = isMe ? 'TÚ' : `P${i + 1}`;
            ctx.fillText(`${label}: ${ratePerMin}/m | ${produced} (${current})`, panelX + 15, panelY + 58 + (i * 24));
        }

        // --- RALLY MODE hint ---
        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MODO RALLY: T para punto de spawn', w / 2, h - 50);
        }
    }
}
