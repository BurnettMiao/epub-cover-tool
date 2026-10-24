<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { addCover } from './lib/epub.js'

const book = ref(null)
const image = ref(null)
const imageUrl = ref('')
const downloadUrl = ref('')
const downloadName = ref('')
const busy = ref(false)
const choosingImage = ref(false)
const message = ref('選好電子書和封面，就可以開始了。')
const error = ref(false)
const dragging = ref('')
const bookInput = ref(null)
const imageInput = ref(null)
const ready = computed(() => book.value && image.value && !busy.value && !choosingImage.value)
let selection = 0
function report(text, failed = false) { message.value = text; error.value = failed }
function clearDownload() {
  if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value)
  downloadUrl.value = ''
}
function revokeImage() {
  if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
  imageUrl.value = ''
}
async function selectFile(file, type) {
  if (!file || busy.value) return
  try {
    if (type === 'book') {
      if (!/\.epub$/i.test(file.name)) throw new Error('請選擇 .epub 電子書。')
      if (file.size > 100 * 1024 * 1024) throw new Error('電子書需小於 100 MB。')
      book.value = file
      clearDownload()
    } else {
      const current = ++selection
      choosingImage.value = true
      let url = ''
      try {
        if (file.size > 20 * 1024 * 1024) throw new Error('封面圖片需小於 20 MB。')
        const b = new Uint8Array(await file.slice(0, 8).arrayBuffer())
        const mime = b[0] === 255 && b[1] === 216 ? 'image/jpeg' :
          b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71 ? 'image/png' : ''
        if (!mime) throw new Error('請使用有效的 JPG 或 PNG 圖片。')
        url = URL.createObjectURL(file)
        const img = new Image()
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('圖片無法讀取，請換一張。')); img.src = url })
        if (current !== selection) { URL.revokeObjectURL(url); return }
        revokeImage()
        imageUrl.value = url
        image.value = { file, mime, width: img.naturalWidth, height: img.naturalHeight }
        clearDownload()
      } catch (e) {
        if (url) URL.revokeObjectURL(url)
        if (current !== selection) return
        throw e
      } finally { if (current === selection) choosingImage.value = false }
    }
    report(book.value && image.value ? '準備好了！可以製作你的新書衣。' : '選好電子書和封面，就可以開始了。')
  } catch (e) { report(e.message, true) }
}
function changed(event, type) {
  selectFile(event.target.files?.[0], type)
  event.target.value = ''
}
function dropped(event, type) {
  dragging.value = ''
  if (event.dataTransfer.files.length !== 1) { report('請一次選擇一個檔案。', true); return }
  selectFile(event.dataTransfer.files[0], type)
}
async function build() {
  if (!ready.value) return
  busy.value = true
  clearDownload()
  report('正在整理書籍、加入封面…')
  try {
    const blob = await addCover(await book.value.arrayBuffer(), image.value)
    downloadUrl.value = URL.createObjectURL(blob)
    downloadName.value = book.value.name.replace(/\.epub$/i, '') + '-新封面.epub'
    report('製作完成！請按下方連結下載新 EPUB。')
  } catch (e) { report(e.message || '處理失敗，請確認 EPUB 是否完整。', true) }
  finally { busy.value = false }
}
function reset() {
  if (busy.value) return
  selection++
  choosingImage.value = false
  book.value = null
  image.value = null
  revokeImage()
  clearDownload()
  report('選好電子書和封面，就可以開始了。')
}
onBeforeUnmount(() => { selection++; revokeImage(); clearDownload() })
</script>

<template>
  <header>
    <a class="brand" href="./">▥ 書衣 <span>BOOK COVER STUDIO</span></a>
    <span class="private">● 全程本機處理</span>
  </header>
  <main>
    <section class="intro">
      <div class="eyebrow">給好故事，一張新封面</div>
      <h1>你的藏書，<br />值得一件<span>好看的書衣。</span></h1>
      <p>替 EPUB 加入或更換封面。選一本書、一張圖片，<br />讓下一次翻開，更有儀式感。</p>
      <div class="tags"><span>EPUB 2 / 3</span><span>JPG / PNG</span><span>為 Kobo 等閱讀器準備</span></div>
    </section>
    <section class="workspace" :aria-busy="busy">
      <div class="editor">
        <div class="stephead"><b>01</b><h2>選擇電子書</h2></div>
        <label class="drop" :class="{ over: dragging === 'book', busy }"
          @dragover.prevent="dragging = 'book'" @dragleave.prevent="dragging = ''" @drop.prevent="dropped($event, 'book')">
          <input ref="bookInput" type="file" accept=".epub,application/epub+zip" :disabled="busy" aria-label="選擇 EPUB 電子書" @change="changed($event, 'book')" />
          <span class="icon" aria-hidden="true">▤</span>
          <strong class="filename">{{ book?.name || '拖入 EPUB，或點此選擇' }}</strong>
          <small>{{ book ? `${(book.size / 1024 / 1024).toFixed(2)} MB · 已選擇電子書` : '支援未加密的 .epub 檔案，最大 100 MB' }}</small>
        </label>
        <div class="stephead second"><b>02</b><h2>選擇新封面</h2></div>
        <label class="drop compact" :class="{ over: dragging === 'image', busy }"
          @dragover.prevent="dragging = 'image'" @dragleave.prevent="dragging = ''" @drop.prevent="dropped($event, 'image')">
          <input ref="imageInput" type="file" accept="image/jpeg,image/png" :disabled="busy" aria-label="選擇封面圖片" @change="changed($event, 'image')" />
          <span class="icon" aria-hidden="true">＋</span>
          <strong class="filename">{{ choosingImage ? '正在讀取圖片…' : image?.file.name || '拖入封面圖片，或點此選擇' }}</strong>
          <small>JPG 或 PNG，最大 20 MB · 建議直式圖片</small>
        </label>
        <div class="action">
          <button :disabled="!ready" @click="build">{{ busy ? '正在製作…' : '製作新 EPUB' }} <span aria-hidden="true">↗</span></button>
          <p id="status" :class="{ error }" role="status" aria-live="polite">{{ message }}</p>
          <a v-if="downloadUrl" id="download" :href="downloadUrl" :download="downloadName">下載 {{ downloadName }} ↓</a>
          <div><button v-if="book || image" class="clear" :disabled="busy" @click="reset">清除，重新選擇</button></div>
        </div>
      </div>
      <aside>
        <div class="previewhead">封面預覽 <span>LIVE PREVIEW</span></div>
        <div class="stage"><div class="bookmock">
          <img v-if="imageUrl" id="preview" :src="imageUrl" alt="所選封面預覽" />
          <div v-else id="placeholder"><small>YOUR NEXT<br />GREAT READ</small><div class="lineart" aria-hidden="true">✳</div><strong>故事，<br />從封面開始。</strong><em>BOOK COVER STUDIO</em></div>
        </div></div>
        <p class="caption">{{ image ? `${image.width} × ${image.height} px · 完整置入，不裁切` : '新封面會完整置入，不裁切圖片' }}</p>
      </aside>
    </section>
    <section class="notes">
      <div><span aria-hidden="true">↳</span><h3>書籍不離開你的裝置</h3><p>所有修改都在瀏覽器內完成，不會上傳電子書或圖片。</p></div>
      <div><span aria-hidden="true">▧</span><h3>為閱讀器準備好</h3><p>同步更新封面頁與 EPUB 封面資訊，保留原本章節。尚未以實體 Kobo 驗證。</p></div>
      <div><span aria-hidden="true">♡</span><h3>原檔好好保留</h3><p>另存一份有新封面的 EPUB。DRM 加密與多版本 EPUB 目前不支援。</p></div>
    </section>
    <footer>書衣 <span>為每一本喜歡的書，換上喜歡的樣子。</span></footer>
  </main>
</template>
