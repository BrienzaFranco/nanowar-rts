import { io } from 'socket.io-client';
import { Entity } from '../../shared/Entity.js';
import { Node } from '../../shared/Node.js';
import { GameState } from '../../shared/GameState.js';

export class MultiplayerController {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.connected = false;
        this.playerIndex = -1;
        this.roomId = null;
        this.cameraCentered = false;
        this.initialStateReceived = false;
    }

    connect(url = '/') {
        this.socket = io(url);
        this.setupSocketEvents();
        window.multiplayer = this;
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('MultiplayerController connected to server');
            this.socket.emit('listRooms');

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

        this.socket.on('gameStart', (initialState) => {
            console.log('Game starting!');
            
            // Clear existing state and initialize from server
            this.game.state = new GameState();
            this.game.state.nodes = [];
            this.game.state.entities = [];
            this.game.state.playerCount = initialState.playerCount || this.game.state.playerCount;
            
            // Apply initial state
            if (initialState.nodes) {
                initialState.nodes.forEach(sn => {
                    const node = new Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                    node.baseHp = sn.baseHp;
                    node.maxHp = sn.maxHp;
                    node.stock = sn.stock;
                    node.maxStock = sn.maxStock;
                    node.spawnProgress = sn.spawnProgress;
                    if (sn.rallyPoint) node.rallyPoint = sn.rallyPoint;
                    this.game.state.nodes.push(node);
                });
            }
            
            // Spawn initial entities for all players - MORE units for multiplayer
            this.game.state.nodes.forEach(node => {
                if (node.owner !== -1) {
                    for (let i = 0; i < 20; i++) {
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

            const lobby = document.getElementById('lobby-screen');
            const gameScreen = document.getElementById('game-screen');
            if (lobby) lobby.style.display = 'none';
            if (gameScreen) gameScreen.style.display = 'block';
            
            this.game.resize();
            this.game.start();
        });

        this.socket.on('gameState', (serverState) => {
            if (this.game.running) {
                this.syncState(serverState);
            }
        });

        this.socket.on('gameOver', (data) => {
            this.game.running = false;
            const won = data.winner === this.playerIndex;
            const msg = won ? '¡VICTORIA!' : 'DERROTA';
            const color = won ? '#4CAF50' : '#f44336';
            
            const overlay = document.createElement('div');
            overlay.id = 'game-over-overlay';
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.85); display: flex;
                justify-content: center; align-items: center; z-index: 1000;
            `;
            
            const box = document.createElement('div');
            box.style.cssText = `
                padding: 40px 60px; background: #141419;
                border: 3px solid ${color}; border-radius: 12px;
                text-align: center;
            `;
            
            box.innerHTML = `
                <h1 style="color: ${color}; font-size: 48px; margin: 0 0 20px 0; letter-spacing: 4px;">${msg}</h1>
                <button id="restart-btn" style="
                    background: ${color}; color: white; border: none;
                    padding: 12px 30px; font-size: 16px; cursor: pointer;
                    border-radius: 4px; font-family: 'Courier New', monospace;
                ">VOLVER AL MENU</button>
            `;
            
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            
            document.getElementById('restart-btn').addEventListener('click', () => {
                overlay.remove();
                location.reload();
            });
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
        // Sync nodes
        serverState.nodes.forEach(sn => {
            let clientNode = this.game.state.nodes.find(cn => cn.id === sn.id);
            if (!clientNode) {
                clientNode = new Node(sn.id, sn.x, sn.y, sn.owner, sn.type);
                this.game.state.nodes.push(clientNode);
            }
            
            // Update properties from server
            clientNode.owner = sn.owner;
            clientNode.baseHp = sn.baseHp;
            clientNode.stock = sn.stock;
            clientNode.spawnProgress = sn.spawnProgress;
            clientNode.hitFlash = sn.hitFlash;
            clientNode.spawnEffect = sn.spawnEffect;
            if (sn.rallyPoint) {
                clientNode.rallyPoint = sn.rallyPoint;
            }
        });

        // Center camera on player's starting node
        if (!this.cameraCentered && this.playerIndex !== -1 && this.game.state.nodes.length > 0) {
            const startNode = this.game.state.nodes.find(n => n.owner === this.playerIndex);
            if (startNode) {
                this.game.camera.centerOn(startNode.x, startNode.y, this.game.canvas.width, this.game.canvas.height);
                this.cameraCentered = true;
            }
        }

        // Sync entities - update existing ones
        const entityMap = new Map();
        this.game.state.entities.forEach(e => entityMap.set(e.id, e));

        serverState.entities.forEach(se => {
            let ent = entityMap.get(se.id);
            if (!ent) {
                ent = new Entity(se.x, se.y, se.owner, se.id);
                this.game.state.entities.push(ent);
            }
            
            // Update from server (authoritative)
            ent.x = se.x;
            ent.y = se.y;
            ent.vx = se.vx;
            ent.vy = se.vy;
            ent.owner = se.owner;
            ent.dying = se.dying;
            ent.deathType = se.deathType;
            ent.deathTime = se.deathTime;
            
            entityMap.set(se.id, ent);
        });

        // Remove entities that no longer exist on server
        const serverEntityIds = new Set(serverState.entities.map(e => e.id));
        this.game.state.entities = this.game.state.entities.filter(e => serverEntityIds.has(e.id));
    }
}
