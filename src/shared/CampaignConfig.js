// shared/CampaignConfig.js

export const CampaignLevels = [
    {
        id: 0,
        name: "Entrenamiento Básico",
        description: "Aprende los conceptos básicos del movimiento y conquista.",
        isTutorial: true,
        mapConfig: {
            numNodes: 5,
            size: "small", // Using existing map sizes
            fixedNodes: null, // No fixed positions for now, fallback to random
        },
        enemies: [
            { id: 2, color: 0xFF4444, difficulty: 'Easy', personality: 'defensive' }
        ]
    },
    {
        id: 1,
        name: "Expansión Rápida",
        description: "El enemigo es más agresivo, captura nodos neutrales rápido.",
        isTutorial: false,
        mapConfig: {
            numNodes: 8,
            size: "small",
        },
        enemies: [
            { id: 2, color: 0xFF4444, difficulty: 'Intermediate', personality: 'expansive' }
        ]
    },
    {
        id: 2,
        name: "Cuellos de Botella",
        description: "Encuentro en un mapa un poco más grande.",
        isTutorial: false,
        mapConfig: {
            numNodes: 12,
            size: "medium",
        },
        enemies: [
            { id: 2, color: 0xFF4444, difficulty: 'Intermediate', personality: 'aggressive' }
        ]
    },
    {
        id: 3,
        name: "Batalla a Tres Bandas",
        description: "Aparece un nuevo contendiente Azul.",
        isTutorial: false,
        mapConfig: {
            numNodes: 15,
            size: "medium",
        },
        enemies: [
            { id: 2, color: 0xFF4444, difficulty: 'Normal', personality: 'defensive' },
            { id: 3, color: 0x4444FF, difficulty: 'Normal', personality: 'expansive' }
        ]
    },
    {
        id: 4,
        name: "Primera Prueba de Fuego",
        description: "El enemigo Rojo no se rinde fácilmente.",
        isTutorial: false,
        mapConfig: {
            numNodes: 20,
            size: "large",
        },
        enemies: [
            { id: 2, color: 0xFF4444, difficulty: 'Hard', personality: 'aggressive' }
            // Added up to level 5 just to prove the concept for Phase 1
        ]
    }
];

export function getCampaignLevel(id) {
    return CampaignLevels.find(level => level.id === id) || null;
}
