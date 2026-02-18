# AGENTS.md - Nanowar Multiplayer RTS

## Build Commands

```bash
# Install dependencies and build
npm install

# Build client bundle (production)
npm run build

# Watch mode for development
npm run watch

# Start production server
npm start

# Development server with auto-restart
npm run dev
```

**Note:** There is no test suite or linter currently configured.

## Project Structure

```
nanowar/
├── src/
│   ├── client/          # Browser-side code
│   │   ├── core/        # Game engine (Game.js, Renderer.js, Camera.js)
│   │   ├── modes/       # Game modes (SingleplayerController.js, MultiplayerController.js)
│   │   ├── systems/     # Subsystems (InputManager.js, SoundManager.js, UIManager.js, SelectionManager.js)
│   │   ├── utils/       # Helper functions (helpers.js)
│   │   └── main.js      # Client entry point
│   ├── server/          # Server-side code
│   │   ├── GameServer.js
│   │   ├── RoomManager.js
│   │   └── PlayerManager.js
│   └── shared/          # Shared game logic
│       ├── Entity.js    # Units/entities
│       ├── Node.js      # Game nodes
│       ├── GameState.js # Game state management
│       ├── GameConfig.js # Constants and config
│       ├── SpatialGrid.js # Spatial hashing for collisions
│       ├── AIController.js # AI logic
│       ├── MapGenerator.js
│       └── GlobalSpawnTimer.js
├── public/              # Static files
│   ├── index.html
│   ├── singleplayer.html
│   ├── styles.css
│   └── dist/            # Webpack output (bundle.js)
├── server.js            # Main server entry
├── webpack.config.cjs   # Webpack configuration
└── package.json
```

## Code Style Guidelines

### JavaScript/Module Style

- **Modules:** Use ES6 modules (`import`/`export`) with `.js` extension
- **Type:** ES modules (`"type": "module"` in package.json)
- **Classes:** Use ES6 class syntax with PascalCase names
- **Variables:** Use `const` by default, `let` when reassignment needed
- **Semicolons:** Optional but consistent within a file

### Naming Conventions

- **Files:** PascalCase for classes (Entity.js, GameServer.js), camelCase for utilities
- **Classes:** PascalCase (e.g., `GameState`, `SpatialGrid`)
- **Methods:** camelCase (e.g., `update`, `handleCollisions`)
- **Private:** No underscore prefix convention currently used
- **Constants:** UPPER_SNAKE_CASE for exported constants (e.g., `PLAYER_COLORS`, `GAME_SETTINGS`)

### Import/Export Patterns

```javascript
// Named exports for utilities and constants
export const PLAYER_COLORS = [...];
export const GAME_SETTINGS = { ... };

// Default exports for classes
export class GameState { ... }

// Import style
import { PLAYER_COLORS } from './GameConfig.js';
import { GameState } from '../../shared/GameState.js';
```

### Code Formatting

- **Indentation:** 4 spaces
- **Quotes:** Single quotes for strings
- **Trailing commas:** Not consistently used
- **Line length:** No strict limit, aim for readability
- **Braces:** Opening brace on same line (K&R style)

### Game Loop Pattern

```javascript
update(dt) {
    // dt is delta time in seconds, capped at 0.05s
    // Update game logic
}

draw(dt) {
    // Render frame
}
```

### Error Handling

- Use console.error() for errors
- Return early for guard clauses
- No try/catch blocks in most code (add where needed)

```javascript
if (!this.canvas) {
    console.error('Canvas not found:', canvasId);
    return;
}
```

### Comments

- Use `//` for inline comments
- Comment complex game logic
- Avoid redundant comments

## Webpack Aliases

Available in client code:
- `@core/` -> `src/client/core/`
- `@systems/` -> `src/client/systems/`
- `@modes/` -> `src/client/modes/`
- `@utils/` -> `src/client/utils/`
- `@shared/` -> `src/shared/`

## Key Architecture Patterns

1. **GameState:** Central state management shared between client and server
2. **SpatialGrid:** Spatial hashing for O(1) collision queries
3. **Entity-Component:** Entities are plain objects with update() methods
4. **Controller Pattern:** Separate controllers for singleplayer vs multiplayer
5. **Socket.io:** Real-time multiplayer communication

## Performance Considerations

- Use `requestAnimationFrame` for game loop
- Pre-render expensive graphics (see Renderer.js glow cache example)
- Use spatial grid for collision detection
- Cap delta time: `Math.min((now - lastTime) / 1000, 0.05)`
- Cache calculations when possible
