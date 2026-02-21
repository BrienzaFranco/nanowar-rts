const DEFAULT_COLORS = [
    '#4CAF50', '#f44336', '#2196F3', '#FF9800',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
];

export let PLAYER_COLORS = [...DEFAULT_COLORS];

export function setPlayerColor(index) {
    if (index >= 0 && index < DEFAULT_COLORS.length) {
        // Reset to default first to be idempotent
        PLAYER_COLORS = [...DEFAULT_COLORS];

        if (index > 0) {
            // Swap selected color with first color (Player 0)
            const temp = PLAYER_COLORS[0];
            PLAYER_COLORS[0] = PLAYER_COLORS[index];
            PLAYER_COLORS[index] = temp;
        }
    }
}

export const GAME_SETTINGS = {
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 3000,
    WORLD_RADIUS: 3000, // Larger than map - units won't reach it often
    OUTSIDE_DEATH_TIME: 5, // Seconds before unit dies outside boundary
    MAX_UNITS_PER_PLAYER: 500, // Global unit cap
};

export const NODE_TYPES = {
    SMALL: 0,
    MEDIUM: 1,
    LARGE: 2,
    MEGA: 3,
    ULTRA: 4,
    OMEGA: 5
};

export const NODE_CONFIG = {
    [NODE_TYPES.SMALL]: { radius: 22, influenceRadius: 100, baseHp: 6, maxHp: 25, spawnInterval: 4.5 },
    [NODE_TYPES.MEDIUM]: { radius: 40, influenceRadius: 160, baseHp: 12, maxHp: 60, spawnInterval: 3.5 },
    [NODE_TYPES.LARGE]: { radius: 65, influenceRadius: 220, baseHp: 25, maxHp: 150, spawnInterval: 2.4 },
    [NODE_TYPES.MEGA]: { radius: 100, influenceRadius: 300, baseHp: 50, maxHp: 300, spawnInterval: 2.0 },
    [NODE_TYPES.ULTRA]: { radius: 125, influenceRadius: 380, baseHp: 80, maxHp: 500, spawnInterval: 1.6 },
    [NODE_TYPES.OMEGA]: { radius: 160, influenceRadius: 450, baseHp: 120, maxHp: 800, spawnInterval: 1.4 }
};
