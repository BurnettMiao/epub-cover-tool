<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({ image: Object, imageUrl: String })
const emit = defineEmits(['adjust'])
const zoom = ref(1), rotation = ref(0), offsetX = ref(0), offsetY = ref(0), confirmed = ref(false), dragging = ref(false), startX = ref(0), startY = ref(0), originX = ref(0), originY = ref(0)
const imageStyle = computed(() => ({ transform: `translate(calc(-50% + ${offsetX.value}px), calc(-50% + ${offsetY.value}px)) scale(${zoom.value}) rotate(${rotation.value}deg)`, transformOrigin: 'center center' }))
function notify() { emit('adjust', { zoom: zoom.value, rotation: rotation.value, offsetX: offsetX.value, offsetY: offsetY.value }) }
function rotate() { rotation.value = (rotation.value + 90) % 360; notify() }
function resetAdjustments() { zoom.value = 1; rotation.value = 0; offsetX.value = 0; offsetY.value = 0; confirmed.value = false; notify() }
function confirmAdjustment() { confirmed.value = true; notify() }
watch(() => props.imageUrl, () => { confirmed.value = false })
function startDrag(event) { if (!props.image || confirmed.value) return; dragging.value = true; startX.value = event.clientX; startY.value = event.clientY; originX.value = offsetX.value; originY.value = offsetY.value; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.style.cursor = 'grabbing'; event.currentTarget.addEventListener('pointermove', drag); event.currentTarget.addEventListener('pointerup', stopDrag, { once: true }) }
function drag(event) { if (!dragging.value) return; offsetX.value = originX.value + event.clientX - startX.value; offsetY.value = originY.value + event.clientY - startY.value; notify() }
function stopDrag(event) { dragging.value = false; event.currentTarget.style.cursor = ''; event.currentTarget.removeEventListener('pointermove', drag) }
</script>

<template>
  <aside class="flex min-h-[400px] flex-col bg-[#eeeee4] px-7 py-6">
    <div class="flex justify-between text-xs text-[#626f61]">封面預覽 <span class="text-[8px] tracking-[2px] opacity-65">LIVE PREVIEW</span></div>
    <div class="flex flex-1 items-center justify-center px-5 py-7"><div class="book-spine relative aspect-[3/4] h-auto w-[250px] max-w-full rotate-[-4deg] overflow-hidden rounded-[2px_5px_5px_2px] bg-[#d7dfcf]" @pointerdown="startDrag"><img v-if="imageUrl" class="absolute left-1/2 top-1/2 h-[calc(100%+2px)] w-[calc(100%+2px)] max-w-none select-none object-cover" :style="imageStyle" :src="imageUrl" alt="所選封面預覽" draggable="false" /><div v-else class="absolute inset-0 flex flex-col justify-between px-[25px] py-[27px] text-[#415642]"><small class="text-[8px] tracking-[2px]">YOUR NEXT<br />GREAT READ</small><div><strong class="font-serif text-[25px] font-normal leading-[1.6]">故事，<br />從封面開始。</strong><em class="mt-6 block text-[6px] not-italic tracking-[1.7px]">BOOK COVER STUDIO</em></div></div></div></div>
    <div v-if="image" class="mx-auto mb-4 w-full max-w-[270px] space-y-2"><label v-if="!confirmed" class="flex items-center gap-3 text-[11px] text-muted"><span class="w-8">縮放</span><input v-model.number="zoom" class="h-1 flex-1 accent-ink" type="range" min="1" max="3" step="0.01" /></label><div v-if="!confirmed" class="flex items-center justify-between"><span class="text-[11px] text-muted">{{ rotation }}°</span><div class="flex gap-3"><button class="!w-auto !bg-transparent !p-0 text-[11px] text-muted hover:!bg-transparent hover:text-accent" type="button" @click="rotate">旋轉 90°</button><button class="!w-auto !bg-transparent !p-0 text-[11px] text-muted hover:!bg-transparent hover:text-accent" type="button" @click="resetAdjustments">還原</button></div></div><button v-if="!confirmed" class="mt-2 flex w-full items-center justify-center rounded-md bg-ink px-3 py-2 text-xs text-white transition hover:bg-[#435a4d]" type="button" @click="confirmAdjustment">確認封面調整</button><button v-else class="mt-2 flex w-full items-center justify-center rounded-md border border-[#bfc6b8] bg-transparent px-3 py-2 text-xs text-ink transition hover:border-accent hover:text-accent" type="button" @click="confirmed = false">重新調整</button></div>
    <p class="mb-2 text-center text-[11px] text-muted">{{ image ? `${image.width} × ${image.height} px · 拖曳調整位置` : '新封面會完整置入，不裁切圖片' }}</p>
  </aside>
</template>
