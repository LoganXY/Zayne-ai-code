# App 模块设计规格

日期：2026-07-18  
状态：已确认（待实现）

## 1. 目标

在现有 Spring Boot + MyBatis-Flex 项目中，参照 User 模块代码风格，实现完整的应用（App）业务接口，覆盖普通用户与管理员的创建、查询、更新、删除能力。

## 2. 已确认约定

| 项 | 约定 |
|----|------|
| 精选判定 | `priority >= 99` |
| 创建应用 | 必填 `initPrompt`；`appName` 可选，未传时取 `initPrompt` 前 12 个字符 |
| 用户查看详情 | 登录用户可按 id 查看任意应用 |
| 返回结构 | `AppVO` 内嵌创建者 `UserVO` |
| 用户分页上限 | 「我的列表」「精选列表」`pageSize` 最大 20 |
| 管理员分页 | 页大小不限；可按除时间字段外的任意业务字段查询 |

## 3. 方案选择

采用「对齐 User 模块」方案：

- Controller 负责参数校验、登录态、权限注解、分页组装
- Service 负责查询条件构建、实体 ↔ VO 转换
- 使用现有 `BaseResponse` / `ResultUtils` / `DeleteRequest` / `PageRequest` / `@AuthCheck`

不采用厚 Service 方案，以保持与 User 模块一致。

## 4. 数据模型

沿用已有表 `app` 与实体 `App`（字段：`id, appName, cover, initPrompt, codeGenType, deployKey, deployedTime, priority, userId, editTime, createTime, updateTime, isDelete`）。

本阶段不新增表结构；`codeGenType` / `deployKey` / `deployedTime` 不在本次接口中写入，预留给后续代码生成与部署能力。

## 5. 新增 / 改造文件

```
src/main/java/com/zayne/zayneaicodemother/
  contant/AppConstant.java
  model/dto/app/
    AppAddRequest.java
    AppUpdateRequest.java
    AppAdminUpdateRequest.java
    AppQueryRequest.java
  model/vo/AppVO.java
  service/AppService.java          # 扩展方法
  service/impl/AppServiceImpl.java # 实现
  controller/AppController.java    # 重写，移除脚手架 CRUD
```

实体 `App`、`AppMapper`、`AppMapper.xml` 已存在，无需改动表映射（除非生成器字段与表不一致，以实体为准）。

## 6. DTO / VO

### AppAddRequest
- `initPrompt`（必填）
- `appName`（可选）

### AppUpdateRequest（用户）
- `id`（必填）
- `appName`（必填；本次仅支持改名称）

### AppAdminUpdateRequest（管理员）
- `id`（必填）
- `appName`（可选）
- `cover`（可选）
- `priority`（可选）

### AppQueryRequest extends PageRequest
可查询字段（不含时间）：
- `id`
- `appName`（模糊）
- `cover`（模糊）
- `initPrompt`（模糊）
- `codeGenType`（精确）
- `deployKey`（精确）
- `priority`（精确）
- `userId`（精确）

继承 `pageNum` / `pageSize` / `sortField` / `sortOrder`。

### AppVO
- 应用业务字段：`id, appName, cover, initPrompt, codeGenType, deployKey, deployedTime, priority, userId, createTime`
- `UserVO user`：创建者脱敏信息

管理员详情接口 `/app/admin/get` 返回实体 `App`（对齐 User 的 `/user/get`）；其余对外列表/详情返回 `AppVO`。

## 7. 常量

`AppConstant.GOOD_APP_PRIORITY = 99`

## 8. Service API

```java
QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest);
AppVO getAppVO(App app);
List<AppVO> getAppVOList(List<App> appList);
```

### getQueryWrapper
- 空请求抛 `PARAMS_ERROR`
- 条件：`eq` 用于 id / codeGenType / deployKey / priority / userId；`like` 用于 appName / cover / initPrompt
- 排序：`orderBy(sortField, "ascend".equals(sortOrder))`（与 User 一致）

### getAppVO / getAppVOList
- 单条：按 `userId` 查用户并填充 `UserVO`
- 列表：收集 `userId` 批量查询用户，构建 `Map<Long, UserVO>`，避免 N+1

## 9. Controller 接口

前缀：`/app`

| 角色 | 方法 | 路径 | 鉴权 | 行为 |
|------|------|------|------|------|
| 用户 | POST | `/add` | 登录 | 校验 `initPrompt`；设 `userId`；缺省 `appName`；`priority` 默认由库/实体为 0 |
| 用户 | POST | `/update` | 登录 | 仅更新自己应用的 `appName` |
| 用户 | POST | `/delete` | 登录 | `DeleteRequest`；仅删除自己的应用 |
| 用户 | GET | `/get/vo` | 登录 | `id`；任意应用 → `AppVO` |
| 用户 | POST | `/my/list/page/vo` | 登录 | 强制 `userId=当前用户`；可按 `appName`；`pageSize≤20` |
| 用户 | POST | `/good/list/page/vo` | 登录 | 强制 `priority≥99`；可按 `appName`；`pageSize≤20` |
| 管理员 | POST | `/admin/delete` | admin | 删除任意应用 |
| 管理员 | POST | `/admin/update` | admin | 更新 `appName` / `cover` / `priority` |
| 管理员 | GET | `/admin/get` | admin | 返回 `App` 实体 |
| 管理员 | GET | `/admin/get/vo` | admin | 返回 `AppVO` |
| 管理员 | POST | `/admin/list/page/vo` | admin | `getQueryWrapper` 全字段查询；页大小不限 |

登录校验：调用 `userService.getLoginUser(request)`（未登录抛 `NOT_LOGIN_ERROR`）。  
管理员：`@AuthCheck(mustRole = UserConstant.ADMIN_ROLE)`。

### 用户更新 / 删除校验
1. 应用存在，否则 `NOT_FOUND_ERROR`
2. `app.userId` 等于当前用户 id，否则 `NO_AUTH_ERROR`

### 创建默认名称
```
appName = StrUtil.isBlank(appName)
    ? StrUtil.sub(initPrompt, 0, 12)
    : appName
```

## 10. 错误处理

复用现有 `ErrorCode` / `ThrowUtils` / `BusinessException`：

- 参数为空或非法 → `PARAMS_ERROR`
- 未登录 → `NOT_LOGIN_ERROR`
- 无权限 → `NO_AUTH_ERROR`
- 记录不存在 → `NOT_FOUND_ERROR`
- 写库失败 → `OPERATION_ERROR`

## 11. 非目标（本阶段不做）

- AI 代码生成、部署、封面上传
- 未登录公开访问精选列表
- 修改 `initPrompt` / `codeGenType` / `deployKey`
- 单元测试（除非实现时项目已有对应测试惯例）

## 12. 测试建议（实现后手动）

1. 普通用户创建应用（仅 initPrompt / 带 appName）
2. 用户改自己的名称成功；改他人应用失败
3. 用户删自己的成功；删他人失败
4. 我的列表：仅本人数据，名称模糊，pageSize=21 被拒
5. 管理员将 priority 设为 99 后出现在精选列表
6. 管理员全量分页：按 userId / priority / appName 等过滤
7. 详情 VO 中含创建者 UserVO
