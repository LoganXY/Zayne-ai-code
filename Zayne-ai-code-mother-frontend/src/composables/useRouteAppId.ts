import { computed, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 从路由参数解析应用 ID，保持字符串以避免雪花 ID 精度丢失。
 */
export function useRouteAppId(paramName = 'id'): ComputedRef<string> {
  const route = useRoute()
  return computed(() => {
    const raw = route.params[paramName]
    const id = Array.isArray(raw) ? raw[0] : raw
    return id && String(id).trim() ? String(id) : ''
  })
}
