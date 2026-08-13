// ---------------------------------------------------------------------------
// Game 4: 企鵝氣球大作戰 — penguin balloons float up from the bottom of the
// screen. Click or tap anywhere to fire from the cannon toward that spot;
// pop enough penguin balloons and you win. No fail state — just keep aiming.
// ---------------------------------------------------------------------------
const GameBalloon = (() => {
  function create(canvas, opts) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const TARGET_HITS = CONFIG.games.balloon.targetHits;
    const BALLOON_R = 30;
    const PROJECTILE_R = 7;
    const PROJECTILE_SPEED = 640;
    const CANNON_Y = H - 34;
    const SPAWN_MIN = 650;
    const SPAWN_MAX = 1050;
    const MAX_BALLOONS = 5;
    const RISE_MIN = 45;
    const RISE_MAX = 75;
    const SWAY_AMPLITUDE = 18;
    const BALLOON_COLORS = [
      { body: PALETTE.rose, dark: PALETTE.roseDark },
      { body: PALETTE.gold, dark: PALETTE.goldDark },
      { body: PALETTE.navy, dark: PALETTE.navyDeep },
    ];

    let balloons, projectiles, popEffects, hitCount, running, rafId, lastTime, spawnTimer, elapsed, aimAngle, clouds;

    function reset() {
      balloons = [];
      projectiles = [];
      popEffects = [];
      hitCount = 0;
      running = true;
      lastTime = null;
      spawnTimer = 0;
      elapsed = 0;
      aimAngle = -Math.PI / 2;
      clouds = [];
      for (let i = 0; i < 5; i++) {
        clouds.push({
          x: Math.random() * W,
          y: 30 + Math.random() * (H * 0.4),
          speed: 10 + Math.random() * 12,
          scale: 0.7 + Math.random() * 0.6,
        });
      }
      if (opts.onScoreUpdate) opts.onScoreUpdate(`擊中 0 / ${TARGET_HITS}`);
    }

    function spawnBalloon() {
      const baseX = BALLOON_R + 24 + Math.random() * (W - (BALLOON_R + 24) * 2);
      const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
      balloons.push({
        baseX,
        x: baseX,
        y: H + BALLOON_R + 20,
        r: BALLOON_R,
        speed: RISE_MIN + Math.random() * (RISE_MAX - RISE_MIN),
        swaySpeed: 1.2 + Math.random() * 1.0,
        swayPhase: Math.random() * Math.PI * 2,
        color,
      });
    }

    function shootAt(tx, ty) {
      if (!running) return;
      const ox = W / 2;
      const oy = CANNON_Y;
      const dx = tx - ox;
      const dy = ty - oy;
      const dist = Math.hypot(dx, dy) || 1;
      aimAngle = Math.atan2(dy, dx);
      projectiles.push({ x: ox, y: oy, vx: (dx / dist) * PROJECTILE_SPEED, vy: (dy / dist) * PROJECTILE_SPEED });
    }

    function update(dt) {
      elapsed += dt;

      spawnTimer -= dt * 1000;
      if (spawnTimer <= 0 && balloons.length < MAX_BALLOONS) {
        spawnBalloon();
        spawnTimer = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      }

      for (const c of clouds) {
        c.x -= c.speed * dt;
        if (c.x < -60) c.x = W + 60;
      }

      for (const b of balloons) {
        b.y -= b.speed * dt;
        b.x = b.baseX + Math.sin(elapsed * b.swaySpeed + b.swayPhase) * SWAY_AMPLITUDE;
      }
      balloons = balloons.filter((b) => b.y + b.r > 0);

      for (const p of projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      projectiles = projectiles.filter((p) => p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20);

      for (const eff of popEffects) eff.t += dt;
      popEffects = popEffects.filter((e) => e.t < 0.35);

      if (!running) return;

      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        for (let j = balloons.length - 1; j >= 0; j--) {
          const b = balloons[j];
          const dx = p.x - b.x;
          const dy = p.y - b.y;
          const hitDist = b.r + PROJECTILE_R;
          if (dx * dx + dy * dy <= hitDist * hitDist) {
            popEffects.push({ x: b.x, y: b.y, t: 0, color: b.color.body });
            balloons.splice(j, 1);
            projectiles.splice(i, 1);
            hitCount++;
            if (opts.onScoreUpdate) opts.onScoreUpdate(`擊中 ${Math.min(hitCount, TARGET_HITS)} / ${TARGET_HITS}`);
            if (hitCount >= TARGET_HITS) {
              running = false;
              opts.onWin();
              return;
            }
            break;
          }
        }
      }
    }

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#dceeff");
      sky.addColorStop(1, "#fff0e8");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      for (const c of clouds) {
        const size = (40 * c.scale) / Pixel.width(SPRITES.cloud.rows);
        Pixel.draw(ctx, SPRITES.cloud.rows, SPRITES.cloud.palette, c.x, c.y, size);
      }

      ctx.fillStyle = "#bff0c4";
      ctx.fillRect(0, H - 26, W, 26);
    }

    function drawBalloon(b) {
      ctx.strokeStyle = "rgba(90, 75, 122, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.r);
      ctx.lineTo(b.x, b.y + b.r + 16);
      ctx.stroke();

      const grad = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.2, b.x, b.y, b.r);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.35, b.color.body);
      grad.addColorStop(1, b.color.dark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      const size = (b.r * 1.5) / Pixel.width(SPRITES.bird.rows);
      Pixel.draw(ctx, SPRITES.bird.rows, SPRITES.bird.palette, b.x - (Pixel.width(SPRITES.bird.rows) * size) / 2, b.y - (Pixel.height(SPRITES.bird.rows) * size) / 2, size);
    }

    function drawCannon() {
      const x = W / 2;
      const y = CANNON_Y;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = PALETTE.navy;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(aimAngle + Math.PI / 2);
      ctx.fillStyle = PALETTE.navyDeep;
      ctx.fillRect(-8, -34, 16, 34);
      ctx.restore();
    }

    function drawProjectile(p) {
      ctx.save();
      ctx.shadowColor = PALETTE.goldLight;
      ctx.shadowBlur = 10;
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PROJECTILE_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPopEffects() {
      for (const e of popEffects) {
        const progress = e.t / 0.35;
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, BALLOON_R * (0.6 + progress * 0.8), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function draw() {
      drawBackground();
      for (const b of balloons) drawBalloon(b);
      drawPopEffects();
      for (const p of projectiles) drawProjectile(p);
      drawCannon();
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
      } else {
        draw();
      }
    }

    function pointerToCanvas(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    function onPointer(e) {
      e.preventDefault();
      const pt = pointerToCanvas(e);
      shootAt(pt.x, pt.y);
    }

    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        shootAt(W / 2, 0);
      }
    }

    function start() {
      reset();
      draw();
      canvas.addEventListener("pointerdown", onPointer);
      window.addEventListener("keydown", onKey);
      rafId = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    }

    return { start, stop };
  }
  return { create };
})();
