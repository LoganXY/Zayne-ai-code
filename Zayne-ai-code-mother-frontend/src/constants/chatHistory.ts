/** 对话历史消息类型（与后端 ChatHistoryMessageTypeEnum 对齐） */
export const CHAT_MESSAGE_TYPE = {
  USER: 'user',
  AI: 'ai',
} as const

export type ChatMessageType = (typeof CHAT_MESSAGE_TYPE)[keyof typeof CHAT_MESSAGE_TYPE]

export const CHAT_MESSAGE_TYPE_OPTIONS = [
  { label: '用户', value: CHAT_MESSAGE_TYPE.USER },
  { label: 'AI', value: CHAT_MESSAGE_TYPE.AI },
] as const

export function getChatMessageTypeText(value?: string): string {
  if (value === CHAT_MESSAGE_TYPE.USER) return '用户'
  if (value === CHAT_MESSAGE_TYPE.AI) return 'AI'
  return value || '-'
}

export const CHAT_HISTORY_PAGE_SIZE = 10
