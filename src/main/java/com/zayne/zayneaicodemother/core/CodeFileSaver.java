package com.zayne.zayneaicodemother.core;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import cn.hutool.core.util.StrUtil;
import com.zayne.zayneaicodemother.ai.model.HtmlCodeResult;
import com.zayne.zayneaicodemother.ai.model.MultiFileCodeResult;
import com.zayne.zayneaicodemother.contant.AppConstant;
import com.zayne.zayneaicodemother.model.enums.CodeGenTypeEnum;

import java.io.File;
import java.nio.charset.StandardCharsets;

/**
 * 文件保存器
 */
@Deprecated
public class CodeFileSaver {

    /**
     * 文件保存根目录
     */
    private static final String FILE_SAVE_ROOT_DIR = AppConstant.CODE_OUTPUT_ROOT_DIR;

    /**
     * 保存 HTML 网页代码
     * @param result
     * @return
     */
    public static  File saveHtmlCodeResult(HtmlCodeResult result) {
        String bashDirPath = buildUniqueDir(CodeGenTypeEnum.HTML.getValue());
        writeToFile(bashDirPath, "index.html", result.getHtmlCode());
        return new File(bashDirPath);
    }

    /**
     * 保存多文件代码
     * @param result
     * @return
     */
    public static File saveMultiFileCodeResult(MultiFileCodeResult result) {
        String bashDirPath = buildUniqueDir(CodeGenTypeEnum.MULTI_FILE.getValue());
        writeToFile(bashDirPath, "index.html", result.getHtmlCode());
        writeToFile(bashDirPath, "style.css", result.getCssCode());
        writeToFile(bashDirPath, "script.js", result.getJsCode());
        return new File(bashDirPath);
    }

    /**
     * 构建文件的唯一路径（tmp/code_output/bizType_雪花 ID）
     * @param bizType 代码生成类型
     * @return
     */
    private static String buildUniqueDir(String bizType) {
        String uniqueDirName = StrUtil.format("{}_{}", bizType, IdUtil.getSnowflakeNextIdStr());
        String dirPath = FILE_SAVE_ROOT_DIR + File.separator + uniqueDirName;
        FileUtil.mkdir(dirPath);
        return dirPath;
    }

    /**
     * 保存单个文件
     * @param dirPath
     * @param fileName
     * @param content
     */
    private static void writeToFile (String dirPath, String fileName, String content) {
        // 内容为空则跳过，避免 FileUtil.writeString 对 null 抛空指针
        if (StrUtil.isBlank(content)) {
            return;
        }
        String filePath = dirPath + File.separator + fileName;
        FileUtil.writeString(content, filePath, StandardCharsets.UTF_8);
    }
}
