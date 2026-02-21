import { Game } from './core/Game.js';
import { InputManager } from './systems/InputManager.js';
import { SelectionManager } from './systems/SelectionManager.js';
import { UIManager } from './systems/UIManager.js';
import { SingleplayerController } from './modes/SingleplayerController.js';
import { MultiplayerController } from './modes/MultiplayerController.js';
import { GameState } from '../shared/GameState.js';
import { sounds } from './systems/SoundManager.js';
import { setPlayerColor } from '../shared/GameConfig.js';
import { Entity } from '../shared/Entity.js';

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
        const testMode = urlParams.get('test') === '1';
        const colorIndex = parseInt(urlParams.get('color')) || 0;

        setPlayerColor(colorIndex);

        game.controller = new SingleplayerController(game);
        game.controller.setup(playerCount, difficulty, testMode);

        // Show game UI and screen
        const ui = document.getElementById('ui');
        const menu = document.getElementById('menu-screen');
        if (ui) ui.style.display = 'block';
        if (menu) menu.style.display = 'none';

        game.resize();
        game.start();
    } else {
        // Multiplayer - controller is set up when connecting
        game.controller = new MultiplayerController(game);
        game.controller.connect();
    }

    // Setup menu button
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            game.running = false;
            location.href = 'index.html';
        });
    }

    // -- HUD BUTTONS SETUP --
    
    // 0. Help
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
        helpBtn.addEventListener('click', () => {
            const tutorial = document.getElementById('tutorial-overlay');
            if (tutorial) {
                tutorial.classList.add('visible');
            } else {
                alert('CONTROLES:\n- Click Izq: Seleccionar\n- Click Der: Mover\n- T + Click: Rally Point\n- S: Detener');
            }
        });
    }

    // 1. Mute
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            const enabled = sounds.toggle();
            muteBtn.textContent = enabled ? '🔊' : '🔇';
        });
    }

    // 2. Surrender
    const surrenderBtn = document.getElementById('surrender-btn');
    if (surrenderBtn) {
        surrenderBtn.style.display = 'flex';
        surrenderBtn.addEventListener('click', () => {
            if (mode === 'multiplayer') {
                if (confirm('¿Estás seguro de que quieres rendirte?')) {
                    if (game.controller && game.controller.surrender) game.controller.surrender();
                }
            } else {
                if (game.controller && game.controller.surrender) game.controller.surrender();
            }
        });
    }

    // 3. Reset (Singleplayer only)
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.style.display = (mode === 'singleplayer') ? 'flex' : 'none';
        if (mode === 'singleplayer') {
            resetBtn.addEventListener('click', () => {
                const urlParams = new URLSearchParams(window.location.search);
                const playerCount = parseInt(urlParams.get('players')) || 2;
                const difficulty = urlParams.get('difficulty') || 'intermediate';
                const testMode = urlParams.get('test') === '1';
                const colorIndex = parseInt(urlParams.get('color')) || 0;
                setPlayerColor(colorIndex);

                game.stop();
                game.gameOverShown = false;
                Entity.resetIdCounter();
                game.state = new GameState();
                game.state.playerCount = playerCount;

                game.ais = [];
                if (game.controller && game.controller.ais) {
                    game.controller.ais = [];
                }

                game.particles = [];
                game.commandIndicators = [];
                game.waypointLines = [];
                game.systems.selection.clear();

                const ui = game.systems.ui;
                ui._lastCounts = {};
                ui._ratesCache = {};
                ui._totalProduced = {};
                ui._currentCounts = {};
                ui._lastSampleTime = 0;

                game.skipCameraReset = true;
                game.controller.setup(playerCount, difficulty, testMode);
                game.skipCameraReset = false;

                if (game.worker) {
                    game.worker.terminate();
                    game.worker = null;
                    game.useWorker = false;
                    game.workerRunning = false;
                }

                game.start();
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
