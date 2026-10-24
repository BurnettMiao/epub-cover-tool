<template>
  <section class="relative">
    <div class="text-xs tracking-[3px] text-accent">給好故事，一張新封面</div>
    <h1 class="my-4 font-serif text-[36px] font-normal leading-[1.4] tracking-[2px] sm:text-[48px]">你的藏書，<br />值得一件<span class="text-accent">好看的書衣。</span></h1>
    <p class="text-sm leading-[1.9] text-[#72786e] lg:absolute lg:right-8 lg:top-8">替 EPUB 加入或更換封面。選一本書、一張圖片，<br class="hidden lg:inline" />讓下一次翻開，更有儀式感。</p>
    <div class="mt-5 mb-8 flex flex-wrap gap-2"><span v-for="tag in tags" :key="tag" class="rounded border border-line px-2.5 py-1 text-[10px] text-[#6d756b]">{{ tag }}</span></div>
  </section>
</template>
<script setup>
const tags = ['EPUB 2 / 3', 'JPG / PNG', '為 Kobo 等閱讀器準備']
</script>
