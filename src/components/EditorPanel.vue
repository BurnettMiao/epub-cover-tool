<script setup>
import FileDropZone from './FileDropZone.vue'
import StepHeading from './StepHeading.vue'
defineProps({ book: Object, busy: Boolean, choosingImage: Boolean, dragging: String, downloadName: String, downloadUrl: String, error: Boolean, image: Object, message: String, ready: Boolean })
defineEmits(['build', 'drag-enter', 'drag-leave', 'file-selected', 'reset'])
</script>

<template>
  <div class="p-6 sm:p-8">
    <StepHeading number="01" title="選擇電子書" />
    <FileDropZone accept=".epub,application/epub+zip" aria-label="選擇 EPUB 電子書" icon="▤" :disabled="busy" :over="dragging === 'book'" :title="book?.name || '拖入 EPUB，或點此選擇'" :hint="book ? `${(book.size / 1024 / 1024).toFixed(2)} MB · 已選擇電子書` : '支援未加密的 .epub 檔案，最大 100 MB'" @drag-enter="$emit('drag-enter', 'book')" @drag-leave="$emit('drag-leave')" @file-selected="(file, multiple) => $emit('file-selected', file, 'book', multiple)" />
    <StepHeading number="02" title="選擇新封面" second />
    <FileDropZone accept="image/jpeg,image/png" aria-label="選擇封面圖片" icon="＋" compact :disabled="busy" :over="dragging === 'image'" :title="choosingImage ? '正在讀取圖片…' : image?.file.name || '拖入封面圖片，或點此選擇'" hint="JPG 或 PNG，最大 20 MB · 建議直式圖片" sub-hint="Kobo 建議尺寸：1448 × 1920 px（3:4）" @drag-enter="$emit('drag-enter', 'image')" @drag-leave="$emit('drag-leave')" @file-selected="(file, multiple) => $emit('file-selected', file, 'image', multiple)" />
    <div class="mt-7"><button class="flex w-full items-center justify-between rounded-md bg-ink px-5 py-4 text-sm text-white transition hover:bg-[#435a4d] disabled:cursor-not-allowed disabled:opacity-40" :disabled="!ready" @click="$emit('build')">{{ busy ? '正在製作…' : '製作新 EPUB' }} <span>↗</span></button><p :class="['min-h-5 text-xs leading-[1.7] text-muted', error ? 'text-[#b24030]' : '']" role="status" aria-live="polite">{{ message }}</p><a v-if="downloadUrl" class="text-[13px] text-accent" :href="downloadUrl" :download="downloadName">下載 {{ downloadName }} ↓</a><div><button v-if="book || image" class="!w-auto !bg-transparent !px-0 !py-2 text-xs text-muted hover:!bg-transparent hover:text-accent disabled:opacity-40" :disabled="busy" @click="$emit('reset')">清除，重新選擇</button></div></div>
  </div>
</template>
