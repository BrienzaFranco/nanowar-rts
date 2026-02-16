export class AIController {
    constructor(game, playerId) {
        this.game = game;
        this.playerId = playerId;
        this.timer = 0;
        this.decisionInterval = 1.5;
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
            if (sourceNode.defendersInside > 10 || (sourceNode.defendersInside > 5 && Math.random() < 0.3)) {
                let closest = null;
                let minDist = Infinity;

                for (let target of availableNodes) {
                    const dx = target.x - sourceNode.x;
                    const dy = target.y - sourceNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let score = dist;
                    if (target.owner === -1) score *= 0.5;
                    else if (target.defendersInside < 5) score *= 0.7;

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

        const count = Math.ceil(units.length * 0.6);
        const attackers = units.slice(0, count);

        // We use game.executeCommand or directly modify entities?
        // Game logic allows direct modification if we are the controller.
        // But for consistency with network, maybe use an action?
        // For now, direct modification as in original code.
        attackers.forEach(e => {
            e.setTarget(targetNode.x, targetNode.y, targetNode);
        });
    }
}
