// ---------------------------------------------------------------------------
// Game 3: 忍耐任務 — a solid floor runs under the whole level; steps sway
// left and right in a gentle S-curve as they rise above it, spaced well
// apart, jumping higher and higher as you go. Every step sits at its own
// height — never two at once. Close to the goal, steps start drifting left
// and right, or up and down, so you have to time the jump. Miss a jump and
// real gravity just carries you back down through the gaps to the floor —
// climb again from there, with your jump back at its starting strength.
// Reach the top to win. No "try again" screen along the way: falling just
// costs you the climb, not the run.
// ---------------------------------------------------------------------------
const GameMario = (() => {
  function create(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const GROUND_Y = H - 90;
    const GRAVITY = 2800;
    const BASE_JUMP_VELOCITY = -740;
    const JUMP_GROWTH = 20;
    const MOVE_SPEED = 230;
    const PLAYER_SIZE = 34;
    const PLATFORM_W = PLAYER_SIZE * 2;
    const PLATFORM_H = 16;
    const GAP_FRACTION = 0.5;
    const MOVING_GAP_FRACTION = 0.28;
    const SWAY_AMPLITUDE = 180;
    const SWAY_WAVES = 1;
    const MIN_X_GAP = 160;
    const PLATFORM_COUNT = CONFIG.games.mario.platformCount;
    const MOVING_ZONE_COUNT = 30;
    const MOVE_X_AMPLITUDE = 50;
    const MOVE_Y_AMPLITUDE = 36;
    const ANCHOR_Y = H * 0.45;
    const START_X = W / 2;

    let player, platforms, camY, elapsed, running, rafId, lastTime, keys, walkFrame, walkTimer, highestIndex;

    function maxJumpHeight(level) {
      const v = jumpVelocityFor(level);
      return (v * v) / (2 * GRAVITY);
    }

    function buildTower() {
      platforms = [{ index: 0, baseX: 0, baseY: GROUND_Y, w: W, isFinal: false, mover: null }];
      let y = GROUND_Y;
      let prevX = START_X - PLATFORM_W / 2;
      for (let i = 1; i <= PLATFORM_COUNT; i++) {
        const isFinal = i === PLATFORM_COUNT;
        const nearGoal = !isFinal && i > PLATFORM_COUNT - MOVING_ZONE_COUNT - 1;
        const gap = maxJumpHeight(i - 1) * (nearGoal ? MOVING_GAP_FRACTION : GAP_FRACTION);
        y -= gap;
        const sway = Math.sin((i / PLATFORM_COUNT) * Math.PI * 2 * SWAY_WAVES) * SWAY_AMPLITUDE;
        let x = START_X + sway - PLATFORM_W / 2;
        if (Math.abs(x - prevX) < MIN_X_GAP) {
          x = prevX + Math.sign(x - prevX || 1) * MIN_X_GAP;
        }
        let mover = null;
        if (nearGoal) {
          const axis = i % 2 === 0 ? "x" : "y";
          const amplitude = axis === "x" ? MOVE_X_AMPLITUDE : MOVE_Y_AMPLITUDE;
          mover = { axis, amplitude, speed: 1.6 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2 };
          if (axis === "x") x = Math.max(10 + amplitude, Math.min(W - PLATFORM_W - 10 - amplitude, x));
        } else {
          x = Math.max(10, Math.min(W - PLATFORM_W - 10, x));
        }
        platforms.push({ index: i, baseX: x, baseY: y, w: PLATFORM_W, isFinal, mover });
        prevX = x;
      }
    }

    function currentPos(p) {
      if (!p.mover) return { x: p.baseX, y: p.baseY };
      const offset = Math.sin(elapsed * p.mover.speed + p.mover.phase) * p.mover.amplitude;
      return p.mover.axis === "x" ? { x: p.baseX + offset, y: p.baseY } : { x: p.baseX, y: p.baseY + offset };
    }

    function jumpVelocityFor(level) {
      return BASE_JUMP_VELOCITY - level * JUMP_GROWTH;
    }

    function reset() {
      buildTower();
      player = { x: START_X, y: GROUND_Y, vy: 0, grounded: true, facing: 1, level: 0, supportIndex: 0, ridePos: { x: START_X, y: GROUND_Y } };
      camY = 0;
      elapsed = 0;
      running = true;
      lastTime = null;
      keys = {};
      walkFrame = 0;
      walkTimer = 0;
      highestIndex = 0;
      if (opts.onScoreUpdate) opts.onScoreUpdate(`第 0 / ${PLATFORM_COUNT} 階`);
    }

    function jump() {
      if (!running) return;
      if (player.grounded) {
        player.vy = jumpVelocityFor(player.level);
        player.grounded = false;
      }
    }

    function land(p, pos) {
      player.grounded = true;
      player.y = pos.y;
      player.vy = 0;
      player.level = p.index;
      player.supportIndex = p.index;
      player.ridePos = pos;
      if (p.index > highestIndex) {
        highestIndex = p.index;
        if (opts.onScoreUpdate) opts.onScoreUpdate(`第 ${highestIndex} / ${PLATFORM_COUNT} 階`);
      }
      if (p.isFinal) {
        running = false;
        opts.onWin();
      }
    }

    function update(dt) {
      elapsed += dt;
      let walking = false;
      if (keys.left) {
        player.x -= MOVE_SPEED * dt;
        player.facing = -1;
        walking = true;
      }
      if (keys.right) {
        player.x += MOVE_SPEED * dt;
        player.facing = 1;
        walking = true;
      }
      player.x = Math.max(PLAYER_SIZE / 2, Math.min(W - PLAYER_SIZE / 2, player.x));

      if (!player.grounded) {
        player.vy += GRAVITY * dt;
        const prevY = player.y;
        player.y += player.vy * dt;

        if (player.vy > 0) {
          for (const p of platforms) {
            const pos = currentPos(p);
            const overlap = player.x + PLAYER_SIZE / 2 > pos.x && player.x - PLAYER_SIZE / 2 < pos.x + p.w;
            if (overlap && prevY <= pos.y && player.y >= pos.y) {
              land(p, pos);
              break;
            }
          }
        }
      } else {
        const p = platforms[player.supportIndex];
        const pos = currentPos(p);
        const stillOn = player.x + PLAYER_SIZE / 2 > pos.x && player.x - PLAYER_SIZE / 2 < pos.x + p.w;
        if (!stillOn) {
          player.grounded = false;
        } else {
          player.x += pos.x - player.ridePos.x;
          player.y = pos.y;
          player.ridePos = pos;
        }
      }

      camY = Math.min(0, player.y - ANCHOR_Y);

      if (walking) {
        walkTimer += dt;
        if (walkTimer > 0.12) {
          walkTimer = 0;
          walkFrame = 1 - walkFrame;
        }
      } else {
        walkFrame = 0;
      }
    }

    function draw() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#bfe9ff");
      grad.addColorStop(1, "#ffe0ec");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      for (const p of platforms) {
        const pos = currentPos(p);
        const sx = pos.x;
        const sy = pos.y - camY;
        if (sy < -40 || sy > H + 40 || sx + p.w < -40 || sx > W + 40) continue;
        if (p.index === 0) {
          ctx.fillStyle = "#bff0c4";
          ctx.fillRect(sx, sy, p.w, H - sy);
          ctx.fillStyle = "#9fdba0";
          ctx.fillRect(sx, sy, p.w, 6);
          continue;
        }
        ctx.fillStyle = p.isFinal ? PALETTE.rose : p.mover ? PALETTE.roseDark : PALETTE.goldDark;
        ctx.fillRect(sx, sy, p.w, PLATFORM_H);
        ctx.strokeStyle = p.mover ? PALETTE.rose : PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy, p.w - 2, PLATFORM_H);

        if (p.isFinal) {
          const cs = 34 / Pixel.width(SPRITES.heart.rows);
          ctx.save();
          ctx.shadowColor = PALETTE.rose;
          ctx.shadowBlur = 14;
          Pixel.draw(ctx, SPRITES.heart.rows, SPRITES.heart.palette, sx + p.w / 2 - 17, sy - Pixel.height(SPRITES.heart.rows) * cs, cs);
          ctx.restore();
        }
      }

      const rows = player.grounded ? (walkFrame === 0 ? SPRITES.hero.idle : SPRITES.hero.walk) : SPRITES.hero.idle;
      const size = PLAYER_SIZE / Pixel.width(rows);
      ctx.save();
      ctx.translate(player.x - PLAYER_SIZE / 2, player.y - camY - Pixel.height(rows) * size);
      if (player.facing === -1) {
        ctx.translate(Pixel.width(rows) * size, 0);
        ctx.scale(-1, 1);
      }
      Pixel.draw(ctx, rows, SPRITES.hero.palette, 0, 0, size);
      ctx.restore();
    }

    function loop(t) {
      if (!running) return;
      if (lastTime == null) lastTime = t;
      const dt = Math.min((t - lastTime) / 1000, 0.033);
      lastTime = t;
      update(dt);
      if (running) {
        draw();
        rafId = requestAnimationFrame(loop);
      }
    }

    function onKeyDown(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;
      if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Space") {
        e.preventDefault();
        jump();
      }
    }
    function onKeyUp(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
    }
    function onPointer(e) {
      e.preventDefault();
      jump();
    }

    function setLeft(active) {
      keys.left = active;
    }
    function setRight(active) {
      keys.right = active;
    }

    function start() {
      reset();
      draw();
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      canvas.addEventListener("pointerdown", onPointer);
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointer);
    }

    return { start, stop, setLeft, setRight, jump };
  }
  return { create };
})();
