<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import { CloudUploadOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { storeToRefs } from 'pinia'
import { deleteApp, deleteAppByAdmin } from '@/api/appController.ts'
import AppDetailModal from '@/components/app/AppDetailModal.vue'
import AppPromptBox from '@/components/app/AppPromptBox.vue'
import ChatMessageList from '@/components/app/ChatMessageList.vue'
import AppPreview from '@/components/app/AppPreview.vue'
import { useRouteAppId } from '@/composables/useRouteAppId.ts'
import { useAppChatStore } from '@/stores/appChat.ts'
import { useLoginUserStore } from '@/stores/loginUser.ts'

const router = useRouter()
const appChat = useAppChatStore()
const loginUserStore = useLoginUserStore()
const {
  currentApp,
  messages,
  streaming,
  previewReady,
  previewKey,
  historyHasMore,
  historyLoading,
} = storeToRefs(appChat)

const prompt = ref('')
const deploying = ref(false)
const detailOpen = ref(false)
const deleting = ref(false)

const appId = useRouteAppId()

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

const isOwner = computed(() => {
  const app = currentApp.value
  if (!app?.userId || loginUserStore.loginUser.id == null) return false
  return String(app.userId) === String(loginUserStore.loginUser.id)
})

const onLoadMore = () => {
  void appChat.loadMoreHistory()
}

const initPage = async (id: string) => {
  if (!id) {
    message.error('应用 ID 无效')
    router.replace('/')
    return
  }

  prompt.value = ''

  await appChat.loadApp(id)
  if (!currentApp.value) return

  const historyOk = await appChat.loadChatHistory(id, true)

  // 自己的应用且无历史时，自动发送初始提示词（历史加载失败时不触发，避免重复对话）
  if (historyOk) {
    await appChat.maybeAutoSend(isOwner.value)
  }

  // 兜底：临时名（等于 initPrompt 前 12 字符）时触发 AI 命名
  const app = currentApp.value
  if (app?.appName && app.initPrompt && app.appName === app.initPrompt.substring(0, 12)) {
    void appChat.generateAndUpdateName(id)
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
            :has-more="historyHasMore"
            :loading-more="historyLoading"
            @load-more="onLoadMore"
          />
        </div>
        <div class="prompt-wrap">
          <AppPromptBox
            v-model="prompt"
            placeholder="请描述你想生成的网站，越详细效果越好哦"
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

    <AppDetailModal
      v-model:open="detailOpen"
      :app="currentApp"
      :creator-name="creatorName"
      :creator-avatar="creatorAvatar"
      :can-manage="canManageApp"
      :deleting="deleting"
      @edit="onModify"
      @delete="onDelete"
    />
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
