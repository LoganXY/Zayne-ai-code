export type SseHandlers = {
  onMessage: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

/**
 * 读取后端 SSE：data 行为 JSON {"d":"..."}，结束为 event: done
 */
export async function streamSse(
  url: string,
  handlers: SseHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'text/event-stream' },
    signal,
  })
  if (!response.ok) {
    throw new Error(`SSE 请求失败: ${response.status}`)
  }
  if (!response.body) {
    throw new Error('浏览器不支持流式读取')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let eventName = 'message'

  const flushEvent = (rawData: string) => {
    if (eventName === 'done') {
      handlers.onDone?.()
      eventName = 'message'
      return
    }
    const lines = rawData.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed = JSON.parse(trimmed) as { d?: string }
        if (typeof parsed.d === 'string') {
          handlers.onMessage(parsed.d)
        }
      } catch {
        handlers.onMessage(trimmed)
      }
    }
    eventName = 'message'
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''
    let dataLines: string[] = []
    for (const rawLine of parts) {
      const line = rawLine.replace(/\r$/, '')
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart())
      } else if (line === '') {
        if (dataLines.length > 0 || eventName === 'done') {
          flushEvent(dataLines.join('\n'))
        }
        dataLines = []
      }
    }
  }
  if (buffer.trim()) {
    if (buffer.includes('event: done') || eventName === 'done') {
      handlers.onDone?.()
    }
  }
}

export function buildChatSseUrl(appId: number | string, message: string): string {
  const base = 'http://localhost:8123/api'
  const params = new URLSearchParams({
    appId: String(appId),
    message,
  })
  return `${base}/app/chat/gen/code?${params.toString()}`
}
