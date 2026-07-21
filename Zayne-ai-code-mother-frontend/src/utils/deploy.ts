/**
 * 去掉 host 末尾多余斜杠，便于拼接路径
 */
function normalizeHost(host: string): string {
  return host.replace(/\/+$/, '')
}

/** 应用生成预览域名（对话页） */
export function getPreviewHost(): string {
  return normalizeHost(import.meta.env.VITE_APP_PREVIEW_HOST || 'http://localhost:8123/api/static')
}

/** 应用部署作品域名（查看作品） */
export function getDeployHost(): string {
  return normalizeHost(import.meta.env.VITE_APP_DEPLOY_HOST || 'http://localhost:8123/api/static')
}

/**
 * 生成预览地址：{previewHost}/{codeGenType}_{appId}/
 */
export function getPreviewSiteUrl(codeGenType: string, appId: string | number): string {
  return `${getPreviewHost()}/${codeGenType}_${appId}/`
}

/**
 * 已部署作品访问地址：{deployHost}/{deployKey}/
 * （与对话页生成预览地址不同）
 */
export function getDeploySiteUrl(deployKey: string): string {
  const key = deployKey.trim().replace(/^\/+|\/+$/g, '')
  return `${getDeployHost()}/${key}/`
}
