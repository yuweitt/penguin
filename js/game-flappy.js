// ---------------------------------------------------------------------------
// Game 1: Flappy Bird clone — gold bird between gilded pillars.
// ---------------------------------------------------------------------------
const GameFlappy = (() => {
  function create(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const GRAVITY = 1400;
    const FLAP_VELOCITY = -380;
    const PIPE_SPEED = 160;
    const PIPE_GAP = 170;
    const PIPE_WIDTH = 60;
    const PIPE_INTERVAL = 1500;
    const GROUND_H = 60;
    const HEART_SIZE = 30;

    let bird, pipes, score, pipesSpawned, running, rafId, lastTime, spawnTimer, clouds;

    function reset() {
      bird = { x: W * 0.28, y: H / 2, vy: 0, size: 28 };
      pipes = [];
      score = 0;
      pipesSpawned = 0;
      spawnTimer = 0;
      running = true;
      lastTime = null;
      clouds = [];
      for (let i = 0; i < 6; i++) {
        clouds.push({
          x: Math.random() * W,
          y: 30 + Math.random() * (H - GROUND_H - 160),
          speed: 12 + Math.random() * 14,
          scale: 0.7 + Math.random() * 0.6,
        });
      }
      if (opts.onScoreUpdate) {
        opts.onScoreUpdate(`分數：0`);
      }
    }

    function flap() {
      if (!running) return;
      bird.vy = FLAP_VELOCITY;
    }

    function spawnPipe() {
      const minTop = 60;
      const maxTop = H - GROUND_H - PIPE_GAP - 60;
      const topH = minTop + Math.random() * (maxTop - minTop);
      pipesSpawned++;
      const heart = pipesSpawned > CONFIG.games.flappy.targetScore;
      pipes.push({ x: W, topH, passed: false, heart });
    }

    function update(dt) {
      bird.vy += GRAVITY * dt;
      bird.y += bird.vy * dt;

      for (const c of clouds) {
        c.x -= c.speed * dt;
        if (c.x < -60) c.x = W + 60;
      }

      spawnTimer += dt * 1000;
      if (spawnTimer > PIPE_INTERVAL) {
        spawnTimer = 0;
        spawnPipe();
      }

      for (const p of pipes) {
        p.x -= PIPE_SPEED * dt;
        if (!p.passed && p.x + PIPE_WIDTH < bird.x - bird.size / 2) {
          p.passed = true;
          score++;
          if (opts.onScoreUpdate) {
            opts.onScoreUpdate(`分數：${score}`);
          }
        }
      }
      pipes = pipes.filter((p) => p.x > -PIPE_WIDTH);

      if (bird.y - bird.size / 2 <= 0 || bird.y + bird.size / 2 >= H - GROUND_H) {
        running = false;
        opts.onLose(score);
        return;
      }
      const bx0 = bird.x - bird.size / 2;
      const bx1 = bird.x + bird.size / 2;
      const by0 = bird.y - bird.size / 2;
      const by1 = bird.y + bird.size / 2;
      for (const p of pipes) {
        if (bx1 > p.x && bx0 < p.x + PIPE_WIDTH) {
          if (by0 < p.topH || by1 > p.topH + PIPE_GAP) {
            running = false;
            opts.onLose(score);
            return;
          }
        }
        if (p.heart) {
          const hx0 = p.x + PIPE_WIDTH / 2 - HEART_SIZE / 2;
          const hx1 = p.x + PIPE_WIDTH / 2 + HEART_SIZE / 2;
          const hy0 = p.topH + PIPE_GAP / 2 - HEART_SIZE / 2;
          const hy1 = p.topH + PIPE_GAP / 2 + HEART_SIZE / 2;
          if (bx1 > hx0 && bx0 < hx1 && by1 > hy0 && by0 < hy1) {
            running = false;
            opts.onWin(score);
            return;
          }
        }
      }
    }

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
      sky.addColorStop(0, "#bfe9ff");
      sky.addColorStop(1, "#eaf7ff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.shadowColor = "rgba(255, 217, 160, 0.9)";
      ctx.shadowBlur = 24;
      ctx.fillStyle = PALETTE.goldLight;
      ctx.beginPath();
      ctx.arc(W - 70, 70, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (const c of clouds) {
        const size = (40 * c.scale) / Pixel.width(SPRITES.cloud.rows);
        Pixel.draw(ctx, SPRITES.cloud.rows, SPRITES.cloud.palette, c.x, c.y, size);
      }

      ctx.fillStyle = "#bff0c4";
      ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
      ctx.strokeStyle = "#9fdba0";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, H - GROUND_H);
      ctx.lineTo(W, H - GROUND_H);
      ctx.stroke();
    }

    function drawPipe(p) {
      const bottomY = p.topH + PIPE_GAP;
      ctx.fillStyle = PALETTE.goldDark;
      ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topH);
      ctx.fillRect(p.x, bottomY, PIPE_WIDTH, H - GROUND_H - bottomY);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x + 1, 0, PIPE_WIDTH - 2, p.topH);
      ctx.strokeRect(p.x + 1, bottomY, PIPE_WIDTH - 2, H - GROUND_H - bottomY);
      const capSize = PIPE_WIDTH / Pixel.width(SPRITES.pillarCap.rows);
      const capH = Pixel.height(SPRITES.pillarCap.rows) * capSize;
      Pixel.draw(ctx, SPRITES.pillarCap.rows, SPRITES.pillarCap.palette, p.x, p.topH - capH, capSize);
      Pixel.draw(ctx, SPRITES.pillarCap.rows, SPRITES.pillarCap.palette, p.x, bottomY, capSize);

      if (p.heart) {
        const hs = HEART_SIZE / Pixel.width(SPRITES.heart.rows);
        const hx = p.x + PIPE_WIDTH / 2 - HEART_SIZE / 2;
        const hy = p.topH + PIPE_GAP / 2 - HEART_SIZE / 2;
        const pulse = 0.9 + Math.sin(performance.now() / 220) * 0.1;
        ctx.save();
        ctx.shadowColor = PALETTE.rose;
        ctx.shadowBlur = 14 * pulse;
        Pixel.draw(ctx, SPRITES.heart.rows, SPRITES.heart.palette, hx, hy, hs);
        ctx.restore();
      }
    }

    function draw() {
      drawBackground();
      for (const p of pipes) drawPipe(p);
      const size = bird.size / Pixel.width(SPRITES.bird.rows);
      const angle = Math.max(-0.4, Math.min(0.9, bird.vy / 500));
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(angle);
      Pixel.draw(ctx, SPRITES.bird.rows, SPRITES.bird.palette, -bird.size / 2, -bird.size / 2, size);
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

    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    }
    function onPointer(e) {
      e.preventDefault();
      flap();
    }

    function start() {
      reset();
      draw();
      window.addEventListener("keydown", onKey);
      canvas.addEventListener("pointerdown", onPointer);
      rafId = requestAnimationFrame(loop);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("pointerdown", onPointer);
    }

    return { start, stop };
  }
  return { create };
})();
