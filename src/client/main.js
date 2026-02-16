import { Game } from './core/Game.js';
import { InputManager } from './systems/InputManager.js';
import { SelectionManager } from './systems/SelectionManager.js';
import { UIManager } from './systems/UIManager.js';
import { SingleplayerController } from './modes/SingleplayerController.js';
import { MultiplayerController } from './modes/MultiplayerController.js';
import { GameState } from '../shared/GameState.js';

window.initGame = (mode) => {
    const game = new Game('game-canvas');

    // Initialize Systems
    game.systems = {
        selection: new SelectionManager(game),
        ui: new UIManager(game)
    };
    game.systems.input = new InputManager(game);

    // Initialize Mode
    if (mode === 'singleplayer') {
        const urlParams = new URLSearchParams(window.location.search);
        const playerCount = parseInt(urlParams.get('players')) || 2;
        const difficulty = urlParams.get('difficulty') || 'intermediate';
        game.controller = new SingleplayerController(game);
        game.controller.setup(playerCount, difficulty);
        game.start();
    } else {
        game.controller = new MultiplayerController(game);
        game.controller.connect();
        // Don't start game loop here - wait for server's gameStart event
    }

    // Setup reset button for singleplayer
    if (mode === 'singleplayer') {
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const urlParams = new URLSearchParams(window.location.search);
                const playerCount = parseInt(urlParams.get('players')) || 2;
                const difficulty = urlParams.get('difficulty') || 'intermediate';
                
                // Stop current game
                game.running = false;
                game.gameOverShown = false;
                
                // Clear state - create fresh GameState
                game.state = new GameState();
                game.state.playerCount = game.controller.ais.length + 1;
                game.particles = [];
                game.commandIndicators = [];
                game.waypointLines = [];
                game.systems.selection.clear();
                
                // Re-setup with new map
                game.controller.setup(playerCount, difficulty);
                game.start();
            });
        }
    }

    return game;
};

// Auto-init based on page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('game-canvas')) {
        const isSingle = window.location.pathname.includes('singleplayer');
        window.initGame(isSingle ? 'singleplayer' : 'multiplayer');
    }
});
