// ==================== LEVEL DATA ====================
// Hand-authored single level: 160 tiles wide x 14 tiles tall.
//   Tile size from game-platformer.js: PF_TILE = 16, so level = 2560 x 224 px.
//
// Design rationale (informed by classic SMB 1-1 level-design analysis):
//   - Mechanics introduced sequentially in safe spaces: run -> stomp -> jump
//     onto a platform -> fireball -> two-platform jump combo -> cluster ->
//     long platform sky-bridge -> arena gate -> boss.
//   - Every visible platform is reachable. Platforms live at row 11 (2 tiles
//     above ground top), which is well within Dowza's full-hold jump arc
//     (~3.7 tiles of rise). Decorative-but-unreachable ledges are forbidden.
//   - Pacing alternates tension (clusters of walkers) with breaks (open
//     ground). No pits in v1 -- the only hazards are walker contact and
//     boss attacks.
//   - Boss arena is the rightmost 28 columns (cols 132-159) so the fight
//     has room to dodge multi-blast volleys.
//
// Tile legend:
//   . = PF_TILE_EMPTY (sky)
//   # = PF_TILE_SOLID (stone, collidable)

const LEVEL_WIDTH_T = 160;

// Level grid. Each row is EXACTLY 160 characters; verified at module load.
const LEVEL_ROWS = [
    "................................................................................................................................................................", //  0 sky
    "................................................................................................................................................................", //  1
    "................................................................................................................................................................", //  2
    "................................................................................................................................................................", //  3
    "................................................................................................................................................................", //  4
    "................................................................................................................................................................", //  5
    "................................................................................................................................................................", //  6
    "................................................................................................................................................................", //  7
    "................................................................................................................................................................", //  8
    "................................................................................................................................................................", //  9
    "................................................................................................................................................................", // 10
    "..............#####...........................####...####.........######................#####.............########............###...............................", // 11 reachable platforms
    "................................................................................................................................................................", // 12
    "################################################################################################################################################################"  // 13 ground (continuous, no pits)
];

// Catch typos at boot rather than at runtime collision math.
LEVEL_ROWS.forEach((r, i) => {
    if (r.length !== LEVEL_WIDTH_T) {
        console.error(`LEVEL row ${i} has length ${r.length}, expected ${LEVEL_WIDTH_T}`);
    }
});

// Convert character grid into integer tile grid the platformer expects.
function _buildLevelTiles() {
    const map = { '.': 0 /*PF_TILE_EMPTY*/, '#': 1 /*PF_TILE_SOLID*/ };
    return LEVEL_ROWS.map(row => row.split('').map(ch => map[ch] != null ? map[ch] : 0));
}

const LEVEL = {
    tiles: _buildLevelTiles(),
    widthT: LEVEL_WIDTH_T,
    heightT: 14,
    widthPx: LEVEL_WIDTH_T * 16,
    heightPx: 14 * 16,

    // Ground row 13 -> tile top y = 208. Entities standing on the ground place
    // their AABB top at (208 - entity.h).
    playerSpawn: { x: 24, y: 13 * 16 - 16 },  // 192: bottom rests at y=208

    // Walker enemies along the route. Each: {x, y, patrolMin, patrolMax} in
    // pixels. y places walker bottom at ground top (208), so y = 208 - 12 = 196.
    //
    // Walker placement maps to the level's pacing sections:
    //   Section 1 (0-12):    1 walker (intro)
    //   Section 2 (12-26):   1 walker (under first platform)
    //   Section 3 (26-44):   2 walkers (open ground, fireball / stomp practice)
    //   Section 4 (44-62):   1 walker (jump-combo bypass)
    //   Section 5 (62-82):   2 walkers (denser cluster below sky-bridge)
    //   Section 6 (82-102):  2 walkers (cluster + bypass platform)
    //   Section 7 (102-122): 1 walker on long sky-bridge ground
    //   Section 8 (122-130): 1 walker before the gate
    walkerSpawns: [
        { x:   8 * 16, y: 13 * 16 - 12, patrolMin:   4 * 16, patrolMax:  12 * 16 },  // 1
        { x:  22 * 16, y: 13 * 16 - 12, patrolMin:  18 * 16, patrolMax:  26 * 16 },  // 2
        { x:  30 * 16, y: 13 * 16 - 12, patrolMin:  27 * 16, patrolMax:  34 * 16 },  // 3
        { x:  40 * 16, y: 13 * 16 - 12, patrolMin:  37 * 16, patrolMax:  44 * 16 },  // 4
        { x:  58 * 16, y: 13 * 16 - 12, patrolMin:  44 * 16, patrolMax:  62 * 16 },  // 5 -- patrols across jump-combo
        { x:  74 * 16, y: 13 * 16 - 12, patrolMin:  64 * 16, patrolMax:  78 * 16 },  // 6
        { x:  86 * 16, y: 13 * 16 - 12, patrolMin:  82 * 16, patrolMax:  92 * 16 },  // 7
        { x:  96 * 16, y: 13 * 16 - 12, patrolMin:  93 * 16, patrolMax: 102 * 16 },  // 8
        { x: 116 * 16, y: 13 * 16 - 12, patrolMin: 102 * 16, patrolMax: 122 * 16 },  // 9 -- patrols under long sky-bridge
        { x: 128 * 16, y: 13 * 16 - 12, patrolMin: 124 * 16, patrolMax: 131 * 16 }   // 10 -- last walker before arena
    ],

    // Boss arena: rightmost 28 columns (cols 132-159). Camera locks to these
    // bounds when Dowza enters. Bowzashine spawns near the right wall.
    arena: {
        triggerX: 132 * 16,
        minTileX: 132,
        maxTileX: 159,
        cameraLockMin: 132 * 16,
        cameraLockMax: (160 * 16) - 384,
        // Boss bottom rests at ground top (208), so y = 208 - BOWZA_H (40) = 168.
        bossSpawn: { x: 150 * 16, y: 13 * 16 - 40 }
    }
};

// ---- Parallax + tile rendering helpers -----------------------------------
//
// drawBackgroundFar/Near are called by game.js from gameRender BEFORE the
// foreground tiles. Both layers are screen-space draws scrolling at fractional
// speed of the world camera, giving a parallax effect.

function drawBackgroundSky(ctx, w, h) {
    // Crimson gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2a0608');
    grad.addColorStop(0.55, '#5a1208');
    grad.addColorStop(1, '#7a1a08');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Three sun/moon glows to break up flat sky
    ctx.fillStyle = 'rgba(255,140,80,0.10)';
    ctx.beginPath();
    ctx.arc(70, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,180,100,0.08)';
    ctx.beginPath();
    ctx.arc(220, 35, 18, 0, Math.PI * 2);
    ctx.fill();
}

function drawBackgroundFar(ctx, w, h, cameraX) {
    // Distant volcanic mountains drawn as 5 silhouettes scrolling at 0.25x.
    const offset = -cameraX * 0.25;
    ctx.fillStyle = '#1a0405';
    const peaks = [
        { x: 0, h: 90, w: 90 },
        { x: 80, h: 110, w: 80 },
        { x: 160, h: 75, w: 100 },
        { x: 250, h: 100, w: 90 },
        { x: 340, h: 85, w: 85 },
        { x: 430, h: 105, w: 95 }
    ];
    // Repeat across the screen so motion is seamless
    for (let pass = -1; pass < 3; pass++) {
        const passOffset = offset + pass * 520;
        for (const p of peaks) {
            const baseX = p.x + passOffset;
            if (baseX > w + 100 || baseX + p.w < -100) continue;
            ctx.beginPath();
            ctx.moveTo(baseX, h);
            ctx.lineTo(baseX + p.w / 2, h - p.h);
            ctx.lineTo(baseX + p.w, h);
            ctx.closePath();
            ctx.fill();
        }
    }
}

function drawBackgroundNear(ctx, w, h, cameraX, time) {
    // Drifting embers in mid-distance, scrolling at 0.6x. Procedural so they
    // don't need persistent state -- compute positions from time + index.
    const offset = -cameraX * 0.6;
    for (let i = 0; i < 18; i++) {
        const seed = i * 37;
        const baseX = ((seed * 13) % 480) + offset;
        const wrappedX = ((baseX % 480) + 480) % 480 - 60;
        if (wrappedX > w + 20 || wrappedX < -20) continue;
        // Vertical drift via slow sine
        const y = ((seed * 7) % (h - 30)) + Math.sin((time * 0.6) + i) * 6;
        const sz = 1 + (i % 3);
        const alpha = 0.45 + 0.4 * Math.sin(time * 1.4 + i);
        ctx.fillStyle = `rgba(255, ${140 + (i % 3) * 30}, 60, ${alpha.toFixed(2)})`;
        ctx.fillRect(wrappedX, y, sz, sz);
    }
}

// ---- Foreground tile rendering ------------------------------------------
//
// Draws only tiles visible in the camera viewport. Each solid tile is
// procedurally textured with a deterministic crack pattern from the tile
// coordinates so it doesn't shimmer between frames.

function drawLevelTiles(ctx, level, cameraX, w, h) {
    const camX = Math.round(cameraX);
    const startTx = Math.max(0, Math.floor(camX / 16));
    const endTx   = Math.min(level.widthT - 1, Math.floor((camX + w) / 16));

    for (let ty = 0; ty < level.heightT; ty++) {
        for (let tx = startTx; tx <= endTx; tx++) {
            const tile = level.tiles[ty][tx];
            if (tile === 0) continue;
            const sx = tx * 16 - camX;
            const sy = ty * 16;
            if (tile === 1) drawSolidTile(ctx, sx, sy, tx, ty);
            else if (tile === 2) drawLavaTile(ctx, sx, sy, tx, ty);
        }
    }
}

function drawSolidTile(ctx, sx, sy, tx, ty) {
    // Base stone
    ctx.fillStyle = '#3a1a14';
    ctx.fillRect(sx, sy, 16, 16);

    // Top highlight (1px lighter band) -- only when there's no solid above
    ctx.fillStyle = '#5a2a18';
    ctx.fillRect(sx, sy, 16, 2);

    // Procedural crack: deterministic from tile coords
    const seed = (tx * 73856093) ^ (ty * 19349663);
    const crackX = (seed & 0x0f);
    const crackY = ((seed >> 4) & 0x0f);
    ctx.fillStyle = '#1a0606';
    ctx.fillRect(sx + crackX % 12 + 1, sy + 4 + (crackY % 8), 2, 1);
    ctx.fillRect(sx + (crackX * 3) % 12 + 1, sy + 9 + (crackY % 5), 1, 2);

    // Glowing lava-vein hint
    if ((seed & 0x07) === 0) {
        ctx.fillStyle = '#cc4014';
        ctx.fillRect(sx + 5, sy + 11, 4, 1);
    }
}

function drawLavaTile(ctx, sx, sy, tx, ty) {
    const time = (typeof gameFrame !== 'undefined' ? gameFrame : 0) / 30;
    const wave = Math.sin(time * 2 + tx * 0.4) * 1.2;
    ctx.fillStyle = '#7a1a04';
    ctx.fillRect(sx, sy, 16, 16);
    ctx.fillStyle = '#cc3818';
    ctx.fillRect(sx, sy + 2 + wave, 16, 12 - wave);
    ctx.fillStyle = '#ff7038';
    ctx.fillRect(sx + 2, sy + 4 + wave, 12, 4 - wave);
    ctx.fillStyle = '#ffcc40';
    ctx.fillRect(sx + 4, sy + 5 + wave, 8, 1);
}
