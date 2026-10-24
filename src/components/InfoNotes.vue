<template><section class="my-9 grid gap-4 sm:grid-cols-3 sm:gap-9 sm:mb-12"><article v-for="note in notes" :key="note.title"><span class="text-[22px] text-accent">{{ note.icon }}</span><h3 class="text-[13px] font-semibold">{{ note.title }}</h3><p class="text-xs leading-[1.8] text-muted">{{ note.body }}</p></article></section></template>
<script setup>
const notes = [
  { icon: '↳', title: '書籍不離開你的裝置', body: '所有修改都在瀏覽器內完成，不會上傳電子書或圖片。' },
  { icon: '▧', title: '為閱讀器準備好', body: '同步更新封面頁與 EPUB 封面資訊，保留原本章節。尚未以實體 Kobo 驗證。' },
  { icon: '♡', title: '原檔好好保留', body: '另存一份有新封面的 EPUB。DRM 加密與多版本 EPUB 目前不支援。' },
]
</script>
