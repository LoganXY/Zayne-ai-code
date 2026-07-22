import { defineStore } from 'pinia'
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { deployApp, generateAppName, getAppVoById } from '@/api/appController.ts'
import { listAppChatHistory } from '@/api/chatHistoryController.ts'
import { CHAT_HISTORY_PAGE_SIZE, CHAT_MESSAGE_TYPE } from '@/constants/chatHistory.ts'
import { buildChatSseUrl, streamSse } from '@/utils/sse.ts'
import { getPreviewSiteUrl } from '@/utils/deploy.ts'

export type ChatRole = 'user' | 'ai'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createTime?: string
}

function mapHistoryRecords(records: API.ChatHistory[]): ChatMessage[] {
  // 后端按 createTime 降序返回，展示需升序
  return [...records].reverse().map((item) => ({
    id: String(item.id ?? `${item.createTime}-${item.messageType}`),
    role: item.messageType === CHAT_MESSAGE_TYPE.USER ? 'user' : 'ai',
    content: item.message ?? '',
    createTime: item.createTime,
  }))
}

export const useAppChatStore = defineStore('appChat', () => {
  const currentApp = ref<API.AppVO | null>(null)
  const messages = ref<ChatMessage[]>([])
  const streaming = ref(false)
  const previewReady = ref(false)
  const previewKey = ref(0)
  const deployUrl = ref<string>('')
  const historyHasMore = ref(false)
  const historyLoading = ref(false)
  /** 当前已加载消息中最早一条的创建时间，用作下一页游标 */
  const oldestCreateTime = ref<string | undefined>()
  let abortController: AbortController | null = null

  function clearSession() {
    messages.value = []
    streaming.value = false
    previewReady.value = false
    deployUrl.value = ''
    historyHasMore.value = false
    historyLoading.value = false
    oldestCreateTime.value = undefined
    abortController?.abort()
    abortController = null
  }

  function prepareCreate(appId: number | string, initPrompt: string) {
    clearSession()
    currentApp.value = { id: appId, initPrompt }
  }

  async function refreshApp(appId: number | string): Promise<API.AppVO | null> {
    const res = await getAppVoById({ id: appId })
    if (res.data.code === 0 && res.data.data) {
      currentApp.value = res.data.data
      return res.data.data
    }
    return null
  }

  /** 同 appId 保留会话状态；不同 appId 先 clearSession */
  async function loadApp(appId: number | string) {
    if (String(currentApp.value?.id) !== String(appId)) {
      clearSession()
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

  /**
   * 游标加载对话历史。
   * @param reset true=首次加载（替换列表）；false=加载更多（前置更早消息）
   * @returns 是否加载成功
   */
  async function loadChatHistory(appId: number | string, reset = false): Promise<boolean> {
    if (historyLoading.value) return false
    if (!reset && !historyHasMore.value) return false

    historyLoading.value = true
    try {
      const res = await listAppChatHistory({
        appId: appId as unknown as number,
        pageSize: CHAT_HISTORY_PAGE_SIZE,
        lastCreateTime: reset ? undefined : oldestCreateTime.value,
      })
      if (res.data.code !== 0 || !res.data.data) {
        if (reset) {
          messages.value = []
          historyHasMore.value = false
          oldestCreateTime.value = undefined
        }
        message.error('加载对话历史失败，' + (res.data.message || ''))
        return false
      }

      const records = res.data.data.records ?? []
      const mapped = mapHistoryRecords(records)

      if (reset) {
        messages.value = mapped
      } else {
        // 去重后前置更早消息
        const existingIds = new Set(messages.value.map((m) => m.id))
        const older = mapped.filter((m) => !existingIds.has(m.id))
        messages.value = [...older, ...messages.value]
      }

      if (records.length > 0) {
        oldestCreateTime.value = records[records.length - 1]?.createTime
      } else if (reset) {
        oldestCreateTime.value = undefined
      }

      historyHasMore.value = records.length >= CHAT_HISTORY_PAGE_SIZE
      return true
    } catch {
      if (reset) {
        messages.value = []
        historyHasMore.value = false
        oldestCreateTime.value = undefined
      }
      return false
    } finally {
      historyLoading.value = false
    }
  }

  async function loadMoreHistory() {
    const appId = currentApp.value?.id
    if (appId == null) return
    await loadChatHistory(appId, false)
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

  /** 自己的应用且无对话历史时，自动发送 initPrompt */
  async function maybeAutoSend(isOwner: boolean) {
    if (!isOwner) return
    if (messages.value.length > 0) return
    const prompt = currentApp.value?.initPrompt
    if (prompt) {
      await sendMessage(prompt)
    }
  }

  async function generateAndUpdateName(appId: number | string) {
    try {
      const res = await generateAppName({ appId })
      if (res.data.code === 0 && res.data.data) {
        const newName = res.data.data
        if (currentApp.value && String(currentApp.value.id) === String(appId)) {
          currentApp.value = { ...currentApp.value, appName: newName }
        }
        message.success(`应用名称已自动生成：${newName}`)
        return newName
      }
    } catch {
      // 静默失败，不影响主流程
    }
    return null
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
    return getPreviewSiteUrl(app.codeGenType, app.id)
  }

  return {
    currentApp,
    messages,
    streaming,
    previewReady,
    previewKey,
    deployUrl,
    historyHasMore,
    historyLoading,
    prepareCreate,
    loadApp,
    loadChatHistory,
    loadMoreHistory,
    clearSession,
    sendMessage,
    maybeAutoSend,
    generateAndUpdateName,
    deploy,
    previewSrc,
  }
})
