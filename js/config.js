// ---------------------------------------------------------------------------
// Central configuration for the birthday arcade.
// The 5-digit codes below gate progression between games. Edit any digit you
// like later (e.g. to spell out a meaningful date) — nothing else needs to
// change, main.js reads everything from here.
// ---------------------------------------------------------------------------
const CONFIG = {
  // codes.start is the very first key, given to her before she opens the page.
  // Each codes.afterX is NOT shown anywhere in the site — she has to get it
  // from you some other way (a note, a message, wherever you hide it) and
  // type it in at the gate screen herself before the next game starts.
  codes: {
    start: "54517",
    afterOpening: "01224",
    afterFlappy: "52517",
    afterStraw: "17322",
    afterMario: "26821",
  },

  // Order of stages, driven by the codes above. "opening" is not a game —
  // it's just a message + photo screen shown right after the very first code,
  // before game 1 (小企鵝飛行記) starts. balloon is the last stage — winning it
  // shows the closing message instead of unlocking anything else.
  stageOrder: ["opening", "flappy", "straw", "mario", "balloon"],

  // Shown right after codes.start, before any game. Edit heading/message/photo/note
  // just like the stageMeta entries below.
  opening: {
    heading: "在開始之前",
    message: "和寶比過的第一個生日！雖然當天在FST，吃完就好趕好趕，但是那天的萊可曼高樓夕陽，和寶比第一次吃法餐，至今依然記憶猶新！",
    photo: "images/opening.jpg",
    note: "",
  },

  stageMeta: {
    flappy: {
      title: "一、小企鵝飛行記",
      desc: "帶著小企鵝穿梭在柱子之間吧！飛遠一點，某個地方藏著一顆愛心，飛進去就能拿到下一把鑰匙。",
      instructions: "按空白鍵、點擊畫面或輕觸螢幕，就能拍動翅膀往上飛。",
      // 過關後顯示的照片和一段話——把 photo 換成你自己的照片路徑（例如 "images/flappy.jpg"，
      // 檔案放到 images 資料夾），note 換成想對她說的話。photo 留空或圖片載入失敗時會自動隱藏。
      photo: "images/flappy.jpg",
      note: "和寶比過的第二個生日~寶比當天剛好有活動，就找了內湖的N168，結果太皮吃的很飽！但是有花花跟厲害的氣球，很讚！",
    },
    straw: {
      title: "二、小朋友下樓梯",
      desc: "畫面會一直往下捲動，小朋友要踩穩每一階往下走！有些階梯上站著調皮的小怪物——跳到它們頭上就能打倒，或是提前攻擊清掉，踩空或撞到怪物就得重來，走到最底層的寶箱就成功了。",
      instructions: "方向鍵或 A / D 移動，方向鍵上或 W 跳躍，空白鍵攻擊——手機的話用畫面下方的按鈕。",
      photo: "images/straw.jpg",
      note: "和寶比過的第三個生日！吃了法式派翠克，很好吃！而且寶比有好看的背帶跟皇冠，拍了回響很大的生日影片特輯！",
    },
    mario: {
      title: "三、忍耐任務",
      desc: "沿著一階階平台往上跳吧！每一階的左右距離都不小，要抓準時機才跳得到。快到頂端時，平台還會左右或上下飄動，要看準時機再跳。如果不小心跳空掉下去，就要從最底層重新往上爬——耐心一點，爬到最頂端拿到那顆愛心就成功了！",
      instructions: "方向鍵或 A / D 移動，方向鍵上、W 或空白鍵跳躍——手機的話用畫面下方的按鈕。",
      photo: "images/mario.jpg",
      note: "和寶比過的第四個生日！吃了de nuit！這時候是長髮寶，看起來有點笨笨的哈哈哈，不過寶比很開心，又帶寶比吃好吃的餐廳！",
    },
    balloon: {
      title: "四、企鵝氣球大作戰",
      desc: "企鵝氣球會一顆顆從下面飄上來，點擊或輕觸畫面瞄準、發射，把氣球通通打下來吧！射中 17 顆企鵝氣球就成功了。",
      instructions: "點擊或輕觸畫面上想瞄準的位置就會發射——手機也是直接點螢幕。",
      photo: "images/balloon.jpg",
      note: "第五個生日吧！我們還要繼續度過好多好多個生日喔，一起去看熱氣球、一起出國玩。祝寶比天天開心，我們趕快找到房子，生日快樂喔！",
    },
  },

  games: {
    flappy: { targetScore: 10 },
    straw: { targetDepth: 17 },
    mario: { platformCount: 50 },
    balloon: { targetHits: 17 },
  },
};

// Build a lookup from code -> stage it unlocks.
CONFIG.codeToStage = {
  [CONFIG.codes.start]: "opening",
  [CONFIG.codes.afterOpening]: "flappy",
  [CONFIG.codes.afterFlappy]: "straw",
  [CONFIG.codes.afterStraw]: "mario",
  [CONFIG.codes.afterMario]: "balloon",
};
