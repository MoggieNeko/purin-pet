# Purin Pet v15 — GitHub 上載說明

今次更新包只供你上載至 GitHub；製作期間沒有部署或更新任何公開網站。

## 最簡單方法：完整專案包

1. 下載並解壓 `purin-pet-v15-github-full.zip`。
2. 用瀏覽器開啟你的 GitHub repository：`MoggieNeko/purin-pet`。
3. 在 repository 首頁按 **Add file → Upload files**。
4. 將解壓後 `purin-pet-v15-github-full` 資料夾內的全部檔案及資料夾拖入上載區（不要直接上載 ZIP）。
5. Commit message 可填：`Upgrade Purin animations and DLC personas to v15`。
6. 選擇直接 commit 到 `main`，再按 **Commit changes**。
7. 到 **Actions** 頁面等候 `Deploy Purin Pet to GitHub Pages` 完成。

## 只上載今次修改

如想保留 GitHub 上其他未包含在本地專案的改動，可改用 `purin-pet-v15-animation-update.zip`：

1. 解壓更新包。
2. 將包內的 `app`、`components`、`public`、`tests` 資料夾拖到 repository 的 **Add file → Upload files**。
3. GitHub 顯示同名檔案時，確認以新版本取代，再 commit 到 `main`。

## 手機仍顯示舊畫面時

今次已將 Service Worker 快取升級至 `purin-pet-v15-animation`。GitHub Pages 部署完成後，請完全關閉舊分頁再開；如仍未更新，可在手機瀏覽器清除該網站的快取後重開。

## 今次主要更新

- 進食變成完整分鏡：拿碗、匙羹送到嘴邊、張嘴、咀嚼及完成反應。
- 睡眠會自然坐低、閉眼、慢呼吸、顯示睡眠符號及醒來伸展。
- 加入摸頭、戳面、搔肚、碰手四個觸摸區域及不同即時反應。
- 各年齡、狀態、待機及 DLC 人物有較自然的姿態、表情與轉場。
- 八套 DLC 全年齡 atlas 已重新對中及精修神態，減少多眼、多嘴、服裝漂移和手機抖動。
