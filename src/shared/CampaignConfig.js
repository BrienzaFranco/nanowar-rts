// shared/CampaignConfig.js

export const CampaignLevels = [
    // Phase 1: Recluta (0-4)
    { id: 0, name: "Misión 1: Frontera Real", description: "Rojo empieza a moverse. Captura rápido.", winCondition: { type: 'standard' }, mapConfig: { numNodes: 8, size: 'small' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'defensive' }] },
    { id: 1, name: "Misión 2: Escaramuza Rival", description: "Rojo competirá por los neutrales.", winCondition: { type: 'standard' }, mapConfig: { numNodes: 10, size: 'small' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'expansive' }] },
    { id: 2, name: "Misión 3: Paso Estrecho", description: "Controla los cuellos de botella.", winCondition: { type: 'standard' }, mapConfig: { numNodes: 12, size: 'small' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 3, name: "Misión 4: Refuerzos", description: "Rojo tiene reservas ocultas.", winCondition: { type: 'standard' }, mapConfig: { numNodes: 14, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 4, name: "Misión 5: Jefe de División", description: "El comandante Rojo se defiende con todo.", winCondition: { type: 'standard' }, mapConfig: { numNodes: 15, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }] },

    // Phase 2: Expansión (5-14)
    { id: 5, name: "Misión 6: Un Nuevo Enemigo", description: "Aparece un contendiente Azul.", mapConfig: { numNodes: 18, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'balanced' }, { id: 2, difficulty: 'Intermediate', personality: 'balanced' }] },
    { id: 6, name: "Misión 7: Fuego Cruzado", description: "Rojo es agresivo, Azul es defensivo.", mapConfig: { numNodes: 20, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'aggressive' }, { id: 2, difficulty: 'Intermediate', personality: 'defensive' }] },
    { id: 7, name: "Misión 8: Alianza Oculta", description: "Enfrenta a dos enemigos que cooperan implícitamente.", mapConfig: { numNodes: 20, size: 'medium' }, enemies: [{ id: 1, difficulty: 'Intermediate', personality: 'expansive' }, { id: 2, difficulty: 'Intermediate', personality: 'expansive' }] },
    { id: 8, name: "Misión 9: Expansión Rival", description: "Rojo y Azul buscan apoderarse del mapa.", mapConfig: { numNodes: 25, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'expansive' }, { id: 2, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 9, name: "Misión 10: El Sándwich", description: "Debes sobrevivir a un empuje doble.", mapConfig: { numNodes: 25, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'aggressive' }, { id: 2, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 10, name: "Misión 11: Asimetría", description: "Ellos tienen menos nodos pero más grandes.", mapConfig: { numNodes: 22, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 11, name: "Misión 12: El Tesoro", description: "Rojo protege una bóveda, Azul intenta robarla.", mapConfig: { numNodes: 30, size: 'large' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 12, name: "Misión 13: Vacío Estelar", description: "Mapa inmenso, pocos nodos. Largos viajes.", mapConfig: { numNodes: 15, size: 'epic' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 13, name: "Misión 14: La Horda Azul", description: "Azul tiene mucha sed de batalla.", mapConfig: { numNodes: 25, size: 'large' }, enemies: [{ id: 2, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 14, name: "Misión 15: Jefes de Sector", description: "Rojo y Azul están decididos a eliminarte.", mapConfig: { numNodes: 30, size: 'large' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'balanced' }] },

    // Phase 3: Guerra de Facciones (15-24)
    { id: 15, name: "Misión 16: Caos a tres bandas", description: "Se suma Naranja. Multi-gestión obligatoria.", mapConfig: { numNodes: 30, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'aggressive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 16, name: "Misión 17: Escalada 1", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 17, name: "Misión 18: Escalada 2", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 18, name: "Misión 19: Escalada 3", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 19, name: "Misión 20: Escalada 4", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 20, name: "Misión 21: Escalada 5", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 21, name: "Misión 22: Escalada 6", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 22, name: "Misión 23: Escalada 7", description: "Lucha de desgaste en mapas amplios.", mapConfig: { numNodes: 35, size: 'large' }, enemies: [{ id: 1, difficulty: 'Normal', personality: 'balanced' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'expansive' }] },
    { id: 23, name: "Misión 24: Contraataque", description: "Las tres facciones empiezan a acorralarte.", mapConfig: { numNodes: 38, size: 'large' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'aggressive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }, { id: 3, difficulty: 'Hard', personality: 'expansive' }] },
    { id: 24, name: "Misión 25: Triunvirato", description: "Tres generales te buscan coordinadamente.", mapConfig: { numNodes: 40, size: 'epic' }, enemies: [{ id: 1, difficulty: 'Hard', personality: 'aggressive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Hard', personality: 'expansive' }] },

    // Phase 4: Tácticas Avanzadas (25-34)
    { id: 25, name: "Misión 26: Desventaja Táctica", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 26, name: "Misión 27: Desventaja Táctica 2", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 27, name: "Misión 28: Desventaja Táctica 3", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 28, name: "Misión 29: Desventaja Táctica 4", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 29, name: "Misión 30: Desventaja Táctica 5", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 30, name: "Misión 31: Desventaja Táctica 6", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 31, name: "Misión 32: Desventaja Táctica 7", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 32, name: "Misión 33: Desventaja Táctica 8", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 33, name: "Misión 34: Desventaja Táctica 9", description: "Enemigos de IA Experta dominan el sector.", mapConfig: { numNodes: 45, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Expert', personality: 'balanced' }, { id: 5, difficulty: 'Hard', personality: 'expansive' }, { id: 6, difficulty: 'Normal', personality: 'aggressive' }] },
    { id: 34, name: "Misión 35: General Violeta", description: "Enemigo en dificultad Imposible liderando la defensa.", mapConfig: { numNodes: 50, size: 'epic' }, enemies: [{ id: 4, difficulty: 'Impossible', personality: 'defensive' }] },

    // Phase 5: Maestría (35-44)
    { id: 35, name: "Misión 36: Maestría Total 1", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 36, name: "Misión 37: Maestría Total 2", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 37, name: "Misión 38: Maestría Total 3", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 38, name: "Misión 39: Maestría Total 4", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 39, name: "Misión 40: Maestría Total 5", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 40, name: "Misión 41: Maestría Total 6", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 41, name: "Misión 42: Maestría Total 7", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 42, name: "Misión 43: Maestría Total 8", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 43, name: "Misión 44: Maestría Total 9", description: "Batallas a escala galáctica. Solo sobreviven los fuertes.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 7, difficulty: 'Expert', personality: 'aggressive' }, { id: 4, difficulty: 'Expert', personality: 'expansive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }, { id: 3, difficulty: 'Normal', personality: 'balanced' }] },
    { id: 44, name: "Misión 45: La Guardia de Élite", description: "Comandos Expertos defienden a la guardia dorada.", mapConfig: { numNodes: 70, size: 'epic' }, enemies: [{ id: 1, difficulty: 'Expert', personality: 'aggressive' }, { id: 2, difficulty: 'Expert', personality: 'defensive' }, { id: 3, difficulty: 'Expert', personality: 'expansive' }, { id: 7, difficulty: 'Impossible', personality: 'balanced' }] },

    // Phase 6: El Vacío (45-49)
    { id: 45, name: "Misión 46: El Despertar del Vacío", description: "Aparece una amenaza oscura y letal. El color Negro.", mapConfig: { numNodes: 40, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Expert', personality: 'aggressive' }, { id: 1, difficulty: 'Normal', personality: 'defensive' }, { id: 2, difficulty: 'Normal', personality: 'defensive' }] },
    { id: 46, name: "Misión 47: Oscuridad Creciente", description: "La amenaza consume nodos neutrales rápidamente.", mapConfig: { numNodes: 50, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Expert', personality: 'expansive' }] },
    { id: 47, name: "Misión 48: El Vórtice", description: "Flanqueos masivos requeridos para frenar su avance.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Impossible', personality: 'aggressive' }] },
    { id: 48, name: "Misión 49: La Última Alianza", description: "Las demás facciones intentan sobrevivir la purga del Vacío.", mapConfig: { numNodes: 60, size: 'epic' }, enemies: [{ id: 8, difficulty: 'Impossible', personality: 'balanced' }, { id: 1, difficulty: 'Hard', personality: 'defensive' }, { id: 2, difficulty: 'Hard', personality: 'defensive' }] },
    {
        id: 49,
        name: "Misión 50: EVENT HORIZON",
        description: "1 vs 1 Definitivo. El Vacío te espera. Sin esperanza.",
        mapConfig: {
            size: "epic",
            fixedNodes: [
                { x: 500, y: 1500, owner: 0, type: 2, baseHp: 100 }, // Player (Strong start, but far away)
                { x: 3500, y: 1000, owner: 8, type: 4, baseHp: 200 }, // AI Boss 1
                { x: 3500, y: 1500, owner: 8, type: 5, baseHp: 300 }, // AI Boss 2 (Mega)
                { x: 3500, y: 2000, owner: 8, type: 4, baseHp: 200 }, // AI Boss 3
                // Defensive wall of neutral nodes for AI
                { x: 3000, y: 1200, owner: -1, type: 3, baseHp: 50 },
                { x: 3000, y: 1500, owner: -1, type: 3, baseHp: 50 },
                { x: 3000, y: 1800, owner: -1, type: 3, baseHp: 50 },
                // Scattered neutral nodes
                { x: 1000, y: 500, owner: -1, type: 1 },
                { x: 1000, y: 2500, owner: -1, type: 1 },
                { x: 2000, y: 1500, owner: -1, type: 2 },
            ],
            numNodes: 15 // Random filler nodes
        },
        enemies: [{ id: 8, difficulty: 'Impossible', personality: 'aggressive' }]
    }
];

export const TutorialLevels = [
    {
        id: 100,
        name: "1. Movimiento y Órdenes",
        description: "Aprende a mover tus tropas y a establecer puntos de reunión (Rally Points).",
        isTutorial: true,
        winCondition: { type: 'actionsComplete', actions: ['moved', 'rally'] },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 50 },
                { x: 800, y: 500, owner: -1, type: 1, baseHp: 5 }
            ],
            initialEntities: [
                { x: 400, y: 400, owner: 0, count: 10 }
            ]
        },
        enemies: [],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: '¡Bienvenido! Primero, MOVER: Haz click y arrastra desde tu nodo verde a cualquier parte.' },
            { trigger: 'time', delay: 5000, text: 'RALLY POINT: Selecciona tu nodo y presiona [E] sobre el mapa para fijar un punto de salida.' },
            { trigger: 'time', delay: 10000, text: 'Haz ambas acciones para completar este tutorial.' }
        ]
    },
    {
        id: 101,
        name: "2. Conquista Neutral",
        description: "Expande tu territorio capturando nodos grises.",
        isTutorial: true,
        winCondition: { type: 'nodes', count: 2 },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 50 },
                { x: 900, y: 500, owner: -1, type: 1, baseHp: 5 }
            ]
        },
        enemies: [],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Captura el nodo gris. Envía suficientes tropas hasta que el HP llegue a cero.' },
            { trigger: 'nodes', count: 2, text: '¡Excelente! Ahora ese nodo te pertenece y generará tropas para ti.' }
        ]
    },
    {
        id: 102,
        name: "3. Sanación de Nodos",
        description: "Envía tropas de vuelta a tus nodos heridos para repararlos.",
        isTutorial: true,
        winCondition: { type: 'unitsToGoal', nodeId: 0, goal: 20 },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 2 }
            ],
            initialEntities: [
                { x: 250, y: 500, owner: 0, count: 25 }
            ]
        },
        enemies: [],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Tu nodo tiene poca vida (está parpadeando). Envía tropas de vuelta hacia él.' },
            { trigger: 'time', delay: 5000, text: 'Al entrar, las unidades "curan" el nodo hasta su capacidad máxima.' }
        ]
    },
    {
        id: 103,
        name: "4. Combate y Victoria",
        description: "Vence a las tropas enemigas y captura su base.",
        isTutorial: true,
        winCondition: { type: 'standard' },
        mapConfig: {
            size: "small",
            fixedNodes: [
                { x: 400, y: 500, owner: 0, type: 2, baseHp: 50 },
                { x: 1000, y: 500, owner: 1, type: 2, baseHp: 10, productionDisabled: true }
            ]
        },
        enemies: [{ id: 1, difficulty: 'Easy', personality: 'defensive' }],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Para ganar, debes capturar todos los nodos enemigos (Rojos).' },
            { trigger: 'time', delay: 5000, text: 'El enemigo está debilitado. Ataca con todo para tomar su nodo.' }
        ]
    },
    {
        id: 104,
        name: "5. Partida de Formación",
        description: "Una batalla real sencilla contra un oponente básico.",
        isTutorial: true,
        winCondition: { type: 'standard' },
        mapConfig: { numNodes: 6, size: 'small' },
        enemies: [{ id: 1, difficulty: 'Easy', personality: 'balanced' }],
        tutorialSteps: [
            { trigger: 'time', delay: 1000, text: 'Aplica todo lo aprendido para derrotar al Comandante Rojo.' }
        ]
    }
];

export function getCampaignLevel(id) {
    if (id >= 100) return TutorialLevels.find(l => l.id === id) || null;
    return CampaignLevels.find(level => level.id === id) || null;
}
