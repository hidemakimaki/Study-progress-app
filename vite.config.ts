import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // VercelはルートでホストするがGitHub Pagesはサブパスになるため出し分ける
  base: process.env.VERCEL ? '/' : '/slide-progress-app/',
  plugins: [react()],
})
