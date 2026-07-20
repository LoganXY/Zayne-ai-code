<script setup lang="ts">
import { formatRelativeTime } from '@/utils/time'

defineProps<{
  app: API.AppVO
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div class="app-card" role="button" tabindex="0" @click="emit('click')" @keydown.enter="emit('click')">
    <div class="cover-wrap">
      <img v-if="app.cover" class="cover" :src="app.cover" :alt="app.appName ?? '应用封面'" />
      <div v-else class="cover-placeholder" />
    </div>
    <div class="meta">
      <div class="name" :title="app.appName">{{ app.appName || '未命名应用' }}</div>
      <div class="time">创建于 {{ formatRelativeTime(app.createTime) }}</div>
    </div>
  </div>
</template>

<style scoped>
.app-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.app-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.cover-wrap {
  width: 100%;
  aspect-ratio: 16 / 10;
  background: #f0f0f0;
  overflow: hidden;
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
}

.meta {
  padding: 12px 14px 14px;
}

.name {
  overflow: hidden;
  color: rgba(0, 0, 0, 0.88);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.time {
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}
</style>
