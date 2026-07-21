package com.zayne.zayneaicodemother.service;

import com.mybatisflex.core.query.QueryWrapper;
import com.mybatisflex.core.service.IService;
import com.zayne.zayneaicodemother.model.dto.app.AppQueryRequest;
import com.zayne.zayneaicodemother.model.entity.App;
import com.zayne.zayneaicodemother.model.entity.User;
import com.zayne.zayneaicodemother.model.vo.AppVO;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * 应用 服务层。
 *
 * @author <a href="https://github.com/LoganXY">程序员Zayne</a>
 */
public interface AppService extends IService<App> {


    /**
     * 通过对话生成应用代码
     * @param appId 应用ID
     * @param message 提示词
     * @param loginUser 登录用户
     * @return
     */
    Flux<String> chatToGenCode (Long appId, String message, User loginUser);

    /**
     * 应用部署
     * @param appId 应用ID
     * @param loginUser 登录用户
     * @return 可访问的部署地址
     */
    String deployApp (Long appId, User loginUser);

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

    /**
     * AI 生成应用名称
     *
     * @param appId     应用 ID
     * @param loginUser 当前登录用户
     * @return 生成的应用名称
     */
    String generateAppName(Long appId, User loginUser);
}
