# 書衣・EPUB 封面工具

以 Vue 3 Composition API、Vite、JSZip 建立的本機網頁工具。選擇 EPUB 和 JPG／PNG，在瀏覽器內加入或更換封面，再下載新檔案。不使用後端、不上傳書籍或圖片、不依賴外部 CDN。

## 在你的 Mac 啟動

需要 Node.js 22.12 以上（可使用 Node.js 24 LTS）及 npm。

將壓縮檔內的專案內容放入 `/Users/burnett/Desktop/epub_cover_tool`。請確認 `package.json` 就在這個資料夾內，避免多包一層同名資料夾。

```bash
cd /Users/burnett/Desktop/epub_cover_tool
npm ci
npm run dev
```

開啟終端機顯示的網址，通常為 `http://127.0.0.1:5173`。停止時在終端機按 Control+C。首次安裝套件需要網路；安裝後，處理書籍不需要網路。

## 使用方式

1. 拖入或選取一個未受 DRM 保護的 EPUB（最大 100 MB）。
2. 拖入或選取 JPG／PNG 封面（最大 20 MB）。
3. 確認封面預覽，按「製作新 EPUB」。
4. 完成後按下載連結，儲存 `原檔名-新封面.epub`。
5. 將新檔案匯入閱讀器。原始檔案不會被覆寫。

## 指令

```bash
npm test          # EPUB 結構與換封面測試
npm run build     # 輸出正式靜態檔案至 dist/
npm run preview   # 預覽建置結果；先執行 build
```

正式版本可由任何靜態網頁伺服器提供。請以 HTTP 開啟，勿直接雙擊 index.html。開發與預覽服務只綁定本機 127.0.0.1。

## 檔案結構

- `src/App.vue`：檔案選擇、拖放、預覽、下載及狀態管理。
- `src/components/`：`AppHeader`、`HeroSection`、`EditorPanel`、`FileDropZone`、`PreviewPanel`、`InfoNotes`、`AppFooter` 等可重用介面元件。
- `src/lib/epub.js`：EPUB 解壓縮、XML 更新、封面頁製作、重新封裝。
- `src/style.css`：Tailwind CSS 匯入、主題色與少量書封預覽自訂樣式。
- `src/main.js`：Vue 進入點。
- `tests/epub.test.js`：EPUB 2／3、舊封面替換、重複替換、章節保留及 DRM 檢查。
- `vite.config.js`：Vue 外掛及相對資源路徑。
- `package.json`、`package-lock.json`：依賴與可重現安裝版本。

## 支援範圍與限制

- 支援單一 rootfile 的 EPUB 2／3，保留原有章節、導覽和資源。
- 更新 EPUB 2 的 cover meta／guide，以及 EPUB 3 的 cover-image 標記；將新封面頁放在閱讀順序首位。
- 可辨識的舊封面會從閱讀順序移除，舊資源檔保留以免破壞既有連結。
- 圖片完整置入，不裁切；不修改原始圖片。
- 不支援 DRM、多版本 EPUB；允許標準字型混淆。
- EPUB 解壓縮後資源大小合計限制為 350 MB；大型檔案仍可能受瀏覽器記憶體限制。
- 尚未以實體 Kobo 驗證；不同閱讀器的封面快取和顯示效果可能不同。
- 測試驗證封面相關結構與內容保留，並非完整 EPUBCheck 格式驗證。

使用的開源依賴與授權請參閱各套件的 LICENSE。
