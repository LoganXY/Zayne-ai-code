package com.zayne.zayneaicodemother.model.vo;

import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class AppVO implements Serializable {

    private Long id;
    private String appName;
    /**
     * 应用封面
     */
    private String cover;
    /**
     * 初始化prompt
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
    private LocalDateTime deployedTime;
    /**
     * 优先级
     */
    private Integer priority;
    private Long userId;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;

    /**
     * 创建用户信息
     */
    private UserVO user;

    private static final long serialVersionUID = 1L;
}
