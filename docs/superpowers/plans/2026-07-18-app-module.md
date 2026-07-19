# App Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 User 模块风格实现完整 App 业务接口（用户 CRUD/列表 + 管理员管理 + 精选列表）。

**Architecture:** Controller 做鉴权与参数校验；Service 构建 QueryWrapper 并组装 AppVO（内嵌 UserVO）；精选用 `priority >= 99`；用户侧分页 `pageSize ≤ 20`。对齐现有 `BaseResponse` / `@AuthCheck` / `DeleteRequest` 模式。

**Tech Stack:** Spring Boot、MyBatis-Flex、Hutool、现有 UserService / ErrorCode。

**Spec:** `docs/superpowers/specs/2026-07-18-app-module-design.md`

**测试说明:** 规格约定本阶段不做单元测试；每 Task 以编译/手动接口检查为准。提交仅在用户明确要求时执行。

---

## File Structure

| 文件 | 职责 |
|------|------|
| `contant/AppConstant.java` | 精选优先级常量 |
| `model/dto/app/*.java` | 请求 DTO |
| `model/vo/AppVO.java` | 响应 VO（含 UserVO） |
| `service/AppService.java` | 服务接口扩展 |
| `service/impl/AppServiceImpl.java` | 查询条件 + VO 组装 |
| `controller/AppController.java` | 全部 HTTP 接口（替换脚手架） |

已有且不改：`App.java`、`AppMapper.java`、`AppMapper.xml`、`sql/create_table.sql`

---

### Task 1: AppConstant + DTOs + AppVO

**Files:**
- Create: `src/main/java/com/zayne/zayneaicodemother/contant/AppConstant.java`
- Create: `src/main/java/com/zayne/zayneaicodemother/model/dto/app/AppAddRequest.java`
- Create: `src/main/java/com/zayne/zayneaicodemother/model/dto/app/AppUpdateRequest.java`
- Create: `src/main/java/com/zayne/zayneaicodemother/model/dto/app/AppAdminUpdateRequest.java`
- Create: `src/main/java/com/zayne/zayneaicodemother/model/dto/app/AppQueryRequest.java`
- Create: `src/main/java/com/zayne/zayneaicodemother/model/vo/AppVO.java`

- [x] **Step 1: 创建 AppConstant**

```java
package com.zayne.zayneaicodemother.contant;

public interface AppConstant {

    /**
     * 精选应用的优先级阈值
     */
    Integer GOOD_APP_PRIORITY = 99;
}
```

- [x] **Step 2: 创建 AppAddRequest**

```java
package com.zayne.zayneaicodemother.model.dto.app;

import lombok.Data;

import java.io.Serializable;

@Data
public class AppAddRequest implements Serializable {

    /**
     * 应用初始化的 prompt
     */
    private String initPrompt;

    /**
     * 应用名称
     */
    private String appName;

    private static final long serialVersionUID = 1L;
}
```

- [x] **Step 3: 创建 AppUpdateRequest（用户仅改名称）**

```java
package com.zayne.zayneaicodemother.model.dto.app;

import lombok.Data;

import java.io.Serializable;

@Data
public class AppUpdateRequest implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * 应用名称
     */
    private String appName;

    private static final long serialVersionUID = 1L;
}
```

- [x] **Step 4: 创建 AppAdminUpdateRequest**

```java
package com.zayne.zayneaicodemother.model.dto.app;

import lombok.Data;

import java.io.Serializable;

@Data
public class AppAdminUpdateRequest implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * 应用名称
     */
    private String appName;

    /**
     * 应用封面
     */
    private String cover;

    /**
     * 优先级
     */
    private Integer priority;

    private static final long serialVersionUID = 1L;
}
```

- [x] **Step 5: 创建 AppQueryRequest**

```java
package com.zayne.zayneaicodemother.model.dto.app;

import com.zayne.zayneaicodemother.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

@EqualsAndHashCode(callSuper = true)
@Data
public class AppQueryRequest extends PageRequest implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * 应用名称
     */
    private String appName;

    /**
     * 应用封面
     */
    private String cover;

    /**
     * 应用初始化的 prompt
     */
    private String initPrompt;

    /**
     * 代码生成类型
     */
    private String codeGenType;

    /**
     * 部署标识
     */
    private String deployKey;

    /**
     * 优先级
     */
    private Integer priority;

    /**
     * 创建用户 id
     */
    private Long userId;

    private static final long serialVersionUID = 1L;
}
```

- [x] **Step 6: 创建 AppVO**

```java
package com.zayne.zayneaicodemother.model.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class AppVO implements Serializable {

    private Long id;
    private String appName;
    private String cover;
    private String initPrompt;
    private String codeGenType;
    private String deployKey;
    private LocalDateTime deployedTime;
    private Integer priority;
    private Long userId;
    private LocalDateTime createTime;

    /**
     * 创建者信息
     */
    private UserVO user;

    private static final long serialVersionUID = 1L;
}
```

---

### Task 2: AppService + AppServiceImpl

**Files:**
- Modify: `src/main/java/com/zayne/zayneaicodemother/service/AppService.java`
- Modify: `src/main/java/com/zayne/zayneaicodemother/service/impl/AppServiceImpl.java`

- [x] **Step 1: 扩展 AppService 接口**

```java
package com.zayne.zayneaicodemother.service;

import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.core.service.IService;
import com.zayne.zayneaicodemother.model.dto.app.AppQueryRequest;
import com.zayne.zayneaicodemother.model.entity.App;
import com.zayne.zayneaicodemother.model.vo.AppVO;

import java.util.List;

/**
 * 应用 服务层。
 *
 * @author <a href="https://github.com/LoganXY">程序员Zayne</a>
 */
public interface AppService extends IService<App> {

    /**
     * 获取查询条件
     *
     * @param appQueryRequest 查询请求
     * @return QueryWrapper
     */
    QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest);

    /**
     * 获取应用封装
     *
     * @param app 应用
     * @return AppVO
     */
    AppVO getAppVO(App app);

    /**
     * 获取应用封装列表
     *
     * @param appList 应用列表
     * @return AppVO 列表
     */
    List<AppVO> getAppVOList(List<App> appList);
}
```

- [x] **Step 2: 实现 AppServiceImpl**

完整实现要点：
1. `getQueryWrapper`：空参抛 `PARAMS_ERROR`；`eq(id/codeGenType/deployKey/priority/userId)`；`like(appName/cover/initPrompt)`；`orderBy(sortField, "ascend".equals(sortOrder))`
2. `getAppVO`：拷贝属性；若有 `userId` 则 `userService.getById` + `getUserVO`
3. `getAppVOList`：空列表返回空 ArrayList；流式拷贝；收集 userId → `userService.listByIds` → Map → 回填 `user`

注入：`@Resource private UserService userService;`

```java
package com.zayne.zayneaicodemother.service.impl;

import cn.hutool.core.bean.BeanUtil;
import cn.hutool.core.collection.CollUtil;
import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.spring.service.impl.ServiceImpl;
import com.zayne.zayneaicodemother.exception.BusinessException;
import com.zayne.zayneaicodemother.exception.ErrorCode;
import com.zayne.zayneaicodemother.mapper.AppMapper;
import com.zayne.zayneaicodemother.model.dto.app.AppQueryRequest;
import com.zayne.zayneaicodemother.model.entity.App;
import com.zayne.zayneaicodemother.model.entity.User;
import com.zayne.zayneaicodemother.model.vo.AppVO;
import com.zayne.zayneaicodemother.model.vo.UserVO;
import com.zayne.zayneaicodemother.service.AppService;
import com.zayne.zayneaicodemother.service.UserService;
import jakarta.annotation.Resource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 应用 服务层实现。
 *
 * @author <a href="https://github.com/LoganXY">程序员Zayne</a>
 */
@Service
public class AppServiceImpl extends ServiceImpl<AppMapper, App> implements AppService {

    @Resource
    private UserService userService;

    @Override
    public QueryWrapper getQueryWrapper(AppQueryRequest appQueryRequest) {
        if (appQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数为空");
        }
        Long id = appQueryRequest.getId();
        String appName = appQueryRequest.getAppName();
        String cover = appQueryRequest.getCover();
        String initPrompt = appQueryRequest.getInitPrompt();
        String codeGenType = appQueryRequest.getCodeGenType();
        String deployKey = appQueryRequest.getDeployKey();
        Integer priority = appQueryRequest.getPriority();
        Long userId = appQueryRequest.getUserId();
        String sortField = appQueryRequest.getSortField();
        String sortOrder = appQueryRequest.getSortOrder();
        return QueryWrapper.create()
                .eq("id", id)
                .like("appName", appName)
                .like("cover", cover)
                .like("initPrompt", initPrompt)
                .eq("codeGenType", codeGenType)
                .eq("deployKey", deployKey)
                .eq("priority", priority)
                .eq("userId", userId)
                .orderBy(sortField, "ascend".equals(sortOrder));
    }

    @Override
    public AppVO getAppVO(App app) {
        if (app == null) {
            return null;
        }
        AppVO appVO = new AppVO();
        BeanUtil.copyProperties(app, appVO);
        Long userId = app.getUserId();
        if (userId != null) {
            User user = userService.getById(userId);
            appVO.setUser(userService.getUserVO(user));
        }
        return appVO;
    }

    @Override
    public List<AppVO> getAppVOList(List<App> appList) {
        if (CollUtil.isEmpty(appList)) {
            return new ArrayList<>();
        }
        Set<Long> userIdSet = appList.stream()
                .map(App::getUserId)
                .collect(Collectors.toSet());
        Map<Long, UserVO> userVOMap = userService.listByIds(userIdSet).stream()
                .collect(Collectors.toMap(User::getId, userService::getUserVO));
        return appList.stream().map(app -> {
            AppVO appVO = getAppVO(app);
            UserVO userVO = userVOMap.get(app.getUserId());
            appVO.setUser(userVO);
            return appVO;
        }).collect(Collectors.toList());
    }
}
```

注意：`getAppVOList` 里若调用完整 `getAppVO` 会对每条再查一次用户。应改为：先 `BeanUtil.copyProperties` 再从 map 填 user，避免 N+1：

```java
return appList.stream().map(app -> {
    AppVO appVO = new AppVO();
    BeanUtil.copyProperties(app, appVO);
    appVO.setUser(userVOMap.get(app.getUserId()));
    return appVO;
}).collect(Collectors.toList());
```

---

### Task 3: 重写 AppController

**Files:**
- Modify: `src/main/java/com/zayne/zayneaicodemother/controller/AppController.java`（整文件替换）

- [x] **Step 1: 写入完整 AppController**

依赖注入：`AppService`、`UserService`（均 `@Resource`）。

接口实现要点：

1. **POST `/add`**  
   - `getLoginUser`；`initPrompt` 非空；`appName` 空则 `StrUtil.sub(initPrompt, 0, 12)`；设 `userId`；`save`；返回 id

2. **POST `/update`**  
   - 登录；校验 id、appName；查应用存在；`userId` 匹配；只更新 `id`+`appName`

3. **POST `/delete`**  
   - 登录；`DeleteRequest`；存在且本人；`removeById`

4. **GET `/get/vo`**  
   - 登录；`id > 0`；`getById`；`getAppVO`

5. **POST `/my/list/page/vo`**  
   - 登录；`pageSize > 20` → `PARAMS_ERROR`；`queryRequest.setUserId(loginUser.getId())`；page + getAppVOList

6. **POST `/good/list/page/vo`**  
   - 登录；`pageSize > 20` → 拒；`queryRequest.setPriority(AppConstant.GOOD_APP_PRIORITY)` 不够——精选是 `>= 99`，不能只用 eq。  
   **实现：** 用 `getQueryWrapper` 后再追加 `.ge("priority", AppConstant.GOOD_APP_PRIORITY)`，且不要用 request 里的 priority eq 覆盖。更稳妥：精选接口单独构建 wrapper：

```java
QueryWrapper queryWrapper = appService.getQueryWrapper(appQueryRequest);
queryWrapper.ge("priority", AppConstant.GOOD_APP_PRIORITY);
```

若 `AppQueryRequest.priority` 也被传且走 `eq`，可能冲突。精选接口应忽略请求中的 priority，或在调用前 `appQueryRequest.setPriority(null)`，再 `ge`。

7. **POST `/admin/delete`** — `@AuthCheck(ADMIN)`；DeleteRequest；removeById  
8. **POST `/admin/update`** — `@AuthCheck`；拷贝 AdminUpdateRequest → App；updateById  
9. **GET `/admin/get`** — `@AuthCheck`；返回 App 实体  
10. **GET `/admin/get/vo`** — `@AuthCheck`；返回 AppVO  
11. **POST `/admin/list/page/vo`** — `@AuthCheck`；全字段 page，不限 pageSize

删除脚手架的 `save/remove/update/list/getInfo/page` 方法。

包与 import 对齐 UserController（`BaseResponse`、`ResultUtils`、`ThrowUtils`、`AuthCheck`、`UserConstant` 等）。

---

### Task 4: 编译与手动验收

- [x] **Step 1: 编译**

```bash
mvn -q -DskipTests compile
```

Expected: BUILD SUCCESS

- [ ] **Step 2: 按规格 §12 手动验收清单自测**（需服务已启动）

重点：创建默认名、改删权限、pageSize=21 拒绝、priority=99 进精选、VO 含 user。

---

## Spec Coverage Checklist

| 规格项 | Task |
|--------|------|
| 用户创建（initPrompt） | Task 3 |
| 用户改名 | Task 3 |
| 用户删除自己的 | Task 3 |
| 用户查看详情 VO | Task 3 |
| 我的列表 pageSize≤20 | Task 3 |
| 精选列表 priority≥99 | Task 3 |
| 管理员删/改/查/分页 | Task 3 |
| AppVO 嵌 UserVO | Task 1–2 |
| GOOD_APP_PRIORITY=99 | Task 1 |
| getQueryWrapper 除时间外字段 | Task 2 |

## Self-Review Notes

- 精选必须用 `ge` + 清空 request.priority，避免与 `eq(priority)` 冲突（已在 Task 3 写明）
- `getAppVOList` 禁止循环调 `getAppVO` 查库（已在 Task 2 纠正）
- 不提交 git，除非用户要求
