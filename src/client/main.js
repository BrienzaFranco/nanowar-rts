import { Game } from './core/Game.js';
import { InputManager } from './systems/InputManager.js';
import { SelectionManager } from './systems/SelectionManager.js';
import { UIManager } from './systems/UIManager.js';
import { SingleplayerController } from './modes/SingleplayerController.js';
import { MultiplayerController } from './modes/MultiplayerController.js';

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
        game.controller = new SingleplayerController(game);
        game.controller.setup(playerCount);
        game.start();
    } else {
        game.controller = new MultiplayerController(game);
        game.controller.connect();
        // Don't start game loop here - wait for server's gameStart event
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
