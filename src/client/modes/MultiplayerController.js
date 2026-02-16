import { io } from 'socket.io-client';

export class MultiplayerController {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerIndex = -1;
        this.roomId = null;
    }

    connect(url = '/') {
        this.socket = io(url);
        this.setupSocketEvents();
        // Expose this controller to window for UI interaction
        window.multiplayer = this;
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('MultiplayerController connected to server');
            this.socket.emit('listRooms');
        });

        this.socket.on('roomList', (rooms) => {
            // Trigger UI update if window.updateRoomListUI exists
            if (window.updateRoomListUI) {
                window.updateRoomListUI(rooms);
            }
        });

        this.socket.on('gameStart', () => {
            console.log('Game starting!');
            const lobby = document.getElementById('lobby-screen');
            const gameScreen = document.getElementById('game-screen');
            if (lobby) lobby.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';
            this.game.start();
        });

        this.socket.on('gameState', (serverState) => {
            if (this.game.running) {
                this.syncState(serverState);
            }
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
        });
    }

    createRoom(maxPlayers = 4) {
        this.socket.emit('createRoom', { maxPlayers }, (response) => {
            if (response.success) {
                this.roomId = response.roomId;
                this.playerIndex = response.playerIndex;
                this.showLobby();
            }
        });
    }

    joinRoom(roomId) {
        this.socket.emit('joinRoom', { roomId }, (response) => {
            if (response.success) {
                this.roomId = roomId;
                this.playerIndex = response.playerIndex;
                this.showLobby();
            } else {
                alert('Error: ' + response.message);
            }
        });
    }

    showLobby() {
        const lobby = document.getElementById('lobby-screen');
        const menu = document.getElementById('menu-screen');
        if (lobby) lobby.style.display = 'block';
        if (menu) menu.style.display = 'none';
    }

    sendAction(action) {
        if (this.socket && this.connected) {
            this.socket.emit('gameAction', action);
        }
    }

    syncState(serverState) {
        // Authoritative sync
        this.game.state.nodes.forEach(clientNode => {
            const serverNode = serverState.nodes.find(sn => sn.id === clientNode.id);
            if (serverNode) {
                clientNode.owner = serverNode.owner;
                clientNode.baseHp = serverNode.baseHp;
                // Don't sync internal progress if we want prediction, 
                // but for authoritative simple sync we do.
                clientNode.spawnProgress = serverNode.spawnProgress;
            }
        });

        // For entities, simple replacement for now
        this.game.state.entities = serverState.entities;
    }
}
