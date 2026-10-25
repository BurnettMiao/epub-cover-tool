<script setup>defineProps({ number: String, second: Boolean, title: String })</script>

<template><div :class="['flex items-center gap-3', second ? 'mt-7' : '', 'mb-4']"><b class="rounded-full border border-[#dfd8ca] px-2 py-1 font-serif text-[13px] font-normal text-accent">{{ number }}</b><h2 class="m-0 text-base font-semibold">{{ title }}</h2></div></template>
