// ---------------------------------------------------------------------------
// Tiny hand-authored pixel-art renderer. Sprites are plain rows of characters;
// each character maps to a color in a palette, "." is transparent.
// ---------------------------------------------------------------------------
const Pixel = {
  draw(ctx, rows, palette, x, y, size) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ".") continue;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(Math.round(x + c * size), Math.round(y + r * size), size, size);
      }
    }
  },
  width(rows) {
    return rows[0].length;
  },
  height(rows) {
    return rows.length;
  },
};

// Shared cute pastel palette accents (peach / pink / plum / cream)
const PALETTE = {
  navy: "#7c6a9c",
  navyDeep: "#5a4b7a",
  gold: "#ffb17a",
  goldLight: "#ffd9a0",
  goldDark: "#e8935c",
  rose: "#ff9eb5",
  roseDark: "#ff6f91",
  cream: "#fff6ef",
  white: "#ffffff",
};

const SPRITES = {
  bird: {
    rows: [
      "..bbbbb..",
      ".bbbbbbb.",
      "bccbbbccb",
      "bcbbobbcb",
      "bkwwwwwkb",
      "bwwwwwwwb",
      "bwwwwwwwb",
      ".oo...oo.",
    ],
    palette: {
      b: PALETTE.navy,
      w: PALETTE.cream,
      o: PALETTE.gold,
      c: PALETTE.white,
      k: PALETTE.rose,
    },
  },
  pillarCap: {
    rows: ["oooooo", "oggggo", "oyyyyo", "oggggo"],
    palette: { o: PALETTE.navy, g: PALETTE.gold, y: PALETTE.goldLight },
  },
  strawPile: {
    rows: [
      "...oo...",
      "..oyyo..",
      ".oyyyyo.",
      "oyyggyyo",
      "oygggyyo",
      "ooooooo.",
    ],
    palette: { o: PALETTE.goldDark, y: PALETTE.gold, g: PALETTE.goldLight },
  },
  strawPileCracked: {
    rows: [
      "........",
      "..oy.o..",
      ".oy.yyo.",
      "oy.ggy.o",
      "oyg.gy.o",
      "oo.oo.o.",
    ],
    palette: { o: PALETTE.goldDark, y: PALETTE.gold, g: PALETTE.goldLight },
  },
  chest: {
    rows: [
      ".oooooo.",
      "oggggggo",
      "oyyyyyyo",
      "oy.gg.yo",
      "oggggggo",
      ".oooooo.",
    ],
    palette: { o: PALETTE.navy, g: PALETTE.goldDark, y: PALETTE.gold },
  },
  heart: {
    rows: [
      ".dd.dd.",
      "drrrrrd",
      "drrrrrd",
      ".drrrd.",
      "..drd..",
      "...d...",
    ],
    palette: { r: PALETTE.rose, d: PALETTE.roseDark },
  },
  hero: {
    idle: [
      "..bbbbb..",
      ".bbbbbbb.",
      "bccbbbccb",
      "bcbbobbcb",
      "bkwwwwwkb",
      "bwwwwwwwb",
      "bwwwwwwwb",
      "bwwwwwwwb",
      ".bwwwwwb.",
      "..bwwwb..",
      ".oo...oo.",
    ],
    walk: [
      "..bbbbb..",
      ".bbbbbbb.",
      "bccbbbccb",
      "bcbbobbcb",
      "bkwwwwwkb",
      "bwwwwwwwb",
      "bwwwwwwwb",
      "bwwwwwwwb",
      ".bwwwwwb.",
      "..bwwwb..",
      "oo.....oo",
    ],
    strike: [
      "..bbbbb....",
      ".bbbbbbb...",
      "bccbbbccb..",
      "bcbbobbcb..",
      "bkwwwwwkb..",
      "bwwwwwwwbo.",
      "bwwwwwwwbmm",
      "bwwwwwwwbo.",
      ".bwwwwwb...",
      "..bwwwb....",
      ".oo...oo...",
    ],
    palette: {
      b: PALETTE.navy,
      w: PALETTE.cream,
      o: PALETTE.gold,
      c: PALETTE.white,
      m: PALETTE.goldLight,
      k: PALETTE.rose,
    },
  },
  skull: {
    rows: [
      ".ooooo.",
      "ooooooo",
      "ox.o.xo",
      "ooooooo",
      "oxo.oxo",
      ".ooooo.",
      "..o.o..",
    ],
    palette: { o: PALETTE.cream, x: PALETTE.navyDeep },
  },
  cloud: {
    rows: [".ooo....", "oooooo..", ".oooooo.", "..oooo.."],
    palette: { o: PALETTE.cream },
  },
};
