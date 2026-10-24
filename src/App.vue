<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { addCover } from './lib/epub.js'
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
import EditorPanel from './components/EditorPanel.vue'
import HeroSection from './components/HeroSection.vue'
import InfoNotes from './components/InfoNotes.vue'
import PreviewPanel from './components/PreviewPanel.vue'

const book = ref(null), image = ref(null), imageUrl = ref(''), downloadUrl = ref(''), downloadName = ref(''), busy = ref(false), choosingImage = ref(false), message = ref('選好電子書和封面，就可以開始了。'), error = ref(false), dragging = ref('')
const ready = computed(() => book.value && image.value && !busy.value && !choosingImage.value)
let selection = 0
function report(text, failed = false) { message.value = text; error.value = failed }
function clearDownload() { if (downloadUrl.value) URL.revokeObjectURL(downloadUrl.value); downloadUrl.value = '' }
function revokeImage() { if (imageUrl.value) URL.revokeObjectURL(imageUrl.value); imageUrl.value = '' }
async function selectFile(file, type, multiple = false) {
  dragging.value = ''
  if (multiple) return report('請一次選擇一個檔案。', true)
  if (!file || busy.value) return
  try {
    if (type === 'book') { if (!/\.epub$/i.test(file.name)) throw Error('請選擇 .epub 電子書。'); if (file.size > 100 * 1024 * 1024) throw Error('電子書需小於 100 MB。'); book.value = file; clearDownload() }
    else {
      const current = ++selection; choosingImage.value = true; let url = ''
      try {
        if (file.size > 20 * 1024 * 1024) throw Error('封面圖片需小於 20 MB。')
        const b = new Uint8Array(await file.slice(0, 8).arrayBuffer()), mime = b[0] === 255 && b[1] === 216 ? 'image/jpeg' : b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71 ? 'image/png' : ''
        if (!mime) throw Error('請使用有效的 JPG 或 PNG 圖片。')
        url = URL.createObjectURL(file); const img = new Image(); await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(Error('圖片無法讀取，請換一張。')); img.src = url })
        if (current !== selection) { URL.revokeObjectURL(url); return }
        revokeImage(); imageUrl.value = url; image.value = { file, mime, width: img.naturalWidth, height: img.naturalHeight }; clearDownload()
      } catch (e) { if (url) URL.revokeObjectURL(url); if (current !== selection) return; throw e } finally { if (current === selection) choosingImage.value = false }
    }
    report(book.value && image.value ? '準備好了！可以製作你的新書衣。' : '選好電子書和封面，就可以開始了。')
  } catch (e) { report(e.message, true) }
}
async function build() { if (!ready.value) return; busy.value = true; clearDownload(); report('正在整理書籍、加入封面…'); try { const blob = await addCover(await book.value.arrayBuffer(), image.value); downloadUrl.value = URL.createObjectURL(blob); downloadName.value = book.value.name.replace(/\.epub$/i, '') + '-新封面.epub'; report('製作完成！請按下方連結下載新 EPUB。') } catch (e) { report(e.message || '處理失敗，請確認 EPUB 是否完整。', true) } finally { busy.value = false } }
function reset() { if (busy.value) return; selection++; choosingImage.value = false; book.value = null; image.value = null; revokeImage(); clearDownload(); report('選好電子書和封面，就可以開始了。') }
onBeforeUnmount(() => { selection++; revokeImage(); clearDownload() })
</script>

<template>
  <AppHeader />
  <main class="mx-auto max-w-[1120px] px-5 pt-8 pb-5 sm:px-8 sm:pt-14">
    <HeroSection />
    <section class="grid overflow-hidden rounded-xl border border-line bg-[#fffefa] lg:grid-cols-[1.15fr_1fr]" :aria-busy="busy">
      <EditorPanel :book="book" :image="image" :busy="busy" :choosing-image="choosingImage" :dragging="dragging" :ready="ready" :message="message" :error="error" :download-url="downloadUrl" :download-name="downloadName" @file-selected="selectFile" @drag-enter="dragging = $event" @drag-leave="dragging = ''" @build="build" @reset="reset" />
      <PreviewPanel :image="image" :image-url="imageUrl" />
    </section>
    <InfoNotes />
    <AppFooter />
  </main>
</template>
