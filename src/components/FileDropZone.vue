<template>
  <label :class="['group relative flex min-h-[147px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-[18px] text-center transition', compact ? 'min-h-[125px]' : '', over ? 'border-accent bg-[#f7f0e6]' : 'border-[#bfc6b8] bg-[#fafbf5] hover:border-accent hover:bg-[#f7f0e6]', disabled ? 'cursor-wait opacity-50' : '']" @dragover.prevent="$emit('drag-enter')" @dragleave.prevent="$emit('drag-leave')" @drop.prevent="onDrop">
    <input class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait" type="file" :accept="accept" :disabled="disabled" :aria-label="ariaLabel" @change="onChange" />
    <span class="text-[26px] text-[#697960]">{{ icon }}</span><strong class="block max-w-full overflow-wrap-anywhere text-[13px]">{{ title }}</strong><small class="text-[11px] text-muted">{{ hint }}</small>
  </label>
</template>
<script setup>
defineProps({ accept: String, ariaLabel: String, compact: Boolean, disabled: Boolean, hint: String, icon: String, over: Boolean, title: String })
const emit = defineEmits(['file-selected', 'drag-enter', 'drag-leave'])
const onChange = (event) => { emit('file-selected', event.target.files?.[0]); event.target.value = '' }
const onDrop = (event) => { emit('drag-leave'); emit('file-selected', event.dataTransfer.files?.length === 1 ? event.dataTransfer.files[0] : null, event.dataTransfer.files?.length !== 1) }
</script>
