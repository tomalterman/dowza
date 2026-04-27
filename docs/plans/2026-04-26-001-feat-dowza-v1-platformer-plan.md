---
title: "feat: Dowza v1 - Mario-style side-scrolling platformer"
type: feat
status: active
date: 2026-04-26
origin: docs/brainstorms/dowza-v1-requirements.md
---

# feat: Dowza v1 - Mario-style side-scrolling platformer

**Target repo:** dowza (working dir: `/Users/tomalterman/dev/dronz/games/dowza`; all repo-relative paths below are rooted there)

## Overview

Build a single-level Mario-style side-scrolling platformer for Leo (age 6) on top of the existing arcade-template engine. Dowza runs and jumps through a fire-world level, defeats walker enemies (stomp or fireball), reaches a boss arena, and beats Bowzashine using the canon's fireball-stuns + stomp-damages loop. Surface area is intentionally narrow: one level, one enemy type, one boss, two-button SMB1-style controls. Best practices applied from this session's research: fixed-timestep loop with render interpolation, Job Talle's Mario-feel trio (variable jump + coyote + buffer), state-machine character behavior, AABB tile collision, all in a single static HTML page.

---

## Problem Frame

Leo co-designed a game called *Dowza vs. Bowzashine* and the v1 requirements doc (`docs/brainstorms/dowza-v1-requirements.md`) defines the product behavior. The repo was just scaffolded from `../arcade-template` and the engine ships a 384x216 canvas with input/sound/particles/title-screen but no platformer primitives - no gravity, no AABB collision, no scrolling camera, no jump physics. v1 has to deliver those primitives plus the gameplay (player + walker + boss + level) without adopting Phaser/Kaplay/Excalibur, because the repo's identity is single-HTML-file static-page.

The user's bar is "polished, playable, ready for feedback" - not a stub. The plan should aim at that bar.

---

## Requirements Trace

- R1. Dowza runs left/right (held) - origin R1
- R2. Variable-height jump with gravity - origin R2
- R3. Stomp defeats enemies and bounces - origin R3
- R4. Fireball attack in facing direction - origin R4
- R5. Fireball defeats walker enemies - origin R5
- R6. Camera scrolls horizontally - origin R6
- R7. Walker enemies populate the level - origin R7
- R8-R12. Bowzashine fight: shielded / fireball-stuns / stomp-damages / 3 hits / shine blasts - origin R8-R12
- R13-R15. 6 HP, i-frames, game over at 0 - origin R13-R15
- R16-R18. Visual identity: Dowza green/blue dinosaur with spikes, Bowzashine bright/large, fire-world theme - origin R16-R18
- R19. Procedural Canvas + Web Audio only - origin R19
- R20-R21. Title screen with "DOWZA" + tap-to-start; win screen on boss defeat - origin R20-R21

**Origin actors:** A1 (Leo, 6yo player; touchscreen and keyboard; pre-literate), A2 (Tom, dev/parent, wants tight v1 scope and reusable engine improvements migrated back deliberately).

**Origin acceptance examples:** AE1 (stomp or fireball both kill walker, stomp gives bounce), AE2 (boss fireball-stun → stomp damages, stomp on shielded boss costs Dowza HP), AE3 (i-frames after damage prevent multi-hit drain).

---

## Scope Boundaries

- No X-arm fire bomb, no Fire Jet, no Superstar, no Big Fist - all carried from origin's Deferred-for-later list
- No second level or world - origin scope cap
- No high-score leaderboard surfaced - precedent: tiny-kitty-garden hides the engine's high-score UI for win-or-lose games
- No procedural level generation - level layout is hand-authored
- No save/checkpoint system - game over restarts from level start
- **No pits/lava insta-death in v1** - resolved from origin Deferred-to-Planning. Mario has them; for a 6yo learning the controls they're punishing. Hazards in v1 are enemy contact and shine blasts only. Lava is decorative background, not a hazard zone.
- No tile-map editor (Tiled). Level is hand-coded as a tile grid in JS source. Tile-editor introduction is a v2+ concern if levels grow.
- No Phaser/Kaplay/Excalibur. Stays vanilla single-HTML-file per arcade-template's identity.

### Deferred to Follow-Up Work

- Migration of platformer primitives (fixed-timestep, AABB tile collision, camera scroll, jump-feel) from `src/game-platformer.js` back to `../arcade-template`'s `src/engine/` - do this only after the primitives are exercised by a second platformer game. Premature extraction risks generalizing on n=1.
- WebAudio music loop / chiptune background track - v2 polish.
- Multi-phase Bowzashine (e.g., shine pattern changes after each damage hit) - v2 polish.

---

## Context & Research

### Relevant Code and Patterns

- `src/engine/loop.js:19` - existing variable-timestep dt is `clamp((now-last)/16.67, 0, 3)`. Works for slow-moving entities; tunneling-prone for fast horizontal motion against thin walls. The plan wraps it with a fixed-timestep accumulator inside `gameUpdate(dt)` rather than rewriting the engine - no engine change needed.
- `src/engine/engine.js:36-48` - boot order. `gameInit` is invoked from `restartGame()` after engine state reset; the game can re-set `Engine.state.health = 6` and rebuild level state in there.
- `src/engine/screens.js:12-60` - title-screen flow already supports a `gameTitleRender(ctx, w, h, time)` hook for custom backdrop art.
- `src/engine/screens.js:99-160` - game-over screen has the high-score path baked in. To suppress, set `Engine.state.score` to a stable 0 (no score tracking in dowza), so `HighScores.check(0)` returns -1 and name entry never triggers. Plus hide the `#highScores` and `SCORE` UI via CSS in `src/template.html`.
- `src/engine/input.js:1-68` - touch buttons auto-build from `GAME.controls`, laid out via `#touchControls { display: flex; justify-content: space-between }`. Four buttons (left, right, jump, fire) at 80px each fit a 360px-padded mobile container; the existing flex layout works without overhaul.
- `../arcade-template/src/game.js` - Block Dodge example shows the gameInit/gameUpdate/gameRender pattern. dowza follows the same orchestrator pattern in `src/game.js`.
- `../tiny-kitty-garden/` - precedent for hiding the engine's score/high-score UI in a non-score-chase game. Method: CSS in `src/template.html` plus passing through 0 score.

### Institutional Learnings

- The `../arcade-template` engine is "thin glue" (canvas + input + screens + loop + audio + particles + popups). Game-specific primitives belong in `src/` files concatenated by `build.js`. Keep the engine generic until n>=2 platformers prove the abstraction.
- `build.js` concatenates JS files in declared order, then writes both `dist/index.html` and root `index.html` for GitHub Pages legacy mode. Add new game files to the `jsFiles` array in declared order.

### External References

- Job Talle, "2D platformer physics" - canonical reference for variable jump / coyote time / jump buffering. https://jobtalle.com/2d_platformer_physics.html
- Jake Gordon, "JS Game Foundations - The Game Loop" - fixed-timestep accumulator pattern. https://jakesgordon.com/writing/javascript-game-foundations-the-game-loop/
- Aleksandr Hovhannisyan, "Performant Game Loops in JavaScript" - render-interpolation rationale. https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/
- Isaac Sukin, "JS Game Loops and Timing" - frame-rate independence on 120Hz/144Hz. https://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
- jakesgordon/javascript-tiny-platformer - canonical "single-file vanilla JS platformer" reference. https://github.com/jakesgordon/javascript-tiny-platformer
- Eloquent JavaScript ch.16, "Project: A Platform Game" - pedagogical Mario-style implementation. https://eloquentjavascript.net/16_game.html
- The Shaggy Dev, "Intro to state machines" - growth pattern for character states. https://shaggydev.com/2021/11/01/state-machines-intro/

---

## Key Technical Decisions

- **Fixed-timestep accumulator wrapped inside `gameUpdate(dt)`, not by rewriting the engine.** The engine's `loop.js` calls `gameUpdate(dt)` every animation frame with a variable `dt`. Inside `gameUpdate`, accumulate `dt * (1/60)` seconds and run a `physicsTick(FIXED_DT)` loop until the accumulator drains. Render once per visual frame using interpolated positions. Rationale: zero-touch to the engine; cleanly migratable later; deterministic platformer physics on 60/120/144 Hz displays. Drawback: accumulator stalls if the tab backgrounds for >1s (engine already clamps `dt` to 3, so worst-case 3 physics ticks of catch-up - acceptable).
- **Platformer primitives live in `src/game-platformer.js`, not `src/engine/`.** Keeps the engine generic. The file exports module-level globals (since build.js concatenates without modules) prefixed `PF_` (e.g., `PF_FIXED_DT`, `PF_GRAVITY`, `PF_collideAabbWorld`). Migration back to engine is a Deferred-to-Follow-Up-Work concern after n>=2 platformers.
- **AABB tile collision, axis-separated.** Resolve X-axis movement and collision first, then Y-axis. This is the standard "stable wall slide" pattern from jakesgordon/tiny-platformer. Per-axis resolution prevents corner-clipping diagonal movement bugs. World is a 2D grid of integer tile types: 0=empty, 1=solid, 2=lava-decorative (passable, kills nothing in v1).
- **Mario-feel constants (Job Talle).** `JUMP_VELOCITY = -4.2`, `GRAVITY = 0.25`, `COYOTE_FRAMES = 6` (~100ms grace after walking off ledge), `JUMP_BUFFER_FRAMES = 6` (queued jump if pressed slightly before landing), `VARIABLE_JUMP_CUTOFF = 0.5` (release-jump caps upward velocity to 50% of current). Tunable via constants in `src/game-platformer.js`. Initial values are starting points; expect 1-2 tuning passes during playtest.
- **Camera: continuous horizontal follow, clamped to level bounds; vertical fixed.** Dowza's screen-X stays near the center; level scrolls underneath. Level isn't tall enough to need vertical camera. In the boss arena (the rightmost ~24 tiles), camera locks to the arena bounds. Implementation: a `camera.x` integer shifted from Dowza's world-X with deadzone and clamping.
- **Two-button SMB1 controls in `GAME.controls`.** `left`, `right`, `jump`, `fire`. Keys: arrows or WASD for movement, `Space`/`KeyW`/`ArrowUp` for jump, `KeyJ`/`KeyZ` for fire. Touch buttons auto-built; `flex space-between` layout already accommodates 4 buttons within the 384px canvas-width container.
- **Hide high-score UI for v1.** Add `#highScores { display: none }` and `score-display:none` rules to dowza's `src/template.html`. Pass through `Engine.state.score = 0` permanently (we don't tally a score - this is win-or-lose). The engine's game-over name-entry path is a no-op when score is 0 (HighScores.check returns -1).
- **Boss state machine: SHIELDED → (fireball impact) → STUNNED → (stomped) → DAMAGED brief → SHIELDED → ... → DEFEATED.** STUNNED window is ~75 frames (1.25s at 60fps). DAMAGED is a brief flash (~20 frames) of i-frames so chain-stomp doesn't kill in two frames. After 3 damage-stomps, transition to DEFEATED: Bowzashine collapses, win screen plays.
- **Single hand-coded level, ~80 tiles wide x 14 tiles tall (1280px x 224px).** ~60-90s of run-jump-fight content. 6 walker enemies placed by hand. Boss arena occupies tiles 56-79 (rightmost ~24 tiles). Level data is a JS array literal in `src/game-level.js`.
- **One walker enemy type for v1.** A small fire-imp that walks left/right between solid tiles, turning at edges and walls. Stomp kills it (Mario-canon). Fireball kills it (canon). Touch costs Dowza 1 HP. Sprite is procedural pixel art ~12x14 px.
- **Procedural pixel art only.** Each entity has a `draw(ctx, x, y, frame)` function that calls `fillRect` for chunky pixel blocks. Frames advance on a global `gameFrame` counter for animation. No image loading.

---

## Open Questions

### Resolved During Planning

- How many stomp-hits to defeat Bowzashine? **3** (origin Deferred default).
- Camera mode? **Continuous horizontal follow** (Mario-canon, justified above).
- Pits in v1? **No** (justified above; resolved against Mario-canon for kid accessibility).
- Enemy variety? **1 walker** (origin Deferred default).
- Level length? **~80 tiles wide ≈ 60-90s of play** (origin Deferred default).
- Where does the platformer engine code live? **`src/game-platformer.js`** (justified in Decisions).
- High-score UI hidden how? **CSS in template.html + score=0 passthrough** (precedent: tiny-kitty-garden).
- Touch layout? **Default flex `space-between` with 4 buttons** - fits 384px width on mobile and tablet alike.

### Deferred to Implementation

- Final tuning constants (gravity, jump velocity, coyote/buffer windows). Job Talle's writeup recommends 4-8 frames for coyote and buffer; the exact feel is a 1-2 iteration playtest decision.
- Sprite-frame counts for animation (run cycle 2 vs 4 frames; jump 1 vs 2 frames). Decide while drawing pixel art.
- Walker spawn positions in the level. Best decided while hand-authoring the level grid.
- Bowzashine shine-blast pattern timing. Start with a simple "fire 3 blasts in 2-second windows, then 1.5s vulnerable window". Tune live.
- Whether to add a "lava" decorative element under platforms even though it doesn't damage. Cosmetic decision.

---

## Output Structure

```
dowza/
  src/
    game-config.js       (modified - update controls to 4-button)
    game-sounds.js       (modified - add jump/stomp/fireball/boss-hit/win sounds)
    game-platformer.js   (NEW - fixed-step loop, AABB collision, camera, jump-feel constants)
    game-level.js        (NEW - tile grid, walker spawns, boss arena bounds)
    game-entities.js     (NEW - Dowza state machine, Walker AI, Fireball, Bowzashine)
    game-render.js       (NEW - procedural pixel art draw functions for everything)
    game.js              (rewritten - orchestrator: gameInit/gameUpdate/gameRender + win screen)
    template.html        (modified - hide #highScores and SCORE; tab title)
  build.js               (modified - add new files to jsFiles array)
  CHANGELOG.md           (modified - v1 entry)
  index.html             (rebuilt by build.js)
  dist/index.html        (rebuilt by build.js)
```

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**Per-frame flow (inside `gameUpdate(dt)` from `loop.js`):**

```
gameUpdate(dt):                          # dt is engine's variable multiplier (1.0 ≈ 60fps)
    accumulator += dt * (1/60)           # convert engine-dt to seconds
    while accumulator >= FIXED_DT:       # FIXED_DT = 1/60 s
        physicsTick(FIXED_DT)            # input read, state-machine step, AABB collision, entity update
        accumulator -= FIXED_DT
    alpha = accumulator / FIXED_DT       # 0..1 interpolation factor
    # render uses alpha to lerp prev/cur positions for smooth motion at >60Hz

physicsTick(dt):
    handleInputBuffers()                 # coyote-frame counter, jump-buffer counter
    dowza.update(dt, level)              # state machine + AABB collide
    fireballs.forEach(update)
    walkers.forEach(update)
    bowzashine?.update(dt, dowza)        # only when in arena
    cameraFollow(dowza)
    saveCurrentForInterpolation()
```

**Dowza state machine:**

```
                  +---<--- (release) ----+
                  v                      |
[idle] --(left|right held)--> [run]      |
   |                            |        |
   +--(jump)----+               |        |
                v               v        |
              [jump]<-----(jump|buffered)|
                |                        |
              (apex / cut)               |
                v                        |
              [fall] --(land)--> [idle/run]
                |
   any state + (hit) --> [hurt] (i-frames, brief flash) --> back to grounded
   any state + (fire pressed) --> spawns Fireball entity, no state change
   land-on-enemy --> bounce: vy = JUMP_VELOCITY * 0.6 (Mario-style stomp bounce)
```

**Bowzashine state machine:**

```
[SHIELDED] --(fireball hit)--> [STUNNED]
                                  |
              (timeout 1.25s)     |
                  +---------------+
                  v               |
              [SHIELDED]          |
                                  |
              (Dowza stomp)<------+
                  |
                  v
              [DAMAGED] (brief, i-frames) --(after ~0.3s)--> [SHIELDED]
                  |
              (3rd damage)
                  v
              [DEFEATED] --> win screen
```

---

## Implementation Units

- U1. **Engine adaptations: controls, hide high-score UI, set tab title**

**Goal:** Adapt `src/game-config.js` and `src/template.html` so the engine wires up dowza's 4 controls, hides the score/high-score UI for the win-or-lose model, and sets the browser tab title.

**Requirements:** R20 (title screen), Key Decisions (controls, hide-UI), origin Scope Boundaries (no leaderboard).

**Dependencies:** None.

**Files:**
- Modify: `src/game-config.js` (controls + instructions)
- Modify: `src/template.html` (CSS to hide `#highScores`; tab `<title>`)

**Approach:**
- Replace `GAME.controls` with: `left`, `right` (existing), plus `jump` (`Space`, `ArrowUp`, `KeyW`) and `fire` (`KeyJ`, `KeyZ`).
- Replace `GAME.instructions` with desktop hints for movement, jump, fire.
- In `src/template.html`, add `#highScores { display: none }` rule. Score display is drawn by engine in `screens.js:67`; suppress by short-circuiting in our gameRender or by drawing a black rect over it (cleaner: leave engine UI alone but always pass `Engine.state.score = 0`, then add CSS `#scoreDisplay` rule to hide if needed - the engine draws score to canvas, so canvas-side suppression requires our `gameRender` to draw a colored rect over rows 0-22 or to skip via not setting score).
- Verify by inspecting tiny-kitty-garden's template.html for the precedent CSS rule.
- Set `<title>DOWZA</title>` in template.html (currently "Arcade Game"); the existing `document.title = GAME.title` in game.js will reset on load too.

**Patterns to follow:**
- `../tiny-kitty-garden/src/template.html` for hide-UI CSS precedent.
- `../arcade-template/src/game-config.js` for the controls schema.

**Test scenarios:**
- Happy path: Open `dist/index.html` in browser. Title screen displays "DOWZA". Tab title says "DOWZA". `#highScores` element is not visible. Touch controls show 4 buttons (LEFT, RIGHT, JUMP, FIRE).
- Edge case: Resize to mobile width. All 4 touch buttons remain visible and tappable without overlap.

**Verification:**
- `node build.js` succeeds.
- Loaded page shows DOWZA title and no high-score block.
- Pressing Space or tapping JUMP fires the `jump` input (verifiable by adding a temp `console.log` during development; remove before commit).

---

- U2. **Platformer foundation: fixed-timestep, AABB world collision, camera, jump-feel helpers**

**Goal:** Create `src/game-platformer.js` containing the platformer primitives Dowza/walkers/Bowzashine all share: fixed-timestep accumulator, AABB-vs-tile-grid collision (axis-separated), camera, and Mario-feel constants/helpers.

**Requirements:** R1, R2, R3, R6, R8-R12 (all platformer-physics-bearing requirements depend on this).

**Dependencies:** None (pure new module).

**Files:**
- Create: `src/game-platformer.js`
- Modify: `build.js` (add `'src/game-platformer.js'` to `jsFiles`, before `game-entities.js`)

**Approach:**
- Constants: `PF_FIXED_DT = 1/60`, `PF_TILE_SIZE = 16`, `PF_GRAVITY = 0.25`, `PF_MAX_FALL = 5`, `PF_JUMP_VELOCITY = -4.2`, `PF_VARIABLE_JUMP_CUTOFF = 0.5`, `PF_COYOTE_FRAMES = 6`, `PF_JUMP_BUFFER_FRAMES = 6`, `PF_RUN_ACCEL = 0.4`, `PF_RUN_MAX = 2.4`, `PF_FRICTION = 0.6`.
- `PF_step(world, dt, accumulatorState, tickFn)`: accumulates `dt`, calls `tickFn(PF_FIXED_DT)` until drained, returns interpolation alpha 0..1.
- `PF_collideAabbWorld(entity, level)`: axis-separated. For X then Y, compute new pos, sample tiles along the entity's leading edges, snap on solid hit, set `onGround` flag for Y collisions when falling. Returns collision flags.
- `PF_camera(camera, follow, level, w, h)`: deadzone-style horizontal follow. Camera shift uses `Math.floor` to keep pixels crisp. Clamp to `[0, level.widthPx - w]`. In boss arena (camera-locked range), clamp to arena bounds.
- `PF_levelTileAt(level, tileX, tileY)`: bounds-checked tile lookup. Out-of-bounds Y is empty (sky); out-of-bounds X is solid (level edges block).

**Execution note:** *None - this unit creates the primitives. Test scenarios below cover the math; integration tests live in U3-U6.*

**Patterns to follow:**
- jakesgordon/javascript-tiny-platformer's collision pattern (axis-separated AABB).
- Variable-timestep `dt` from existing `loop.js` is the input; this unit converts it to fixed steps.

**Test scenarios:**
- Happy path: a 20x20 entity at world (50, 50) with `vx=2, vy=0` and 5 ticks moves to (60, 50). With `vy=0.25` accumulating over ticks, falls until it lands on a solid tile and `onGround` becomes true.
- Edge case (corner-clip prevention): entity moving diagonally into an inside corner snaps to both walls cleanly without phasing through. Axis-separated resolution should prevent the classic "diagonal velocity > tile size" tunneling.
- Edge case (level edges): entity at world X = -2 with vx = -1 collides with the implicit left-wall (PF_levelTileAt returns solid for X<0).
- Error path: `PF_collideAabbWorld` with `entity.w = 0` or `entity.h = 0` should not crash; result is "no collision."
- Edge case (camera clamp): camera follows entity moving rightward but stops scrolling when entity reaches `level.widthPx - canvasW`.

**Verification:**
- A test harness scene (temporary) in `gameUpdate` showing a 16x16 box that falls under gravity, lands on a tile, jumps when input pressed, and slides against walls without tunneling. (Remove the scene before final commit; replaced by U3.)

---

- U3. **Player entity: Dowza state machine + Mario-feel jump**

**Goal:** Implement the Dowza entity with state machine (idle/run/jump/fall/hurt), variable-height jump, coyote time, jump buffering, fireball-throw input handling, and 6 HP with i-frame after damage. Live in `src/game-entities.js`.

**Requirements:** R1, R2, R3 (stomp bounce mechanic — completion ties to U5), R4 (fireball spawn — entity creation lives in U5; here we just emit the input event), R13, R14.

**Dependencies:** U2 (uses PF_ collision + jump-feel constants).

**Files:**
- Create: `src/game-entities.js` (Dowza class/factory + state machine; walker and fireball stubs added in U5; Bowzashine stub added in U6)
- Modify: `build.js` (add file to jsFiles before `game.js`)

**Approach:**
- Dowza is a plain object: `{ x, y, prevX, prevY, vx, vy, w: 12, h: 16, facing: 1, onGround: false, coyoteFramesLeft: 0, jumpBufferFramesLeft: 0, jumpHeld: false, state: 'idle', stateFrames: 0, hp: 6, iFrames: 0 }`.
- Each tick: read input (`Engine.input.left/right/jump/fire`); update horizontal velocity (accel + friction + max-clamp); apply gravity; resolve collision via `PF_collideAabbWorld`; manage coyote and buffer; transition state machine.
- Variable jump: when the `jump` input transitions from false to true and (`onGround || coyoteFramesLeft > 0` or `jumpBufferFramesLeft > 0`), set `vy = PF_JUMP_VELOCITY`. While airborne, if `jump` released and `vy < PF_JUMP_VELOCITY * PF_VARIABLE_JUMP_CUTOFF`, set `vy *= PF_VARIABLE_JUMP_CUTOFF`.
- Coyote: each tick where `onGround` is true, reset `coyoteFramesLeft = PF_COYOTE_FRAMES`. While airborne, decrement.
- Buffer: when `jump` pressed but not jumpable yet, set `jumpBufferFramesLeft = PF_JUMP_BUFFER_FRAMES`. Decrement each tick. On any later tick that's jumpable, consume.
- State transitions: `idle <-> run` based on `vx`; transition to `jump` when `vy < 0`; to `fall` when `vy > 0 && !onGround`; to `hurt` flash when `iFrames > 0`.
- Damage: `dowza.takeHit()` decrements hp by 1, sets `iFrames = 60` (1s at 60fps), sets `vx = -facing * 1.5, vy = -2` (knockback), plays `hit` sound. While `iFrames > 0`, ignore further enemy contact.
- Fireball input: when `fire` pressed (rising edge) AND `Engine.fireCooldown <= 0`, call `spawnFireball(dowza.x + facing * 6, dowza.y - 4, facing)` (function provided by U5) and set `Engine.fireCooldown = 18` frames (~3 fireballs/s max).

**Patterns to follow:**
- Job Talle's variable-jump and coyote/buffer formulas.
- Eloquent JS ch.16 entity-update style (per-axis, AABB, set onGround during Y resolution).

**Test scenarios:**
- Happy path (run): hold `right` for 2s, Dowza accelerates to PF_RUN_MAX and stays there. Release: friction decelerates to 0 within ~0.5s.
- Happy path (jump): on ground, press `jump`. Dowza launches with PF_JUMP_VELOCITY; reaches an apex; falls; `onGround` returns true on land.
- Edge case (variable jump): press jump, release after 5 frames. Apex is meaningfully lower than holding for 25 frames. Verifies cutoff math.
- Edge case (coyote): walk Dowza off the right edge of a tile and press `jump` 3 frames later. Should still jump (within COYOTE_FRAMES). Press 10 frames later: doesn't jump.
- Edge case (jump buffer): press `jump` 4 frames before landing. On land, jump fires immediately (buffered).
- Edge case (i-frames): take a hit at hp=6. While `iFrames > 0`, walk into the same enemy. HP stays at 5 (no further drain). After iFrames expire, contact again drops to 4.
- Integration: Dowza lands on a moving walker (handled in U5; tested there).
- Error path: collision with a malformed level (out-of-bounds tileY) does not crash; returns no-collision.

**Verification:**
- Manual: jump physics feel "Mario-like" - quick rise, controllable arc, soft variable apex, forgiving coyote and buffer windows.
- HP bar (engine hearts) shows 6 hearts at start and decrements properly on enemy contact.

---

- U4. **Level: tile grid, fire-world theme, parallax background**

**Goal:** Implement the single hand-coded level in `src/game-level.js`: a ~80x14 tile grid of solid/empty tiles, a fire/lava decorative theme, and a 2-layer parallax background (distant volcanic mountains + closer drifting embers). Define the boss arena bounds (rightmost ~24 tiles).

**Requirements:** R6 (camera scrolls through level), R7 (level structure), R18 (fire-world theme).

**Dependencies:** U2 (uses PF_TILE_SIZE).

**Files:**
- Create: `src/game-level.js`
- Modify: `build.js` (add file to jsFiles after `game-platformer.js`, before `game-entities.js`)

**Approach:**
- `LEVEL = { tiles: [[...]], widthTiles: 80, heightTiles: 14, walkerSpawns: [...], bossArena: {minTileX, maxTileX} }`.
- Tile grid hand-authored. ~5-6 distinct ground heights to provide jumping interest. No pits (per Scope Boundaries). A few raised platforms (3-4 tiles wide) for jump-over-and-stomp setups.
- Walker spawns: 6 walkers placed at rest positions on solid ground. Each has `{tileX, tileY, patrolMin, patrolMax}`.
- Boss arena: tiles 56-79. Contains a solid floor, no platforms (clean fight), and an "arena gate" trigger at tile 56 - first time Dowza crosses, camera locks and Bowzashine spawns/animates in.
- Background drawn in 2 layers (each in a separate function called from gameRender):
  - **Far layer:** dark red/maroon volcano silhouettes scrolling at 0.3x camera speed.
  - **Near layer:** orange/yellow ember particles drifting upward, slight horizontal sway, scrolling at 0.7x.
- Sky color: dark crimson gradient (top: `#3a0a0a`, bottom: `#7a1a0a`).
- Tile rendering: solid tiles are dark stone with lava cracks (procedurally drawn from a deterministic per-tile noise so it doesn't shimmer between frames).

**Patterns to follow:**
- Eloquent JS ch.16 tile-grid representation (string-per-row literal, then `.split('')` to char array, then mapped to tile types - readable level source).

**Test scenarios:**
- Test expectation: none -- this unit is data + render functions; integration is verified in U3 (collision against the level) and U6 (boss arena trigger).

**Verification:**
- Visual: scroll the camera through the level (programmatically in development) and the parallax layers move at correct relative speeds. Level looks like a fire world.
- The tile array is exactly 80 columns by 14 rows. (`assert LEVEL.tiles.length === 14 && LEVEL.tiles[0].length === 80` in dev.)

---

- U5. **Combat: walker enemy, fireball, stomp, damage handling**

**Goal:** Implement the regular walker enemy AI, the fireball projectile entity, the stomp mechanic, and Dowza-vs-walker damage interactions.

**Requirements:** R3 (stomp), R4 (fireball spawn), R5 (fireball kill), R7 (walkers populate level), R13 (damage drops HP), R14 (i-frames). AE1 (stomp or fireball both kill walker, stomp gives bounce). AE3 (i-frames).

**Dependencies:** U2 (collision), U3 (Dowza), U4 (level + walker spawns).

**Files:**
- Modify: `src/game-entities.js` (add Walker factory + AI + Fireball factory + spawnFireball + stomp resolution)
- Modify: `src/game-sounds.js` (add `stomp`, `fireball`, `enemyDie`, `playerHit`)

**Approach:**
- Walker: `{ x, y, w: 12, h: 12, vx: ±0.6, alive: true, patrolMin, patrolMax }`. Each tick: move horizontally, AABB-collide with world, reverse direction on wall hit OR when about to walk off the patrol range. Touch with Dowza:
  - If Dowza's `vy > 0` AND Dowza's bottom is above walker's top + threshold → stomp. Walker dies (spawn 6 particles, play `stomp` + `enemyDie`), Dowza's vy = `PF_JUMP_VELOCITY * 0.6` (bounce).
  - Otherwise → Dowza takes 1 hit (`dowza.takeHit()`).
- Fireball: `{ x, y, vx: ±3, vy: 0, life: 60, alive: true, w: 6, h: 6 }`. Spawned by `spawnFireball(x, y, facing)`. Each tick: move horizontally (no gravity in v1 — simpler and more readable for Leo); kill on hit-wall or hit-enemy or `life <= 0`; on hit-enemy, walker dies (particles + sounds).
- Stomp threshold: standard "if Dowza's previous-frame bottom was above walker's top, this is a stomp." Avoids ambiguous side-collision-during-fall cases.
- Game state lists: `Engine.fireballs = []`, `Engine.walkers = []`. Initialized in `gameInit` from `LEVEL.walkerSpawns`.

**Patterns to follow:**
- Existing arcade-template `Engine.spawnParticle` for impact visuals.
- Block Dodge collision check style (`boxOverlap` helper) - simple AABB pair test.

**Test scenarios:**
- Happy path (stomp): Dowza falls onto a walker. Walker dies; Dowza bounces upward.
- Happy path (fireball): Dowza fires while facing right. Fireball travels right, hits a walker, walker dies, fireball disappears.
- Happy path (side-touch): walker walks into idle Dowza. Dowza takes 1 HP, knocks back, i-frames active.
- Edge case (AE1 dual-kill): Dowza fires AND lands on a walker in the same frame. Walker dies once, no double-decrement of any counter.
- Edge case (fireball hits wall): fireball traveling right meets a solid tile. Fireball disappears, no enemy damaged.
- Edge case (walker patrol turnaround): walker reaches `patrolMax`, reverses, walks back to `patrolMin`.
- Edge case (i-frames preserved): Dowza takes hit, then runs into same walker. Second contact during iFrames does nothing.
- Error path (off-screen): walker at x = level.widthPx + 100 doesn't crash collision; just stays inert.

**Verification:**
- Playthrough: run through the level, stomp 2 walkers, fireball 2 walkers, take a side hit on the 5th and 6th. HP decrements visibly. All sounds play.

---

- U6. **Bowzashine boss + arena + win screen**

**Goal:** Implement Bowzashine entity with state machine (SHIELDED → STUNNED → DAMAGED → DEFEATED), shine-blast attack, the arena gating logic, the 3-stomp win condition, and the win-screen flow.

**Requirements:** R8, R9, R10, R11, R12, R21 (win screen). AE2 (boss damage rules).

**Dependencies:** U2, U3, U4, U5.

**Files:**
- Modify: `src/game-entities.js` (add Bowzashine factory + state machine + shine-blast)
- Modify: `src/game.js` (arena gating; win-screen state)
- Modify: `src/game-sounds.js` (add `shine`, `bossStun`, `bossHit`, `bossDefeat`, `win`)

**Approach:**
- Bowzashine: `{ x, y, w: 36, h: 40, hp: 3, state: 'SHIELDED', stateFrames: 0, attackTimer: 0, shineBlasts: [] }`.
- Spawn trigger: when Dowza's x crosses tile 56 the first time, push `Engine.bowzashine = makeBowzashine(...)` and lock camera to arena bounds. Pre-spawn animation: 60-frame "scream" tell (Bowzashine rises out of lava with particles).
- SHIELDED state: every ~120 frames, fire a 3-blast volley aimed at Dowza's current position. Each shine-blast: `{ x, y, vx, vy, life: 90, w: 6, h: 6 }`. Touch costs Dowza 1 HP. Stomping or fireballing Bowzashine in SHIELDED: stomp = Dowza takes 1 HP (no boss damage); fireball = transition to STUNNED.
- STUNNED state: lasts 75 frames. Stops firing blasts, sprite "wobbles" (vertical sine bob). If Dowza stomps top during this window: transition to DAMAGED, hp -= 1, knockback Dowza upward (PF_JUMP_VELOCITY * 0.7), particles + bossHit sound.
- DAMAGED state: 20-frame i-frames + flash. Then back to SHIELDED unless hp == 0.
- DEFEATED state: hp == 0. Bowzashine sinks dramatically (40 frames of fall + particle explosion); 60 frames later, set `Engine.win = true`.
- Win-screen: in `gameRender`, if `Engine.win`, draw a victory overlay ("DOWZA WINS!" + "TAP TO PLAY AGAIN"). Tap/space restarts via `restartGame()` (already engine-provided).

**Patterns to follow:**
- The same state-machine + i-frames pattern as Dowza (U3) and Walker (U5); no new mechanics, just composition.
- Existing engine `gameOverRender` hook is invoked by the engine, but our win condition is independent of `Engine.state.gameOver` (which means HP = 0). For win, we use our own `Engine.win` flag drawn in `gameRender`. Restart on tap is a click handler we attach in gameInit.

**Test scenarios:**
- Happy path (shielded touch): Dowza walks into shielded Bowzashine. Dowza takes 1 HP; Bowzashine HP unchanged.
- Happy path (fireball stun): Dowza fireballs Bowzashine. State transitions to STUNNED. Verify visually (sprite wobble, no shine-blast emission for ~1.25s).
- Happy path (damage): During STUNNED, Dowza stomps boss. Bowzashine HP from 3 → 2. Dowza bounces up. State transitions to DAMAGED then SHIELDED.
- Happy path (win): Land 3 successful damage stomps. Bowzashine transitions to DEFEATED, win screen plays.
- Edge case (stomp during SHIELDED, AE2): jump on Bowzashine while shielded. Dowza loses 1 HP, Bowzashine HP unchanged.
- Edge case (shine blast dodge): blast travels and Dowza ducks under or jumps over - no contact, no HP loss.
- Edge case (fireball during STUNNED): fireball does no damage during STUNNED (only stomp damages). Confirms fireball role is "stunner only."
- Edge case (re-enter arena after win): tapping restart sets `Engine.win = false`, respawns boss, Dowza at level start. (Restart is engine `restartGame` which calls our `gameInit`.)
- Integration: HP at 1 → take 1 shine blast → game over plays normally (engine path).
- Error path (boss spawn before arena): Dowza at tile 50 should not see Bowzashine yet. Confirms gate fires only at tile 56.

**Verification:**
- Full playthrough start → boss → win in <90 seconds. All sound cues play. Win screen restarts cleanly.

---

- U7. **Procedural pixel art, sounds, title-screen art, polish pass**

**Goal:** Draw all entities and the world with procedural pixel art (no images). Author all 7-8 game sounds. Add custom title-screen art (Dowza on a fire-world platform, "DOWZA" big logo, version stamp via existing engine path). Tweak Mario-feel constants based on playtest. Update `CHANGELOG.md` with v1 entry. Bump `GAME.version` to `v1`.

**Requirements:** R16 (Dowza visual identity), R17 (Bowzashine visual), R18 (fire world), R19 (procedural only), R20 (title art), AE-coverage of all visuals.

**Dependencies:** U1-U6 (everything must work mechanically before polish).

**Files:**
- Create: `src/game-render.js` (`drawDowza`, `drawWalker`, `drawBowzashine`, `drawFireball`, `drawShineBlast`, `drawTile`, `drawBackgroundFar`, `drawBackgroundNear`)
- Modify: `build.js` (add `src/game-render.js` to jsFiles before `game.js`)
- Modify: `src/game.js` (call render functions from gameRender; gameTitleRender for title art)
- Modify: `src/game-sounds.js` (final tuning of all sounds)
- Modify: `CHANGELOG.md` (append v1 entry)
- Modify: `src/game-config.js` (`version: 'v1'` is already set; verify)

**Approach:**
- Dowza pixel art: 12x16 sprite, green body with green dorsal spikes, blue head with 2 blue head-spikes, small eye, small smile. 2-frame run cycle. 1-frame jump (legs tucked). 1-frame fall (arms out).
- Walker: 12x12 fire-imp, orange/red body, 2 black eye dots, 2-frame walk cycle.
- Fireball: 6x6 yellow-orange ball with 4-frame flicker (color swap yellow/white/orange/red).
- Bowzashine: 36x40 sprite, dark dragon-like body with bright golden "shine" outline (drawn as a 2-pixel halo of yellow during SHIELDED; dimmed during STUNNED). 2 horns. Arms cross during SHIELDED idle pose; uncross when firing shine blasts.
- Shine blast: 6x6 bright yellow with 2-pixel white core; trails 2 fading particles.
- Tiles: stone with 2-3 procedural cracks per tile (deterministic noise from `tileX*7 + tileY*13`). Top-edge highlight in lighter stone. Lava tile (decorative): bright orange-red gradient with 2-frame "bubble" animation.
- Background far: silhouette mountains drawn as 4-5 polygons with `fill: #2a0a0a`, scrolling at 0.3x camera. Background near: 12-15 ember particles drifting upward, life-cycled, scrolling at 0.7x.
- Title screen: Dowza standing on a single tile center-bottom; large "DOWZA" logo (engine handles); subtitle "A NEW ARCADE ADVENTURE" (engine); version stamp top-right (engine). `gameTitleRender` draws background + Dowza idle pose.
- Sounds (all procedural, Web Audio):
  - `start`: existing arpeggio rising 3 tones.
  - `gameOver`: existing descending tones.
  - `jump`: short rising tone (300→500Hz, sine, 0.08s).
  - `stomp`: low percussive thud (noise burst 0.05s, low-pass).
  - `fireball`: ascending zap (300→800Hz, square, 0.1s).
  - `enemyDie`: 2-tone descending pop.
  - `playerHit`: dissonant low buzz (sawtooth 200→80Hz, 0.2s + noise burst).
  - `shine`: bright shimmer (square 800→1200Hz, 0.15s).
  - `bossStun`: thwack (noise + low tone).
  - `bossHit`: meaty crunch (lower-than-stomp + pitch wobble).
  - `bossDefeat`: dramatic descending arpeggio.
  - `win`: triumphant 3-note rise (square 600→900→1200Hz).
- Playtest pass: run through 3-5 times. Tune jump velocity / gravity / coyote / buffer. Tune walker speed. Tune Bowzashine attack timing.
- CHANGELOG entry: replace placeholder with real v1 description.

**Patterns to follow:**
- `../arcade-template/src/game.js` Block Dodge for procedural pixel-art rect-painting style.
- `../tiny-kitty-garden`'s sound style if useful.

**Test scenarios:**
- Test expectation: visual + audio polish; no behavioral changes to verify with new tests. Implicit coverage from U1-U6 manual playthrough.

**Verification:**
- Final playtest: Leo (or proxy) plays through level → boss → win. Looks like Dowza, sounds satisfying, feels Mario-like, ends triumphantly.
- `node build.js` succeeds; bundle size <120KB (current arcade-template bundle is ~44KB; budget allows ~75KB of new code).
- Playthrough recorded (manually note timing): start → boss arena in 60-90s, boss fight in 30-45s, total run ~90-135s.

---

## System-Wide Impact

- **Interaction graph:** Engine (`loop.js`) calls `gameUpdate(dt)` and `gameRender(ctx, w, h)`. Game wraps these via `src/game.js` orchestrator → `src/game-platformer.js` (PF_step accumulator) → entity ticks → render. State lives in `Engine.state` (HP, score=0, gameOver) and `Engine.bowzashine`, `Engine.walkers`, `Engine.fireballs`, `Engine.win`, `Engine.camera`, `Engine.fireCooldown`, `Engine.physicsAccumulator`. Engine title/game-over screens are reused; win screen is dowza-specific.
- **Error propagation:** Boundary errors (Dowza falling out the bottom of the level) are caught by setting HP = 0 → engine game-over. Shouldn't happen in v1 (no pits) but defensive.
- **State lifecycle risks:** `Engine.bowzashine` etc. are global; must be re-initialized in `gameInit` (called by engine `restartGame`). Camera must reset to 0. fireCooldown resets to 0. win flag resets to false. Single `gameInit` is the source of truth for clean restart.
- **API surface parity:** None - this is a single-game repo, no shared API.
- **Integration coverage:** Manual playthrough is the integration test. No automated test framework in arcade-template. Per-unit test scenarios above are guidance for the implementer's manual verification.
- **Unchanged invariants:** The `../arcade-template` engine source is not modified by this plan. All changes are in dowza's `src/` and `build.js`. tiny-kitty-garden remains untouched.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Mario-feel constants are wrong on first try - jump feels floaty or stiff | Constants are isolated in `src/game-platformer.js` as named globals. 1-2 playtest iterations expected. U7 explicitly budgets time for tuning. |
| Touch button layout cramped at small phone widths | Default flex `space-between` puts left/right on the left side, jump/fire on the right side - the canvas is only 384px wide so 4×80px buttons fit. Verified against existing arcade-template's CSS. |
| Variable timestep in engine causes occasional stutter at >60Hz | Fixed-timestep accumulator in U2 nullifies the engine's timing wobble for physics. Render still uses engine's frame timing - cosmetic stutter is unlikely. |
| Boss state machine has subtle bugs at state transitions (stomp during DAMAGED, fireball during DEFEATED) | Defensive: each interaction (`takeHit`, `stompedBy`, `fireballHit`) checks current state and no-ops on incompatible states. Test scenarios in U6 enumerate the matrix. |
| File explosion makes the bundle hard to read | 4 new files (game-platformer, game-level, game-entities, game-render) each <300 lines is below typical readability threshold. Each file has a clear, narrow responsibility. |
| Play-test scope creep before Leo sees v1 | Hard stop after U7. Ship v1 to get Leo's feedback before any v2 polish (X-arm bomb, Fire Jet, etc.). The user's instruction was "only return when you think you're sufficiently delivered" - that's a complete v1, not a polished v2. |

---

## Documentation / Operational Notes

- `CHANGELOG.md` v1 entry replaces placeholder (currently has scaffolding-stub entry).
- `GAME.version` already `v1` from scaffolding; no bump needed.
- `node build.js` is the only build step; produces both `dist/index.html` (deployable) and `index.html` (root, for GitHub Pages legacy mode).
- After ship: optionally add to `tomalterman.github.io/games/index.html` per arcade-template README. This is a separate-repo task, not part of v1.

---

## Sources & References

- **Origin document:** [docs/brainstorms/dowza-v1-requirements.md](../brainstorms/dowza-v1-requirements.md)
- Engine code: `src/engine/loop.js`, `src/engine/screens.js`, `src/engine/input.js`, `src/engine/engine.js`
- Adjacent precedent: `../arcade-template/src/game.js` (Block Dodge), `../tiny-kitty-garden/src/template.html` (UI hide pattern)
- External: Job Talle 2D platformer physics, Jake Gordon game-loop, Eloquent JS ch.16, jakesgordon/javascript-tiny-platformer (see Context & Research / External References)
