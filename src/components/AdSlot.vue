<script lang="ts" setup>
const props = withDefaults(defineProps<{
  slotType: 'top' | 'bottom' | 'sidebar'
}>(), {
  slotType: 'top',
});

const adsEnabled = import.meta.env.VITE_ADS_ENABLED === 'true';

const isSidebar = computed(() => props.slotType === 'sidebar');
const maxWidth = computed(() => isSidebar.value ? '300px' : '728px');
const height = computed(() => isSidebar.value ? '250px' : '90px');

/*
 * TODO: 替换为真实 Google AdSense 代码
 *
 * 1. 在 index.html head 中添加 AdSense 全局脚本:
 *    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"><\/script>
 *
 * 2. 将下方 ad-placeholder 替换为:
 *    <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" data-ad-slot="XXXXXXXXXX" data-ad-format="auto" data-full-width-responsive="true"></ins>
 */
</script>

<template>
  <div v-if="adsEnabled" :data-slot="slotType">
    <div :style="{ maxWidth: maxWidth, height: height, width: '100%', backgroundColor: 'rgba(128,128,128,0.08)', border: '1px dashed rgba(128,128,128,0.25)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: slotType === 'top' ? '0 auto 16px' : slotType === 'bottom' ? '24px auto 0' : '0 auto' }">
      <span :style="{ color: 'rgba(128,128,128,0.4)', fontSize: '14px', userSelect: 'none' }">Ad</span>
    </div>
  </div>
</template>
