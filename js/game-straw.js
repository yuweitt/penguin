// ---------------------------------------------------------------------------
// Game 2: 小朋友下樓梯 — an endless staircase scrolls upward past the player.
// While standing on a step, you ride along with it. Walk off its edge (or
// let it scroll away) and gravity takes over until you land on the next one.
// Strike ahead to clear monsters, or jump away and land on one to stomp it.
// Miss every step below you, or land on a live monster, and it's over —
// reach the bottom (a little treasure chest) to win.
// ---------------------------------------------------------------------------
const GameStraw = (() => {
  function create(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const START_Y = H - 160;
    const PLAYER_SIZE = 34;
    const MOVE_SPEED = 260;
    const GRAVITY = 2200;
    const HOP_VELOCITY = -420;
    const STEP_H = 16;
    const STEP_W = 130;
    const STEP_SPACING = 130;
    const MONSTER_SIZE = 28;
    const STRIKE_RANGE_Y = 260;
    const STRIKE_DURATION = 220;
    const FALL_LIMIT_Y = H + 120;
    const TARGET_DEPTH = CONFIG.games.straw.targetDepth;
    const MAX_STEP_DELTA = 100;
    const MIN_X = 30;
    const MAX_X = W - 30 - STEP_W;
    const DANGER_RED = "#e0433f";
    const DANGER_RED_DARK = "#a92c29";
    const DANGER_GROUP_SIZE = 5;

    let player, steps, spawnCounter, depth, scrollSpeed, running, rafId, lastTime, keys, walkFrame, walkTimer, strikeTimer, lastStepX, dangerOffset;

    function makeStep(y, opts2) {
      opts2 = opts2 || {};
      let x;
      if (opts2.x != null) {
        x = opts2.x;
      } else {
        const lo = Math.max(MIN_X, lastStepX - MAX_STEP_DELTA);
        const hi = Math.min(MAX_X, lastStepX + MAX_STEP_DELTA);
        x = lo + Math.random() * (hi - lo);
      }
      lastStepX = x;
      spawnCounter++;
      const isFinal = spawnCounter === TARGET_DEPTH;

      const offsetInGroup = (spawnCounter - 1) % DANGER_GROUP_SIZE;
      const hasMonster = !opts2.safe && !isFinal && offsetInGroup === dangerOffset;

      return { x, y, w: STEP_W, hasMonster, monsterCleared: false, isFinal };
    }

    function reset() {
      player = { x: W / 2, y: START_Y, vy: 0, grounded: true, supportStep: null, lastStep: null, jumpedThisFall: false, facing: 1 };
      steps = [];
      spawnCounter = 0;
      depth = 0;
      scrollSpeed = 130;
      running = true;
      lastTime = null;
      keys = {};
      walkFrame = 0;
      walkTimer = 0;
      strikeTimer = 0;
      dangerOffset = Math.floor(Math.random() * DANGER_GROUP_SIZE);

      const startStep = makeStep(START_Y, { safe: true, x: player.x - STEP_W / 2 });
      steps.push(startStep);
      player.supportStep = startStep;
      let y = START_Y + STEP_SPACING;
      while (y < H + STEP_SPACING * 2) {
        steps.push(makeStep(y));
        y += STEP_SPACING;
      }
      if (opts.onScoreUpdate) opts.onScoreUpdate(`深度 0 / ${TARGET_DEPTH}`);
    }

    function nearestUpcomingMonsterStep() {
      let best = null;
      let bestDist = Infinity;
      for (const s of steps) {
        if (!s.hasMonster || s.monsterCleared) continue;
        const dist = player.y - s.y;
        if (dist < -20 || dist > STRIKE_RANGE_Y) continue;
        if (dist < bestDist) {
          bestDist = dist;
          best = s;
        }
      }
      return best;
    }

    function strike() {
      if (!running) return;
      strikeTimer = STRIKE_DURATION;
      const s = nearestUpcomingMonsterStep();
      if (s) s.monsterCleared = true;
    }

    function detach() {
      player.grounded = false;
      player.lastStep = player.supportStep;
      player.supportStep = null;
    }

    function jump() {
      if (!running) return;
      if (player.grounded) {
        player.vy = HOP_VELOCITY;
        player.jumpedThisFall = true;
        detach();
      }
    }

    function fail() {
      if (!running) return;
      running = false;
      opts.onLose();
    }

    function succeed() {
      running = false;
      opts.onWin();
    }

    function land(step) {
      if (step.hasMonster && !step.monsterCleared) {
        if (player.jumpedThisFall) {
          step.monsterCleared = true;
        } else {
          fail();
          return;
        }
      }
      player.grounded = true;
      player.supportStep = step;
      player.y = step.y;
      player.vy = 0;
      player.jumpedThisFall = false;
      depth++;
      if (opts.onScoreUpdate) opts.onScoreUpdate(`深度 ${Math.min(depth, TARGET_DEPTH)} / ${TARGET_DEPTH}`);
      if (step.isFinal || depth >= TARGET_DEPTH) succeed();
    }

    function update(dt) {
      let moving = false;
      if (keys.left) {
        player.x -= MOVE_SPEED * dt;
        player.facing = -1;
        moving = true;
      }
      if (keys.right) {
        player.x += MOVE_SPEED * dt;
        player.facing = 1;
        moving = true;
      }
      player.x = Math.max(24, Math.min(W - 24, player.x));

      scrollSpeed = Math.min(320, 130 + depth * 8);
      for (const s of steps) s.y -= scrollSpeed * dt;
      while (steps.length && steps[steps.length - 1].y < H + STEP_SPACING) {
        steps.push(makeStep(steps[steps.length - 1].y + STEP_SPACING));
      }
      steps = steps.filter((s) => s.y > -60);

      if (player.grounded && player.supportStep) {
        const s = player.supportStep;
        const stillOn = player.x + PLAYER_SIZE / 2 > s.x && player.x - PLAYER_SIZE / 2 < s.x + s.w;
        if (!stillOn || s.y < -40) {
          detach();
        } else {
          player.y = s.y;
        }
      }

      if (!running) return;

      if (!player.grounded) {
        player.vy += GRAVITY * dt;
        player.y += player.vy * dt;

        if (player.vy > 0) {
          for (const s of steps) {
            if (s === player.lastStep) continue;
            const overlap = player.x + PLAYER_SIZE / 2 > s.x && player.x - PLAYER_SIZE / 2 < s.x + s.w;
            if (overlap && player.y >= s.y && player.y - player.vy * dt <= s.y + STEP_H) {
              land(s);
              if (!running) return;
              break;
            }
          }
        }

        if (player.y > FALL_LIMIT_Y) {
          fail();
          return;
        }
      }

      if (moving) {
        walkTimer += dt;
        if (walkTimer > 0.16) {
          walkTimer = 0;
          walkFrame = 1 - walkFrame;
        }
      } else {
        walkFrame = 0;
      }

      if (strikeTimer > 0) {
        strikeTimer -= dt * 1000;
        if (strikeTimer < 0) strikeTimer = 0;
      }
    }

    function drawBackground() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#dceeff");
      grad.addColorStop(1, "#ffe0ec");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(0, 0, 22, H);
      ctx.fillRect(W - 22, 0, 22, H);
    }

    function draw() {
      drawBackground();

      for (const s of steps) {
        const danger = s.hasMonster && !s.monsterCleared;
        ctx.fillStyle = s.isFinal ? PALETTE.rose : danger ? DANGER_RED : PALETTE.goldDark;
        ctx.fillRect(s.x, s.y, s.w, STEP_H);
        ctx.strokeStyle = danger ? DANGER_RED_DARK : PALETTE.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(s.x + 1, s.y, s.w - 2, STEP_H);

        if (s.isFinal) {
          const cs = 36 / Pixel.width(SPRITES.chest.rows);
          Pixel.draw(ctx, SPRITES.chest.rows, SPRITES.chest.palette, s.x + s.w / 2 - 18, s.y - Pixel.height(SPRITES.chest.rows) * cs, cs);
        } else if (danger) {
          const size = MONSTER_SIZE / Pixel.width(SPRITES.skull.rows);
          Pixel.draw(ctx, SPRITES.skull.rows, SPRITES.skull.palette, s.x + s.w / 2 - MONSTER_SIZE / 2, s.y - Pixel.height(SPRITES.skull.rows) * size, size);
        }
      }

      const rows = strikeTimer > 0 ? SPRITES.hero.strike : !player.grounded ? SPRITES.hero.idle : walkFrame === 0 ? SPRITES.hero.idle : SPRITES.hero.walk;
      const size = PLAYER_SIZE / Pixel.width(rows);
      ctx.save();
      ctx.translate(player.x, player.y - Pixel.height(rows) * size);
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
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        jump();
      }
      if (e.code === "Space") {
        e.preventDefault();
        strike();
      }
    }
    function onKeyUp(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
      if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
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
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    }

    return { start, stop, setLeft, setRight, strike, jump };
  }
  return { create };
})();
