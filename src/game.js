// ==================== DOWZA: GAME ORCHESTRATOR ====================
// Engine calls (per frame): gameUpdate(dt), gameRender(ctx, w, h),
// gameTitleRender(ctx, w, h, time), gameOverRender(ctx, w, h).
// Engine calls gameInit() on game start and on restart (after taking i-frames-
// triggered HP=0 game over). All entity/world state is rebuilt from scratch
// in gameInit so restart is clean.

document.title = GAME.title;

// Track total elapsed frames (used for animation phases in render).
let gameFrame = 0;

function gameInit() {
    // Engine HP UI uses these. Dowza has 6 HP per the brainstorm.
    Engine.state.health = 6;
    Engine.state.maxHealth = 6;
    Engine.state.score = 0;       // suppress engine high-score path

    // Core state
    Engine.player = makeDowza(LEVEL.playerSpawn.x, LEVEL.playerSpawn.y);
    Engine.walkers = LEVEL.walkerSpawns.map(makeWalker);
    Engine.fireballs = [];
    Engine.shineBlasts = [];
    Engine.bowzashine = null;     // spawned when Dowza enters arena
    Engine.arenaTriggered = false;
    Engine.win = false;
    Engine.winFrames = 0;

    // Camera
    Engine.camera = PF_cameraInit();

    // Physics accumulator state for fixed-timestep wrapper
    Engine.physAcc = { acc: 0 };

    gameFrame = 0;
}

function gameUpdate(engineDt) {
    PF_step(Engine.physAcc, engineDt, function (dt) {
        physicsTick(dt);
    });
}

function physicsTick(dt) {
    gameFrame++;

    const d = Engine.player;
    if (!d) return;

    dowzaTick(d, LEVEL);

    for (let i = 0; i < Engine.walkers.length; i++) {
        const w = Engine.walkers[i];
        walkerTick(w, LEVEL);
        const keep = resolvePlayerWalker(d, w);
        if (!keep) { Engine.walkers.splice(i, 1); i--; }
    }

    for (let i = 0; i < Engine.fireballs.length; i++) {
        const fb = Engine.fireballs[i];
        fireballTick(fb, LEVEL);
        if (fb.alive) {
            for (const w of Engine.walkers) {
                if (resolveFireballWalker(fb, w)) break;
            }
        }
        if (fb.alive && Engine.bowzashine) {
            resolveFireballBoss(fb, Engine.bowzashine);
        }
        if (!fb.alive) { Engine.fireballs.splice(i, 1); i--; }
    }

    if (!Engine.arenaTriggered && d.x + d.w / 2 >= LEVEL.arena.triggerX) {
        Engine.arenaTriggered = true;
        Engine.camera.lockMin = LEVEL.arena.cameraLockMin;
        Engine.camera.lockMax = LEVEL.arena.cameraLockMax;
        Engine.bowzashine = makeBowzashine(LEVEL.arena.bossSpawn.x, LEVEL.arena.bossSpawn.y);
    }

    if (Engine.bowzashine) {
        bowzashineTick(Engine.bowzashine, d, LEVEL);
        resolvePlayerBoss(d, Engine.bowzashine);
    }

    for (let i = 0; i < Engine.shineBlasts.length; i++) {
        const s = Engine.shineBlasts[i];
        shineTick(s, LEVEL);
        if (s.alive) resolvePlayerShine(d, s);
        if (!s.alive) { Engine.shineBlasts.splice(i, 1); i--; }
    }

    PF_cameraFollow(Engine.camera, d, LEVEL, GAME.width);

    if (Engine.win) {
        d.frozen = true;
        Engine.winFrames++;
    }
}

function gameRender(ctx, w, h) {
    const camX = PF_cameraSnapX(Engine.camera);
    const time = gameFrame / 60;

    drawBackgroundSky(ctx, w, h);
    drawBackgroundFar(ctx, w, h, camX);
    drawBackgroundNear(ctx, w, h, camX, time);
    drawLevelTiles(ctx, LEVEL, camX, w, h);

    // Decorative arena gate flames (visible when Dowza is near the arena entrance).
    if (camX + w >= LEVEL.arena.triggerX - 16 && camX <= LEVEL.arena.triggerX + 16) {
        drawArenaGate(ctx, LEVEL.arena.triggerX - camX, time);
    }

    for (const wk of Engine.walkers) drawWalker(ctx, wk, camX);
    for (const fb of Engine.fireballs) drawFireball(ctx, fb, camX);
    if (Engine.bowzashine) drawBowzashine(ctx, Engine.bowzashine, camX, time);
    for (const s of Engine.shineBlasts) drawShineBlast(ctx, s, camX);
    drawDowza(ctx, Engine.player, camX);

    if (Engine.bowzashine && Engine.bowzashine.state !== 'ENTERING' && !Engine.win) {
        drawBossHpBar(ctx, Engine.bowzashine);
    }

    if (Engine.win) {
        drawWinScreen(ctx, w, h, Engine.winFrames);
    }
}

function gameTitleRender(ctx, w, h, time) {
    drawTitleBackdrop(ctx, w, h, time);
}

function gameOverRender(ctx, w, h) {
    if (Engine.player && Engine.camera) {
        const camX = PF_cameraSnapX(Engine.camera);
        drawBackgroundSky(ctx, w, h);
        drawBackgroundFar(ctx, w, h, camX);
        drawLevelTiles(ctx, LEVEL, camX, w, h);
        for (const wk of Engine.walkers) drawWalker(ctx, wk, camX);
        if (Engine.bowzashine) drawBowzashine(ctx, Engine.bowzashine, camX, gameFrame / 60);
        drawDowza(ctx, Engine.player, camX);
    }
}

// ---- Win screen overlay -------------------------------------------------
function drawWinScreen(ctx, w, h, winFrames) {
    const alpha = Math.min(0.7, winFrames / 90);
    ctx.fillStyle = `rgba(40, 8, 4, ${alpha.toFixed(2)})`;
    ctx.fillRect(0, 0, w, h);

    if (winFrames < 30) return;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('DOWZA WINS!', w / 2 + 2, h / 2 - 18 + 2);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('DOWZA WINS!', w / 2, h / 2 - 18);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('BOWZASHINE DEFEATED', w / 2, h / 2 + 4);

    if (winFrames > 90 && Math.sin(winFrames / 12) > 0) {
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText('Press SPACE or tap to play again', w / 2, h / 2 + 28);
    }

    ctx.textAlign = 'left';
}

// ---- Win-screen restart hook --------------------------------------------
//
// The engine's input.js handles restart on the gameOver state. Win is our
// state, so we add our own listener that fires when the win overlay has been
// up for >= 60 frames (lockout to avoid accidental skip during the fanfare).

(function installWinRestartHook() {
    const winFrameThreshold = 60;
    function shouldRestart() { return Engine.win && Engine.winFrames > winFrameThreshold; }
    document.addEventListener('keydown', function (e) {
        if (!shouldRestart()) return;
        if (['Space', 'Enter', 'KeyJ', 'KeyZ', 'ArrowUp', 'KeyW'].includes(e.code)) {
            e.preventDefault();
            restartGame();
        }
    });
    function tapRestart(e) { if (shouldRestart()) restartGame(); }
    window.addEventListener('click', tapRestart);
    window.addEventListener('touchstart', tapRestart, { passive: true });
})();

// ---- Override engine drawUI to suppress the SCORE label ------------------
//
// Dowza is a beat-the-boss game, not a score-chase, so we hide the engine's
// "SCORE: 000000" overlay. JS function-hoisting in the concatenated bundle
// means this declaration overrides the one in src/engine/screens.js because
// game.js loads after it. Hearts (HP) are kept verbatim.

function drawUI(ctx) {
    // Health hearts only -- skip the score line
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4757';
    ctx.font = '14px monospace';
    for (let i = 0; i < Engine.state.maxHealth; i++) {
        const x = GAME.width - 16 - i * 14;
        const y = 14;
        if (i < Engine.state.health) {
            drawHeart(ctx, x, y, 5, '#ff4757');
        } else {
            drawHeart(ctx, x, y, 5, '#333');
        }
    }
    ctx.textAlign = 'left';
}

// ---- HUD: boss HP bar ---------------------------------------------------
function drawBossHpBar(ctx, b) {
    const x = 96, y = 6, w = 192, h = 8;
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = '#330';
    ctx.fillRect(x, y, w, h);
    const pct = b.hp / 3;
    ctx.fillStyle = '#ffaa20';
    ctx.fillRect(x, y, Math.max(0, w * pct), h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('BOWZASHINE', x + w / 2, y - 4);
    ctx.textAlign = 'left';
}

// ---- Decorative arena gate flames ---------------------------------------
function drawArenaGate(ctx, screenX, time) {
    for (let i = 0; i < 7; i++) {
        const flameY = 80 + i * 14;
        const flicker = Math.sin(time * 4 + i * 1.3) * 2;
        ctx.fillStyle = '#ffaa30';
        ctx.fillRect(screenX - 2, flameY + flicker, 4, 6);
        ctx.fillStyle = '#ffe060';
        ctx.fillRect(screenX - 1, flameY + flicker + 1, 2, 3);
    }
}

// ---- Title screen backdrop ----------------------------------------------
function drawTitleBackdrop(ctx, w, h, time) {
    drawBackgroundSky(ctx, w, h);
    drawBackgroundFar(ctx, w, h, time * 30);
    drawBackgroundNear(ctx, w, h, time * 30, time);

    // Ground strip
    ctx.fillStyle = '#3a1a14';
    ctx.fillRect(0, h - 28, w, 28);
    ctx.fillStyle = '#5a2a18';
    ctx.fillRect(0, h - 28, w, 2);

    // Idle Dowza near center
    const bob = Math.sin(time * 2) * 0.6;
    const fake = {
        x: w / 2 - DOWZA_W / 2,
        y: h - 28 - DOWZA_H + bob,
        prevY: h - 28 - DOWZA_H + bob,
        w: DOWZA_W, h: DOWZA_H,
        facing: 1,
        state: 'idle',
        animFrame: Math.floor(time * 8),
        iFrames: 0
    };
    drawDowza(ctx, fake, 0);

    // Atmospheric tagline below the engine's subtitle
    ctx.fillStyle = 'rgba(255, 80, 30, 0.85)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('beat the boss of the fire world', w / 2, h / 2 + 38);
    ctx.textAlign = 'left';
}
