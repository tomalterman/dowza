# Changelog

## v2 — Bigger level, audio-rich, iPad-fixed

**What changed**

- **Sound on iPad** — `src/engine/sound.js` now calls `ctx.resume()` and
  primes the audio output with a 1-frame silent buffer inside the first-
  gesture handler. iOS Safari starts every AudioContext in `suspended`
  state, so creating it on tap was not enough -- every `play()` returned
  silently. Verified by reading the page on a desktop bundle; iPad fix is
  the same code path so should land for Leo on the next deploy.
- **Level redesigned and 2x longer** — the level grew from 80 tiles
  (~16s of running) to 160 tiles (~25s plus boss) and was rebuilt around
  the SMB 1-1 progressive-introduction pattern: section 1 teaches running,
  section 2 introduces the first reachable platform, section 3 has open
  ground for stomp/fireball practice, section 4 a two-platform jump
  combo, sections 5-6 walker clusters with bypass platforms, section 7 a
  long sky-bridge, section 8 an arena ramp. **Every visible platform is
  now reachable** -- they all sit at row 11 (2 tiles above ground), well
  inside Dowza's 60px-rise full-hold jump arc. The previous level had
  decorative platforms 4-7 tiles up that nothing could reach; those were
  the "platforms make no sense" Leo flagged.
- **Walker count grew from 6 to 10** spread across the longer level so
  pacing alternates tension (clusters) with breaks (open ground).
- **Boss arena widened** from 24 tiles to 28 to give the player more room
  to dodge multi-blast volleys.
- **More audio cues** so what's happening on screen is also audible:
  - `footstep` ticks every ~14 frames while running on the ground
  - `land` plays on air-to-ground transitions with meaningful impact velocity
  - `arenaApproach` rumble fires once when the camera locks
  - `shineCharge` pre-volley telegraph fires 12 frames before each shine volley
  - `fireballWall` distinct from `enemyDie` so the kid can hear when a fireball missed

**Why**

Three pieces of feedback from playing v1: (1) no sound on iPad, (2) the
level felt short and hard to read, (3) some platforms looked like they
should be jumpable but weren't, which made the level feel arbitrary.
Research surfaced the canonical SMB 1-1 pattern (every visible affordance
is interactive; mechanics introduced in safe spaces before being
combined; pacing alternates tension and breaks) and the iOS Safari
AudioContext-suspended bug. v2 applies all three.

## v1 — First playable: Dowza vs. Bowzashine

**What changed**

- Mario-style side-scrolling platformer built on top of the
  `../arcade-template` engine. 384x216 canvas, vanilla JS, single static
  HTML file. No Phaser/Kaplay/Excalibur introduced.
- Platformer foundation in `src/game-platformer.js`: fixed-timestep
  accumulator (so physics is deterministic on 60/120/144Hz), AABB-vs-
  tile-grid collision (axis-separated), camera with deadzone follow and
  arena-lock, Mario-feel constants (variable jump cutoff, coyote time,
  jump buffer per Job Talle's writeup).
- Hand-authored 80x14 fire-world level (`src/game-level.js`) with
  jumping platforms, lava-themed parallax background (sky gradient +
  silhouette mountains + drifting embers), and an arena gate at column
  56.
- Entities (`src/game-entities.js`): Dowza (idle/run/jump/fall/hurt
  state machine, 6 HP with i-frames), Walker fire-imp (patrols ground,
  Mario-canon stomp + fireball both kill), Fireball (straight projectile,
  4-frame flicker), Bowzashine boss (state machine
  ENTERING/SHIELDED/STUNNED/DAMAGED/DEFEATED, 3-blast shine volleys,
  fireball-stun-then-stomp damage loop, 3 hits to defeat).
- Procedural pixel art (`src/game-render.js`) for every entity; no
  image files. Dowza is a green-bodied / blue-headed dinosaur with
  spikes per Leo's design canon. Bowzashine is a 36x40 boss with a
  shielded golden halo, X-eyed stunned look, and a smoke-and-fade
  defeat animation.
- Procedural Web Audio sounds (`src/game-sounds.js`): jump, stomp,
  fireball, enemyDie, playerHit, shine, bossStun, bossHit, bossDefeat,
  win.
- Two-button SMB1 controls (`src/game-config.js`): left/right + jump
  (Space/W/Up) + fire (J/Z/Shift). Touch layout overridden in
  `src/template.html` for D-pad-left + action-right cluster placement.
- High-score UI hidden via CSS (precedent: tiny-kitty-garden); engine
  `drawUI` overridden in `src/game.js` to keep hearts but drop the
  SCORE label.
- Win screen with restart hook on key/tap after a 1-second lockout.
- Documentation: brainstorm requirements doc at
  `docs/brainstorms/dowza-v1-requirements.md` and implementation plan
  at `docs/plans/2026-04-26-001-feat-dowza-v1-platformer-plan.md`.

**Why**

The brainstorm captured Leo's design canon (Dowza's identity, fire
powers, dramatic boss fight). The plan resolved the remaining technical
choices (fixed-timestep over variable, axis-separated AABB, no Tiled,
no pits, 1 walker type, 3-stomp boss) so v1 stayed scoped to "polished
playable" instead of feature-creeping.

Two real bugs caught and fixed during build:

1. **Ghost-blocking collision.** The original AABB snap-out used a
   `-0.001` epsilon to "park slightly outside the wall," which left
   the entity AABB peeking 0.001px into the previous tile. On the next
   axis sweep, `floor(y / TILE)` returned a row the entity was barely
   intersecting, and a platform tile in that row blocked horizontal
   motion at exactly column 38 (the row-11 platform). Fix: snap flush
   to tile boundaries; preserve the `-0.001` only on the AABB sweep
   *range* where the upper edge is genuinely exclusive. See comment in
   `PF_moveAndCollide`.
2. **Stunned-boss side damage.** Jumping onto the boss during STUNNED,
   Dowza's side AABB overlapped the boss before the stomp criterion
   could fire, so he took damage instead of dealing it. Fix: a
   paralyzed boss is harmless. Side-touch only damages Dowza when the
   boss is SHIELDED.

Headless smoke tests (using stubbed DOM) verified the level grid is
exactly 80x14, Dowza's spawn coordinates put him on the ground, full
playthrough completes (level + boss) in ~16s with 5/6 HP remaining via
a smart AI driver.

**Deferred to v2+** (per the brainstorm Scope Boundaries)

- X-arm fire bomb, Fire Jet, Superstar, Big Fist (all in Leo's canon).
- Second level / world progression.
- Tiled level editor, save/checkpoints.
- Multi-phase Bowzashine attack patterns.
