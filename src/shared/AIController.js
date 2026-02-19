export class AIController {
    constructor(game, playerId, difficulty = 'Normal') {
        this.game = game;
        this.playerId = playerId;
        this.timer = 0;
        this.difficulty = difficulty;

        const personalities = ['aggressive', 'defensive', 'expansive'];
        if (this.difficulty === 'Easy') {
            this.personality = 'defensive';
        } else {
            this.personality = personalities[Math.floor(Math.random() * personalities.length)];
        }

        const baseIntervals = {
            'Easy': 5.0,
            'Normal': 1.2,
            'Hard': 0.8,
            'Nightmare': 0.4
        };
        this.decisionInterval = baseIntervals[this.difficulty] + (Math.random() * 0.5);

        console.log(`[AI INFO] Player ${playerId} initialized: Difficulty=${this.difficulty}, Personality=${this.personality}`);
    }

    get view() {
        return this.game.sharedView || null;
    }

    getNodeCount() {
        const view = this.view;
        return view ? view.getNodeCount() : this.game.state.nodes.length;
    }

    getEntityCount() {
        const view = this.view;
        return view ? view.getEntityCount() : this.game.state.entities.length;
    }

    getNodeOwner(idx) {
        const view = this.view;
        return view ? view.getNodeOwner(idx) : this.game.state.nodes[idx].owner;
    }

    getNodeX(idx) {
        const view = this.view;
        return view ? view.getNodeX(idx) : this.game.state.nodes[idx].x;
    }

    getNodeY(idx) {
        const view = this.view;
        return view ? view.getNodeY(idx) : this.game.state.nodes[idx].y;
    }

    getNodeId(idx) {
        const view = this.view;
        return view ? view.getNodeId(idx) : this.game.state.nodes[idx].id;
    }

    getNodeInfluenceRadius(idx) {
        const view = this.view;
        return view ? view.getNodeInfluenceRadius(idx) : this.game.state.nodes[idx].influenceRadius;
    }

    getNodeBaseHp(idx) {
        const view = this.view;
        return view ? view.getNodeBaseHp(idx) : this.game.state.nodes[idx].baseHp;
    }

    getNodeMaxHp(idx) {
        const view = this.view;
        return view ? view.getNodeMaxHp(idx) : this.game.state.nodes[idx].maxHp;
    }

    getEntityOwner(idx) {
        const view = this.view;
        return view ? view.getEntityOwner(idx) : this.game.state.entities[idx].owner;
    }

    getEntityX(idx) {
        const view = this.view;
        return view ? view.getEntityX(idx) : this.game.state.entities[idx].x;
    }

    getEntityY(idx) {
        const view = this.view;
        return view ? view.getEntityY(idx) : this.game.state.entities[idx].y;
    }

    getEntityId(idx) {
        const view = this.view;
        return view ? view.getEntityId(idx) : this.game.state.entities[idx].id;
    }

    isEntityDead(idx) {
        const view = this.view;
        return view ? view.isEntityDead(idx) : this.game.state.entities[idx].dead;
    }

    isEntityDying(idx) {
        const view = this.view;
        return view ? view.isEntityDying(idx) : this.game.state.entities[idx].dying;
    }

    getEntityTargetNodeId(idx) {
        const view = this.view;
        return view ? view.getEntityTargetNodeId(idx) : (this.game.state.entities[idx].targetNode ? this.game.state.entities[idx].targetNode.id : -1);
    }

    getNodesByOwner(owner) {
        const view = this.view;
        if (view) {
            return view.getNodesByOwner(owner);
        }
        const result = [];
        this.game.state.nodes.forEach((n, i) => {
            if (n.owner === owner) result.push(i);
        });
        return result;
    }

    getEntitiesInRadius(x, y, radius, owner) {
        const view = this.view;
        if (view) {
            return view.getEntitiesInRadius(x, y, radius, owner);
        }
        const result = [];
        const radiusSq = radius * radius;
        this.game.state.entities.forEach((e, i) => {
            if (e.owner === owner && !e.dead && !e.dying) {
                const dx = x - e.x;
                const dy = y - e.y;
                if (dx * dx + dy * dy <= radiusSq) {
                    result.push(i);
                }
            }
        });
        return result;
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.decisionInterval) {
            this.timer = 0;
            this.makeDecision();
        }
    }

    makeDecision() {
        const myNodeIdxs = this.getNodesByOwner(this.playerId);
        
        if (myNodeIdxs.length === 0) return;

        for (const sourceIdx of myNodeIdxs) {
            const sourceX = this.getNodeX(sourceIdx);
            const sourceY = this.getNodeY(sourceIdx);
            const sourceInfluence = this.getNodeInfluenceRadius(sourceIdx);

            const defenderIdxs = this.getEntitiesInRadius(sourceX, sourceY, sourceInfluence, this.playerId);
            const defenderCount = defenderIdxs.length;

            let minDefendersToStay = 5;
            if (this.difficulty === 'Nightmare') minDefendersToStay = 2;
            if (this.difficulty === 'Hard') minDefendersToStay = 4;
            if (this.difficulty === 'Easy') minDefendersToStay = 18;

            if (this.personality === 'defensive') minDefendersToStay += 5;
            if (this.personality === 'aggressive') minDefendersToStay -= 2;

            const neutralCount = this.getNodesByOwner(-1).length;
            if (this.difficulty === 'Easy' && neutralCount > 0) {
                minDefendersToStay = 30;
            }

            const nodeBaseHp = this.getNodeBaseHp(sourceIdx);
            const nodeMaxHp = this.getNodeMaxHp(sourceIdx);
            if (this.personality === 'defensive' && nodeBaseHp < nodeMaxHp * 0.9) {
                continue;
            }

            if (defenderCount > minDefendersToStay || (defenderCount > 2 && Math.random() < 0.15)) {
                let bestTargetIdx = -1;
                let bestScore = -Infinity;

                const nodeCount = this.getNodeCount();
                for (let targetIdx = 0; targetIdx < nodeCount; targetIdx++) {
                    if (targetIdx === sourceIdx) continue;

                    const targetX = this.getNodeX(targetIdx);
                    const targetY = this.getNodeY(targetIdx);
                    const dx = targetX - sourceX;
                    const dy = targetY - sourceY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let score = 1000 / dist;
                    const targetOwner = this.getNodeOwner(targetIdx);
                    const targetBaseHp = this.getNodeBaseHp(targetIdx);
                    const targetMaxHp = this.getNodeMaxHp(targetIdx);

                    if (targetOwner === -1) {
                        let expansionWeight = 1.5;
                        if (this.personality === 'expansive') expansionWeight = 3.0;
                        if (this.difficulty === 'Easy') expansionWeight = 5.0;
                        if (myNodeIdxs.length > 5) expansionWeight *= 0.5;
                        score *= expansionWeight;
                    } else if (targetOwner !== this.playerId) {
                        let attackWeight = 1.0;
                        if (this.personality === 'aggressive') attackWeight = 2.5;
                        if (this.difficulty === 'Nightmare') attackWeight = 3.0;
                        if (this.difficulty === 'Hard') attackWeight = 2.0;
                        if (this.difficulty === 'Easy') attackWeight = 0.1;
                        if ((this.difficulty === 'Hard' || this.difficulty === 'Nightmare') && targetBaseHp < targetMaxHp * 0.4) {
                            attackWeight *= 2.0;
                        }
                        score *= attackWeight;
                    } else {
                        if (this.personality === 'defensive' && targetBaseHp < targetMaxHp * 0.5) {
                            score *= 2.0;
                        } else {
                            score *= 0.1;
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestTargetIdx = targetIdx;
                    }
                }

                if (bestTargetIdx >= 0) {
                    this.sendUnits(sourceIdx, bestTargetIdx);
                }
            }
        }
    }

    sendUnits(sourceIdx, targetIdx) {
        const sourceX = this.getNodeX(sourceIdx);
        const sourceY = this.getNodeY(sourceIdx);
        const sourceInfluence = this.getNodeInfluenceRadius(sourceIdx);
        const targetX = this.getNodeX(targetIdx);
        const targetY = this.getNodeY(targetIdx);
        const targetId = this.getNodeId(targetIdx);

        const unitIdxs = this.getEntitiesInRadius(sourceX, sourceY, sourceInfluence, this.playerId);
        
        const filteredUnits = [];
        for (const idx of unitIdxs) {
            if (this.isEntityDead(idx) || this.isEntityDying(idx)) continue;
            if (this.getEntityTargetNodeId(idx) === -1) {
                filteredUnits.push(idx);
            }
        }

        if (filteredUnits.length === 0) return;

        let attackPercent = 0.5;
        if (this.personality === 'aggressive') attackPercent = 0.8;
        if (this.difficulty === 'Nightmare') attackPercent = 0.9;
        if (this.difficulty === 'Hard') attackPercent = 0.65;
        if (this.difficulty === 'Easy') attackPercent = 0.05;

        filteredUnits.sort((a, b) => {
            const distSqA = (this.getEntityX(a) - sourceX) ** 2 + (this.getEntityY(a) - sourceY) ** 2;
            const distSqB = (this.getEntityX(b) - sourceX) ** 2 + (this.getEntityY(b) - sourceY) ** 2;
            return distSqB - distSqA;
        });

        const count = Math.ceil(filteredUnits.length * Math.min(attackPercent, 0.95));
        
        for (let i = 0; i < count; i++) {
            const entityIdx = filteredUnits[i];
            const entityId = this.getEntityId(entityIdx);
            this.game.setEntityTarget(entityId, targetX, targetY, targetId);
        }
    }
}
