---
date: 2026-04-26
topic: dowza-v1
---

# Dowza v1 — Side-Scrolling Mario-Style Platformer

## Problem Frame

Leo (6) co-designed an arcade game called *Dowza vs. Bowzashine*. We want to ship a v1 that feels recognizably "his game" — Dowza's character, Mario-style platforming, and a dramatic boss fight against Bowzashine — built on the existing `../arcade-template` engine. v1 must be playable end-to-end (level → boss → win), preserve Leo's strongest creative anchors, and be intentionally narrow so we can ship and iterate.

---

## Actors

- A1. Leo (primary player): 6yo. Plays via touchscreen and keyboard. Cannot reliably read complex text. Game must be playable without reading.
- A2. Tom (developer / parent): Implements the game on top of the existing arcade template. Wants tight v1 scope so it ships, and wants reusable engine improvements migrated back to `../arcade-template` deliberately.

---

## Key Flows

- F1. Single playthrough
  - **Trigger:** Leo taps the title screen.
  - **Actors:** A1
  - **Steps:**
    1. Dowza spawns at the left edge of the level.
    2. Leo runs and jumps rightward through the level, defeating regular enemies via stomp or fireball.
    3. Dowza reaches the boss arena at the far right of the level.
    4. Bowzashine fires shining blast attacks in telegraphed patterns; Leo dodges.
    5. Leo throws a fireball at Bowzashine → his shine shield breaks and he is briefly stunned.
    6. Leo stomps the stunned Bowzashine → 1 damage.
    7. Repeat 4–6 until Bowzashine is defeated → win screen.
    8. If Dowza takes 6 hits at any point → game over screen with restart prompt.
  - **Outcome:** Leo wins (boss defeated) or loses (6 hits taken). Either path returns to a restart-ready state.
  - **Covered by:** R1–R15

---

## Requirements

**Player movement (Dowza)**
- R1. Dowza runs left and right on solid ground; movement is held, not toggled.
- R2. Dowza can jump with gravity and variable height (longer hold = higher jump), Mario-style.
- R3. Stomping an enemy from above defeats it and gives Dowza a small jump bounce.

**Player attack**
- R4. Dowza throws fireballs in the direction he is facing on a dedicated input.
- R5. Fireballs defeat regular enemies on impact and have a finite lifetime.

**Level and camera**
- R6. The level scrolls horizontally; the camera follows Dowza.
- R7. Regular enemies populate the level. Dowza must traverse the level to reach the boss arena at the level's end.

**Boss fight (Bowzashine)**
- R8. Bowzashine is shielded by his shine: stomps and fireballs do no damage while shielded; touching a shielded Bowzashine costs Dowza 1 HP.
- R9. A fireball hit on Bowzashine breaks his shine shield and stuns him for a short window.
- R10. Stomping the stunned Bowzashine deals 1 damage; Dowza bounces off as with a normal stomp.
- R11. Bowzashine fires telegraphed shining blast attacks that deal 1 HP to Dowza on contact.
- R12. After a small number of stomp-hits (default proposal: 3), Bowzashine is defeated → win.

**Health and lose condition**
- R13. Dowza has 6 HP. Any contact with an enemy or a shine blast costs 1 HP.
- R14. After taking damage, Dowza is briefly invincible (i-frames) so a single overlap doesn't drain multiple HP.
- R15. At 0 HP, the game over screen appears with a restart affordance.

**Visual & audio identity**
- R16. Dowza renders as a green-bodied, blue-headed dinosaur with green body spikes and blue head spikes.
- R17. Bowzashine is visually distinct, larger than Dowza, with bright glowing shine attacks.
- R18. The level theme is a fire/lava world, Bowser-castle aesthetic.
- R19. All visuals are procedural Canvas; all sounds are procedural Web Audio (engine constraint inherited from `../arcade-template`).

**Title and end screens**
- R20. The title screen shows "DOWZA" with the subtitle and a tap/press-to-start affordance — readable without literacy beyond recognizing the title art.
- R21. On boss defeat, a clearly distinct win screen plays.

---

## Acceptance Examples

- AE1. **Covers R3, R5.** Given Dowza is running rightward toward a regular walker enemy, when Dowza jumps and lands on the enemy's head, the enemy is defeated and Dowza bounces upward. Alternatively, when Dowza throws a fireball that hits the same enemy, the enemy is also defeated.
- AE2. **Covers R8, R9, R10.** Given Bowzashine is in his shielded shining state, when Dowza stomps him, no boss damage is dealt and Dowza loses 1 HP. When Dowza throws a fireball that hits Bowzashine, his shine shield breaks and he is briefly stunned. While stunned, Dowza stomps him → 1 damage to the boss.
- AE3. **Covers R13, R14.** Given Dowza is at 6 HP, when an enemy contacts him, he drops to 5 HP and flashes for an i-frame window. During that window, further enemy contact deals no further damage.

---

## Success Criteria

- Leo can pick up the game on a phone, tablet, or desktop and play through level → boss → win without instruction beyond the on-screen controls.
- The four creative anchors Leo cared about most (Dowza's identity, green/blue spiky look, fire powers, dramatic boss fight) are visibly present and recognizable to him.
- Code is structured so v2 can add the deferred features (X-arm bomb, Fire Jet, Superstar, Big Fist, more levels) without architectural rewrites.
- Reusable platformer engine improvements (camera scroll, gravity, platform collision) are migrated back to `../arcade-template` deliberately, per the repo's stated convention.

---

## Scope Boundaries

- **No X-arm fire bomb in v1** — kept in design canon, deferred to v2.
- **No Fire Jet in v1** — deferred to v2.
- **No Superstar power-up in v1** — deferred.
- **No Big Fist move in v1** — deferred.
- **One level only** — Bowzashine is the v1 boss; "next level" is v2+.
- **No high-score leaderboard surfaced in v1** — Dowza is a beat-the-boss game, not a score-chase. Hide the engine's high-score UI (precedent: tiny-kitty-garden).
- **No procedural level generation** — level layout is hand-authored.
- **No save/checkpoint system** — game over restarts from the start of the level.

---

## Key Decisions

- **Mario-canon platformer over single-screen boss arena.** Leo wanted the journey, not just the fight. Settled in dialogue against the smaller "boss-only" alternative.
- **Stomp and fireball both defeat regular enemies.** Mario-canon. Makes the jump button do double duty and gives Leo two valid options against any enemy.
- **Fireball-stun → stomp-damage boss loop.** Both core moves load-bearing in the climax. Picked over fireball-only, X-arm-only, and stomp-only alternatives.
- **Two-button SMB1-style controls.** Movement (left, right) + jump + fireball = 4 inputs. Matches Super Mario Bros 1985 exactly, fits the touchscreen input budget for a 6yo, and maps cleanly onto the engine's `controls` config.
- **Defer X-arm bomb and Fire Jet to v2.** Both are still in Leo's design canon for later. Removing them from v1 keeps the surface area small and the build shippable.

---

## Dependencies / Assumptions

- v1 is built on `../arcade-template`'s engine, which currently provides: 384×216 canvas, input system (configurable buttons), procedural sound, particle system, score popups, hit-flash, and title/game-over screens.
- **The engine does not currently implement camera scrolling, gravity/jump physics, platform collision, or horizontal level layout.** These will need to be added in dowza's `src/game.js` (and potentially in new engine modules that get migrated back to `../arcade-template`).
- The 4-control touch layout (left, right, jump, fireball) is feasible within the engine's existing `controls` config.
- The engine's high-score UI can be hidden via the same approach used by tiny-kitty-garden.

---

## Outstanding Questions

### Resolve Before Planning

*(none — all blocking product decisions are resolved.)*

### Deferred to Planning

- [Affects R12][User decision during planning] How many stomp-hits does Bowzashine take to defeat? Default proposal: 3 stomps in v1 (short, dramatic).
- [Affects R6, R7][Technical] Camera scrolling implementation: continuous follow vs. screen-flip on edge. Default lean: continuous (Mario-canon); planning should weigh engine effort vs. feel.
- [Affects R2][Technical] Jump physics tuning constants — gravity, max jump height, variable-hold curve. Mario-feel is sensitive to these; budget time to playtest.
- [Affects R7][User decision] Pits/lava as instant-death hazards? Mario has them, but they punish a 6yo. Default proposal: **no pits in v1**; all damage is enemy- or boss-driven.
- [Affects R7][User decision] How many distinct regular-enemy types in v1? Default proposal: **1 walker enemy** for v1; add variety in v2.
- [Affects R7][User decision] Approximate level length? Default proposal: ~3 "screens" of content (~60–90s of play) before the boss arena.
- [Affects R20][Technical] On-screen control glyphs and positioning for the jump and fireball touch buttons.

---

## Next Steps

-> `/ce-plan` for structured implementation planning. Bring this document into the planning step; the planner will resolve the *Deferred to Planning* questions either with the suggested defaults or with explicit user input.
