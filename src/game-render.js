// ==================== PROCEDURAL PIXEL ART ====================
// All entity rendering. Pure draw functions called from game.js gameRender().
// Procedural Canvas API only -- no images.
//
// Convention: each draw function takes an entity and the camera-x offset, and
// translates entity world coords -> screen coords (entity.x - cameraX).
// Drawing is rect-based pixel art with deliberate chunky pixels.

// =====================================================================
// DOWZA: green-bodied + blue-headed dinosaur with spikes (12x16)
// =====================================================================

function drawDowza(ctx, d, camX) {
    if (!d || !d.alive && d.alive !== undefined) {
        // alive flag: undefined means title-screen fake; false means dead.
        if (d.alive === false) return;
    }
    const sx = Math.round(d.x - camX);
    const sy = Math.round(d.y);

    // i-frames flicker: skip rendering every other frame while invincible
    if (d.iFrames > 0 && Math.floor(d.iFrames / 4) % 2 === 0) return;

    // Foot stance: alternates while running
    let stance = 0;
    if (d.state === 'run') stance = Math.floor(d.animFrame / 6) % 2;
    else if (d.state === 'jump' || d.state === 'fall') stance = 2;
    // hurt -> use stance 0 (will be flickered out anyway)

    const f = d.facing >= 0 ? 1 : -1;
    // Mirror: simplest approach is to compute pixel x relative to the sprite's
    // left edge, but flip for left-facing. We do this by passing a coord
    // transformer.
    const px = (lx) => sx + (f === 1 ? lx : (DOWZA_W - 1 - lx));

    // ---- Body (green) ----
    const bodyTop = sy + 7;
    ctx.fillStyle = '#3aaa3a';  // mid green body
    rectPx(ctx, sx + 2, bodyTop, 8, 7);
    // Body shading
    ctx.fillStyle = '#2a8030';
    rectPx(ctx, sx + 2, bodyTop, 8, 1);
    rectPx(ctx, sx + 2, bodyTop + 6, 8, 1);
    ctx.fillStyle = '#5acc5a';
    rectPx(ctx, sx + 3, bodyTop + 1, 1, 5);

    // Belly (lighter)
    ctx.fillStyle = '#a4e088';
    rectPx(ctx, sx + 4, bodyTop + 2, 4, 3);

    // ---- Body spikes (green, dorsal) ----
    ctx.fillStyle = '#1a601a';
    // 3 dorsal spikes along the back, mirrored by facing
    rectPx(ctx, px(f === 1 ? 1 : 1), bodyTop + 1, 1, 2);
    rectPx(ctx, px(f === 1 ? 1 : 0), bodyTop + 3, 1, 2);
    rectPx(ctx, px(f === 1 ? 1 : 1), bodyTop + 5, 1, 2);

    // ---- Head (blue) ----
    const headTop = sy + 1;
    ctx.fillStyle = '#3070cc';
    rectPx(ctx, sx + 3, headTop, 7, 6);
    // Head shading
    ctx.fillStyle = '#205088';
    rectPx(ctx, sx + 3, headTop, 7, 1);
    ctx.fillStyle = '#5090ee';
    rectPx(ctx, sx + 3, headTop + 1, 1, 4);

    // Snout
    if (f === 1) {
        ctx.fillStyle = '#3070cc';
        rectPx(ctx, sx + 9, headTop + 3, 2, 2);
        ctx.fillStyle = '#205088';
        rectPx(ctx, sx + 10, headTop + 3, 1, 1);
    } else {
        ctx.fillStyle = '#3070cc';
        rectPx(ctx, sx + 1, headTop + 3, 2, 2);
        ctx.fillStyle = '#205088';
        rectPx(ctx, sx + 1, headTop + 3, 1, 1);
    }

    // ---- Head spikes (blue, on top of head) ----
    ctx.fillStyle = '#103060';
    rectPx(ctx, sx + 4, headTop - 1, 1, 1);
    rectPx(ctx, sx + 7, headTop - 1, 1, 1);
    rectPx(ctx, sx + 4, headTop - 2, 1, 1);
    rectPx(ctx, sx + 7, headTop - 2, 1, 1);

    // ---- Eye ----
    ctx.fillStyle = '#fff';
    rectPx(ctx, px(f === 1 ? 8 : 4), headTop + 2, 1, 2);
    ctx.fillStyle = '#000';
    rectPx(ctx, px(f === 1 ? 8 : 4), headTop + 3, 1, 1);

    // ---- Mouth (small smile) ----
    ctx.fillStyle = '#1a4080';
    if (f === 1) {
        rectPx(ctx, sx + 9, headTop + 5, 1, 1);
    } else {
        rectPx(ctx, sx + 2, headTop + 5, 1, 1);
    }

    // ---- Arms ----
    ctx.fillStyle = '#3aaa3a';
    if (d.state === 'idle' || d.state === 'run' || d.state === 'hurt') {
        rectPx(ctx, sx + 1, sy + 9, 2, 3);
        rectPx(ctx, sx + 9, sy + 9, 2, 3);
    } else if (d.state === 'jump') {
        // Arms up
        rectPx(ctx, sx + 0, sy + 7, 2, 3);
        rectPx(ctx, sx + 10, sy + 7, 2, 3);
    } else if (d.state === 'fall') {
        // Arms out
        rectPx(ctx, sx + 0, sy + 9, 2, 3);
        rectPx(ctx, sx + 10, sy + 9, 2, 3);
    }
    ctx.fillStyle = '#2a8030';
    if (d.state === 'idle' || d.state === 'run') {
        rectPx(ctx, sx + 1, sy + 11, 2, 1);
        rectPx(ctx, sx + 9, sy + 11, 2, 1);
    }

    // ---- Legs ----
    ctx.fillStyle = '#2a8030';
    if (stance === 0) {
        rectPx(ctx, sx + 3, sy + 14, 2, 2);
        rectPx(ctx, sx + 7, sy + 14, 2, 2);
    } else if (stance === 1) {
        rectPx(ctx, sx + 2, sy + 14, 2, 2);
        rectPx(ctx, sx + 8, sy + 14, 2, 2);
    } else {
        // jumping: legs together
        rectPx(ctx, sx + 4, sy + 13, 4, 3);
    }
    // Foot tips (darker)
    ctx.fillStyle = '#103018';
    if (stance === 0) {
        rectPx(ctx, sx + 3, sy + 15, 2, 1);
        rectPx(ctx, sx + 7, sy + 15, 2, 1);
    } else if (stance === 1) {
        rectPx(ctx, sx + 2, sy + 15, 2, 1);
        rectPx(ctx, sx + 8, sy + 15, 2, 1);
    } else {
        rectPx(ctx, sx + 4, sy + 15, 4, 1);
    }
}

// =====================================================================
// WALKER: small fire-imp (12x12)
// =====================================================================

function drawWalker(ctx, w, camX) {
    const sx = Math.round(w.x - camX);
    const sy = Math.round(w.y);

    if (!w.alive) {
        // Squash fade: shrink vertically and fade out across deathFrames
        const t = Math.min(1, w.deathFrames / 18);
        const sh = Math.max(2, Math.round(WALKER_H * (1 - t * 0.85)));
        const yOff = WALKER_H - sh;
        ctx.fillStyle = `rgba(220, 80, 30, ${(1 - t).toFixed(2)})`;
        rectPx(ctx, sx + 1, sy + yOff, WALKER_W - 2, sh);
        return;
    }

    // Body (orange-red)
    ctx.fillStyle = '#cc4018';
    rectPx(ctx, sx + 1, sy + 2, WALKER_W - 2, WALKER_H - 3);
    ctx.fillStyle = '#882010';
    rectPx(ctx, sx + 1, sy + 2, WALKER_W - 2, 1);
    rectPx(ctx, sx + 1, sy + WALKER_H - 2, WALKER_W - 2, 1);
    ctx.fillStyle = '#ff7038';
    rectPx(ctx, sx + 2, sy + 3, 1, WALKER_H - 5);

    // Hot belly glow
    ctx.fillStyle = '#ffaa30';
    rectPx(ctx, sx + 4, sy + 5, 4, 3);
    ctx.fillStyle = '#ffe060';
    rectPx(ctx, sx + 5, sy + 6, 2, 1);

    // Eyes -- look forward
    ctx.fillStyle = '#000';
    if (w.vx >= 0) {
        rectPx(ctx, sx + 7, sy + 4, 1, 2);
        rectPx(ctx, sx + 9, sy + 4, 1, 2);
    } else {
        rectPx(ctx, sx + 2, sy + 4, 1, 2);
        rectPx(ctx, sx + 4, sy + 4, 1, 2);
    }

    // Two little horns (fire imp style)
    ctx.fillStyle = '#601008';
    rectPx(ctx, sx + 3, sy + 1, 1, 1);
    rectPx(ctx, sx + 8, sy + 1, 1, 1);
    rectPx(ctx, sx + 3, sy, 1, 1);
    rectPx(ctx, sx + 8, sy, 1, 1);

    // Feet (alternate while moving)
    const stance = Math.floor(w.animFrame / 8) % 2;
    ctx.fillStyle = '#400808';
    if (stance === 0) {
        rectPx(ctx, sx + 2, sy + WALKER_H - 1, 3, 1);
        rectPx(ctx, sx + 7, sy + WALKER_H - 1, 3, 1);
    } else {
        rectPx(ctx, sx + 3, sy + WALKER_H - 1, 3, 1);
        rectPx(ctx, sx + 6, sy + WALKER_H - 1, 3, 1);
    }
}

// =====================================================================
// FIREBALL (6x6) -- flickers yellow/orange/red over 4 frames
// =====================================================================

function drawFireball(ctx, fb, camX) {
    if (!fb.alive) return;
    const sx = Math.round(fb.x - camX);
    const sy = Math.round(fb.y);
    const phase = Math.floor(fb.animFrame / 3) % 4;
    const colors = [
        ['#ffe060', '#ffaa30', '#ff5018'],   // yellow core
        ['#ffaa30', '#ff7028', '#cc3010'],   // orange
        ['#ff5018', '#cc3010', '#700808'],   // red
        ['#fff8c0', '#ffe060', '#ffaa30']    // bright flash
    ];
    const c = colors[phase];
    // Outer
    ctx.fillStyle = c[2];
    rectPx(ctx, sx, sy + 1, 6, 4);
    rectPx(ctx, sx + 1, sy, 4, 6);
    // Mid
    ctx.fillStyle = c[1];
    rectPx(ctx, sx + 1, sy + 1, 4, 4);
    // Core
    ctx.fillStyle = c[0];
    rectPx(ctx, sx + 2, sy + 2, 2, 2);

    // Tiny trail behind direction of motion
    const trailX = fb.vx > 0 ? sx - 3 : sx + 6;
    ctx.fillStyle = `rgba(255, 200, 60, 0.5)`;
    rectPx(ctx, trailX, sy + 2, 2, 2);
}

// =====================================================================
// BOWZASHINE (36x40) -- big bright dragon-boss
// =====================================================================

function drawBowzashine(ctx, b, camX, time) {
    const sx = Math.round(b.x - camX);
    const sy = Math.round(b.y);

    // Shielded shimmer (golden halo) drawn behind body
    if (b.state === 'SHIELDED') {
        const pulse = 0.4 + Math.sin(time * 6) * 0.2;
        ctx.fillStyle = `rgba(255, 230, 100, ${pulse.toFixed(2)})`;
        rectPx(ctx, sx - 3, sy + 4, b.w + 6, b.h - 4);
        rectPx(ctx, sx, sy - 1, b.w, b.h);
        ctx.fillStyle = `rgba(255, 255, 200, ${(pulse * 0.6).toFixed(2)})`;
        rectPx(ctx, sx - 2, sy + 6, b.w + 4, b.h - 8);
    }

    // Body main mass
    let bodyColor = '#3a2030';     // dark wine-purple base
    let bodyShade = '#5a3050';
    let bodyHi    = '#8060a0';
    if (b.state === 'STUNNED') {
        // dimmer + tint blue
        bodyColor = '#202040';
        bodyShade = '#404068';
        bodyHi    = '#6068a0';
    }
    if (b.state === 'DAMAGED' && Math.floor(b.stateFrames / 3) % 2 === 0) {
        bodyColor = '#ff8848';
        bodyShade = '#ffaa60';
        bodyHi    = '#fff0a0';
    }
    if (b.state === 'DEFEATED') {
        // Burnt/smoking gray-black with hint of red
        const fade = Math.min(1, b.stateFrames / 50);
        bodyColor = fade > 0.5 ? '#1a0a0a' : '#3a1a1a';
        bodyShade = '#2a1010';
        bodyHi    = '#5a2818';
    }

    // Torso
    ctx.fillStyle = bodyColor;
    rectPx(ctx, sx + 4, sy + 12, b.w - 8, b.h - 16);
    // Belly (slightly lighter)
    ctx.fillStyle = bodyHi;
    rectPx(ctx, sx + 10, sy + 18, b.w - 20, b.h - 26);
    // Top shading
    ctx.fillStyle = bodyShade;
    rectPx(ctx, sx + 4, sy + 12, b.w - 8, 2);
    // Bottom shading
    ctx.fillStyle = '#2a1020';
    rectPx(ctx, sx + 4, sy + b.h - 6, b.w - 8, 2);

    // Head (top) -- chunky with two horns
    ctx.fillStyle = bodyColor;
    rectPx(ctx, sx + 8, sy + 4, b.w - 16, 10);
    ctx.fillStyle = bodyShade;
    rectPx(ctx, sx + 8, sy + 4, b.w - 16, 2);
    // Horns
    ctx.fillStyle = '#fff0a0';
    rectPx(ctx, sx + 8, sy, 3, 5);
    rectPx(ctx, sx + b.w - 11, sy, 3, 5);
    ctx.fillStyle = '#ffaa30';
    rectPx(ctx, sx + 9, sy + 1, 1, 3);
    rectPx(ctx, sx + b.w - 10, sy + 1, 1, 3);

    // Eyes (glowing yellow during SHIELDED, dim during STUNNED, red flash on DAMAGED, dark on DEFEATED)
    let eyeColor = '#ffe040';
    let pupilColor = '#000';
    if (b.state === 'STUNNED') eyeColor = '#7080cc';
    if (b.state === 'DAMAGED' && Math.floor(b.stateFrames / 4) % 2 === 0) eyeColor = '#ff4030';
    if (b.state === 'DEFEATED') { eyeColor = '#1a0808'; pupilColor = '#1a0808'; }
    ctx.fillStyle = eyeColor;
    rectPx(ctx, sx + 12, sy + 7, 3, 3);
    rectPx(ctx, sx + b.w - 15, sy + 7, 3, 3);
    ctx.fillStyle = pupilColor;
    if (b.state !== 'STUNNED' && b.state !== 'DEFEATED') {
        rectPx(ctx, sx + 13, sy + 8, 1, 2);
        rectPx(ctx, sx + b.w - 14, sy + 8, 1, 2);
    } else if (b.state === 'STUNNED') {
        // X eyes (stunned look)
        ctx.fillStyle = '#000';
        rectPx(ctx, sx + 12, sy + 7, 1, 1);
        rectPx(ctx, sx + 14, sy + 9, 1, 1);
        rectPx(ctx, sx + 12, sy + 9, 1, 1);
        rectPx(ctx, sx + 14, sy + 7, 1, 1);
        rectPx(ctx, sx + b.w - 15, sy + 7, 1, 1);
        rectPx(ctx, sx + b.w - 13, sy + 9, 1, 1);
        rectPx(ctx, sx + b.w - 15, sy + 9, 1, 1);
        rectPx(ctx, sx + b.w - 13, sy + 7, 1, 1);
    }

    // Mouth -- crossed-arms-during-shielded means mouth closed; open during STUNNED
    if (b.state === 'STUNNED') {
        ctx.fillStyle = '#1a0808';
        rectPx(ctx, sx + b.w / 2 - 3, sy + 11, 6, 2);
    } else if (b.state !== 'DEFEATED') {
        ctx.fillStyle = '#3a1a1a';
        rectPx(ctx, sx + b.w / 2 - 2, sy + 12, 4, 1);
    }

    // Arms crossed during SHIELDED, dropped during others
    ctx.fillStyle = bodyColor;
    if (b.state === 'SHIELDED') {
        // crossed arms across the chest (X shape)
        rectPx(ctx, sx + 5, sy + 18, 14, 3);
        rectPx(ctx, sx + b.w - 19, sy + 22, 14, 3);
    } else {
        rectPx(ctx, sx + 1, sy + 18, 5, 8);
        rectPx(ctx, sx + b.w - 6, sy + 18, 5, 8);
    }
    ctx.fillStyle = bodyShade;
    if (b.state === 'SHIELDED') {
        rectPx(ctx, sx + 5, sy + 18, 14, 1);
    }

    // Spikes on the back row (silhouetted; visible above shoulders)
    ctx.fillStyle = '#fff0a0';
    rectPx(ctx, sx + 2, sy + 16, 2, 2);
    rectPx(ctx, sx + b.w - 4, sy + 16, 2, 2);
    rectPx(ctx, sx + 2, sy + 22, 2, 2);
    rectPx(ctx, sx + b.w - 4, sy + 22, 2, 2);
    ctx.fillStyle = '#ff8838';
    rectPx(ctx, sx + 2, sy + 17, 1, 1);
    rectPx(ctx, sx + b.w - 4, sy + 17, 1, 1);

    // Feet (chunky claws)
    ctx.fillStyle = '#1a0808';
    rectPx(ctx, sx + 6, sy + b.h - 4, 7, 4);
    rectPx(ctx, sx + b.w - 13, sy + b.h - 4, 7, 4);
    ctx.fillStyle = '#fff0a0';
    rectPx(ctx, sx + 7, sy + b.h - 1, 1, 1);
    rectPx(ctx, sx + 11, sy + b.h - 1, 1, 1);
    rectPx(ctx, sx + b.w - 12, sy + b.h - 1, 1, 1);
    rectPx(ctx, sx + b.w - 8, sy + b.h - 1, 1, 1);
}

// =====================================================================
// SHINE BLAST (8x8) -- bright yellow projectile with white core
// =====================================================================

function drawShineBlast(ctx, s, camX) {
    if (!s.alive) return;
    const sx = Math.round(s.x - camX);
    const sy = Math.round(s.y);
    const phase = Math.floor(s.animFrame / 4) % 2;
    // Outer
    ctx.fillStyle = '#ffaa20';
    rectPx(ctx, sx, sy + 1, 8, 6);
    rectPx(ctx, sx + 1, sy, 6, 8);
    // Mid
    ctx.fillStyle = phase === 0 ? '#ffe040' : '#fff088';
    rectPx(ctx, sx + 1, sy + 1, 6, 6);
    // Core
    ctx.fillStyle = '#fff';
    rectPx(ctx, sx + 3, sy + 3, 2, 2);

    // Sparkle trail
    if (phase === 0) {
        ctx.fillStyle = `rgba(255, 240, 140, 0.6)`;
        rectPx(ctx, sx - Math.sign(s.vx) * 2 + 3, sy + 3, 1, 1);
    }
}

// =====================================================================
// Pixel-snap rect helper. Canvas fillRect with floats causes anti-aliasing
// blur on pixel art -- snap to integers and ensure no negative widths.
// =====================================================================

function rectPx(ctx, x, y, w, h) {
    if (w <= 0 || h <= 0) return;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
