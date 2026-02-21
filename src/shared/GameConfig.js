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
    WORLD_WIDTH: 3200,
    WORLD_HEIGHT: 2400,
    WORLD_RADIUS: 2400, // Larger than map - units won't reach it often
    OUTSIDE_DEATH_TIME: 5, // Seconds before unit dies outside boundary
    MAX_UNITS_PER_PLAYER: 500, // Global unit cap
};

export const NODE_TYPES = {
    small: { radius: 20, influenceFat: 4, baseHp: 4, maxHp: 12, stockFat: 0.5 },
    medium: { radius: 32, influenceFat: 3.5, baseHp: 7, maxHp: 22, stockFat: 0.5 },
    large: { radius: 55, influenceFat: 3, baseHp: 12, maxHp: 35, stockFat: 0.6 }
};
