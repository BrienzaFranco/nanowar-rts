export const PLAYER_COLORS = [
    '#4CAF50', '#f44336', '#2196F3', '#FF9800',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
];

export const GAME_SETTINGS = {
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1800,
};

export const NODE_TYPES = {
    small: { radius: 20, influenceFat: 4, baseHp: 4, maxHp: 12, stockFat: 0.5 },
    medium: { radius: 32, influenceFat: 3.5, baseHp: 7, maxHp: 22, stockFat: 0.5 },
    large: { radius: 55, influenceFat: 3, baseHp: 12, maxHp: 35, stockFat: 0.6 }
};
