import { io } from 'socket.io-client';

export class MultiplayerController {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
    }

    connect(url = '/') {
        this.socket = io(url);
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('Connected to server');
        });

        this.socket.on('gameState', (serverState) => {
            this.syncState(serverState);
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
        });
    }

    sendAction(action) {
        if (this.socket && this.connected) {
            this.socket.emit('gameAction', action);
        }
    }

    syncState(serverState) {
        // Authoritative sync: replace local state with server state
        // For performance, we eventually want interpolation, but simple sync for now.
        // Needs careful mapping to class instances if we want to retain local methods.
        this.game.state.nodes = serverState.nodes; // Simplified for now
        this.game.state.entities = serverState.entities;
    }
}
