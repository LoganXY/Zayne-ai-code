/**
 * 代码生成类型（对齐后端 CodeGenTypeEnum）
 */
export enum CodeGenTypeEnum {
  HTML = 'html',
  MULTI_FILE = 'multi_file',
  VUE_PROJECT = 'vue_project',
}

export const CODE_GEN_TYPE_OPTIONS = [
  { label: '原生 HTML 模式', value: CodeGenTypeEnum.HTML },
  { label: '原生多文件模式', value: CodeGenTypeEnum.MULTI_FILE },
  { label: 'Vue 项目模式', value: CodeGenTypeEnum.VUE_PROJECT },
] as const

const CODE_GEN_TYPE_TEXT_MAP: Record<string, string> = {
  [CodeGenTypeEnum.HTML]: '原生 HTML 模式',
  [CodeGenTypeEnum.MULTI_FILE]: '原生多文件模式',
  [CodeGenTypeEnum.VUE_PROJECT]: 'Vue 项目模式',
}

/** 将生成类型 value 转为中文文案 */
export function getCodeGenTypeText(value?: string): string {
  if (!value) return '-'
  return CODE_GEN_TYPE_TEXT_MAP[value] ?? value
}
