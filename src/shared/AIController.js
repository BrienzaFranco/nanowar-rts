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

        // Force Black AI (Owner 8) to be always aggressive
        if (this.playerId === 8) {
            this.personality = 'aggressive';
        }

        const baseIntervals = {
            'Easy': 6.0,
            'Intermediate': 3.5,
            'Normal': 1.5,
            'Hard': 0.8,
            'Expert': 0.4,
            'Impossible': 0.15
        };
        this.decisionInterval = (baseIntervals[this.difficulty] || 1.5) + (Math.random() * 0.5);

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
            const nodeBaseHp = this.getNodeBaseHp(sourceIdx);
            const nodeMaxHp = this.getNodeMaxHp(sourceIdx);

            const defenderIdxs = this.getEntitiesInRadius(sourceX, sourceY, sourceInfluence, this.playerId);
            const defenderCount = defenderIdxs.length;

            let minDefendersToStay = 8;
            if (this.difficulty === 'Impossible') minDefendersToStay = 1;
            if (this.difficulty === 'Expert') minDefendersToStay = 3;
            if (this.difficulty === 'Hard') minDefendersToStay = 5;
            if (this.difficulty === 'Normal') minDefendersToStay = 10;
            if (this.difficulty === 'Intermediate') minDefendersToStay = 15;
            if (this.difficulty === 'Easy') minDefendersToStay = 25;

            if (this.personality === 'defensive') minDefendersToStay += 5;
            if (this.personality === 'aggressive') minDefendersToStay -= 2;

            const neutralCount = this.getNodesByOwner(-1).length;
            if (this.difficulty === 'Easy' && neutralCount > 0) {
                minDefendersToStay = 40;
            }

            // Defensive AI strictly waits until its node is FULL before doing anything else
            if (this.personality === 'defensive' && nodeBaseHp < nodeMaxHp) {
                continue;
            }

            // Easy/Intermediate are more likely to stay passive
            let activityThreshold = 0.5;
            if (this.difficulty === 'Easy') activityThreshold = 0.05;
            if (this.difficulty === 'Intermediate') activityThreshold = 0.2;
            if (this.difficulty === 'Normal') activityThreshold = 0.6;
            if (this.difficulty === 'Hard') activityThreshold = 0.8;
            if (this.difficulty === 'Expert' || this.difficulty === 'Impossible') activityThreshold = 1.0;

            if (defenderCount > minDefendersToStay || (defenderCount > 2 && Math.random() < activityThreshold * 0.15)) {
                let bestTargetIdx = -1;
                let bestScore = -Infinity;

                // Check if any of my nodes need help (Defensive Priority)
                let needsDefenseIdx = -1;
                if (this.personality === 'defensive') {
                    for (const myIdx of myNodeIdxs) {
                        if (myIdx === sourceIdx) continue;
                        const hp = this.getNodeBaseHp(myIdx);
                        const maxHp = this.getNodeMaxHp(myIdx);
                        if (hp < maxHp) {
                            needsDefenseIdx = myIdx;
                            break;
                        }
                    }
                }

                if (needsDefenseIdx !== -1) {
                    // Defensive AI immediately helps its own damaged node
                    bestTargetIdx = needsDefenseIdx;
                    bestScore = 99999;
                } else {
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
                            if (this.difficulty === 'Easy') expansionWeight = 10.0; // Focus ONLY on neutral if easy
                            if (this.difficulty === 'Intermediate') expansionWeight = 5.0;

                            if (myNodeIdxs.length > 5 && this.difficulty !== 'Easy') expansionWeight *= 0.5;
                            score *= expansionWeight;
                        } else if (targetOwner !== this.playerId) {
                            let attackWeight = 1.0;
                            if (this.personality === 'aggressive') attackWeight = 2.5;
                            if (this.difficulty === 'Impossible') attackWeight = 4.0;
                            if (this.difficulty === 'Expert') attackWeight = 3.0;
                            if (this.difficulty === 'Hard') attackWeight = 2.0;
                            if (this.difficulty === 'Intermediate') attackWeight = 0.5;
                            if (this.difficulty === 'Easy') attackWeight = 0.01; // Almost never attack players early

                            if (this.personality === 'defensive') {
                                // Defensive AI only attacks if it has a massive army (e.g. 100+)
                                if (defenderCount < 100) {
                                    attackWeight = 0; // Won't attack enemies at all
                                } else {
                                    attackWeight = 5.0; // Huge counter attack
                                }
                            }

                            if (this.difficulty !== 'Easy' && this.difficulty !== 'Intermediate' && targetBaseHp < targetMaxHp * 0.4) {
                                attackWeight *= 2.0;
                            }
                            score *= attackWeight;
                        } else {
                            if (this.personality === 'defensive' && targetBaseHp < targetMaxHp) {
                                score *= 5.0; // High priority to heal own nodes
                            } else if (this.difficulty === 'Impossible' && targetBaseHp < targetMaxHp * 0.9) {
                                score *= 1.5; // Impossible AI heals its nodes efficiently
                            } else {
                                score *= 0.1;
                            }
                        }

                        // For Defensive AI, heavily penalize distance so they only conquer nearby nodes
                        if (this.personality === 'defensive') {
                            score *= (1000 / Math.max(1000, dist));
                        }

                        // Add "Stupidity" for Intermediate - sometimes choose nodes that are too strong
                        if (this.difficulty === 'Intermediate') {
                            if (targetBaseHp > nodeBaseHp * 1.5) {
                                score *= (0.5 + Math.random() * 2.0); // Randomly overvalue strong nodes
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
        if (this.difficulty === 'Impossible') attackPercent = 1.0;
        if (this.difficulty === 'Expert') attackPercent = 0.9;
        if (this.difficulty === 'Hard') attackPercent = 0.7;
        if (this.difficulty === 'Normal') attackPercent = 0.5;
        if (this.difficulty === 'Intermediate') attackPercent = 0.2;
        if (this.difficulty === 'Easy') attackPercent = 0.1;

        if (this.personality === 'aggressive') attackPercent += 0.1;

        filteredUnits.sort((a, b) => {
            const distSqA = (this.getEntityX(a) - sourceX) ** 2 + (this.getEntityY(a) - sourceY) ** 2;
            const distSqB = (this.getEntityX(b) - sourceX) ** 2 + (this.getEntityY(b) - sourceY) ** 2;
            return distSqB - distSqA;
        });

        const count = Math.ceil(filteredUnits.length * Math.min(attackPercent, 1.0));

        for (let i = 0; i < count; i++) {
            const entityIdx = filteredUnits[i];
            const entityId = this.getEntityId(entityIdx);
            this.game.setEntityTarget(entityId, targetX, targetY, targetId);
        }
    }

}
