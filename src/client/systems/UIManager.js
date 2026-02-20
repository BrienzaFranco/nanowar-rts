export class UIManager {
    constructor(game) {
        this.game = game;

        // Stats tracking
        this._lastCounts = {};
        this._ratesCache = {};
        this._totalProduced = {};
        this._currentCounts = {};
        this._lastSampleTime = 0;
        this.game.state.spawnCounts = {};

        // Animated row sorting
        // _rowY[playerId] = current animated Y offset within panel (lerped)
        this._rowY = {};
        this._targetOrder = []; // sorted player indices by rate descending
    }

    _countEntitiesPerPlayer() {
        const counts = {};
        const view = this.game.sharedView;
        if (view) {
            const n = view.getEntityCount();
            for (let i = 0; i < n; i++) {
                if (view.isEntityDead(i) || view.isEntityDying(i)) continue;
                const owner = view.getEntityOwner(i);
                counts[owner] = (counts[owner] || 0) + 1;
            }
        } else {
            const entities = this.game.state?.entities;
            if (entities) {
                entities.forEach(e => {
                    if (!e.dead && !e.dying) counts[e.owner] = (counts[e.owner] || 0) + 1;
                });
            }
        }
        return counts;
    }

    _computeProdRates() {
        const SPAWN_INTERVALS = { 0: 4.5, 1: 3.5, 2: 2.4 };
        const rates = {};
        const view = this.game.sharedView;
        if (view) {
            const nodeCount = view.getNodeCount();
            for (let n = 0; n < nodeCount; n++) {
                const owner = view.getNodeOwner(n);
                if (owner < 0) continue;
                const type = view.memory.nodes.type[n];
                const baseInterval = SPAWN_INTERVALS[type] || 3.5;
                const baseHp = view.getNodeBaseHp(n);
                const maxHp = view.getNodeMaxHp(n);
                const hpPct = Math.min(baseHp / maxHp, 1.0);
                const healthScaling = 0.3 + hpPct * 1.2 + (type === 2 ? 0.5 : 0);
                const effectiveInterval = baseInterval / healthScaling;
                rates[owner] = (rates[owner] || 0) + (60 / effectiveInterval);
            }
        } else {
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
        if (dt < 1) return;

        const currentCounts = this._countEntitiesPerPlayer();
        const playerCount = this.game.state?.playerCount || 2;

        const spawnCounts = this.game.state?.spawnCounts || {};
        for (let i = 0; i < playerCount; i++) {
            const spawned = spawnCounts[i] || 0;
            this._totalProduced[i] = (this._totalProduced[i] || 0) + spawned;
            this._lastCounts[i] = currentCounts[i] || 0;
        }
        if (this.game.state?.spawnCounts) this.game.state.spawnCounts = {};

        const serverProduced = this.game.state?.stats?.unitsProduced;
        if (serverProduced) {
            for (const pid in serverProduced) {
                this._totalProduced[parseInt(pid)] = serverProduced[pid];
            }
        }

        this._currentCounts = currentCounts;
        this._ratesCache = this._computeProdRates();
        this._lastSampleTime = now;
    }

    draw(renderer) {
        if (this._lastSampleTime === 0) {
            this._currentCounts = this._countEntitiesPerPlayer();
            this._lastCounts = { ...this._currentCounts };
            this._ratesCache = this._computeProdRates();
            this._lastSampleTime = performance.now();
        }
        this._updateStatsCache();

        const ctx = renderer.ctx;
        const h = this.game.canvas.height;
        const w = this.game.canvas.width;
        const playerIndex = this.game.controller.playerIndex !== undefined ? this.game.controller.playerIndex : 0;
        const playerCount = this.game.state.playerCount || 2;

        const COLORS = ['#4CAF50', '#f44336', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'];
        const myColor = COLORS[playerIndex % COLORS.length];

        // --- PLAYER INFO (Bottom Left) ---
        ctx.save();
        ctx.fillStyle = myColor;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.shadowColor = myColor;
        ctx.shadowBlur = 8;
        ctx.fillText(`JUGADOR ${playerIndex + 1}`, 20, h - 40);
        ctx.shadowBlur = 0;

        const elapsed = this.game.state.elapsedTime || 0;
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '13px monospace';
        ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, 20, h - 22);
        ctx.restore();

        // --- SELECTION INFO (Top Right) ---
        const selectionCount = this.game.systems.selection.selectedEntities.size;
        if (selectionCount > 0) {
            ctx.save();
            const selBoxY = 70;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            this._roundRect(ctx, w - 210, selBoxY, 200, 36, 8);
            ctx.fill();
            ctx.strokeStyle = myColor + 'aa';
            ctx.lineWidth = 1.5;
            this._roundRect(ctx, w - 210, selBoxY, 200, 36, 8);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`SELEC: ${selectionCount}`, w - 18, selBoxY + 23);
            ctx.restore();
        }

        // --- STATS PANEL (Bottom Right) ---
        const ROW_H = 28;
        const panelPad = 14;
        const panelWidth = 270;
        const headerH = 40;
        const panelHeight = headerH + playerCount * ROW_H + panelPad;
        const panelX = w - panelWidth - 16;
        const panelY = h - panelHeight - 16;

        // Compute sorted order by rate descending
        const sorted = Array.from({ length: playerCount }, (_, i) => i)
            .sort((a, b) => (this._ratesCache[b] || 0) - (this._ratesCache[a] || 0));

        // Update animated Y positions (lerp toward target)
        sorted.forEach((pid, rank) => {
            const targetY = headerH + rank * ROW_H;
            if (this._rowY[pid] === undefined) this._rowY[pid] = targetY;
            this._rowY[pid] += (targetY - this._rowY[pid]) * 0.08; // smooth
        });

        // Panel background — glassmorphism style
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 20;
        const grad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
        grad.addColorStop(0, 'rgba(15,15,25,0.92)');
        grad.addColorStop(1, 'rgba(5,5,12,0.96)');
        ctx.fillStyle = grad;
        this._roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Panel border
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 10);
        ctx.stroke();

        // Header
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(panelX + 1, panelY + 1, panelWidth - 2, headerH - 6);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('PROD/MIN', panelX + 16, panelY + 16);
        ctx.textAlign = 'center';
        ctx.fillText('TOTAL', panelX + panelWidth - 75, panelY + 16);
        ctx.textAlign = 'right';
        ctx.fillText('EN CAMPO', panelX + panelWidth - 12, panelY + 16);

        // Divider
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 10, panelY + headerH - 8);
        ctx.lineTo(panelX + panelWidth - 10, panelY + headerH - 8);
        ctx.stroke();

        // Clip rows to panel
        ctx.beginPath();
        this._roundRect(ctx, panelX, panelY + headerH - 8, panelWidth, panelHeight - headerH + 8, 10);
        ctx.clip();

        // Draw each player row at its animated Y
        for (let i = 0; i < playerCount; i++) {
            const pColor = COLORS[i % COLORS.length];
            const isMe = i === playerIndex;
            const rate = this._ratesCache[i] || 0;
            const ratePerMin = Math.round(rate);
            const produced = this._totalProduced[i] || 0;
            const current = this._currentCounts?.[i] || 0;
            const label = isMe ? 'TÚ' : `P${i + 1}`;

            const rowY = panelY + (this._rowY[i] ?? (headerH + i * ROW_H));
            const rowMid = rowY + ROW_H / 2 + 5;

            // Row hover highlight for me
            if (isMe) {
                const hlGrad = ctx.createLinearGradient(panelX, rowY, panelX + panelWidth, rowY);
                hlGrad.addColorStop(0, pColor + '30');
                hlGrad.addColorStop(0.5, pColor + '18');
                hlGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = hlGrad;
                ctx.fillRect(panelX, rowY, panelWidth, ROW_H);

                // Left accent bar
                ctx.fillStyle = pColor;
                ctx.fillRect(panelX, rowY + 4, 3, ROW_H - 8);
            }

            // Color dot
            ctx.beginPath();
            ctx.arc(panelX + 14, rowMid - 3, 4, 0, Math.PI * 2);
            ctx.fillStyle = pColor;
            if (isMe) {
                ctx.shadowColor = pColor;
                ctx.shadowBlur = 8;
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label + rate
            ctx.textAlign = 'left';
            ctx.fillStyle = isMe ? '#fff' : pColor + 'cc';
            ctx.font = isMe ? 'bold 13px monospace' : '12px monospace';
            ctx.fillText(label, panelX + 26, rowMid);

            // PROD/MIN value with color intensity
            const maxRate = Math.max(...Object.values(this._ratesCache), 1);
            const rateFrac = rate / maxRate;
            const rateColor = isMe ? '#fff' : `hsl(${120 * rateFrac}, 70%, ${50 + rateFrac * 20}%)`;
            ctx.fillStyle = rateColor;
            ctx.font = isMe ? 'bold 13px monospace' : '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${ratePerMin}/m`, panelX + 100, rowMid);

            // Totals
            ctx.fillStyle = isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${produced}`, panelX + panelWidth - 75, rowMid);

            ctx.textAlign = 'right';
            ctx.fillText(`(${current})`, panelX + panelWidth - 10, rowMid);
        }

        ctx.restore();

        // --- RALLY MODE hint ---
        if (this.game.systems.selection.selectedNodes.size > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,220,0,0.85)';
            ctx.font = 'bold 13px monospace';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#ff0';
            ctx.shadowBlur = 6;
            ctx.fillText('MODO RALLY: T para punto de spawn', w / 2, h - 50);
            ctx.restore();
        }
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
