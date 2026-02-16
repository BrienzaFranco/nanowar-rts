export class AIController {
    constructor(game, playerId) {
        this.game = game;
        this.playerId = playerId;
        this.timer = 0;
        this.decisionInterval = 1.0 + Math.random(); // Varied intervals

        // Personnelities: Aggressive, Defensive, Expansive
        const personalities = ['aggressive', 'defensive', 'expansive'];
        this.personality = personalities[Math.floor(Math.random() * personalities.length)];
        console.log(`AI Player ${playerId} is ${this.personality}`);
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
        const availableNodes = this.game.state.nodes.filter(n => n.owner !== this.playerId);

        if (myNodes.length === 0) return;

        myNodes.forEach(sourceNode => {
            const count = sourceNode.areaDefenders ? sourceNode.areaDefenders.length : 0;

            // Basic threshold to decide if we can move units
            let unitThreshold = 5;
            if (this.personality === 'aggressive') unitThreshold = 3;
            if (this.personality === 'defensive') unitThreshold = 10;

            if (count > unitThreshold || (count > 2 && Math.random() < 0.2)) {

                // Healing priority for Defensive
                if (this.personality === 'defensive' && sourceNode.hp < sourceNode.maxHp * 0.8) {
                    // Stay and heal
                    return;
                }

                let closest = null;
                let minDist = Infinity;

                for (let target of availableNodes) {
                    const dx = target.x - sourceNode.x;
                    const dy = target.y - sourceNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let score = dist;

                    // Modifiers based on personality
                    if (target.owner === -1) {
                        // Expansion priority
                        score *= (this.personality === 'expansive') ? 0.3 : 0.6;
                    } else {
                        // Attack enemy priority
                        score *= (this.personality === 'aggressive') ? 0.5 : 1.2;
                    }

                    if (target.defendersInside < 5) score *= 0.8;

                    if (score < minDist) {
                        minDist = score;
                        closest = target;
                    }
                }

                if (closest) {
                    this.attack(sourceNode, closest);
                }
            }
        });
    }

    attack(sourceNode, targetNode) {
        const units = this.game.state.entities.filter(e =>
            e.owner === this.playerId &&
            !e.dead &&
            !e.targetNode &&
            Math.sqrt((e.x - sourceNode.x) ** 2 + (e.y - sourceNode.y) ** 2) <= sourceNode.influenceRadius
        );

        let attackPercent = 0.6;
        if (this.personality === 'aggressive') attackPercent = 0.75;
        if (this.personality === 'defensive') attackPercent = 0.4;

        const count = Math.ceil(units.length * attackPercent);
        const attackers = units.slice(0, count);

        attackers.forEach(e => {
            e.setTarget(targetNode.x, targetNode.y, targetNode);
        });
    }
}
