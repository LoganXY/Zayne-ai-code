package com.zayne.zayneaicodemother;

import dev.langchain4j.community.store.embedding.redis.spring.RedisEmbeddingStoreAutoConfiguration;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(exclude = RedisEmbeddingStoreAutoConfiguration.class)
@MapperScan("com.zayne.zayneaicodemother.mapper")
public class ZayneAiCodeMotherApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZayneAiCodeMotherApplication.class, args);
    }

}
