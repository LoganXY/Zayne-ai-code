<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { deleteApp, deleteAppByAdmin, getAppVoById } from '@/api/appController.ts'
import AppPromptBox from '@/components/app/AppPromptBox.vue'
import ChatMessageList from '@/components/app/ChatMessageList.vue'
import AppPreview from '@/components/app/AppPreview.vue'
import { useAppChatStore } from '@/stores/appChat.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { formatDateTime } from '@/utils/time.ts'

const route = useRoute()
const router = useRouter()
const appChat = useAppChatStore()
const loginUserStore = useLoginUserStore()
const { currentApp, messages, streaming, previewReady, previewKey, autoSendInitPrompt } =
  storeToRefs(appChat)

const prompt = ref('')
const deploying = ref(false)
const detailOpen = ref(false)
const deleting = ref(false)

const appId = computed(() => {
  const raw = route.params.id
  const id = Array.isArray(raw) ? raw[0] : raw
  // 保持字符串，避免 JavaScript Number 对大整数（雪花 ID）精度丢失
  return id && String(id).trim() ? String(id) : ''
})

const previewSrc = computed(() => appChat.previewSrc())

const creatorName = computed(
  () => currentApp.value?.user?.userName || loginUserStore.loginUser.userName || '无名',
)
const creatorAvatar = computed(
  () => currentApp.value?.user?.userAvatar || loginUserStore.loginUser.userAvatar,
)

const canManageApp = computed(() => {
  const app = currentApp.value
  if (!app) return false
  if (loginUserStore.loginUser.userRole === 'admin') return true
  return app.userId != null && app.userId === loginUserStore.loginUser.id
})

const openDetail = () => {
  detailOpen.value = true
}

const onModify = () => {
  if (!appId.value) return
  detailOpen.value = false
  router.push(`/app/edit/${appId.value}`)
}

const onDelete = () => {
  if (!appId.value || !canManageApp.value) {
    message.error('无权限删除该应用')
    return
  }
  Modal.confirm({
    title: '确认删除该应用吗？',
    content: '删除后不可恢复',
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      deleting.value = true
      try {
        const id = appId.value
        const res =
          loginUserStore.loginUser.userRole === 'admin'
            ? await deleteAppByAdmin({ id })
            : await deleteApp({ id })
        if (res.data.code === 0) {
          message.success('删除成功')
          detailOpen.value = false
          appChat.clearSession()
          await router.replace('/')
        } else {
          message.error('删除失败，' + res.data.message)
        }
      } finally {
        deleting.value = false
      }
    },
  })
}

const onSubmit = async () => {
  const text = prompt.value.trim()
  if (!text) return
  prompt.value = ''
  await appChat.sendMessage(text)
}

const onDeploy = async () => {
  deploying.value = true
  try {
    const url = await appChat.deploy()
    if (url) {
      Modal.success({
        title: '部署成功',
        content: url,
        okText: '打开',
        onOk: () => {
          window.open(url, '_blank')
        },
      })
    }
  } finally {
    deploying.value = false
  }
}

const initPage = async (id: string) => {
  if (!id) {
    message.error('应用 ID 无效')
    router.replace('/')
    return
  }

  prompt.value = ''

  if (String(currentApp.value?.id) === id && autoSendInitPrompt.value) {
    const res = await getAppVoById({ id })
    if (res.data.code === 0 && res.data.data) {
      currentApp.value = { ...currentApp.value, ...res.data.data }
    }
    await appChat.maybeAutoSend()
  } else {
    await appChat.loadApp(id)
    // 兜底：如果应用名是临时名称，触发 AI 命名
    const app = currentApp.value
    if (app?.appName && app.initPrompt && app.appName === app.initPrompt.substring(0, 12)) {
      appChat.generateAndUpdateName(id)
    }
  }
}

watch(
  appId,
  (id) => {
    void initPage(id)
  },
  { immediate: true },
)
</script>

<template>
  <div id="appChatPage">
    <div class="app-toolbar">
      <div class="app-name">{{ currentApp?.appName || '未命名应用' }}</div>
      <a-space>
        <a-button @click="openDetail">
          <template #icon>
            <InfoCircleOutlined />
          </template>
          应用详情
        </a-button>
        <a-button type="primary" :loading="deploying" @click="onDeploy">
          <template #icon>
            <CloudUploadOutlined />
          </template>
          部署
        </a-button>
      </a-space>
    </div>

    <div class="chat-layout">
      <div class="chat-pane">
        <div class="messages-wrap">
          <ChatMessageList
            :messages="messages"
            :streaming="streaming"
            :user-avatar="loginUserStore.loginUser.userAvatar"
            :user-name="loginUserStore.loginUser.userName"
          />
        </div>
        <div class="prompt-wrap">
          <AppPromptBox
            v-model="prompt"
            placeholder="继续描述你想修改或新增的内容…"
            :loading="streaming"
            :disabled="streaming"
            @submit="onSubmit"
          />
        </div>
      </div>
      <div class="preview-pane">
        <AppPreview :src="previewSrc" :ready="previewReady" :reload-key="previewKey" />
      </div>
    </div>

    <a-modal
      v-model:open="detailOpen"
      title="应用详情"
      :footer="null"
      :width="420"
      destroy-on-close
    >
      <div class="detail-body">
        <div class="detail-row">
          <span class="detail-label">创建者：</span>
          <div class="creator">
            <a-avatar :src="creatorAvatar" :size="28">
              {{ creatorName?.[0] || '无' }}
            </a-avatar>
            <span>{{ creatorName }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="detail-label">创建时间：</span>
          <span class="detail-value">{{ formatDateTime(currentApp?.createTime) }}</span>
        </div>
      </div>
      <div class="detail-actions">
        <a-button type="primary" @click="onModify">
          <template #icon>
            <EditOutlined />
          </template>
          修改
        </a-button>
        <a-button danger :loading="deleting" :disabled="!canManageApp" @click="onDelete">
          <template #icon>
            <DeleteOutlined />
          </template>
          删除
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<style scoped>
#appChatPage {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 64px - 32px);
  min-height: 480px;
  margin: 0;
}

.app-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 12px;
  padding: 0 2px;
}

.app-name {
  color: rgba(0, 0, 0, 0.88);
  font-size: 18px;
  font-weight: 600;
  text-align: left;
}

.chat-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 16px;
  overflow: hidden;
}

.chat-pane {
  display: flex;
  flex-direction: column;
  width: 38%;
  min-width: 360px;
  max-width: 520px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.messages-wrap {
  flex: 1;
  min-height: 0;
}

.prompt-wrap {
  flex-shrink: 0;
  padding: 12px 16px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-pane {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.detail-body {
  padding: 8px 0 4px;
}

.detail-row {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
}

.detail-label {
  flex-shrink: 0;
  color: rgba(0, 0, 0, 0.45);
}

.detail-value {
  color: rgba(0, 0, 0, 0.88);
}

.creator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(0, 0, 0, 0.88);
}

.detail-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 900px) {
  #appChatPage {
    height: auto;
    min-height: calc(100vh - 64px - 32px);
  }

  .chat-layout {
    flex-direction: column;
  }

  .chat-pane {
    width: 100%;
    max-width: none;
    min-width: 0;
    height: 420px;
  }

  .preview-pane {
    height: 420px;
  }
}
</style>
