// ==================== GAME CONFIGURATION ====================
// Edit this file to configure your game.

const GAME = {
    title: 'DOWZA',
    subtitle: 'VS. BOWZASHINE',
    version: 'v2',
    bgColor: '#3a0a0a',

    // Firebase - see README.md for setup instructions
    // Leave as-is to use local-only high scores
    firebase: {
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: "",
        appId: ""
    },
    firebasePath: 'highscores-dowza',
    localStoragePrefix: 'dowza',

    // Canvas resolution (384x216 = SNES-style, recommended)
    width: 384,
    height: 216,

    // Touch controls - each becomes a button on mobile
    // id: used as Engine.input[id]
    // label: button text
    // keys: keyboard codes that map to this control
    controls: [
        { id: 'left',  label: '◀',    keys: ['ArrowLeft', 'KeyA'] },
        { id: 'right', label: '▶',    keys: ['ArrowRight', 'KeyD'] },
        { id: 'jump',  label: 'JUMP', keys: ['Space', 'ArrowUp', 'KeyW'] },
        { id: 'fire',  label: 'FIRE', keys: ['KeyJ', 'KeyZ', 'ShiftLeft'] }
    ],

    // Desktop instructions (hidden on touch devices)
    instructions: [
        { label: 'MOVE', keys: 'Arrows or A/D' },
        { label: 'JUMP', keys: 'Space, W, or Up' },
        { label: 'FIRE', keys: 'J, Z, or Shift' }
    ]
};
