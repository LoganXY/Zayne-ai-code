package com.zayne.zayneaicodemother.langgraph4j.tools;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.RandomUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.system.SystemUtil;
import com.zayne.zayneaicodemother.exception.BusinessException;
import com.zayne.zayneaicodemother.exception.ErrorCode;
import com.zayne.zayneaicodemother.langgraph4j.model.ImageResource;
import com.zayne.zayneaicodemother.langgraph4j.model.enums.ImageCategoryEnum;
import com.zayne.zayneaicodemother.manager.CosManager;
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Mermaid 架构图生成工具
 */
@Slf4j
@Component
public class MermaidDiagramTool {

    @Resource
    private CosManager cosManager;

    /**
     * 查找 Puppeteer 缓存的 Chrome 浏览器可执行文件路径。
     * Mermaid CLI 底层使用 Puppeteer 渲染图表，部分 Windows 系统的 chrome-headless-shell
     * 无法正常启动（缺少 VC++ 运行库），需要使用完整的 chrome.exe 替代。
     */
    private static String findChromeExecutable() {
        String userHome = System.getProperty("user.home");
        // Puppeteer 默认缓存目录
        Path puppeteerCacheDir = Paths.get(userHome, ".cache", "puppeteer", "chrome");
        if (!Files.isDirectory(puppeteerCacheDir)) {
            return null;
        }
        try {
            // 在缓存中找最新版本的 chrome.exe
            return Files.walk(puppeteerCacheDir, 3)
                    .filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().equalsIgnoreCase("chrome.exe"))
                    .max(Comparator.naturalOrder())
                    .map(Path::toAbsolutePath)
                    .map(Path::toString)
                    .orElse(null);
        } catch (IOException e) {
            log.warn("查找 Chrome 可执行文件失败: {}", e.getMessage());
            return null;
        }
    }

    @Tool("将 Mermaid 代码转换为架构图图片，用于展示系统结构和技术关系")
    public List<ImageResource> generateMermaidDiagram(@P("Mermaid 图表代码") String mermaidCode,
                                                      @P("架构图描述") String description) {
        if (StrUtil.isBlank(mermaidCode)) {
            return new ArrayList<>();
        }
        try {
            // 转换为SVG图片
            File diagramFile = convertMermaidToSvg(mermaidCode);
            // 上传到COS
            String keyName = String.format("/mermaid/%s/%s",
                    RandomUtil.randomString(5), diagramFile.getName());
            String cosUrl = cosManager.uploadFile(keyName, diagramFile);
            // 清理临时文件
            FileUtil.del(diagramFile);
            if (StrUtil.isNotBlank(cosUrl)) {
                return Collections.singletonList(ImageResource.builder()
                        .category(ImageCategoryEnum.ARCHITECTURE)
                        .description(description)
                        .url(cosUrl)
                        .build());
            }
        } catch (Exception e) {
            log.error("生成架构图失败: {}", e.getMessage(), e);
        }
        return new ArrayList<>();
    }

    /**
     * 将Mermaid代码转换为SVG图片
     */
    private File convertMermaidToSvg(String mermaidCode) {
        // 创建临时输入文件
        File tempInputFile = FileUtil.createTempFile("mermaid_input_", ".mmd", true);
        FileUtil.writeUtf8String(mermaidCode, tempInputFile);
        // 创建临时输出文件
        File tempOutputFile = FileUtil.createTempFile("mermaid_output_", ".svg", true);
        try {
            // 根据操作系统选择命令
            String command = SystemUtil.getOsInfo().isWindows() ? "mmdc.cmd" : "mmdc";
            // 查找 Chrome 可执行文件，解决 chrome-headless-shell 启动失败的问题
            String chromePath = findChromeExecutable();

            ProcessBuilder processBuilder = new ProcessBuilder(
                    command,
                    "-i", tempInputFile.getAbsolutePath(),
                    "-o", tempOutputFile.getAbsolutePath(),
                    "-b", "transparent"
            );
            // 如果找到 Chrome，设置环境变量让 Puppeteer 使用完整 Chrome 而非 headless-shell
            if (chromePath != null) {
                log.info("使用 Chrome: {}", chromePath);
                processBuilder.environment().put("PUPPETEER_EXECUTABLE_PATH", chromePath);
            }
            processBuilder.redirectErrorStream(true);

            Process process = processBuilder.start();
            // 读取命令输出
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean finished = process.waitFor(30, TimeUnit.SECONDS);

            if (!finished || process.exitValue() != 0) {
                log.error("Mermaid CLI 执行异常, exitCode={}, output={}",
                        finished ? process.exitValue() : "timeout", output);
                throw new BusinessException(ErrorCode.SYSTEM_ERROR,
                        "Mermaid CLI 执行失败: " + output);
            }

            // 检查输出文件
            if (!tempOutputFile.exists() || tempOutputFile.length() == 0) {
                throw new BusinessException(ErrorCode.SYSTEM_ERROR,
                        "Mermaid CLI 未生成有效输出文件, output=" + output);
            }
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "Mermaid CLI 执行异常: " + e.getMessage());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "Mermaid CLI 执行被中断");
        }
        // 清理输入文件，保留输出文件供上传使用
        FileUtil.del(tempInputFile);
        return tempOutputFile;
    }
}
