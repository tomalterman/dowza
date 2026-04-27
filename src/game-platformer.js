// ==================== PLATFORMER FOUNDATION ====================
// Reusable platformer primitives that sit on top of the arcade-template
// engine without touching it. Migrate back to ../arcade-template/src/engine
// only after a second platformer game proves the abstractions (n>=2 rule).
//
// Globals (no module system in this build) are prefixed PF_ to avoid collisions.

// ---- Tunable constants ---------------------------------------------------
const PF_FIXED_DT       = 1 / 60;   // physics tick length (seconds)
const PF_TILE           = 16;       // tile pixel size (16x16)
const PF_GRAVITY        = 0.30;     // px / tick^2
const PF_MAX_FALL       = 5.5;      // terminal vertical velocity
const PF_JUMP_VEL       = -6.0;     // initial jump impulse (negative = up); tuned so a
                                    //   full-hold jump clears the 40px Bowzashine top
                                    //   with margin (max rise ~60px from ground at y=192,
                                    //   so peak Dowza bottom ~148, well above boss top 176)
const PF_JUMP_CUTOFF    = 0.45;     // release-jump cuts upward velocity to this fraction
const PF_COYOTE_FRAMES  = 7;        // frames after walking off a ledge that jump still works
const PF_JUMP_BUFFER    = 7;        // frames a queued jump remains valid before landing
const PF_RUN_ACCEL      = 0.55;     // px / tick^2
const PF_RUN_MAX        = 2.4;      // px / tick (horizontal)
const PF_FRICTION       = 0.78;     // multiplier each tick when no horizontal input

// Tile types (level grid values)
const PF_TILE_EMPTY = 0;
const PF_TILE_SOLID = 1;
const PF_TILE_LAVA  = 2;   // decorative in v1 (not a hazard); still drawn

// ---- Fixed-timestep accumulator -----------------------------------------
//
// The engine's loop.js calls gameUpdate(engineDt) every animation frame with
// engineDt as a multiplier where 1.0 ≈ 60fps. We convert that back to seconds
// and run physics in fixed steps so collision math is deterministic across
// 60Hz / 120Hz / 144Hz displays. Returns the alpha 0..1 that the renderer can
// use to interpolate between previous and current entity positions.

function PF_step(state, engineDt, tickFn) {
    state.acc = (state.acc || 0) + engineDt * (1 / 60);
    let safety = 0;
    while (state.acc >= PF_FIXED_DT && safety < 6) {  // cap catch-up to 6 ticks/frame
        tickFn(PF_FIXED_DT);
        state.acc -= PF_FIXED_DT;
        safety++;
    }
    if (safety >= 6) state.acc = 0;  // tab background; drop overflow
    return state.acc / PF_FIXED_DT;
}

// ---- Tile lookup ---------------------------------------------------------
function PF_tileAt(level, tx, ty) {
    if (tx < 0)               return PF_TILE_SOLID;   // left edge of world is solid
    if (tx >= level.widthT)   return PF_TILE_SOLID;   // right edge of world is solid
    if (ty < 0)               return PF_TILE_EMPTY;   // sky
    if (ty >= level.heightT)  return PF_TILE_EMPTY;   // below world (no pits in v1)
    return level.tiles[ty][tx];
}

function PF_isSolid(level, tx, ty) {
    return PF_tileAt(level, tx, ty) === PF_TILE_SOLID;
}

// ---- Axis-separated AABB-vs-tile-grid collision -------------------------
//
// Resolve X first, then Y. Sample tile cells along the leading edges of the
// entity. Snap on solid hit and zero the corresponding velocity. Returns
// flags so the caller can react (set onGround, reverse direction, etc.).
//
// Entity contract: { x, y, w, h, vx, vy, onGround }
//   x,y is the top-left corner of the AABB in world pixels.

function PF_moveAndCollide(e, level) {
    e.onGround = false;
    let hitLeft = false, hitRight = false, hitCeil = false;

    // Why no -0.001 epsilon on the snap-out positions: subtracting 0.001 from
    // a snap-out ("park at wall edge minus a hair") leaves the entity AABB
    // peeking 0.001 px into the previous tile. floor(y / TILE) on the next
    // axis sweep then returns a tile row the entity is barely intersecting,
    // and a platform sitting in that peek-row ghost-blocks horizontal motion.
    // We park flush at the boundary instead. The -0.001 on the AABB sweep
    // *range* below is preserved -- the AABB upper edge is exclusive there.

    // ---- X axis ----
    let nx = e.x + e.vx;
    if (e.vx > 0) {
        // sample right edge over vertical span
        const rightEdge = nx + e.w;
        const tx = Math.floor((rightEdge - 0.001) / PF_TILE);
        const tyTop = Math.floor(e.y / PF_TILE);
        const tyBot = Math.floor((e.y + e.h - 0.001) / PF_TILE);
        for (let ty = tyTop; ty <= tyBot; ty++) {
            if (PF_isSolid(level, tx, ty)) {
                nx = tx * PF_TILE - e.w;
                e.vx = 0;
                hitRight = true;
                break;
            }
        }
    } else if (e.vx < 0) {
        const leftEdge = nx;
        const tx = Math.floor(leftEdge / PF_TILE);
        const tyTop = Math.floor(e.y / PF_TILE);
        const tyBot = Math.floor((e.y + e.h - 0.001) / PF_TILE);
        for (let ty = tyTop; ty <= tyBot; ty++) {
            if (PF_isSolid(level, tx, ty)) {
                nx = (tx + 1) * PF_TILE;
                e.vx = 0;
                hitLeft = true;
                break;
            }
        }
    }
    e.x = nx;

    // ---- Y axis ----
    let ny = e.y + e.vy;
    if (e.vy > 0) {
        // falling: sample bottom edge
        const bottomEdge = ny + e.h;
        const ty = Math.floor((bottomEdge - 0.001) / PF_TILE);
        const txLeft = Math.floor(e.x / PF_TILE);
        const txRight = Math.floor((e.x + e.w - 0.001) / PF_TILE);
        for (let tx = txLeft; tx <= txRight; tx++) {
            if (PF_isSolid(level, tx, ty)) {
                ny = ty * PF_TILE - e.h;
                e.vy = 0;
                e.onGround = true;
                break;
            }
        }
    } else if (e.vy < 0) {
        // rising: sample top edge
        const topEdge = ny;
        const ty = Math.floor(topEdge / PF_TILE);
        const txLeft = Math.floor(e.x / PF_TILE);
        const txRight = Math.floor((e.x + e.w - 0.001) / PF_TILE);
        for (let tx = txLeft; tx <= txRight; tx++) {
            if (PF_isSolid(level, tx, ty)) {
                ny = (ty + 1) * PF_TILE;
                e.vy = 0;
                hitCeil = true;
                break;
            }
        }
    }
    e.y = ny;

    return { hitLeft, hitRight, hitCeil, onGround: e.onGround };
}

// ---- AABB pair test (used by entity-vs-entity hit detection) ------------
function PF_aabbOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}

// ---- Camera --------------------------------------------------------------
//
// Horizontal follow with a small deadzone. Vertical is fixed (level isn't tall
// enough to need scrolling). When camera.lockMin/lockMax are set (boss arena),
// the camera clamps to those bounds instead of the full level width.

function PF_cameraInit() {
    return { x: 0, lockMin: -1, lockMax: -1 };
}

function PF_cameraFollow(camera, target, level, viewW) {
    // Center target horizontally with a 32px deadzone
    const focus = target.x + target.w / 2 - viewW / 2;
    const lerp = 0.25;
    let desiredX = camera.x + (focus - camera.x) * lerp;

    // Clamp to level bounds (or arena lock when set)
    const minX = camera.lockMin >= 0 ? camera.lockMin : 0;
    const maxX = camera.lockMax >= 0 ? camera.lockMax : Math.max(0, level.widthPx - viewW);
    if (desiredX < minX) desiredX = minX;
    if (desiredX > maxX) desiredX = maxX;
    camera.x = desiredX;
}

// Snap pixel-space cam.x for crisp rendering (pixel art shimmers if cam.x
// is fractional). Caller uses this *only* during render -- the smooth value
// stays in camera.x for next-frame interpolation.
function PF_cameraSnapX(camera) {
    return Math.round(camera.x);
}
