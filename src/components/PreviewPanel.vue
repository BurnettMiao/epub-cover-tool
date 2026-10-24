<template>
  <aside class="flex min-h-[400px] flex-col bg-[#eeeee4] px-7 py-6">
    <div class="flex justify-between text-xs text-[#626f61]">
      封面預覽
      <span class="text-[8px] tracking-[2px] opacity-65">LIVE PREVIEW</span>
    </div>
    <div class="flex flex-1 items-center justify-center px-5 py-9">
      <div
        class="book-spine relative aspect-[3/4] h-auto w-[250px] max-w-full rotate-[-4deg] rounded-[2px_5px_5px_2px] bg-[#d7dfcf]"
      >
        <img
          v-if="imageUrl"
          class="block h-full w-full object-contain"
          :src="imageUrl"
          alt="所選封面預覽"
        />
        <div
          v-else
          class="flex h-full flex-col justify-between px-[25px] py-[27px] text-[#415642]"
        >
          <small class="text-[8px] tracking-[2px]"
            >YOUR NEXT<br />GREAT READ</small
          >

          <div>
            <strong class="font-serif text-[25px] font-normal leading-[1.6]"
              >故事，<br />從封面開始。</strong
            ><em class="mt-6 block text-[6px] not-italic tracking-[1.7px]"
              >BOOK COVER STUDIO</em
            >
          </div>
        </div>
      </div>
    </div>
    <p class="mb-2 text-center text-[11px] text-muted">
      {{
        image
          ? `${image.width} × ${image.height} px · 完整置入，不裁切`
          : '新封面會完整置入，不裁切圖片'
      }}
    </p>
  </aside>
</template>
<script setup>
defineProps({ image: Object, imageUrl: String });
</script>
