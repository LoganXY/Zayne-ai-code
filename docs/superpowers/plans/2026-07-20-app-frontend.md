# App Frontend Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 Vue3 前端实现应用主页、对话生成/预览/部署、应用编辑与管理员应用管理，对接已有 `appController` API。

**Architecture:** 页面编排 + `components/app/*` 可复用 UI；Pinia `appList` / `appChat` 管理列表与 SSE 会话；`utils/sse.ts` 用 fetch + credentials 解析后端 `{"d":chunk}` / `event: done` 流。管理页对齐 `UserManagePage`。

**Tech Stack:** Vue 3、Vue Router、Pinia、Ant Design Vue 4、Axios、dayjs（已随 antd 引入）

**Spec:** `docs/superpowers/specs/2026-07-20-app-frontend-design.md`

**测试说明:** 规格约定本阶段不做单元测试；每 Task 以 `npm run type-check` / 页面手动验证为准。提交仅在用户明确要求时执行（计划中 Commit 步骤默认跳过，除非用户要求）。

**工作目录:** `Zayne-ai-code-mother-frontend/`（下文路径均相对此目录，除非写明仓库根）

---

## File Structure

| 文件 | 职责 |
|------|------|
| `src/utils/sse.ts` | 带 Cookie 的 SSE 流解析 |
| `src/utils/time.ts` | 相对时间文案 |
| `src/stores/appList.ts` | 我的作品 / 精选列表状态 |
| `src/stores/appChat.ts` | 对话消息、SSE、预览、部署 |
| `src/components/app/AppPromptBox.vue` | 提示词输入 + 发送 |
| `src/components/app/AppCard.vue` | 我的作品卡片 |
| `src/components/app/FeaturedAppCard.vue` | 精选卡片 |
| `src/components/app/AppCardList.vue` | 分区标题 + 可选搜索 + 网格 + 分页 |
| `src/components/app/ChatMessageList.vue` | 消息列表 |
| `src/components/app/AppPreview.vue` | iframe 预览 |
| `src/pages/HomePage.vue` | 主页（重写） |
| `src/pages/app/AppChatPage.vue` | 对话页 |
| `src/pages/app/AppEditPage.vue` | 应用编辑 |
| `src/pages/admin/AppManagePage.vue` | 管理员应用管理 |
| `src/router/index.ts` | 注册路由 |
| `src/config/menu.ts` | 应用管理菜单 |

已有沿用：`src/api/appController.ts`、`src/api/typings.d.ts`、`GlobalHeader`、`access.ts`、`request.ts`

---

### Task 1: SSE 工具 + 相对时间

**Files:**
- Create: `src/utils/sse.ts`
- Create: `src/utils/time.ts`

- [ ] **Step 1: 创建 `sse.ts`**

```ts
export type SseHandlers = {
  onMessage: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

/**
 * 读取后端 SSE：data 行为 JSON {"d":"..."}，结束为 event: done
 */
export async function streamSse(
  url: string,
  handlers: SseHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'text/event-stream' },
    signal,
  })
  if (!response.ok) {
    throw new Error(`SSE 请求失败: ${response.status}`)
  }
  if (!response.body) {
    throw new Error('浏览器不支持流式读取')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let eventName = 'message'

  const flushEvent = (rawData: string) => {
    if (eventName === 'done') {
      handlers.onDone?.()
      eventName = 'message'
      return
    }
    const lines = rawData.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed = JSON.parse(trimmed) as { d?: string }
        if (typeof parsed.d === 'string') {
          handlers.onMessage(parsed.d)
        }
      } catch {
        handlers.onMessage(trimmed)
      }
    }
    eventName = 'message'
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''
    let dataLines: string[] = []
    for (const rawLine of parts) {
      const line = rawLine.replace(/\r$/, '')
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart())
      } else if (line === '') {
        if (dataLines.length > 0 || eventName === 'done') {
          flushEvent(dataLines.join('\n'))
        }
        dataLines = []
      }
    }
  }
  if (buffer.trim()) {
    // 流结束时若残留 done
    if (buffer.includes('event: done') || eventName === 'done') {
      handlers.onDone?.()
    }
  }
}

export function buildChatSseUrl(appId: number, message: string): string {
  const base = 'http://localhost:8123/api'
  const params = new URLSearchParams({
    appId: String(appId),
    message,
  })
  return `${base}/app/chat/gen/code?${params.toString()}`
}
```

- [ ] **Step 2: 创建 `time.ts`**

```ts
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function formatRelativeTime(time?: string): string {
  if (!time) return '-'
  return dayjs(time).fromNow()
}

export function formatDateTime(time?: string): string {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}
```

- [ ] **Step 3: 类型检查**

Run: `npm run type-check`  
Expected: 无新增与这两个文件相关的错误（若 dayjs plugin 类型告警，确认 `dayjs` 可从依赖解析）

- [ ] **Step 4: Commit（仅当用户要求）**

```bash
git add Zayne-ai-code-mother-frontend/src/utils/sse.ts Zayne-ai-code-mother-frontend/src/utils/time.ts
git commit -m "feat(frontend): add SSE helper and relative time util"
```

---

### Task 2: Pinia stores — appList + appChat

**Files:**
- Create: `src/stores/appList.ts`
- Create: `src/stores/appChat.ts`

- [ ] **Step 1: 创建 `appList.ts`**

```ts
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { listGoodAppVoByPage, listMyAppVoByPage } from '@/api/appController'

export const useAppListStore = defineStore('appList', () => {
  const myApps = ref<API.AppVO[]>([])
  const myTotal = ref(0)
  const myLoading = ref(false)
  const myQuery = reactive<API.AppQueryRequest>({
    pageNum: 1,
    pageSize: 20,
    appName: undefined,
  })

  const goodApps = ref<API.AppVO[]>([])
  const goodTotal = ref(0)
  const goodLoading = ref(false)
  const goodQuery = reactive<API.AppQueryRequest>({
    pageNum: 1,
    pageSize: 20,
    appName: undefined,
  })

  async function fetchMyApps() {
    myLoading.value = true
    try {
      const res = await listMyAppVoByPage({ ...myQuery, pageSize: Math.min(myQuery.pageSize ?? 20, 20) })
      if (res.data.code === 0 && res.data.data) {
        myApps.value = res.data.data.records ?? []
        myTotal.value = res.data.data.totalRow ?? 0
      } else {
        message.error('获取我的作品失败，' + res.data.message)
      }
    } finally {
      myLoading.value = false
    }
  }

  async function fetchGoodApps() {
    goodLoading.value = true
    try {
      const res = await listGoodAppVoByPage({
        ...goodQuery,
        pageSize: Math.min(goodQuery.pageSize ?? 20, 20),
      })
      if (res.data.code === 0 && res.data.data) {
        goodApps.value = res.data.data.records ?? []
        goodTotal.value = res.data.data.totalRow ?? 0
      } else {
        message.error('获取精选案例失败，' + res.data.message)
      }
    } finally {
      goodLoading.value = false
    }
  }

  return {
    myApps,
    myTotal,
    myLoading,
    myQuery,
    goodApps,
    goodTotal,
    goodLoading,
    goodQuery,
    fetchMyApps,
    fetchGoodApps,
  }
})
```

- [ ] **Step 2: 创建 `appChat.ts`**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { deployApp, getAppVoById } from '@/api/appController'
import { buildChatSseUrl, streamSse } from '@/utils/sse'

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
    abortController?.abort()
    abortController = null
  }

  function prepareCreate(appId: number, initPrompt: string) {
    clearSession()
    currentApp.value = { id: appId, initPrompt }
    autoSendInitPrompt.value = true
  }

  /** 同 appId 保留 messages；不同 appId 先 clearSession */
  async function loadApp(appId: number) {
    if (currentApp.value?.id !== appId) {
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
            // 触发响应式：替换数组项
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
      message.success('部署成功')
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
```

对话页 `onMounted`：若 store 已有同 id 且 `autoSendInitPrompt`，先用 `getAppVoById` 补全 `currentApp` 再 `maybeAutoSend()`；否则调用 `loadApp(id)`。

- [ ] **Step 3: 类型检查**

Run: `npm run type-check`

- [ ] **Step 4: Commit（仅当用户要求）**

---

### Task 3: 输入框与卡片组件

**Files:**
- Create: `src/components/app/AppPromptBox.vue`
- Create: `src/components/app/AppCard.vue`
- Create: `src/components/app/FeaturedAppCard.vue`
- Create: `src/components/app/AppCardList.vue`

- [ ] **Step 1: `AppPromptBox.vue`**

Props: `modelValue: string`, `placeholder?: string`, `disabled?: boolean`, `loading?: boolean`  
Emits: `update:modelValue`, `submit`

模板：白色大圆角容器 + textarea + 右下角圆形发送按钮（ArrowUpOutlined）。无上传/优化按钮。

- [ ] **Step 2: `AppCard.vue`**

Props: `app: API.AppVO`  
点击 emit `click`。展示 cover（无则占位）、`appName`、`创建于 ${formatRelativeTime(createTime)}`。

- [ ] **Step 3: `FeaturedAppCard.vue`**

Props: `app: API.AppVO`  
封面 + 底部：头像、`appName`、作者 `user.userName`、标签（按 `codeGenType` 映射：如 `multi_file`→「网站」，缺省「用户应用」；可用简单 map）。

- [ ] **Step 4: `AppCardList.vue`**

Props:
- `title: string`
- `apps: API.AppVO[]`
- `loading: boolean`
- `total: number`
- `pageNum: number`
- `pageSize: number`
- `keyword?: string`
- `variant: 'mine' | 'featured'`
- `showSearch?: boolean`

Emits: `update:pageNum`, `update:keyword`, `search`, `item-click`

内部：标题行 + 可选搜索 Input.Search + a-row/a-col 网格 + a-pagination。

- [ ] **Step 5: 类型检查**

- [ ] **Step 6: Commit（仅当用户要求）**

---

### Task 4: 对话消息列表 + 预览

**Files:**
- Create: `src/components/app/ChatMessageList.vue`
- Create: `src/components/app/AppPreview.vue`

- [ ] **Step 1: `ChatMessageList.vue`**

Props: `messages: ChatMessage[]`, `streaming?: boolean`  
用户消息右对齐气泡；AI 左对齐，`white-space: pre-wrap` 展示 content。列表容器可滚动，新消息时滚到底。

- [ ] **Step 2: `AppPreview.vue`**

Props: `src: string`, `ready: boolean`, `reloadKey: number`  
`ready && src` 时渲染 `<iframe :key="reloadKey" :src="src" />`；否则占位文案「生成完成后将在此预览」。

- [ ] **Step 3: 类型检查**

---

### Task 5: 重写主页

**Files:**
- Modify: `src/pages/HomePage.vue`

- [ ] **Step 1: 实现主页**

结构：
1. 渐变背景 hero：标题「一句话呈所想」+ 副标题「与 AI 对话轻松创建应用和网站」（可用 `/logo.png` 作猫标）
2. `AppPromptBox` + 4 个建议标签（点击写入 prompt）
3. `AppCardList` 我的作品（`variant=mine`）
4. `AppCardList` 精选案例（`variant=featured`）

逻辑：
- `onMounted`：`fetchMyApps` + `fetchGoodApps`（未登录失败由拦截器处理，可 catch 忽略）
- 提交：`addApp({ initPrompt })` → `appChat.prepareCreate(id, initPrompt)` → `router.push(/app/chat/${id})` → `fetchMyApps`
- 卡片点击 → `router.push(/app/chat/${id})`

建议标签文案：
- 波普风电商页面
- 企业网站
- 电商运营后台
- 暗黑话题社区

样式贴近原型：渐变 `linear-gradient(180deg, #e8f8f0, #e8f4fc)`，居中，大圆角。

注意：`BasicLayout` 的 `.content-inner` 有 `max-width: 1200px`；主页可在根节点用负边距或 `:deep` 拉满，或接受 1200 内容宽。优先在 `HomePage` 内用全宽渐变块，不必改 Layout。

- [ ] **Step 2: 手动验证**

浏览器打开 `/`，确认标题、输入框、标签、两块列表布局。

- [ ] **Step 3: Commit（仅当用户要求）**

---

### Task 6: 对话页

**Files:**
- Create: `src/pages/app/AppChatPage.vue`
- Modify: `src/router/index.ts`（先加 chat 路由也可在本 Task）

- [ ] **Step 1: 注册路由**

```ts
{
  path: '/app/chat/:id',
  name: '应用对话',
  component: () => import('@/pages/app/AppChatPage.vue'),
},
```

- [ ] **Step 2: 实现 `AppChatPage.vue`**

- 读 `route.params.id` 为 number
- `onMounted`:
  - 若 store 已有同 id 且 `autoSendInitPrompt`：`getAppVoById` 合并到 `currentApp`，再 `maybeAutoSend()`
  - 否则 `loadApp(id)`（同 id 保留 messages）
- 应用顶栏：左 `currentApp.appName`（点击 `router.push(/app/edit/${id})`），右部署按钮 → `deploy()`，若有 `deployUrl` 用 `a-modal` 或 `window.open`
- 左：`ChatMessageList` + `AppPromptBox`（submit → `sendMessage`）
- 右：`AppPreview`（`:src="previewSrc()"` `:ready="previewReady"` `:reload-key="previewKey"`）
- 全局顶栏已由 Layout 提供（头像+用户名在右上角），本页不重复用户区

布局 CSS：`height: calc(100vh - 64px - layout padding)` 左右 flex；左约 40%，右 60%。

- [ ] **Step 3: 手动验证**

1. 主页创建 → 自动 SSE → 预览出现  
2. 从我的作品进入 → 不自动发、可预览（若已生成）  
3. 部署返回 URL

- [ ] **Step 4: Commit（仅当用户要求）**

---

### Task 7: 应用编辑页

**Files:**
- Create: `src/pages/app/AppEditPage.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1: 路由**

```ts
{
  path: '/app/edit/:id',
  name: '应用编辑',
  component: () => import('@/pages/app/AppEditPage.vue'),
},
```

- [ ] **Step 2: 实现编辑页**

- `getAppVoById` 加载
- 用 `useLoginUserStore`：若非 admin 且 `app.userId !== loginUser.id` → `message.error('无权限')` + `router.replace('/')`
- 普通用户：表单仅 `appName` → `updateApp`
- 管理员：`appName`、`cover`、`priority` → `updateAppByAdmin`
- Card + Form，风格参考 `UserProfilePage`
- 成功后 `router.back()`

- [ ] **Step 3: 手动验证**

用户改名；管理员改 priority。

---

### Task 8: 应用管理页 + 菜单

**Files:**
- Create: `src/pages/admin/AppManagePage.vue`
- Modify: `src/config/menu.ts`
- Modify: `src/router/index.ts`

- [ ] **Step 1: 菜单**

```ts
{
  key: 'appManage',
  label: '应用管理',
  path: '/admin/appManage',
  access: 'admin',
},
```

- [ ] **Step 2: 路由**

```ts
{
  path: '/admin/appManage',
  name: '应用管理',
  component: () => import('@/pages/admin/AppManagePage.vue'),
},
```

- [ ] **Step 3: 实现 `AppManagePage.vue`（对齐 UserManagePage）**

- 搜索：`appName`、`priority`、`codeGenType`、`userId`
- 表格列：id、名称、封面、codeGenType、priority、userId、创建时间、操作
- `listAppVoByPageByAdmin`
- 操作：
  - 编辑：`window.open(`/app/edit/${id}`, '_blank')`
  - 删除：`deleteAppByAdmin` + Popconfirm
  - 精选：`updateAppByAdmin({ id, priority: 99 })`

- [ ] **Step 4: 全量类型检查**

Run: `npm run type-check`  
Expected: PASS

- [ ] **Step 5: 端到端手动清单（对照规格 §10）**

1. 创建 → 自动对话 → 预览  
2. 继续对话  
3. 部署  
4. 列表搜索/分页/进入不自动发  
5. 用户编辑自己的名称  
6. 管理员删除/精选/编辑  
7. 非管理员看不到菜单且 `/admin/appManage` 被拒  
8. 顶栏右上角头像+用户名

- [ ] **Step 6: Commit（仅当用户要求）**

---

## Spec Coverage Checklist

| 规格项 | Task |
|--------|------|
| 主页标题/输入/建议标签/双列表 | 5, 3 |
| 创建跳转 + 仅新建自动 SSE | 2, 5, 6 |
| 对话左右栏 + 预览 URL + 部署 | 4, 6 |
| 保留 GlobalHeader 头像用户名 | 6（沿用 Layout） |
| 无上传/优化按钮 | 3 |
| 同 app 会话保留 / 换 app 重置 | 2 |
| 用户编辑名称 | 7 |
| 管理员管理/精选/新开编辑 | 8 |
| Pinia appList + appChat | 2 |
| SSE fetch credentials | 1, 2 |

## Placeholder Scan

无 TBD/TODO；验证以 type-check + 手动清单代替单测（与规格一致）。
