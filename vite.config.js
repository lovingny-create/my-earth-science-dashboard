import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2015' // 옛날 브라우저(ES6)도 지원하도록 설정
  }
})
