package com.zayne.zayneaicodemother.config;

import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import org.springframework.boot.jackson.JsonComponent;

/**
 * Spring MVC Json 配置 —— 将 Long 序列化为 String，防止 JavaScript 大整数精度丢失
 */
@JsonComponent
public class JsonConfig extends SimpleModule {

    public JsonConfig() {
        addSerializer(Long.class, ToStringSerializer.instance);
        addSerializer(Long.TYPE, ToStringSerializer.instance);
    }
}
