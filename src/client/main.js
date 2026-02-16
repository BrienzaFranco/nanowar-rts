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
        
        // Show game UI and screen
        const ui = document.getElementById('ui');
        const menu = document.getElementById('menu-screen');
        if (ui) ui.style.display = 'block';
        if (menu) menu.style.display = 'none';
        
        game.resize();
        game.start();
    }

    // Setup menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            game.running = false;
            location.href = 'index.html';
        });
    }

    // Show surrender button only in multiplayer
    if (mode === 'multiplayer') {
        const surrenderBtn = document.getElementById('surrender-btn');
        const resetBtn = document.getElementById('reset-btn');
        if (surrenderBtn) surrenderBtn.style.display = 'block';
        if (resetBtn) resetBtn.style.display = 'none';
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

    // Setup surrender button for multiplayer
    if (mode === 'multiplayer') {
        const surrenderBtn = document.getElementById('surrender-btn');
        if (surrenderBtn) {
            surrenderBtn.addEventListener('click', () => {
                if (game.controller && game.controller.surrender) {
                    game.controller.surrender();
                }
            });
        }
    }

    return game;
};

// Auto-init based on page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('game-canvas')) {
        // Check if singleplayer by path or by URL params
        const isSingle = window.location.pathname.includes('singleplayer') || 
                         new URLSearchParams(window.location.search).has('players');
        window.initGame(isSingle ? 'singleplayer' : 'multiplayer');
    }
});
