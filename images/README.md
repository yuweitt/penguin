# 照片放這裡

把五張照片放進這個資料夾，檔名要對上：

- `opening.jpg` — 輸入第一組密碼（00000）後，第一關開始前顯示的開場白
- `flappy.jpg` — 第一關（小企鵝飛行記）過關後顯示
- `straw.jpg` — 第二關（小朋友下樓梯）過關後顯示
- `mario.jpg` — 第三關（忍耐任務）過關後顯示
- `balloon.jpg` — 第四關（企鵝氣球大作戰）過關後顯示

檔名要完全一樣（副檔名也可以換成 `.png`，但要記得同步修改
`js/config.js` 裡對應的 `photo` 路徑）。

如果某一關先不放照片，[config.js](../js/config.js) 裡把該關的 `photo` 改成空字串
`""` 即可，畫面會自動不顯示照片區塊。

想對她說的話：開場白寫在 `config.js` 的 `CONFIG.opening.message`（標題是 `CONFIG.opening.heading`），
每一關過關後的話寫在同一個檔案裡每一關的 `note` 欄位。
