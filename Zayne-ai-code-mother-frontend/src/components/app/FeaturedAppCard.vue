<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  app: API.AppVO
}>()

const emit = defineEmits<{
  click: []
}>()

const CODE_GEN_TYPE_MAP: Record<string, { label: string; color: string }> = {
  multi_file: { label: '网站', color: 'blue' },
  html: { label: '网站', color: 'cyan' },
}

const typeMeta = computed(() => {
  const key = props.app.codeGenType ?? ''
  return CODE_GEN_TYPE_MAP[key] ?? { label: '用户应用', color: 'default' }
})
</script>

<template>
  <div
    class="featured-app-card"
    role="button"
    tabindex="0"
    @click="emit('click')"
    @keydown.enter="emit('click')"
  >
    <div class="cover-wrap">
      <img v-if="app.cover" class="cover" :src="app.cover" :alt="app.appName ?? '应用封面'" />
      <div v-else class="cover-placeholder" />
    </div>
    <div class="footer">
      <a-avatar class="avatar" :src="app.user?.userAvatar" :size="32">
        {{ (app.user?.userName || '用').slice(0, 1) }}
      </a-avatar>
      <div class="info">
        <div class="name" :title="app.appName">{{ app.appName || '未命名应用' }}</div>
        <div class="author">{{ app.user?.userName || '匿名用户' }}</div>
      </div>
      <a-tag class="type-tag" :color="typeMeta.color">{{ typeMeta.label }}</a-tag>
    </div>
  </div>
</template>

<style scoped>
.featured-app-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition:
    box-shadow 0.2s,
    transform 0.2s;
}

.featured-app-card:hover {
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

.footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px 14px;
}

.avatar {
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  overflow: hidden;
  color: rgba(0, 0, 0, 0.88);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.author {
  margin-top: 2px;
  overflow: hidden;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.type-tag {
  flex-shrink: 0;
  margin-inline-end: 0;
}
</style>
