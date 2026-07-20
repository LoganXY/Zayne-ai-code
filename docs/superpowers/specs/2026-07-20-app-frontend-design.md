# 应用前端模块设计规格

日期：2026-07-20  
状态：已确认（待实现）  
范围：`Zayne-ai-code-mother-frontend`

## 1. 目标

在现有 Vue3 + Ant Design Vue + Pinia 前端中，按原型与业务需求实现应用相关完整页面：主页创建与列表、生成对话与预览部署、应用信息编辑、管理员应用管理。对接已生成的 `src/api/appController.ts` 等接口。

## 2. 已确认约定

| 项 | 约定 |
|----|------|
| 视觉方向 | 用户侧（主页、对话页）贴近原型图：渐变背景、大圆角输入、卡片网格 |
| 管理侧风格 | 应用管理页、编辑页对齐现有「用户管理 / 个人中心」Ant Design 风格 |
| 原型附加按钮 | 不展示「上传 / 优化 / 编辑」等无接口能力的按钮，仅保留提示词输入 + 发送 |
| 自动发送 initPrompt | 仅从主页创建成功并跳转对话页时自动发送；从列表进入已有应用不自动发送 |
| 对话页顶栏 | 保留全局 `GlobalHeader`；其下另有应用顶栏（左应用名、右部署） |
| 全局顶栏用户区 | 右上角显示头像 + 用户名（沿用现有下拉：个人中心 / 退出） |
| 状态管理 | 组件拆分 + Pinia（方案 3）：列表与对话会话进 store |
| 精选判定 | 与后端一致：`priority >= 99`；管理页「精选」将 priority 设为 99 |
| 预览 URL | `http://localhost:8123/api/static/{codeGenType}_{appId}/` |
| 用户分页 | 「我的作品」「精选案例」每页最多 20 |
| 管理员分页 | 页大小不限 |

## 3. 方案选择

采用「组件拆分 + Pinia」：

- 页面负责路由编排与布局
- 可复用组件负责输入框、卡片、消息列表、预览 iframe
- `appList` / `appChat` store 管理列表查询缓存与对话 SSE 会话状态
- 管理页表格逻辑对齐 `UserManagePage`，请求可留在页面内（不必强行进 store）

不采用纯页面堆逻辑（难维护）；不以「仅组件、无 store」为最终方案（已选方案 3，便于同 app 会话保留与列表缓存）。

## 4. 路由与菜单

| 路径 | 名称 | 组件 | 权限 |
|------|------|------|------|
| `/` | 主页 | `HomePage.vue`（重写） | 公开；写操作/我的列表依赖登录 |
| `/app/chat/:id` | 应用生成对话 | `pages/app/AppChatPage.vue` | 登录（未登录走现有 401 跳转） |
| `/app/edit/:id` | 应用信息修改 | `pages/app/AppEditPage.vue` | 登录；普通用户仅本人 |
| `/admin/appManage` | 应用管理 | `pages/admin/AppManagePage.vue` | `admin`（`access.ts` 已校验 `/admin`） |

`src/config/menu.ts` 新增：

```ts
{
  key: 'appManage',
  label: '应用管理',
  path: '/admin/appManage',
  access: 'admin',
}
```

## 5. 文件结构

```
Zayne-ai-code-mother-frontend/src/
  pages/
    HomePage.vue                 # 重写
    app/AppChatPage.vue
    app/AppEditPage.vue
    admin/AppManagePage.vue
  components/app/
    AppPromptBox.vue             # 提示词输入 + 发送
    AppCard.vue                  # 我的作品卡片
    FeaturedAppCard.vue          # 精选卡片（作者 + 标签）
    AppCardList.vue              # 分区标题 + 搜索 + 网格 + 分页
    ChatMessageList.vue
    AppPreview.vue               # iframe 预览
  stores/
    appList.ts                   # 我的列表 / 精选列表
    appChat.ts                   # 当前应用、消息、SSE、预览就绪
  utils/
    sse.ts                       # 带 credentials 的 SSE 读取封装
  router/index.ts                # 注册新路由
  config/menu.ts                 # 应用管理菜单
```

已有且沿用：`GlobalHeader`（头像+用户名）、`BasicLayout`、`access.ts`、`request.ts`、`api/appController.ts`、`api/typings.d.ts`。

## 6. 页面设计

### 6.1 主页

自上而下：

1. **标题区**：文案贴近原型（如「一句话呈所想」+ 副标题）；可使用站点 logo / 猫标资源
2. **提示词输入框**：仅文本 + 发送圆钮
3. **建议标签**：固定 4 条示例文案；点击填入输入框，不直接创建
4. **我的作品**：`listMyAppVoByPage`；按名称搜索；每页 ≤20；卡片展示封面、名称、相对创建时间；点击进 `/app/chat/:id`
5. **精选案例**：`listGoodAppVoByPage`；按名称搜索；每页 ≤20；卡片含封面、标题、作者头像/名、类型标签；点击进 `/app/chat/:id`

**创建流程**

1. 校验非空 → `addApp({ initPrompt })`
2. `appChat` 写入当前应用上下文，并设 `autoSendInitPrompt = true`
3. `router.push(/app/chat/${appId})`

未登录时创建或拉「我的作品」触发后端 401，走现有登录跳转即可；可用空态文案引导登录。

### 6.2 应用生成对话页

**布局**

- 外层仍用 `BasicLayout`（含全局顶栏：左品牌/菜单，右头像+用户名）
- 应用顶栏：左显示 `appName`（可跳转 `/app/edit/:id`），右「部署」按钮
- 主区左右分栏：左对话，右预览

**左侧对话**

- 用户消息靠右，AI 消息靠左；AI 内容为 SSE 流式拼接的文本（可简单按行展示文件名等）
- 底部 `AppPromptBox`：无上传/优化；发送调用同一 SSE 接口
- 无后端历史消息接口：不拉取历史；依赖 `appChat` 在同 `appId` 下保留本会话消息；切换 `appId` 时重置

**自动发送规则**

- 进入时若 `autoSendInitPrompt === true`：展示用户消息（`initPrompt`）→ 调用 SSE → 成功后清除该标记
- 从列表进入：`getAppVoById` 加载应用信息，不自动发送；若已有 `codeGenType`，可直接尝试展示预览

**SSE**

- URL：`GET /api/app/chat/gen/code?appId=&message=`
- 响应：`text/event-stream`；业务数据为 `data: {"d":"<chunk>"}`；结束为 `event: done`
- 实现：`utils/sse.ts` 使用 `fetch` + `credentials: 'include'` 解析流（避免原生 `EventSource` 跨域/Cookie 限制）
- `done` 后：`previewReady = true`，右侧 `AppPreview` 加载静态地址
- 预览地址：`http://localhost:8123/api/static/${codeGenType}_${appId}/`（`codeGenType` 来自 AppVO）

**部署**

- `deployApp({ appId })` → 成功 `message.success`，展示返回 URL（可点击新窗口打开）

### 6.3 应用管理页（管理员）

对齐 `UserManagePage`：

- 搜索表单：`appName`、`priority`、`codeGenType`、`userId` 等（`AppQueryRequest` 中除时间外字段按需暴露）
- 表格：`listAppVoByPageByAdmin`
- 操作：
  - **编辑**：`router.push` 或 `window.open` 到 `/app/edit/:id`（需求：新开页面 → 优先 `window.open`）
  - **删除**：`deleteAppByAdmin` + Popconfirm
  - **精选**：`updateAppByAdmin({ id, priority: 99 })`

### 6.4 应用信息修改页

- 共用路由 `/app/edit/:id`
- 加载详情：`getAppVoById`；校验普通用户 `userId === 当前用户`
- 普通用户表单：仅 `appName` → `updateApp`
- 管理员表单：`appName`、`cover`、`priority` → `updateAppByAdmin`
- 保存成功提示并返回（`router.back()` 或回主页）

## 7. Store 职责

### `appList`

- `myApps` / `goodApps` 的 `records`、`total`、`loading`、查询参数（含 `pageNum`/`pageSize`/`appName`）
- `fetchMyApps` / `fetchGoodApps`
- 创建成功后可刷新我的列表

### `appChat`

- `currentApp: AppVO | null`
- `messages: { role: 'user' | 'ai'; content: string }[]`
- `streaming: boolean`
- `previewReady: boolean`
- `autoSendInitPrompt: boolean`
- `loadApp(id)` / `resetForApp(id)` / `sendMessage(message)` / `deploy()`
- 同 `appId` 再进入保留 messages；不同 `appId` 重置

## 8. 错误处理

- 接口 `code !== 0`：`message.error` + 后端 `message`
- SSE 中断/失败：结束 streaming，提示错误，不错误地置 `previewReady`
- 编辑无权限：提示并跳转回主页或上一页
- 沿用 axios 拦截器对 `40100` 的登录跳转

## 9. 非目标（本阶段不做）

- 上传附件、提示词优化、对话内「编辑」能力
- 消息历史持久化 UI（无对应后端接口）
- 封面上传组件（管理员可填 cover URL 文本即可）
- 未登录公开浏览精选（以后端鉴权为准）
- 单元测试（除非项目已有对应惯例）

## 10. 手动验证清单

1. 登录后主页输入提示词创建应用，跳转对话页并自动 SSE，结束后右侧预览出现
2. 对话页继续发送消息可再次流式生成并刷新预览
3. 部署成功返回可访问 URL
4. 我的作品 / 精选分页与按名称搜索；点击进入不自动重发 initPrompt，但可看到预览（若已生成）
5. 普通用户编辑自己的应用名称成功；编辑他人失败
6. 管理员应用管理：删除、精选（priority=99 后出现在精选列表）、编辑打开修改页改封面/优先级
7. 非管理员菜单不可见应用管理；直接访问 `/admin/appManage` 被拒
8. 全局顶栏右上角始终为头像 + 用户名
