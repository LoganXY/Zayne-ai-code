package com.zayne.zayneaicodemother.controller;

import com.zayne.zayneaicodemother.contant.AppConstant;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.HandlerMapping;

import java.io.File;

@RestController
@RequestMapping("/static")
public class StaticResourceController {

    /**
     * 提供静态资源访问，支持目录重定向。
     * <p>
     * 对话预览：http://localhost:8123/api/static/{codeGenType}_{appId}/
     * 部署作品：http://localhost:8123/api/static/{deployKey}/
     * 优先从部署目录读取，其次从生成目录读取。
     */
    @GetMapping("/{key}/**")
    public ResponseEntity<Resource> serveStaticResource(
            @PathVariable String key,
            HttpServletRequest request) {
        try {
            String resourcePath = (String) request.getAttribute(HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
            resourcePath = resourcePath.substring(("/static/" + key).length());
            if (resourcePath.isEmpty()) {
                HttpHeaders headers = new HttpHeaders();
                headers.add("Location", request.getRequestURI() + "/");
                return new ResponseEntity<>(headers, HttpStatus.MOVED_PERMANENTLY);
            }
            if (resourcePath.equals("/")) {
                resourcePath = "/index.html";
            }

            File file = resolveFile(key, resourcePath);
            if (file == null || !file.exists() || !file.isFile()) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header("Content-Type", getContentTypeWithCharset(file.getAbsolutePath()))
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * 部署目录优先，找不到再回落到生成目录（预览）
     */
    private File resolveFile(String key, String resourcePath) {
        File deployFile = new File(AppConstant.CODE_DEPLOY_ROOT_DIR + "/" + key + resourcePath);
        if (deployFile.exists() && deployFile.isFile()) {
            return deployFile;
        }
        File outputFile = new File(AppConstant.CODE_OUTPUT_ROOT_DIR + "/" + key + resourcePath);
        if (outputFile.exists() && outputFile.isFile()) {
            return outputFile;
        }
        return null;
    }

    private String getContentTypeWithCharset(String filePath) {
        if (filePath.endsWith(".html")) return "text/html; charset=UTF-8";
        if (filePath.endsWith(".css")) return "text/css; charset=UTF-8";
        if (filePath.endsWith(".js")) return "application/javascript; charset=UTF-8";
        if (filePath.endsWith(".png")) return "image/png";
        if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }
}
