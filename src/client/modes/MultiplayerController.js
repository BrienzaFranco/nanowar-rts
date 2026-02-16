import { io } from 'socket.io-client';
import { Entity } from '../../shared/Entity.js';
import { Node } from '../../shared/Node.js';

export class MultiplayerController {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerIndex = -1;
        this.roomId = null;
        this.cameraCentered = false;
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

            // Send nickname if we have one stored
            const name = localStorage.getItem('nanowar_nickname');
            if (name) this.socket.emit('setNickname', name);
        });

        this.socket.on('roomList', (rooms) => {
            if (window.updateRoomListUI) {
                window.updateRoomListUI(rooms);
            }
        });

        this.socket.on('lobbyUpdate', (data) => {
            console.log('Lobby Update:', data);
            if (window.updateLobbyUI) {
                window.updateLobbyUI(data.players);
            }
        });

        this.socket.on('gameStart', () => {
            console.log('Game starting!');
            const lobby = document.getElementById('lobby-screen');
            const gameScreen = document.getElementById('game-screen');
            if (lobby) lobby.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';
            
            // Resize canvas now that it's visible
            this.game.resize();
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

    toggleReady() {
        if (this.socket) this.socket.emit('toggleReady');
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
        // Authoritative sync for Nodes
        serverState.nodes.forEach(sn => {
            let clientNode = this.game.state.nodes.find(cn => cn.id === sn.id);
            if (!clientNode) {
                // Create node if it doesn't exist
                clientNode = new Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                this.game.state.nodes.push(clientNode);
            }

            // Update properties
            clientNode.owner = sn.owner;
            clientNode.baseHp = sn.baseHp;
            clientNode.spawnProgress = sn.spawnProgress;
            if (sn.rallyPoint) {
                clientNode.rallyPoint = sn.rallyPoint;
            }
        });

        // Center camera on player's node if not already done
        if (!this.cameraCentered && this.playerIndex !== -1 && this.game.state.nodes.length > 0) {
            const startNode = this.game.state.nodes.find(n => n.owner === this.playerIndex);
            if (startNode) {
                this.game.camera.centerOn(startNode.x, startNode.y, this.game.canvas.width, this.game.canvas.height);
                this.cameraCentered = true;
            }
        }

        // Authoritative sync for Entities (Re-instantiation Fix)
        // 1. Identify entities to keep/update and entities to add
        const newEntities = [];
        serverState.entities.forEach(se => {
            let localEnt = this.game.state.entities.find(le => le.id === se.id);
            if (localEnt) {
                // Update existing
                localEnt.x = se.x;
                localEnt.y = se.y;
                localEnt.vx = se.vx;
                localEnt.vy = se.vy;
                localEnt.owner = se.owner;
                localEnt.dying = se.dying;
                newEntities.push(localEnt);
            } else {
                // Re-instantiate new
                const ent = new Entity(se.x, se.y, se.owner, se.id);
                ent.vx = se.vx;
                ent.vy = se.vy;
                ent.dying = se.dying;
                newEntities.push(ent);
            }
        });

        this.game.state.entities = newEntities;
    }
}
