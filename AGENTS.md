# AGENTS.md - Nanowar Multiplayer RTS

## Build Commands

```bash
npm install        # Install dependencies
npm run build      # Build client bundle (production)
npm run watch      # Watch mode for development
npm start          # Start production server
npm run dev        # Development server with auto-restart (nodemon)
```

**Note:** No test suite or linter configured. Test by running `npm start` and playing.

## Project Structure

```
nanowar/
├── src/
│   ├── client/
│   │   ├── core/           # Game engine (Game.js, Renderer.js, Camera.js, Particle.js)
│   │   ├── modes/          # SingleplayerController.js, MultiplayerController.js
│   │   ├── systems/        # InputManager, SoundManager, UIManager, SelectionManager
│   │   ├── utils/          # helpers.js
│   │   ├── workers/        # GameWorker.js (Web Worker for physics)
│   │   └── main.js         # Client entry point
│   ├── server/             # GameServer.js, RoomManager.js, PlayerManager.js
│   └── shared/             # Shared game logic (runs on both client and server)
│       ├── Entity.js       # Units/entities
│       ├── Node.js         # Game nodes (bases)
│       ├── GameState.js    # Game state management
│       ├── GameConfig.js   # Constants and config
│       ├── SpatialGrid.js  # Spatial hashing for collisions
│       ├── AIController.js # AI logic
│       ├── MapGenerator.js
│       ├── SharedMemory.js # SharedArrayBuffer layout for worker
│       ├── SharedView.js   # Read-only view for main thread
│       ├── EntityData.js   # Entity TypedArray wrapper
│       └── NodeData.js     # Node TypedArray wrapper
├── public/                 # Static files (index.html, singleplayer.html, styles.css)
├── server.js               # Main server entry (Express + Socket.io)
├── webpack.config.cjs      # Webpack configuration
└── package.json
```

## Code Style Guidelines

### JavaScript/Module Style

- **Modules:** ES6 modules (`import`/`export`) with `.js` extension
- **Type:** ES modules (`"type": "module"` in package.json)
- **Classes:** ES6 class syntax with PascalCase names
- **Variables:** `const` by default, `let` when reassignment needed
- **Semicolons:** Optional but consistent within a file
- **Comments:** No comments unless complex logic requires explanation

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (classes) | PascalCase | `Entity.js`, `GameServer.js` |
| Files (utilities) | camelCase | `helpers.js` |
| Classes | PascalCase | `GameState`, `SpatialGrid` |
| Methods | camelCase | `update`, `handleCollisions` |
| Constants (exported) | UPPER_SNAKE_CASE | `PLAYER_COLORS`, `GAME_SETTINGS` |
| Private fields | No prefix | Use closure or document intent |

### Import/Export Patterns

```javascript
// Named exports for utilities and constants
export const PLAYER_COLORS = ['#ff6b6b', '#4ecdc4'];
export const GAME_SETTINGS = { WORLD_WIDTH: 2400 };

// Default exports for classes
export class GameState { ... }

// Import style with webpack aliases
import { PLAYER_COLORS } from './GameConfig.js';
import { GameState } from '@shared/GameState.js';
import { Game } from '@core/Game.js';
```

### Code Formatting

- **Indentation:** 4 spaces
- **Quotes:** Single quotes for strings
- **Braces:** K&R style (opening brace on same line)
- **Line length:** No strict limit, aim for readability

### Error Handling

```javascript
// Guard clauses with early return
if (!this.canvas) {
    console.error('Canvas not found:', canvasId);
    return;
}

// No try/catch in most game code - add only for async/file operations
```

## Webpack Aliases

Available in client code:
- `@core/` → `src/client/core/`
- `@systems/` → `src/client/systems/`
- `@modes/` → `src/client/modes/`
- `@utils/` → `src/client/utils/`
- `@shared/` → `src/shared/`

## Architecture Patterns

### 1. Game Loop Pattern

```javascript
update(dt) {
    // dt is delta time in seconds, capped at 0.05s
    // Update game logic
}
draw(dt) {
    // Render frame
}
```

### 2. Web Worker with SharedArrayBuffer (Physics)

The game offloads physics calculations to a Web Worker for performance:

```
Main Thread                    Worker Thread
     │                              │
     │  SharedArrayBuffer           │
     │◄────────────────────────────►│
     │                              │
     │  postMessage(commands)       │
     │─────────────────────────────►│
     │                              │
     │  frameComplete event         │
     │◄─────────────────────────────│
```

**Key files:**
- `SharedMemory.js` - Memory layout with TypedArrays (entities, nodes, events)
- `EntityData.js` / `NodeData.js` - Wrappers for reading/writing typed data
- `SharedView.js` - Read-only view for main thread
- `GameWorker.js` - Worker with physics loop at 60Hz

**Memory layout pattern:**
```javascript
// Each field offset = previous offset + (fieldSize * MAX_COUNT)
const ENTITY_OFFSET_X = 0;
const ENTITY_OFFSET_Y = ENTITY_OFFSET_X + (4 * MAX_ENTITIES);
```

**Worker communication:**
```javascript
// Main thread → Worker
worker.postMessage({ type: 'setEntityTargetById', data: { entityId, targetX, targetY } });

// Worker reads/writes SharedArrayBuffer directly (no copying)
// Main thread reads via SharedView
```

### 3. Entity-Component Pattern

Entities are objects with `update(dt)` methods. The game state iterates through them:

```javascript
this.entities.forEach(ent => ent.update(dt, spatialGrid, nodes, camera, game));
```

### 4. Spatial Grid for Collision Detection

```javascript
const spatialGrid = new SpatialGrid(width, height, cellSize);
spatialGrid.addObject(entity);
const nearby = spatialGrid.retrieve(x, y, radius);
```

### 5. Controller Pattern

- `SingleplayerController` - Local game with AI opponents
- `MultiplayerController` - Socket.io communication with server

### 6. State Synchronization (Multiplayer)

Server sends full state at 30 FPS:
```javascript
this.io.to(roomId).emit('gameState', this.state.getState());
```

## Server Requirements

SharedArrayBuffer requires COOP/COEP headers (set in server.js):
```javascript
res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
```

## Performance Considerations

- Use `requestAnimationFrame` for game loop
- Cap delta time: `Math.min(dt, 0.05)`
- Pre-render expensive graphics (see Renderer.js glow cache)
- Use spatial grid for O(1) collision queries
- Worker handles physics, main thread only renders
- Cap particles: `if (this.particles.length > 100) return;`

## Entity-Node Interaction Logic

When entity touches node:
1. **Neutral node** → Entity dies, node captured
2. **Own node + targeting it** → Entity absorbed, node healed
3. **Enemy node + targeting it** → Defenders sacrificed first, then node damaged
4. **Any node + NOT targeting** → Entity pushed out and rounds around

## AI Controller

AI uses `game.setEntityTarget()` for Worker compatibility:
```javascript
if (this.game.setEntityTarget) {
    this.game.setEntityTarget(e.id, targetX, targetY, targetNodeId);
} else {
    e.setTarget(targetX, targetY, targetNode);
}
```
