// ==================== GAME SOUNDS ====================
// Procedural Web Audio sounds for Dowza. Each sound is a function that
// receives the Sound engine (S) and uses S.playTone / S.playNoise.
//
// Engine-invoked sounds: 'start' (fired on game start) and 'gameOver'.
// All other sounds are triggered by game logic.

const SOUNDS = {
    // Title-tap to start: bright triadic rise
    start: (S) => {
        S.playTone(330, 440, 0.09, 'square', 0.28);
        setTimeout(() => S.playTone(440, 660, 0.09, 'square', 0.28), 90);
        setTimeout(() => S.playTone(660, 880, 0.13, 'square', 0.28), 180);
    },

    // Lose: low descending arpeggio
    gameOver: (S) => {
        S.playTone(380, 220, 0.3, 'square', 0.3);
        setTimeout(() => S.playTone(280, 160, 0.3, 'square', 0.3), 150);
        setTimeout(() => S.playTone(180, 90,  0.4, 'square', 0.3), 300);
    },

    // Mario-style "boing" jump: short rising pitch
    jump: (S) => {
        S.playTone(280, 540, 0.07, 'square', 0.16);
    },

    // Stomp on a regular enemy: low percussive thud + small noise burst
    stomp: (S) => {
        S.playTone(220, 110, 0.06, 'square', 0.2);
        S.playNoise(0.04, 600, 200);
    },

    // Throwing a fireball: zappy ascending tone
    fireball: (S) => {
        S.playTone(420, 820, 0.08, 'square', 0.16);
    },

    // Walker death: 2-tone descending pop
    enemyDie: (S) => {
        S.playTone(700, 420, 0.06, 'square', 0.2);
        setTimeout(() => S.playTone(420, 240, 0.07, 'square', 0.2), 50);
    },

    // Dowza takes damage: dissonant low buzz + noise
    playerHit: (S) => {
        S.playTone(280, 110, 0.18, 'sawtooth', 0.32);
        S.playNoise(0.1, 400, 100);
    },

    // Bowzashine fires a shine volley: bright shimmer
    shine: (S) => {
        S.playTone(820, 1180, 0.12, 'square', 0.18);
        setTimeout(() => S.playTone(1100, 880, 0.08, 'sine', 0.14), 60);
    },

    // Boss shield breaks (fireball lands during SHIELDED): meaty crunch
    bossStun: (S) => {
        S.playNoise(0.16, 1200, 200);
        S.playTone(180, 80, 0.18, 'sawtooth', 0.32);
    },

    // Stomp while STUNNED damages boss: bigger thud
    bossHit: (S) => {
        S.playTone(160, 70, 0.18, 'sawtooth', 0.34);
        S.playNoise(0.08, 800, 200);
        setTimeout(() => S.playTone(80, 40, 0.16, 'sawtooth', 0.28), 40);
    },

    // Boss defeated: dramatic descending wail
    bossDefeat: (S) => {
        S.playTone(800, 100, 0.6, 'sawtooth', 0.32);
        setTimeout(() => S.playNoise(0.4, 600, 100), 100);
    },

    // Player victory: triumphant rising fanfare
    win: (S) => {
        S.playTone(523, 659, 0.12, 'square', 0.3);  // C5 -> E5
        setTimeout(() => S.playTone(659, 784, 0.12, 'square', 0.3), 110);  // E5 -> G5
        setTimeout(() => S.playTone(784, 1047, 0.22, 'square', 0.3), 220); // G5 -> C6
    },

    // Footstep tick while running. Tiny low-pitched click.
    footstep: (S) => {
        S.playTone(140, 100, 0.025, 'square', 0.08);
    },

    // Landing thud after a jump or fall (only when impact velocity is meaningful).
    land: (S) => {
        S.playTone(180, 90, 0.06, 'square', 0.16);
        S.playNoise(0.04, 400, 100);
    },

    // Approach-arena rumble. Plays once when Dowza first sees the gate column.
    arenaApproach: (S) => {
        S.playNoise(0.5, 220, 80);
        S.playTone(120, 80, 0.4, 'sawtooth', 0.18);
    },

    // Boss-volley telegraph. Short shimmer right before shine blasts spawn.
    shineCharge: (S) => {
        S.playTone(600, 900, 0.18, 'sine', 0.14);
    },

    // Fireball wall-spark. Distinct from enemyDie so the kid knows the
    // fireball missed.
    fireballWall: (S) => {
        S.playNoise(0.04, 1200, 600);
    },

    // Falling into a pit + respawning at last-safe-ground. Two-stage:
    // descending whoosh, then a small bonk on respawn.
    fall: (S) => {
        S.playTone(600, 100, 0.35, 'sawtooth', 0.25);
        setTimeout(() => S.playNoise(0.08, 600, 200), 350);
    }
};
