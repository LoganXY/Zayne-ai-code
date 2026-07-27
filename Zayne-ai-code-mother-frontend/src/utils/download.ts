import { downloadAppCode } from '@/api/appController'

/**
 * 下载应用代码 ZIP 包。
 * 使用 responseType: 'blob' 获取二进制流，绕过全局 JSON 拦截，
 * 从 Content-Disposition 响应头解析文件名后触发浏览器下载。
 *
 * 后端响应头示例：
 *   Content-Type: application/zip
 *   Content-Disposition: attachment; filename="123.zip"
 */
export async function downloadAppCodeZip(appId: string): Promise<void> {
  // 直接传字符串 appId，避免 Snowflake 长整型 ID 在 JavaScript Number 转换中精度丢失
  const res = await downloadAppCode(
    { appId },
    { responseType: 'blob' } as Record<string, unknown>,
  )

  const blob: Blob = (res as unknown as { data: Blob }).data ?? res

  // 从响应头解析 filename，兼容 RFC 5987 编码格式
  let filename = `${appId}.zip`
  const disposition: string | undefined = (res as unknown as { headers?: Record<string, string> }).headers
    ? Object.entries((res as unknown as { headers: Record<string, string> }).headers).find(
        ([k]) => k.toLowerCase() === 'content-disposition',
      )?.[1]
    : undefined

  if (disposition) {
    const match = disposition.match(/filename[*]?=UTF-8''([^;]+)/i)
    if (match?.[1]) {
      filename = decodeURIComponent(match[1])
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
