// ==================== GAME ENTITIES ====================
// Dowza, Walker enemy, Fireball projectile, Bowzashine boss. Each entity is
// a plain object created via a factory function. Entity ticks live here;
// sprite rendering lives in game-render.js.
//
// Conventions:
//   - Position (x, y) is the AABB top-left in world pixels.
//   - vx, vy are pixels per fixed tick (1/60 s).
//   - All entities expose w, h for collision; PF_aabbOverlap pairs them.

// =====================================================================
// DOWZA (player) ------------------------------------------------------
// =====================================================================

const DOWZA_W = 12;
const DOWZA_H = 16;

function makeDowza(spawnX, spawnY) {
    return {
        x: spawnX, y: spawnY,
        prevX: spawnX, prevY: spawnY,
        vx: 0, vy: 0,
        w: DOWZA_W, h: DOWZA_H,
        facing: 1,            // 1 = right, -1 = left
        onGround: false,
        coyote: 0,            // frames remaining of post-walkoff jump grace
        buffer: 0,            // frames remaining of queued jump
        jumpHeld: false,      // tracks whether jump is currently held
        prevJumpInput: false, // for rising-edge detection
        prevFireInput: false,
        fireCooldown: 0,
        hp: 6,
        maxHp: 6,
        iFrames: 0,
        state: 'idle',        // idle | run | jump | fall | hurt
        stateFrames: 0,
        animFrame: 0,
        alive: true,
        // Win-state freeze: when set, Dowza stops accepting input and idles
        frozen: false
    };
}

function dowzaTick(d, level) {
    d.prevX = d.x;
    d.prevY = d.y;
    d.stateFrames++;
    d.animFrame++;
    if (d.fireCooldown > 0) d.fireCooldown--;
    if (d.iFrames > 0) d.iFrames--;

    // ---- Read input (rising edges + held flags) ----
    const left = !d.frozen && Engine.input.left;
    const right = !d.frozen && Engine.input.right;
    const jumpHeld = !d.frozen && Engine.input.jump;
    const jumpEdge = jumpHeld && !d.prevJumpInput;
    const fireHeld = !d.frozen && Engine.input.fire;
    const fireEdge = fireHeld && !d.prevFireInput;
    d.prevJumpInput = jumpHeld;
    d.prevFireInput = fireHeld;

    // ---- Horizontal acceleration / friction ----
    if (left && !right) {
        d.vx -= PF_RUN_ACCEL;
        d.facing = -1;
    } else if (right && !left) {
        d.vx += PF_RUN_ACCEL;
        d.facing = 1;
    } else {
        d.vx *= PF_FRICTION;
        if (Math.abs(d.vx) < 0.05) d.vx = 0;
    }
    if (d.vx > PF_RUN_MAX) d.vx = PF_RUN_MAX;
    if (d.vx < -PF_RUN_MAX) d.vx = -PF_RUN_MAX;

    // ---- Coyote + jump buffer bookkeeping ----
    if (d.onGround) {
        d.coyote = PF_COYOTE_FRAMES;
    } else if (d.coyote > 0) {
        d.coyote--;
    }
    if (jumpEdge) {
        d.buffer = PF_JUMP_BUFFER;
    } else if (d.buffer > 0) {
        d.buffer--;
    }

    // ---- Jump trigger (consume buffer when jumpable) ----
    const canJump = d.coyote > 0 || d.onGround;
    if (d.buffer > 0 && canJump) {
        d.vy = PF_JUMP_VEL;
        d.coyote = 0;
        d.buffer = 0;
        d.onGround = false;
        if (typeof Sound !== 'undefined') Sound.play('jump');
    }

    // ---- Variable jump height: release-jump caps upward velocity ----
    if (!jumpHeld && d.vy < 0) {
        d.vy *= PF_JUMP_CUTOFF;
        // After applying once, ensure we don't keep cutting on subsequent ticks
        if (Math.abs(d.vy) < 0.5) d.vy = 0;
    }

    // ---- Apply gravity ----
    d.vy += PF_GRAVITY;
    if (d.vy > PF_MAX_FALL) d.vy = PF_MAX_FALL;

    // ---- Move + collide ----
    PF_moveAndCollide(d, level);

    // Clamp horizontally to level bounds (no falling off the world)
    if (d.x < 0) { d.x = 0; d.vx = 0; }
    if (d.x + d.w > level.widthPx) {
        d.x = level.widthPx - d.w;
        d.vx = 0;
    }
    // Below-world safety: shouldn't happen (no pits) but defensive
    if (d.y > level.heightPx + 64) {
        d.hp = 0;
    }

    // ---- Fire input (entity creation lives here so we can set facing/origin) ----
    if (fireEdge && d.fireCooldown <= 0) {
        spawnFireball(d.x + d.w / 2 + d.facing * 6, d.y + 5, d.facing);
        d.fireCooldown = 18;
        if (typeof Sound !== 'undefined') Sound.play('fireball');
    }

    // ---- State machine ----
    let next = d.state;
    if (d.iFrames > 50 && d.state !== 'hurt') {  // first ~10 frames after damage flash as hurt
        next = 'hurt';
    } else if (!d.onGround && d.vy < 0) {
        next = 'jump';
    } else if (!d.onGround && d.vy > 0) {
        next = 'fall';
    } else if (d.onGround && Math.abs(d.vx) > 0.15) {
        next = 'run';
    } else if (d.onGround) {
        next = 'idle';
    }
    if (next !== d.state) {
        d.state = next;
        d.stateFrames = 0;
    }
}

// Damage helper: walker contact, shine blast, shielded-boss touch.
function dowzaTakeHit(d, fromX) {
    if (d.iFrames > 0 || !d.alive) return;
    d.hp--;
    d.iFrames = 60;
    // Knockback: away from the hit source, slight upward kick
    const dir = (d.x + d.w / 2 < fromX) ? -1 : 1;
    d.vx = dir * 2.0;
    d.vy = -3.0;
    if (typeof Sound !== 'undefined') Sound.play('playerHit');
    if (d.hp <= 0) {
        d.alive = false;
        Engine.state.health = 0;  // engine will trigger gameOver path
    } else {
        Engine.state.health = d.hp;
    }
}

// Stomp bounce helper: gives Dowza an upward kick after squashing something.
function dowzaStompBounce(d) {
    d.vy = PF_JUMP_VEL * 0.7;
    d.onGround = false;
    d.coyote = 0;
}

// =====================================================================
// WALKER ENEMY --------------------------------------------------------
// =====================================================================
//
// Small fire-imp that paces between patrolMin and patrolMax. Stomp kills it
// (Mario-canon). Fireball kills it. Touching its side costs Dowza 1 HP.

const WALKER_W = 12;
const WALKER_H = 12;

function makeWalker(spec) {
    return {
        x: spec.x, y: spec.y,
        prevX: spec.x, prevY: spec.y,
        vx: -0.65, vy: 0,                 // start moving left
        w: WALKER_W, h: WALKER_H,
        patrolMin: spec.patrolMin,
        patrolMax: spec.patrolMax - WALKER_W,  // upper bound is left-edge constraint
        alive: true,
        deathFrames: 0,                    // when >0, walker is dying (squashed render)
        animFrame: 0
    };
}

function walkerTick(w, level) {
    w.prevX = w.x; w.prevY = w.y;
    w.animFrame++;

    if (!w.alive) {
        w.deathFrames++;
        return;
    }

    // Apply gravity + collide so it sits on platforms cleanly
    w.vy += PF_GRAVITY;
    if (w.vy > PF_MAX_FALL) w.vy = PF_MAX_FALL;
    const hit = PF_moveAndCollide(w, level);

    // Reverse on wall contact
    if (hit.hitLeft) w.vx = Math.abs(w.vx);
    if (hit.hitRight) w.vx = -Math.abs(w.vx);

    // Reverse on patrol bounds
    if (w.x <= w.patrolMin && w.vx < 0) w.vx = Math.abs(w.vx);
    if (w.x >= w.patrolMax && w.vx > 0) w.vx = -Math.abs(w.vx);
}

// Resolve player-vs-walker contact. Stomp = walker dies + Dowza bounces.
// Side touch = Dowza takes a hit. Returns true if the walker should be kept
// active (alive or in death animation).
function resolvePlayerWalker(d, w) {
    if (!w.alive) return w.deathFrames < 18;
    if (!PF_aabbOverlap(d, w)) return true;

    // Stomp criterion: previous-frame Dowza-bottom was above walker-top AND
    // current vy is downward. This avoids ambiguous diagonal-touch cases.
    const prevBottom = d.prevY + d.h;
    const wTop = w.y;
    if (d.vy > 0 && prevBottom <= wTop + 2) {
        // STOMP
        w.alive = false;
        w.deathFrames = 1;
        dowzaStompBounce(d);
        if (typeof Sound !== 'undefined') Sound.play('stomp');
        // Squash particles
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            Engine.spawnParticle(
                w.x + w.w / 2, w.y + w.h / 2,
                Math.cos(ang) * 1.4, Math.sin(ang) * 1.4 - 0.5,
                2, '#ff8040', 22
            );
        }
        return true;
    }

    // Side-touch hurts Dowza
    dowzaTakeHit(d, w.x + w.w / 2);
    return true;
}

// =====================================================================
// FIREBALL PROJECTILE ------------------------------------------------
// =====================================================================
//
// Spawned by Dowza pressing fire. Travels horizontally (no gravity in v1
// for readability), dies on enemy hit, wall hit, or life expiry.

const FIREBALL_W = 6;
const FIREBALL_H = 6;
const FIREBALL_SPEED = 3.6;
const FIREBALL_LIFE = 60;

function spawnFireball(x, y, facing) {
    const fb = {
        x: x - FIREBALL_W / 2, y: y - FIREBALL_H / 2,
        prevX: x - FIREBALL_W / 2, prevY: y - FIREBALL_H / 2,
        vx: FIREBALL_SPEED * facing, vy: 0,
        w: FIREBALL_W, h: FIREBALL_H,
        life: FIREBALL_LIFE,
        alive: true,
        animFrame: 0
    };
    if (!Engine.fireballs) Engine.fireballs = [];
    Engine.fireballs.push(fb);
    return fb;
}

function fireballTick(fb, level) {
    if (!fb.alive) return;
    fb.prevX = fb.x; fb.prevY = fb.y;
    fb.animFrame++;
    fb.life--;
    if (fb.life <= 0) { fb.alive = false; return; }

    // Move + check wall collision via tile sample at leading edge
    fb.x += fb.vx;
    const tx = Math.floor(((fb.vx > 0 ? fb.x + fb.w : fb.x) - 0.001) / PF_TILE);
    const ty = Math.floor((fb.y + fb.h / 2) / PF_TILE);
    if (PF_isSolid(level, tx, ty)) {
        fb.alive = false;
        // Wall sparks
        for (let i = 0; i < 4; i++) {
            Engine.spawnParticle(
                fb.x + fb.w / 2, fb.y + fb.h / 2,
                (Math.random() - 0.5) * 2, -Math.random() * 2,
                1, '#ffcc40', 12
            );
        }
        return;
    }
    // Off-world cleanup
    if (fb.x + fb.w < 0 || fb.x > level.widthPx) fb.alive = false;
}

// Resolve fireball-vs-walker. Returns true if fireball died this call.
function resolveFireballWalker(fb, w) {
    if (!fb.alive || !w.alive) return false;
    if (!PF_aabbOverlap(fb, w)) return false;

    fb.alive = false;
    w.alive = false;
    w.deathFrames = 1;
    if (typeof Sound !== 'undefined') Sound.play('enemyDie');
    for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        Engine.spawnParticle(
            w.x + w.w / 2, w.y + w.h / 2,
            Math.cos(ang) * 1.8, Math.sin(ang) * 1.8 - 0.7,
            2, '#ff6028', 26
        );
    }
    return true;
}

// =====================================================================
// BOWZASHINE BOSS -----------------------------------------------------
// =====================================================================
//
// State machine:
//   ENTERING -> SHIELDED -> STUNNED -> SHIELDED -> ... -> DEFEATED
//                ^                       |
//                |       (after stomp)   v
//                +-- DAMAGED (i-frames) -+
//
// SHIELDED  : fires shine-blasts on a timer; touch costs Dowza 1 HP; stomp
//             from Dowza costs Dowza 1 HP (no boss damage); fireball ->
//             STUNNED.
// STUNNED   : 75 frames of vulnerability. Fireballs do nothing in this state
//             (intentional: forces Dowza to commit to the stomp). Stomp -> DAMAGED.
// DAMAGED   : 30 frames i-frames + flash. Returns to SHIELDED unless hp == 0.
// DEFEATED  : 90-frame fall+collapse. Sets Engine.win = true at end.
// ENTERING  : 60-frame rise-from-lava intro on first arena entry.

const BOWZA_W = 36;
const BOWZA_H = 40;
const BOWZA_MAX_HP = 3;

function makeBowzashine(spawnX, spawnY) {
    return {
        x: spawnX, y: spawnY,
        prevX: spawnX, prevY: spawnY,
        vx: 0, vy: 0,
        w: BOWZA_W, h: BOWZA_H,
        hp: BOWZA_MAX_HP,
        state: 'ENTERING',
        stateFrames: 0,
        attackTimer: 110,
        animFrame: 0,
        defeated: false
    };
}

function bowzashineTick(b, dowza, level) {
    b.prevX = b.x; b.prevY = b.y;
    b.stateFrames++;
    b.animFrame++;

    // Ground row 13 -> top y = 208. Boss bottom rests at 208, so resting top = 168.
    const groundY = 13 * 16 - b.h;  // 168 for BOWZA_H=40

    if (b.state === 'ENTERING') {
        // Rise from below the floor over 60 frames: starts ~32px below resting,
        // ends at resting position so feet sit cleanly on the ground tile.
        const t = Math.min(1, b.stateFrames / 60);
        b.y = groundY + (1 - t) * 32;
        if (b.stateFrames >= 60) {
            b.state = 'SHIELDED';
            b.stateFrames = 0;
            b.attackTimer = 60;
        }
        return;
    }

    if (b.state === 'SHIELDED') {
        b.y = groundY + Math.sin(b.animFrame * 0.05) * 1.5;
        b.attackTimer--;
        if (b.attackTimer <= 0) {
            spawnShineVolley(b, dowza);
            b.attackTimer = 130;
        }
        return;
    }

    if (b.state === 'STUNNED') {
        b.y = groundY + Math.sin(b.animFrame * 0.3) * 3;
        if (b.stateFrames >= 75) {
            b.state = 'SHIELDED';
            b.stateFrames = 0;
            b.attackTimer = 80;
        }
        return;
    }

    if (b.state === 'DAMAGED') {
        b.y = groundY + Math.sin(b.animFrame * 0.5) * 2;
        if (b.stateFrames >= 30) {
            if (b.hp <= 0) {
                b.state = 'DEFEATED';
                b.stateFrames = 0;
                if (typeof Sound !== 'undefined') Sound.play('bossDefeat');
            } else {
                b.state = 'SHIELDED';
                b.stateFrames = 0;
                b.attackTimer = 60;
            }
        }
        return;
    }

    if (b.state === 'DEFEATED') {
        // Fall into the void: 90 frames of acceleration + particle bursts
        if (b.stateFrames < 90) {
            b.y += 0.6 + b.stateFrames * 0.05;
            // explosion particles
            if (b.stateFrames % 4 === 0) {
                for (let i = 0; i < 6; i++) {
                    const ang = (i / 6) * Math.PI * 2 + Math.random() * 0.4;
                    Engine.spawnParticle(
                        b.x + b.w / 2 + (Math.random() - 0.5) * b.w * 0.6,
                        b.y + b.h / 2,
                        Math.cos(ang) * 2, Math.sin(ang) * 2 - 1,
                        2 + Math.floor(Math.random() * 2),
                        ['#ffcc40', '#ff7028', '#cc3010'][i % 3],
                        24
                    );
                }
            }
        } else if (!b.defeated) {
            b.defeated = true;
            Engine.win = true;
            if (typeof Sound !== 'undefined') Sound.play('win');
        }
        return;
    }
}

// Resolve player-vs-boss contact. Returns nothing; mutates Dowza/boss state.
function resolvePlayerBoss(d, b) {
    if (!d.alive || b.state === 'DEFEATED' || b.state === 'ENTERING') return;
    if (!PF_aabbOverlap(d, b)) return;

    if (b.state === 'STUNNED') {
        // Stomp criterion: was previous-frame bottom above boss top?
        const prevBottom = d.prevY + d.h;
        if (d.vy > 0 && prevBottom <= b.y + 4) {
            // DAMAGE
            b.hp--;
            b.state = 'DAMAGED';
            b.stateFrames = 0;
            dowzaStompBounce(d);
            d.vy *= 0.85;  // softer bounce off boss than walker
            if (typeof Sound !== 'undefined') Sound.play('bossHit');
            for (let i = 0; i < 14; i++) {
                const ang = (i / 14) * Math.PI * 2;
                Engine.spawnParticle(
                    b.x + b.w / 2, b.y + 2,
                    Math.cos(ang) * 2.4, Math.sin(ang) * 2.4 - 1,
                    2 + (i % 2),
                    ['#ffe040', '#ffaa20', '#ff6020'][i % 3],
                    32
                );
            }
            return;
        }
    }

    if (b.state === 'SHIELDED' || b.state === 'STUNNED' || b.state === 'DAMAGED') {
        // Side-touch always hurts (even DAMAGED state -- don't stomp the corpse)
        dowzaTakeHit(d, b.x + b.w / 2);
    }
}

// Resolve fireball-vs-boss. Returns true if fireball was consumed.
function resolveFireballBoss(fb, b) {
    if (!fb.alive) return false;
    if (b.state !== 'SHIELDED') return false;  // stuns only happen from SHIELDED
    if (!PF_aabbOverlap(fb, b)) return false;

    fb.alive = false;
    b.state = 'STUNNED';
    b.stateFrames = 0;
    if (typeof Sound !== 'undefined') Sound.play('bossStun');
    // Shield-shatter sparks
    for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        Engine.spawnParticle(
            b.x + b.w / 2, b.y + b.h / 2,
            Math.cos(ang) * 2.6, Math.sin(ang) * 2.6,
            2, '#ffe888',
            28
        );
    }
    return true;
}

// =====================================================================
// SHINE BLAST (boss projectile) --------------------------------------
// =====================================================================

const SHINE_W = 8;
const SHINE_H = 8;
const SHINE_LIFE = 110;

function spawnShineVolley(b, target) {
    if (typeof Sound !== 'undefined') Sound.play('shine');
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.45;
    const tx = target.x + target.w / 2;
    const ty = target.y + target.h / 2;
    const dx = tx - cx, dy = ty - cy;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const baseVx = dx / dist;
    const baseVy = dy / dist;

    // 3 blasts in a slight fan
    const angles = [-0.18, 0, 0.18];
    if (!Engine.shineBlasts) Engine.shineBlasts = [];
    for (const a of angles) {
        const cosA = Math.cos(a), sinA = Math.sin(a);
        const vx = (baseVx * cosA - baseVy * sinA) * 2.4;
        const vy = (baseVx * sinA + baseVy * cosA) * 2.4;
        Engine.shineBlasts.push({
            x: cx - SHINE_W / 2, y: cy - SHINE_H / 2,
            prevX: cx - SHINE_W / 2, prevY: cy - SHINE_H / 2,
            vx, vy,
            w: SHINE_W, h: SHINE_H,
            life: SHINE_LIFE,
            alive: true,
            animFrame: 0
        });
    }
}

function shineTick(s, level) {
    if (!s.alive) return;
    s.prevX = s.x; s.prevY = s.y;
    s.life--;
    s.animFrame++;
    if (s.life <= 0) { s.alive = false; return; }
    s.x += s.vx;
    s.y += s.vy;
    // Wall hit: any solid tile on path
    const tx = Math.floor((s.x + s.w / 2) / PF_TILE);
    const ty = Math.floor((s.y + s.h / 2) / PF_TILE);
    if (PF_isSolid(level, tx, ty)) {
        s.alive = false;
        for (let i = 0; i < 4; i++) {
            Engine.spawnParticle(
                s.x + s.w / 2, s.y + s.h / 2,
                (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
                1, '#ffe888', 14
            );
        }
    }
}

function resolvePlayerShine(d, s) {
    if (!s.alive || !d.alive) return;
    if (!PF_aabbOverlap(d, s)) return;
    s.alive = false;
    dowzaTakeHit(d, s.x + s.w / 2);
    for (let i = 0; i < 6; i++) {
        Engine.spawnParticle(
            s.x + s.w / 2, s.y + s.h / 2,
            (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
            1, '#ffeeaa', 14
        );
    }
}
