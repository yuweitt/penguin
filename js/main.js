// ---------------------------------------------------------------------------
// Orchestration: screen switching, code gate, stage transitions.
// ---------------------------------------------------------------------------
(() => {
  const revealApp = () => document.getElementById("app").classList.add("fonts-ready");
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(revealApp);
    setTimeout(revealApp, 1500);
  } else {
    revealApp();
  }

  const screens = {
    gate: document.getElementById("screen-gate"),
    intro: document.getElementById("screen-intro"),
    game: document.getElementById("screen-game"),
    message: document.getElementById("screen-message"),
  };

  const canvas = document.getElementById("game-canvas");
  const overlay = document.getElementById("game-overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayRetry = document.getElementById("overlay-retry");
  const hudTitle = document.getElementById("hud-title");
  const hudScore = document.getElementById("hud-score");
  const gameInstructions = document.getElementById("game-instructions");
  const touchControls = document.getElementById("touch-controls");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnStrike = document.getElementById("btn-strike");
  const btnJump = document.getElementById("btn-jump");

  const STAGE_BUTTONS = {
    straw: [btnLeft, btnJump, btnStrike, btnRight],
    mario: [btnLeft, btnJump, btnRight],
  };

  const codeForm = document.getElementById("code-form");
  const codeInput = document.getElementById("code-input");
  const codeError = document.getElementById("code-error");

  const GAME_MODULES = { flappy: GameFlappy, straw: GameStraw, mario: GameMario, balloon: GameBalloon };

  let currentStage = null;
  let currentController = null;

  function showScreen(name) {
    Object.values(screens).forEach((s) => s.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function goToStage(stage) {
    currentStage = stage;
    if (stage === "opening") {
      showMessageScreen({
        heading: CONFIG.opening.heading,
        text: CONFIG.opening.message,
        photo: CONFIG.opening.photo,
        note: CONFIG.opening.note,
      });
      return;
    }
    const meta = CONFIG.stageMeta[stage];
    document.getElementById("intro-title").textContent = meta.title;
    document.getElementById("intro-desc").textContent = meta.desc;
    showScreen("intro");
  }

  function showMessageScreen({ heading, text, photo, note, hint }) {
    document.getElementById("message-heading").textContent = heading || "";
    document.getElementById("message-text").textContent = text || "";
    document.getElementById("message-hint").textContent = hint == null ? "下一把鑰匙要自己去別的地方找找看囉！" : hint;

    const photoEl = document.getElementById("message-photo");
    const placeholderEl = document.getElementById("message-photo-placeholder");
    if (photo) {
      photoEl.onerror = () => {
        photoEl.classList.add("hidden");
        placeholderEl.classList.remove("hidden");
      };
      photoEl.onload = () => {
        photoEl.classList.remove("hidden");
        placeholderEl.classList.add("hidden");
      };
      photoEl.src = photo;
    } else {
      photoEl.removeAttribute("src");
      photoEl.classList.add("hidden");
      placeholderEl.classList.remove("hidden");
    }
    document.getElementById("message-note").textContent = note || "";

    showScreen("message");
  }

  function startGame(stage) {
    const meta = CONFIG.stageMeta[stage];
    hudTitle.textContent = meta.title;
    hudScore.textContent = "";
    gameInstructions.textContent = meta.instructions;
    overlay.classList.add("hidden");
    const activeButtons = STAGE_BUTTONS[stage] || [];
    touchControls.classList.toggle("hidden", activeButtons.length === 0);
    [btnLeft, btnRight, btnStrike, btnJump].forEach((btn) => {
      btn.classList.toggle("hidden", !activeButtons.includes(btn));
    });
    showScreen("game");

    const mod = GAME_MODULES[stage];
    currentController = mod.create(canvas, {
      onWin: () => onStageWin(stage),
      onLose: () => onStageLose(),
      onScoreUpdate: (text) => {
        hudScore.textContent = text;
      },
    });
    currentController.start();
  }

  function bindHoldButton(btn, onPress, onRelease) {
    const press = (e) => {
      e.preventDefault();
      onPress();
    };
    const release = (e) => {
      e.preventDefault();
      onRelease();
    };
    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);
  }

  bindHoldButton(
    btnLeft,
    () => currentController && currentController.setLeft && currentController.setLeft(true),
    () => currentController && currentController.setLeft && currentController.setLeft(false)
  );
  bindHoldButton(
    btnRight,
    () => currentController && currentController.setRight && currentController.setRight(true),
    () => currentController && currentController.setRight && currentController.setRight(false)
  );
  btnStrike.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (currentController && currentController.strike) currentController.strike();
  });
  btnJump.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (currentController && currentController.jump) currentController.jump();
  });

  function onStageLose() {
    if (currentController) currentController.stop();
    overlayTitle.textContent = "還差一點，再試一次吧！";
    overlay.classList.remove("hidden");
  }

  function onStageWin(stage) {
    if (currentController) {
      currentController.stop();
      currentController = null;
    }
    const meta = CONFIG.stageMeta[stage];
    const isLast = CONFIG.stageOrder[CONFIG.stageOrder.length - 1] === stage;
    let text = revealMessageFor(stage);
    if (isLast) {
      text += " 每一根柱子、每一階樓梯、每一次忍耐，都值得——因為妳值得更多更多。生日快樂，我的寶貝。";
    }
    showMessageScreen({
      heading: isLast ? "生日快樂！" : "過關了！",
      text,
      photo: meta.photo,
      note: meta.note,
      hint: isLast ? "" : undefined,
    });
  }

  function revealMessageFor(stage) {
    switch (stage) {
      case "flappy":
        return "小企鵝順利叼到了愛心，開心地拍拍翅膀！";
      case "straw":
        return "妳一階一階地找到了寶物，緊緊抱在懷裡！";
      case "mario":
        return "妳一次次跌下去又爬回來，終於順利登頂了！";
      case "balloon":
        return "妳一發發瞄準，把企鵝氣球通通打了下來！";
      default:
        return "";
    }
  }

  document.getElementById("intro-start").addEventListener("click", () => {
    startGame(currentStage);
  });

  overlayRetry.addEventListener("click", () => {
    overlay.classList.add("hidden");
    startGame(currentStage);
  });

  document.getElementById("message-continue").addEventListener("click", () => {
    codeInput.value = "";
    codeError.textContent = "";
    showScreen("gate");
  });

  codeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = codeInput.value.trim();
    const stage = CONFIG.codeToStage[val];
    if (!stage) {
      codeError.textContent = "密碼好像不對唷，再試一次吧！";
      return;
    }
    codeError.textContent = "";
    codeInput.value = "";
    goToStage(stage);
  });

  showScreen("gate");
})();
