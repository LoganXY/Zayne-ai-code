# AI 生成应用名称 — 设计文档

**日期：** 2026-07-21
**状态：** 待实现

---

## 1. 需求概述

用户创建应用时，仅需输入描述词（initPrompt），系统自动使用 AI 生成一个简洁实用的中文应用名称（2-8 字），替代当前"截取描述词前 12 字符"的临时命名方式。

## 2. 用户故事

- 用户在首页输入应用描述词，点击发送
- 应用立即创建并跳转到聊天页（应用名暂为临时名称）
- 1-2 秒后，AI 自动生成一个合适的中文名称
- 页面顶部标题栏自动更新为新名称，同时弹出 Toast："应用名称已自动生成：XXX"

## 3. 技术方案

**模式：** 创建后异步生成（独立 API + 前端异步调用）

**整体流程：**

```
用户输入描述词 → addApp(临时名称) → 立即返回 appId → 跳转聊天页
                                          ↘
                                     异步调用 generateAppName
                                          ↓
                                     AI 生成名称 → 更新 DB
                                          ↓
                                前端收到名称 → 更新标题栏 + Toast
```

## 4. 后端设计

### 4.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/main/resources/prompt/app-name-gen-system-prompt.txt` | AI 命名的系统提示词 |

### 4.2 修改文件

| 文件 | 改动 |
|------|------|
| `AiCodeGeneratorService.java` | 新增 `generateAppName(String userMessage)` 方法 |
| `AppService.java` | 新增 `generateAppName(Long appId, User loginUser)` 接口方法 |
| `AppServiceImpl.java` | 新增 `generateAppName()` 实现 |
| `AppController.java` | 新增 `POST /app/generate-name/{appId}` 端点 |

### 4.3 AI 系统提示词

```
你是一个应用命名专家。根据用户对应用的描述，生成一个简洁实用的中文应用名称。

要求：
- 名称长度 2-8 个中文字符
- 简洁明了，直接概括应用核心功能
- 只返回名称本身，不要任何解释、引号或标点符号
```

### 4.4 API 设计

**端点：** `POST /app/generate-name/{appId}`

**请求：** 路径参数 `appId`

**响应：** `BaseResponse<String>` — 生成的名称

**校验：**
- appId 必须有效
- 用户必须登录
- 应用必须属于当前用户

**内部逻辑：**
1. 查询应用，校验归属
2. 调用 `aiCodeGeneratorService.generateAppName(app.getInitPrompt())`
3. 更新 `app.appName` 到数据库
4. 返回新名称

## 5. 前端设计

### 5.1 修改文件

| 文件 | 改动 |
|------|------|
| `src/api/appController.ts` | 新增 `generateAppName()` API 函数 |
| `src/api/typings.d.ts` | 新增请求/响应类型 |
| `src/stores/appChat.ts` | 新增 `generateAndUpdateName()` 方法 |
| `src/pages/HomePage.vue` | 创建应用后触发异步名称生成 |
| `src/pages/app/AppChatPage.vue` | 加载时兜底检查，触发命名 |

### 5.2 Store 方法

```ts
// appChat store 新增
async function generateAndUpdateName(appId: number | string) {
  try {
    const res = await generateAppName(appId)
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
```

### 5.3 触发时机

**主路径（HomePage.vue）：**
创建应用成功后，`generateAppName(id)` 不 await 直接调用（fire-and-forget），然后跳转聊天页。名称生成完成时自动更新 store 并弹出 Toast。

**兜底路径（AppChatPage.vue）：**
`loadApp` 完成后，如果应用名恰好等于 `initPrompt.substring(0, 12)`（即后端默认的临时名），额外触发一次 `generateAndUpdateName`。

## 6. 边界情况

| 场景 | 处理 |
|------|------|
| AI 调用超时/失败 | 静默降级，保留临时名称，不影响应用正常使用 |
| 用户手动修改了名称 | 编辑页修改后不再自动生成 |
| 同时创建多个应用 | 各自独立调用，用 appId 隔离 |
| 网络断开 | catch 异常，不弹错误提示 |

## 7. 测试要点

- [ ] 输入描述词创建应用，验证 1-3 秒内自动生成中文名称
- [ ] 验证生成的名称长度在 2-8 个中文字符
- [ ] 验证名称符合应用功能描述
- [ ] AI 调用失败时，应用仍可正常使用（保留临时名称）
- [ ] 用户手动修改名称后，不再被覆盖