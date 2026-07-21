/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 应用生成预览域名 */
  readonly VITE_APP_PREVIEW_HOST: string
  /** 应用部署作品域名 */
  readonly VITE_APP_DEPLOY_HOST: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
