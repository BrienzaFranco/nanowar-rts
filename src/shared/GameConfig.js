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
    small: { radius: 22, influenceFat: 4, baseHp: 6, maxHp: 18, stockFat: 0.5 },
    medium: { radius: 38, influenceFat: 3.5, baseHp: 12, maxHp: 35, stockFat: 0.5 },
    large: { radius: 60, influenceFat: 3, baseHp: 20, maxHp: 60, stockFat: 0.6 },
    mega: { radius: 95, influenceFat: 2.5, baseHp: 40, maxHp: 130, stockFat: 0.7 },
    ultra: { radius: 135, influenceFat: 2.2, baseHp: 70, maxHp: 280, stockFat: 0.8 },
    omega: { radius: 190, influenceFat: 2.0, baseHp: 150, maxHp: 600, stockFat: 1.0 }
};
