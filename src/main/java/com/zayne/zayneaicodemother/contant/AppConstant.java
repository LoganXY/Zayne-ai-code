package com.zayne.zayneaicodemother.contant;

/**
 * 应用常量
 */
public interface AppConstant {

    /**
     * 精选应用的优先级阈值
     */
    Integer GOOD_APP_PRIORITY = 99;

    /**
     * 默认应用的优先级
     */
    Integer DEFAULT_APP_PRIORITY = 0;

    /**
     * 应用生成目录
     */
    String CODE_OUTPUT_ROOT_DIR = System.getProperty("user.dir") + "/tmp/code_output";

    /**
     * 应用部署目录
     */
    String CODE_DEPLOY_ROOT_DIR = System.getProperty("user.dir") + "/tmp/code_deploy";

    /**
     * 应用部署域名（本地开发通过后端静态接口访问已部署目录）
     */
    String CODE_DEPLOY_HOST = "http://localhost:8123/api/static";

}
