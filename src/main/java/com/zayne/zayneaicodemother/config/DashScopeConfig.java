package com.zayne.zayneaicodemother.config;

import com.alibaba.dashscope.utils.Constants;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * DashScope SDK 全局配置
 * <p>
 * 业务空间（workspace）API Key（sk-ws-* 格式）需要使用专属域名。
 * 在百炼控制台 → 业务空间 → 复制空间ID，替换 URL 中的 {workspaceId}。
 * 如果不使用 workspace key，可以保持默认的 dashscope.aliyuncs.com。
 */
@Slf4j
@Configuration
public class DashScopeConfig {

    @Value("${dashscope.base-url:https://dashscope.aliyuncs.com/api/v1}")
    private String baseUrl;

    @PostConstruct
    public void init() {
        Constants.baseHttpApiUrl = baseUrl;
        log.info("DashScope base URL 已设置为: {}", baseUrl);
    }
}
