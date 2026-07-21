<script setup lang="ts">
import { computed } from 'vue'
import { formatRelativeTime } from '@/utils/time'
import { getDeploySiteUrl } from '@/utils/deploy'
import { getCodeGenTypeText } from '@/constants/codeGenType'

const props = withDefaults(
  defineProps<{
    app: API.AppVO
    variant?: 'mine' | 'featured'
  }>(),
  {
    variant: 'mine',
  },
)

const emit = defineEmits<{
  'view-chat': []
}>()

const isFeatured = computed(() => props.variant === 'featured')
const typeLabel = computed(() => getCodeGenTypeText(props.app.codeGenType))
const hasDeploy = computed(() => Boolean(props.app.deployKey?.trim()))

const openWorks = (event: Event) => {
  event.stopPropagation()
  const key = props.app.deployKey?.trim()
  if (!key) return
  window.open(getDeploySiteUrl(key), '_blank')
}

const openChat = (event: Event) => {
  event.stopPropagation()
  emit('view-chat')
}
</script>

<template>
  <div class="app-card">
    <div class="cover-wrap">
      <img v-if="app.cover" class="cover" :src="app.cover" :alt="app.appName ?? '应用封面'" />
      <div v-else class="cover-placeholder" />
      <div class="cover-actions">
        <button v-if="hasDeploy" type="button" class="action-btn action-works" @click="openWorks">
          查看作品
        </button>
        <button type="button" class="action-btn action-chat" @click="openChat">查看对话</button>
      </div>
    </div>

    <div v-if="isFeatured" class="footer">
      <a-avatar class="avatar" :src="app.user?.userAvatar" :size="32">
        {{ (app.user?.userName || '用').slice(0, 1) }}
      </a-avatar>
      <div class="info">
        <div class="name" :title="app.appName">{{ app.appName || '未命名应用' }}</div>
        <div class="author">{{ app.user?.userName || '匿名用户' }}</div>
      </div>
      <a-tag class="type-tag" color="blue">{{ typeLabel }}</a-tag>
    </div>
    <div v-else class="meta">
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
  transition: box-shadow 0.2s;
}

.app-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.cover-wrap {
  position: relative;
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

.cover-actions {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.28);
  opacity: 0;
  transition: opacity 0.2s;
}

.app-card:hover .cover-actions {
  opacity: 1;
}

.action-btn {
  min-width: 120px;
  padding: 8px 20px;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-works {
  background: #1f1f1f;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-chat {
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.meta,
.footer {
  padding: 12px 14px 14px;
}

.footer {
  display: flex;
  align-items: center;
  gap: 10px;
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

.time,
.author {
  margin-top: 6px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
}

.author {
  margin-top: 2px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.type-tag {
  flex-shrink: 0;
  margin-inline-end: 0;
}

@media (hover: none) {
  .cover-actions {
    opacity: 1;
    background: rgba(0, 0, 0, 0.22);
  }
}
</style>
