import { AIController } from '../../shared/AIController.js';
import { Node } from '../../shared/Node.js';
import { Entity } from '../../shared/Entity.js';
import { MapGenerator } from '../../shared/MapGenerator.js';

export class SingleplayerController {
    constructor(game) {
        this.game = game;
        this.ais = [];
    }

    setup(playerCount = 1, difficulty = 'intermediate') {
        this.game.state.playerCount = playerCount;
        this.game.state.difficulty = difficulty;
        this.createLevel();
        this.createInitialEntities();

        const difficultyMap = {
            'easy': 'Easy',
            'intermediate': 'Normal',
            'hard': 'Hard',
            'expert': 'Nightmare'
        };

        // Create AIs for CPUs (indices > 0)
        for (let i = 1; i < playerCount; i++) {
            const aiDifficulty = difficultyMap[difficulty] || 'Normal';
            this.ais.push(new AIController(this.game, i, aiDifficulty));
        }
    }

    createLevel() {
        const width = this.game.state.worldWidth;
        const height = this.game.state.worldHeight;
        this.game.state.nodes = MapGenerator.generate(this.game.state.playerCount, width, height);
    }

    createInitialEntities() {
        this.game.state.nodes.forEach(node => {
            if (node.owner !== -1) {
                for (let i = 0; i < 15; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = node.radius + 30;
                    const ent = new Entity(
                        node.x + Math.cos(angle) * dist,
                        node.y + Math.sin(angle) * dist,
                        node.owner,
                        Date.now() + i + (node.owner * 1000)
                    );
                    this.game.state.entities.push(ent);
                }
            }
        });
    }

    update(dt) {
        this.ais.forEach(ai => ai.update(dt));
    }
}
