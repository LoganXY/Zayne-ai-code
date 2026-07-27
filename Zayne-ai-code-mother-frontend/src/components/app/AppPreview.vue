<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  src: string
  ready: boolean
  reloadKey: number
  editMode?: boolean
}>()

const emit = defineEmits<{
  'iframe-ready': [iframe: HTMLIFrameElement]
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

const onLoad = () => {
  if (iframeRef.value) {
    emit('iframe-ready', iframeRef.value)
  }
}

// iframe 重建后，若仍在编辑模式则重新注入脚本
watch(
  () => props.reloadKey,
  () => {
    if (props.editMode && iframeRef.value) {
      emit('iframe-ready', iframeRef.value)
    }
  },
)
</script>

<template>
  <div class="app-preview">
    <iframe
      v-if="ready && src"
      ref="iframeRef"
      :key="reloadKey"
      :src="src"
      class="preview-frame"
      :class="{ 'is-edit-mode': editMode }"
      title="应用预览"
      allow="clipboard-read; clipboard-write"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      @load="onLoad"
    />
    <div v-else class="placeholder">
      <div class="placeholder-icon">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="40" height="28" rx="4" stroke="#d9d9d9" stroke-width="2.5" fill="none"/>
          <rect x="10" y="36" width="28" height="4" rx="2" fill="#d9d9d9"/>
          <circle cx="24" cy="22" r="7" stroke="#d9d9d9" stroke-width="2.5" fill="none"/>
          <path d="M27.5 25.5L31 29" stroke="#d9d9d9" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="placeholder-text">生成完成后将在此预览</div>
      <div class="placeholder-sub">AI 正在为您编织精彩的页面</div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');

.app-preview {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fafafa;
}

.preview-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.preview-frame.is-edit-mode {
  cursor: crosshair;
}

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: linear-gradient(145deg, #f8f9fb 0%, #f0f2f5 100%);
}

.placeholder-icon {
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.placeholder-text {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: #595959;
  letter-spacing: 0.5px;
}

.placeholder-sub {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 300;
  color: #bfbfbf;
  letter-spacing: 1px;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
</style>
