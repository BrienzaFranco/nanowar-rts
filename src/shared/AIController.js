export class AIController {
    constructor(game, playerId, difficulty = 'Normal') {
        this.game = game;
        this.playerId = playerId;
        this.timer = 0;
        this.difficulty = difficulty;

        // Personalities: Aggressive, Defensive, Expansive
        const personalities = ['aggressive', 'defensive', 'expansive'];
        this.personality = personalities[Math.floor(Math.random() * personalities.length)];

        // Set interval based on difficulty
        const baseIntervals = {
            'Easy': 2.0,
            'Normal': 1.2,
            'Hard': 0.8,
            'Nightmare': 0.4
        };
        this.decisionInterval = baseIntervals[this.difficulty] + (Math.random() * 0.4);

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
            if (this.difficulty === 'Easy') minDefendersToStay = 10;

            if (this.personality === 'defensive') minDefendersToStay += 5;
            if (this.personality === 'aggressive') minDefendersToStay -= 2;

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
                        let expansionWeight = (this.personality === 'expansive') ? 3.0 : 1.5;
                        // Reduce priority if we already have many nodes
                        if (myNodes.length > 5) expansionWeight *= 0.5;
                        score *= expansionWeight;
                    } else if (target.owner !== this.playerId) {
                        // Enemy node
                        let attackWeight = (this.personality === 'aggressive') ? 2.5 : 1.0;
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
        if (this.difficulty === 'Nightmare') attackPercent += 0.1;
        if (this.difficulty === 'Easy') attackPercent = 0.3;

        const count = Math.ceil(units.length * Math.min(attackPercent, 0.95));
        const attackers = units.slice(0, count);

        attackers.forEach(e => {
            e.setTarget(targetNode.x, targetNode.y, targetNode);
        });
    }
}
