<script setup lang="ts">
defineProps<{
  src: string
  ready: boolean
  reloadKey: number
}>()
</script>

<template>
  <div class="app-preview">
    <iframe
      v-if="ready && src"
      :key="reloadKey"
      :src="src"
      frameborder="0"
      class="preview-frame"
      title="应用预览"
    />
    <div v-else class="placeholder">生成完成后将在此预览</div>
  </div>
</template>

<style scoped>
.app-preview {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fafafa;
}

.preview-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
