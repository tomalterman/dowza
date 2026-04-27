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
//
// Pit layout (gaps in row 13): cols 18-20, 46-48, 62-64, 96-98, 122-124
// (each 3 tiles, ~48 px -- well within the full-hold jump arc of ~115 px).
//
// Platform constraint: NEVER overhang a pit-launch column (the col directly
// left or right of a pit). Otherwise the platform's underside blocks
// Dowza's jump arc and he ghost-bonks off the bottom mid-leap. Verified at
// build time -- see _verifyPlatformPitClearance() below.
//
// Walkers ON platforms force engagement at platform height (a fireball
// fired from the ground can't reach an enemy on row 11 -- wrong lane).
// Spike walkers force fireball-or-jump-over (stomp damages Dowza).
const LEVEL_ROWS = [
    "................................................................................................................................................................", //  0
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
    "..........................#######.....................................######..............#####...........########..####........................................", // 11 platforms (each cleared from pit-launch cols)
    "................................................................................................................................................................", // 12
    "##################...#########################...#############...###############################...#######################...###################################"  // 13 ground with pits at 18-20, 46-48, 62-64, 96-98, 122-124
];

// Build-time check: a platform overhanging a pit-launch col would block the
// jump arc with its underside (real bug seen in v3 development). Fail loud
// at boot rather than producing a level the player can't traverse.
function _verifyPlatformPitClearance() {
    const ground = LEVEL_ROWS[13];
    const platforms = LEVEL_ROWS[11];
    for (let c = 0; c < ground.length; c++) {
        if (ground[c] !== '.') continue;  // not a pit col
        // Check the col immediately left (launch) and right (landing)
        for (const adj of [c - 1, c + 1]) {
            if (adj >= 0 && adj < ground.length && ground[adj] === '#' && platforms[adj] === '#') {
                console.error(`LEVEL: row 11 platform at col ${adj} overhangs pit-${c} launch/landing`);
            }
        }
    }
}
_verifyPlatformPitClearance();

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
    // For walkers ON platforms, y places bottom at the platform top (row 11
    // top = 176), so y = 176 - 12 = 164. PatrolMin/Max in those cases are
    // the platform's x range so the walker doesn't fall off.
    //
    // Walker placement (mix of ground walkers + walkers on platforms +
    // spike walkers below) builds the kind of vertical/lane variety that
    // forces real platforming decisions:
    walkerSpawns: [
        // Section 1 (0-12): intro walker, flat ground
        { x:   6 * 16, y: 13 * 16 - 12, patrolMin:   3 * 16, patrolMax:  12 * 16 },

        // Section 2 (12-25): post-pit ground walker (after pit at 18-20)
        { x:  23 * 16, y: 13 * 16 - 12, patrolMin:  22 * 16, patrolMax:  26 * 16 },

        // Section 3 (26-44): WALKER ON PLATFORM at row 11 cols 26-32 (7 wide).
        // Forces a jump-up engagement; fireball-from-ground can't reach.
        { x:  28 * 16, y: 11 * 16 - 12, patrolMin:  26 * 16, patrolMax:  33 * 16 },

        // Section 4 (44-62): post-pit ground walker (after pit at 46-48)
        { x:  55 * 16, y: 13 * 16 - 12, patrolMin:  50 * 16, patrolMax:  61 * 16 },

        // Section 5 (62-82): WALKER ON the wider platform at cols 70-75
        { x:  72 * 16, y: 11 * 16 - 12, patrolMin:  70 * 16, patrolMax:  76 * 16 },

        // Section 5 ground walker beneath the platform
        { x:  78 * 16, y: 13 * 16 - 12, patrolMin:  68 * 16, patrolMax:  84 * 16 },

        // Section 6 (84-100): WALKER ON platform 90-94
        { x:  92 * 16, y: 11 * 16 - 12, patrolMin:  90 * 16, patrolMax:  95 * 16 },

        // Section 7 (102-122): walker on the LONG sky-bridge
        { x: 110 * 16, y: 11 * 16 - 12, patrolMin: 106 * 16, patrolMax: 114 * 16 },

        // Section 8 (115-122): walker on staging platform 116-119
        { x: 117 * 16, y: 11 * 16 - 12, patrolMin: 116 * 16, patrolMax: 120 * 16 }
    ],

    // Spike walkers: stomp HURTS Dowza, only fireball kills. Placed at
    // pacing points after the player has practiced stomping a normal walker
    // so the visual + behavioral difference is the lesson.
    spikeWalkerSpawns: [
        // Section 3 (col 38): first introduction, on flat ground after the
        // post-pit recovery zone.
        { x:  38 * 16, y: 13 * 16 - 16, patrolMin:  35 * 16, patrolMax:  44 * 16 },
        // Section 5 (col 80): cluster -- spike + regular walker forces mixed tactics.
        { x:  80 * 16, y: 13 * 16 - 16, patrolMin:  76 * 16, patrolMax:  84 * 16 },
        // Section 7 (col 102): one before the long sky-bridge.
        { x: 102 * 16, y: 13 * 16 - 16, patrolMin: 100 * 16, patrolMax: 106 * 16 }
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

    // First pass: paint pit-bottom lava for every gap in row 13. The lava
    // sits at the bottom of the screen so a kid sees the orange glow under
    // any gap and reads it as "don't fall in here." Dowza never touches it
    // because the pit-fall respawn fires before he reaches that y.
    const groundRow = level.heightT - 1;
    for (let tx = startTx; tx <= endTx; tx++) {
        if (level.tiles[groundRow][tx] === 0) {  // gap in ground row
            const sx = tx * 16 - camX;
            // Draw a 16-tall lava strip at the bottom of the canvas + a soft
            // glow above the pit edge.
            drawPitLava(ctx, sx, h - 16);
        }
    }

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

function drawPitLava(ctx, sx, sy) {
    const time = (typeof gameFrame !== 'undefined' ? gameFrame : 0) / 30;
    const wave = Math.sin(time * 2 + sx * 0.04) * 1.2;
    ctx.fillStyle = '#7a1a04';
    ctx.fillRect(sx, sy, 16, 16);
    ctx.fillStyle = '#cc3818';
    ctx.fillRect(sx, sy + 2 + wave, 16, 12 - wave);
    ctx.fillStyle = '#ff7038';
    ctx.fillRect(sx + 2, sy + 4 + wave, 12, 4 - wave);
    ctx.fillStyle = '#ffcc40';
    ctx.fillRect(sx + 4, sy + 5 + wave, 8, 1);
    // Glow above the pit edge so the danger is visible from a distance
    ctx.fillStyle = 'rgba(255, 140, 60, 0.35)';
    ctx.fillRect(sx, sy - 6, 16, 6);
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
