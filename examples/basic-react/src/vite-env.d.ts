/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RAUTH_API_KEY: string
  readonly VITE_RAUTH_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
