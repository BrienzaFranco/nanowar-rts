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

    _computeProdRates() {
        // Compute theoretical prod/min from owned nodes' base spawn interval.
        // spawnInterval is: small=4.5, medium=3.5, large=2.4 (units/sec at 100% HP)
        // healthScaling ≈ 0.3 + healthPercent*1.2 → at 25% start HP = 0.3+0.25*1.2 ≈ 0.6
        // We use the base (unscaled) rate 60/spawnInterval for simplicity (max HP).
        const SPAWN_INTERVALS = { 0: 4.5, 1: 3.5, 2: 2.4 }; // keyed by NODE_TYPE index
        const rates = {};

        const view = this.game.sharedView;
        if (view) {
            const nodeCount = view.getNodeCount();
            for (let n = 0; n < nodeCount; n++) {
                const owner = view.getNodeOwner(n);
                if (owner < 0) continue;
                const type = view.memory.nodes.type[n]; // 0=small, 1=medium, 2=large
                const baseInterval = SPAWN_INTERVALS[type] || 3.5;
                const baseHp = view.getNodeBaseHp(n);
                const maxHp = view.getNodeMaxHp(n);
                const hpPct = Math.min(baseHp / maxHp, 1.0);
                const healthScaling = 0.3 + hpPct * 1.2 + (type === 2 ? 0.5 : 0);
                const effectiveInterval = baseInterval / healthScaling;
                rates[owner] = (rates[owner] || 0) + (60 / effectiveInterval);
            }
        } else {
            // Fallback: use game.state.productionRates (multiplayer)  
            const serverRates = this.game.state?.productionRates;
            if (serverRates) {
                for (const pid in serverRates) {
                    rates[parseInt(pid)] = serverRates[pid] * 60;
                }
            }
        }
        return rates;
    }

    _updateStatsCache() {
        const now = performance.now();
        const dt = (now - this._lastSampleTime) / 1000;
        if (dt < 1) return; // Update every second

        const currentCounts = this._countEntitiesPerPlayer();
        const playerCount = this.game.state?.playerCount || 2;

        // Count new spawns from accumulated spawn events (for TOT column)
        const spawnCounts = this.game.state?.spawnCounts || {};
        for (let i = 0; i < playerCount; i++) {
            const spawned = spawnCounts[i] || 0;
            this._totalProduced[i] = (this._totalProduced[i] || 0) + spawned;
            this._lastCounts[i] = currentCounts[i] || 0;
        }
        // Reset spawn counts after consuming
        if (this.game.state?.spawnCounts) {
            this.game.state.spawnCounts = {};
        }

        // Sync server-provided totals (multiplayer)
        const serverProduced = this.game.state?.stats?.unitsProduced;
        if (serverProduced) {
            for (const pid in serverProduced) {
                this._totalProduced[parseInt(pid)] = serverProduced[pid];
            }
        }

        this._currentCounts = currentCounts;
        this._ratesCache = this._computeProdRates(); // Always live from nodes
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
            const ratePerMin = Math.round(rate); // already in units/min
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
