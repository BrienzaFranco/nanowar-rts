import { AIController } from '../../shared/AIController.js';
import { Node } from '../../shared/Node.js';
import { Entity } from '../../shared/Entity.js';
import { MapGenerator } from '../../shared/MapGenerator.js';
import { sounds } from '../systems/SoundManager.js';

export class SingleplayerController {
    constructor(game) {
        this.game = game;
        this.ais = [];
        this.gameOverShown = false;
    }

    setup(playerCount = 1, difficulty = 'intermediate') {
        this.game.state.playerCount = playerCount;
        this.game.state.difficulty = difficulty;
        this.playerIndex = 0;
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
        
        if (this.gameOverShown) return;
        
        const playerNodes = this.game.state.nodes.filter(n => n.owner === 0);
        const enemyNodes = this.game.state.nodes.filter(n => n.owner > 0);
        const playerEntities = this.game.state.entities.filter(e => e.owner === 0 && !e.dead && !e.dying);
        const enemyEntities = this.game.state.entities.filter(e => e.owner > 0 && !e.dead && !e.dying);
        
        const playerHasUnits = playerNodes.length > 0 || playerEntities.length > 0;
        const enemiesAlive = enemyNodes.length > 0 || enemyEntities.length > 0;
        
        if (!playerHasUnits) {
            this.showGameOver(false);
        } else if (!enemiesAlive) {
            this.showGameOver(true);
        }
    }
    
    showGameOver(won) {
        this.gameOverShown = true;
        this.game.gameOverShown = true;
        
        if (won) {
            sounds.playWin();
        } else {
            sounds.playLose();
        }
        
        const msg = won ? '¡VICTORIA!' : 'DERROTA';
        const color = won ? '#4CAF50' : '#f44336';
        
        const overlay = document.createElement('div');
        overlay.id = 'game-over-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 1000;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            font-family: 'Courier New', monospace;
        `;
        
        overlay.innerHTML = `
            <h1 style="color: ${color}; font-size: 48px; margin-bottom: 20px; letter-spacing: 8px;">${msg}</h1>
            <p style="color: #888; font-size: 14px;">${won ? 'Has vencido a todos los enemigos!' : 'Has perdido todas tus unidades...'}</p>
            <button onclick="location.reload()" style="
                margin-top: 30px; padding: 15px 40px;
                background: ${color}; border: none; border-radius: 4px;
                color: white; font-family: 'Courier New', monospace;
                font-size: 14px; cursor: pointer; letter-spacing: 2px;">
                JUGAR DE NUEVO
            </button>
        `;
        
        document.body.appendChild(overlay);
    }
}
