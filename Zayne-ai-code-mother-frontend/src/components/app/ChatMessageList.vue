<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { ChatMessage } from '@/stores/appChat'
import AiMarkdownContent from '@/components/app/AiMarkdownContent.vue'

const props = withDefaults(
  defineProps<{
    messages: ChatMessage[]
    streaming?: boolean
    userAvatar?: string
    userName?: string
  }>(),
  {
    streaming: false,
    userAvatar: '',
    userName: '',
  },
)

const listRef = ref<HTMLElement | null>(null)

watch(
  () => props.messages,
  async () => {
    await nextTick()
    const el = listRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  },
  { deep: true },
)
</script>

<template>
  <div ref="listRef" class="chat-message-list">
    <div
      v-for="(msg, index) in messages"
      :key="msg.id"
      class="message-row"
      :class="msg.role === 'user' ? 'is-user' : 'is-ai'"
    >
      <img
        v-if="msg.role === 'ai'"
        class="avatar"
        src="/mascot-icon-circle.png"
        alt="AI"
      />

      <div class="bubble">
        <AiMarkdownContent v-if="msg.role === 'ai'" :content="msg.content" />
        <div v-else class="user-content">{{ msg.content }}</div>
        <div
          v-if="streaming && msg.role === 'ai' && index === messages.length - 1"
          class="streaming-hint"
        >
          生成中…
        </div>
      </div>

      <a-avatar
        v-if="msg.role === 'user'"
        class="avatar user-avatar"
        :src="userAvatar || undefined"
        :size="36"
      >
        {{ userName?.[0] || 'U' }}
      </a-avatar>
    </div>
  </div>
</template>

<style scoped>
.chat-message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  padding: 16px 20px;
  overflow-y: auto;
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.message-row.is-user {
  justify-content: flex-end;
}

.message-row.is-ai {
  justify-content: flex-start;
}

.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.user-avatar {
  background: #bfbfbf;
  color: #fff;
  font-size: 14px;
}

.bubble {
  max-width: min(82%, 640px);
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
}

.is-user .bubble {
  background: #1677ff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.is-ai .bubble {
  background: #fff;
  color: rgba(0, 0, 0, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.user-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.streaming-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}
</style>
