/** 精选应用优先级阈值（>= 该值视为精选） */
export const FEATURED_PRIORITY = 99

/** 取消精选后的默认优先级 */
export const DEFAULT_PRIORITY = 0

export function isFeaturedApp(priority?: number | null): boolean {
  return (priority ?? 0) >= FEATURED_PRIORITY
}
