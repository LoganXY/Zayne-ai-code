package com.zayne.zayneaicodemother.controller;

import com.zayne.zayneaicodemother.common.BaseResponse;
import com.zayne.zayneaicodemother.common.ResultUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {

        @GetMapping("/")
        public BaseResponse<String> healthCheck() {
            return ResultUtils.success("ok");
        }
}
