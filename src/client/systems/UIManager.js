import { PLAYER_COLORS } from '../../shared/GameConfig.js';

export class UIManager {
    constructor(game) {
        this.game = game;
        this._lastCounts = {};
        this._ratesCache = {};
        this._totalProduced = {};
        this._currentCounts = {};
        this._lastSampleTime = 0;
        this.game.state.spawnCounts = {};
        // Animated row positions (lerp by playerId)
        this._rowY = {};
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
                rates[owner] = (rates[owner] || 0) + (60 / (baseInterval / healthScaling));
            }
        } else {
            const serverRates = this.game.state?.productionRates;
            if (serverRates) {
                for (const pid in serverRates) rates[parseInt(pid)] = serverRates[pid] * 60;
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
            this._totalProduced[i] = (this._totalProduced[i] || 0) + (spawnCounts[i] || 0);
        }
        if (this.game.state?.spawnCounts) this.game.state.spawnCounts = {};

        const serverProduced = this.game.state?.stats?.unitsProduced;
        if (serverProduced) {
            for (const pid in serverProduced) this._totalProduced[parseInt(pid)] = serverProduced[pid];
        }

        this._currentCounts = currentCounts;
        this._ratesCache = this._computeProdRates();
        this._lastSampleTime = now;
    }

    draw(renderer) {
        if (this._lastSampleTime === 0) {
            this._currentCounts = this._countEntitiesPerPlayer();
            this._ratesCache = this._computeProdRates();
            this._lastSampleTime = performance.now();
        }
        this._updateStatsCache();

        const ctx = renderer.ctx;
        const cw = this.game.canvas.width;
        const ch = this.game.canvas.height;
        const playerIndex = this.game.controller?.playerIndex ?? 0;
        const playerCount = this.game.state.playerCount || 2;
        const COLORS = PLAYER_COLORS;

        // ── SELECTED COUNT (top right) ────────────────────────────────
        const selCount = this.game.systems.selection?.selectedEntities?.size || 0;
        if (selCount > 0) {
            ctx.save();
            ctx.font = 'bold 15px "Courier New", monospace';
            ctx.textAlign = 'right';
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillText(`SEL: ${selCount}`, cw - 20, 28);
            ctx.restore();
        }

        // ── STATS PANEL (bottom right) ────────────────────────────────
        const COL_NAME = 0;   // relative to panelX + padding
        const COL_RATE = 120;
        const COL_TOT = 200;
        const COL_CUR = 270;
        const PAD = 18;
        const ROW_H = 30;
        const HEADER_H = 40;
        const panelW = 320;
        const panelH = HEADER_H + playerCount * ROW_H + 16;
        const panelX = cw - panelW - 16;
        const panelY = ch - panelH - 16;

        // Sort players by rate descending
        const sorted = Array.from({ length: playerCount }, (_, i) => i)
            .sort((a, b) => (this._ratesCache[b] || 0) - (this._ratesCache[a] || 0));

        // Lerp animated row Y positions
        sorted.forEach((pid, rank) => {
            const target = HEADER_H + rank * ROW_H;
            if (this._rowY[pid] === undefined) this._rowY[pid] = target;
            this._rowY[pid] += (target - this._rowY[pid]) * 0.1;
        });

        // Panel background
        ctx.save();
        ctx.fillStyle = 'rgba(8, 8, 10, 0.96)';
        ctx.fillRect(panelX, panelY, panelW, panelH);

        // Panel border (1px, all sides)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 0.5, panelY + 0.5, panelW - 1, panelH - 1);

        // Header row
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fillRect(panelX, panelY, panelW, HEADER_H);

        // Header divider
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.beginPath();
        ctx.moveTo(panelX, panelY + HEADER_H);
        ctx.lineTo(panelX + panelW, panelY + HEADER_H);
        ctx.stroke();

        // Header labels
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '13px "Courier New", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('JUGADOR', panelX + PAD, panelY + 25);
        ctx.textAlign = 'right';
        ctx.fillText('PROD/M', panelX + PAD + COL_RATE + 32, panelY + 25);
        ctx.fillText('TOT', panelX + PAD + COL_TOT + 32, panelY + 25);
        ctx.fillText('CAMPO', panelX + panelW - PAD, panelY + 25);

        // Clip to panel for animated rows
        ctx.beginPath();
        ctx.rect(panelX, panelY + HEADER_H, panelW, panelH - HEADER_H);
        ctx.clip();

        // Draw each player row
        for (let i = 0; i < playerCount; i++) {
            const color = COLORS[i % COLORS.length];
            const isMe = i === playerIndex;
            const rate = this._ratesCache[i] || 0;
            const produced = this._totalProduced[i] || 0;
            const current = this._currentCounts?.[i] || 0;
            const label = isMe ? 'TÚ' : `P${i + 1}`;

            const ry = panelY + (this._rowY[i] ?? (HEADER_H + i * ROW_H));
            const mid = ry + ROW_H / 2 + 4;

            // Row highlight for current player
            if (isMe) {
                ctx.fillStyle = color + '14';
                ctx.fillRect(panelX, ry, panelW, ROW_H);
                // Left accent line
                ctx.fillStyle = color;
                ctx.fillRect(panelX, ry + 3, 2, ROW_H - 6);
            }

            // Row divider (subtle)
            ctx.strokeStyle = 'rgba(255,255,255,0.04)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(panelX, ry + ROW_H - 0.5);
            ctx.lineTo(panelX + panelW, ry + ROW_H - 0.5);
            ctx.stroke();

            // Color dot (square)
            ctx.fillStyle = color;
            ctx.fillRect(panelX + PAD, mid - 7, 8, 8);

            // Label
            ctx.textAlign = 'left';
            ctx.fillStyle = isMe ? '#fff' : color + 'bb';
            ctx.font = isMe ? 'bold 15px "Courier New", monospace' : '14px "Courier New", monospace';
            ctx.fillText(label, panelX + PAD + 16, mid);

            // Rate
            ctx.textAlign = 'right';
            ctx.fillStyle = isMe ? '#fff' : 'rgba(255,255,255,0.7)';
            ctx.font = '14px "Courier New", monospace';
            ctx.fillText(`${Math.round(rate)}/m`, panelX + PAD + COL_RATE + 32, mid);

            // Total produced
            ctx.fillStyle = isMe ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
            ctx.fillText(`${produced}`, panelX + PAD + COL_TOT + 32, mid);

            // Current on field
            ctx.fillText(`${current}`, panelX + panelW - PAD, mid);
        }

        ctx.restore();

        // ── RALLY MODE hint ───────────────────────────────────────────
        if (this.game.systems.selection?.selectedNodes?.size > 0) {
            ctx.save();
            ctx.fillStyle = 'rgba(255,220,50,0.9)';
            ctx.font = '15px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('MODO RALLY — T: PUNTO DE SPAWN', cw / 2, ch - 24);
            ctx.restore();
        }
    }
}
