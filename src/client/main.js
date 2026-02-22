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
import { CampaignLevels } from '../shared/CampaignConfig.js';
import { CampaignManager } from './CampaignManager.js';

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
        const campaignId = urlParams.get('campaign');

        setPlayerColor(colorIndex);

        game.controller = new SingleplayerController(game);
        game.controller.setup(playerCount, difficulty, testMode, campaignId);

        // Show game UI and screen
        const ui = document.getElementById('ui');
        const menu = document.getElementById('menu-screen');
        if (ui) ui.style.display = 'flex'; // Changed to flex for horizontal layout
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
            const confirmMsg = mode === 'multiplayer' ?
                '¿Estás seguro de que quieres rendirte? Los nodos pasarán a ser neutrales.' :
                '¿Estás seguro de que quieres rendirte?';

            if (confirm(confirmMsg)) {
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

// --- CAMPAIGN UI LOGIC ---
let selectedCampaignId = null;

window.renderCampaignGrid = () => {
    const grid = document.getElementById('campaign-grid');
    if (!grid) return;

    // Create elements if not already there, up to 50
    const unlockedLevelId = CampaignManager.getUnlockedLevel();
    grid.innerHTML = '';

    // Render the 50 slots (even if configured levels don't exist yet, we show placeholders)
    for (let i = 0; i < 50; i++) {
        const btn = document.createElement('button');
        btn.className = 'ui-btn-game';
        btn.textContent = i === 0 ? 'T' : (i).toString();
        btn.style.width = '100%';
        btn.style.height = '40px';
        btn.style.fontSize = '12px';

        const isUnlocked = i <= unlockedLevelId;
        const config = CampaignLevels.find(l => l.id === i);

        if (!isUnlocked) {
            btn.style.opacity = '0.2';
            btn.style.cursor = 'not-allowed';
            btn.textContent = '🔒';
        } else if (!config) {
            // Level is unlocked but not yet implemented in Config
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Próximamente';
        } else {
            // Unlocked and playable
            if (i < unlockedLevelId) {
                btn.style.borderColor = '#4CAF50';
                btn.style.color = '#4CAF50';
            } else {
                btn.style.borderColor = '#FFEB3B';
                btn.style.color = '#FFEB3B';
                btn.style.boxShadow = '0 0 10px rgba(255, 235, 59, 0.3)';
            }

            btn.addEventListener('click', () => {
                selectedCampaignId = i;
                document.getElementById('campaign-level-title').textContent = `Misión ${i}: ${config.name}`;
                document.getElementById('campaign-level-desc').textContent = config.description || 'Sin descripción.';
                document.getElementById('btn-start-campaign').disabled = false;

                // Visual selection
                Array.from(grid.children).forEach(c => c.style.background = 'transparent');
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
            });
        }

        grid.appendChild(btn);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const btnStartCampaign = document.getElementById('btn-start-campaign');
    if (btnStartCampaign) {
        btnStartCampaign.addEventListener('click', () => {
            if (selectedCampaignId !== null) {
                // We pass the campaign id in the URL
                window.location.href = `singleplayer.html?campaign=${selectedCampaignId}`;
            }
        });
    }
});

// Auto-init based on page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('game-canvas')) {
        // Check if singleplayer by path or by URL params
        const isSingle = window.location.pathname.includes('singleplayer') ||
            new URLSearchParams(window.location.search).has('players');
        window.initGame(isSingle ? 'singleplayer' : 'multiplayer');
    }
});
