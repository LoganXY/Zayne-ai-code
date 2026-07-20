import { defineStore } from 'pinia'
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { deployApp, getAppVoById } from '@/api/appController.ts'
import { buildChatSseUrl, streamSse } from '@/utils/sse.ts'

export type ChatRole = 'user' | 'ai'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

export const useAppChatStore = defineStore('appChat', () => {
  const currentApp = ref<API.AppVO | null>(null)
  const messages = ref<ChatMessage[]>([])
  const streaming = ref(false)
  const previewReady = ref(false)
  const previewKey = ref(0)
  const autoSendInitPrompt = ref(false)
  const deployUrl = ref<string>('')
  let abortController: AbortController | null = null

  function clearSession() {
    messages.value = []
    streaming.value = false
    previewReady.value = false
    deployUrl.value = ''
    autoSendInitPrompt.value = false
    abortController?.abort()
    abortController = null
  }

  function prepareCreate(appId: number | string, initPrompt: string) {
    clearSession()
    currentApp.value = { id: appId, initPrompt }
    autoSendInitPrompt.value = true
  }

  async function refreshApp(appId: number | string): Promise<API.AppVO | null> {
    const res = await getAppVoById({ id: appId })
    if (res.data.code === 0 && res.data.data) {
      currentApp.value = res.data.data
      return res.data.data
    }
    return null
  }

  /** 同 appId 保留 messages；不同 appId 先 clearSession。列表进入路径会清除自动发送标记。 */
  async function loadApp(appId: number | string) {
    if (String(currentApp.value?.id) !== String(appId)) {
      clearSession()
    } else {
      autoSendInitPrompt.value = false
    }
    const res = await getAppVoById({ id: appId })
    if (res.data.code === 0 && res.data.data) {
      currentApp.value = res.data.data
      if (res.data.data.codeGenType) {
        previewReady.value = true
      }
      return res.data.data
    }
    message.error('获取应用失败，' + res.data.message)
    return null
  }

  async function sendMessage(text: string) {
    const appId = currentApp.value?.id
    if (appId == null || !text.trim() || streaming.value) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }
    const aiMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'ai',
      content: '',
    }
    messages.value.push(userMsg, aiMsg)
    streaming.value = true
    previewReady.value = false

    abortController?.abort()
    abortController = new AbortController()

    try {
      await streamSse(
        buildChatSseUrl(appId, text.trim()),
        {
          onMessage: (chunk) => {
            aiMsg.content += chunk
            // 触发响应式：替换数组项（content 累加在局部 aiMsg 上）
            const idx = messages.value.findIndex((m) => m.id === aiMsg.id)
            if (idx >= 0) {
              messages.value[idx] = { ...aiMsg }
            }
          },
          onDone: () => {
            previewReady.value = true
            previewKey.value += 1
          },
        },
        abortController.signal,
      )
      // 补拉 codeGenType，确保预览地址可用
      await refreshApp(appId)
      if (currentApp.value?.codeGenType) {
        previewReady.value = true
        previewKey.value += 1
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        message.error(e?.message || '生成失败')
      }
    } finally {
      streaming.value = false
    }
  }

  async function maybeAutoSend() {
    if (!autoSendInitPrompt.value) return
    const prompt = currentApp.value?.initPrompt
    autoSendInitPrompt.value = false
    if (prompt) {
      await sendMessage(prompt)
    }
  }

  async function deploy() {
    const appId = currentApp.value?.id
    if (appId == null) return
    const res = await deployApp({ appId })
    if (res.data.code === 0 && res.data.data) {
      deployUrl.value = res.data.data
      return res.data.data
    }
    message.error('部署失败，' + res.data.message)
    return null
  }

  function previewSrc(): string {
    const app = currentApp.value
    if (!app?.id || !app.codeGenType) return ''
    return `http://localhost:8123/api/static/${app.codeGenType}_${app.id}/`
  }

  return {
    currentApp,
    messages,
    streaming,
    previewReady,
    previewKey,
    autoSendInitPrompt,
    deployUrl,
    prepareCreate,
    loadApp,
    clearSession,
    sendMessage,
    maybeAutoSend,
    deploy,
    previewSrc,
  }
})
