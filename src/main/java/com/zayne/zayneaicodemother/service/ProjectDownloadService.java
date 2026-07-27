package com.zayne.zayneaicodemother.service;

import jakarta.servlet.http.HttpServletResponse;

/**
 * 项目代码下载 服务层。
 *
 * @author <a href="https://github.com/LoganXY">程序员Zayne</a>
 */
public interface ProjectDownloadService {

    /**
     * 下载应用源代码
     *
     * @param projectPath 项目路径
     * @param downloadFileName 文件名
     * @param response
     * @return
     */
    void downloadProjectAsZip(String projectPath, String downloadFileName, HttpServletResponse response);
}