package com.zayne.zayneaicodemother;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("com.zayne.zayneaicodemother.mapper")
public class ZayneAiCodeMotherApplication {

    public static void main(String[] args) {
        SpringApplication.run(ZayneAiCodeMotherApplication.class, args);
    }

}
