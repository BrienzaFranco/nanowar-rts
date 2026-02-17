export class AIController {
    constructor(game, playerId, difficulty = 'Normal') {
        this.game = game;
        this.playerId = playerId;
        this.timer = 0;
        this.difficulty = difficulty;

        // Personalities: Aggressive, Defensive, Expansive
        const personalities = ['aggressive', 'defensive', 'expansive'];
        if (this.difficulty === 'Easy') {
            // Easy mode always gets defensive personality - less aggressive
            this.personality = 'defensive';
        } else {
            this.personality = personalities[Math.floor(Math.random() * personalities.length)];
        }

        // Set interval based on difficulty - Easy is VERY slow
        const baseIntervals = {
            'Easy': 5.0,
            'Normal': 1.2,
            'Hard': 0.8,
            'Nightmare': 0.4
        };
        this.decisionInterval = baseIntervals[this.difficulty] + (Math.random() * 0.5);

        console.log(`[AI INFO] Player ${playerId} initialized: Difficulty=${this.difficulty}, Personality=${this.personality}`);
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.decisionInterval) {
            this.timer = 0;
            this.makeDecision();
        }
    }

    makeDecision() {
        const myNodes = this.game.state.nodes.filter(n => n.owner === this.playerId);
        const allNodes = this.game.state.nodes;
        const enemyNodes = allNodes.filter(n => n.owner !== this.playerId && n.owner !== -1);
        const neutralNodes = allNodes.filter(n => n.owner === -1);

        if (myNodes.length === 0) return;

        myNodes.forEach(sourceNode => {
            const defenderCount = sourceNode.areaDefenders ? sourceNode.areaDefenders.length : 0;

            // Attack sensitivity based on difficulty and personality
            let minDefendersToStay = 5;
            if (this.difficulty === 'Nightmare') minDefendersToStay = 2;
            if (this.difficulty === 'Hard') minDefendersToStay = 4;
            if (this.difficulty === 'Easy') minDefendersToStay = 18; // Keeps almost all units defending!

            if (this.personality === 'defensive') minDefendersToStay += 5;
            if (this.personality === 'aggressive') minDefendersToStay -= 2;

            // For Easy: prioritize neutrals over attacking
            if (this.difficulty === 'Easy' && neutralNodes.length > 0) {
                // Easy AI focuses on expansion, rarely attacks
                minDefendersToStay = 30; // Super defensive!
            }

            // Heal check for Defensive
            if (this.personality === 'defensive' && sourceNode.hp < sourceNode.maxHp * 0.9) {
                return; // Prioritize healing
            }

            if (defenderCount > minDefendersToStay || (defenderCount > 2 && Math.random() < 0.15)) {
                let bestTarget = null;
                let bestScore = -Infinity;

                allNodes.filter(n => n !== sourceNode).forEach(target => {
                    const dx = target.x - sourceNode.x;
                    const dy = target.y - sourceNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Score calculation: higher is better
                    let score = 1000 / dist; // Base proximity score

                    // Ownership modifiers
                    if (target.owner === -1) {
                        // Neutral node
                        let expansionWeight = 1.5;
                        if (this.personality === 'expansive') expansionWeight = 3.0;
                        if (this.difficulty === 'Easy') expansionWeight = 5.0; // Prioritize neutrals!
                        // Reduce priority if we already have many nodes
                        if (myNodes.length > 5) expansionWeight *= 0.5;
                        score *= expansionWeight;
                    } else if (target.owner !== this.playerId) {
                        // Enemy node
                        let attackWeight = 1.0;
                        if (this.personality === 'aggressive') attackWeight = 2.5;
                        if (this.difficulty === 'Nightmare') attackWeight = 3.0;
                        if (this.difficulty === 'Hard') attackWeight = 2.0;
                        if (this.difficulty === 'Easy') attackWeight = 0.1; // Almost never attacks enemies!
                        if (this.difficulty === 'Hard' || this.difficulty === 'Nightmare') {
                            // Target weak enemy nodes
                            if (target.hp < target.maxHp * 0.4) attackWeight *= 2.0;
                        }
                        score *= attackWeight;
                    } else {
                        // Reinforce own node
                        if (this.personality === 'defensive' && target.hp < target.maxHp * 0.5) {
                            score *= 2.0;
                        } else {
                            score *= 0.1; // Low priority to reinforce healthy nodes
                        }
                    }

                    if (score > bestScore) {
                        bestScore = score;
                        bestTarget = target;
                    }
                });

                if (bestTarget) {
                    this.sendUnits(sourceNode, bestTarget);
                }
            }
        });
    }

    sendUnits(sourceNode, targetNode) {
        const units = this.game.state.entities.filter(e =>
            e.owner === this.playerId &&
            !e.dead &&
            !e.targetNode &&
            Math.sqrt((e.x - sourceNode.x) ** 2 + (e.y - sourceNode.y) ** 2) <= sourceNode.influenceRadius
        );

        if (units.length === 0) return;

        // Attack percentage based on personality/difficulty
        let attackPercent = 0.5;
        if (this.personality === 'aggressive') attackPercent = 0.8;
        if (this.difficulty === 'Nightmare') attackPercent = 0.9;
        if (this.difficulty === 'Hard') attackPercent = 0.65;
        if (this.difficulty === 'Easy') attackPercent = 0.05; // Only 5% of units attack!

        // Sort units by distance to source node (descending)
        // This ensures we send the FURTHEST units first, keeping the CLOSEST ones as defenders
        units.sort((a, b) => {
            const distSqA = (a.x - sourceNode.x) ** 2 + (a.y - sourceNode.y) ** 2;
            const distSqB = (b.x - sourceNode.x) ** 2 + (b.y - sourceNode.y) ** 2;
            return distSqB - distSqA; // Descending order
        });

        const count = Math.ceil(units.length * Math.min(attackPercent, 0.95));
        const attackers = units.slice(0, count);

        attackers.forEach(e => {
            e.setTarget(targetNode.x, targetNode.y, targetNode);
        });
    }
}
