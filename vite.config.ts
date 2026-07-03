import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 配置@别名
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve:{
    alias:{
      "@":resolve(__dirname,'./src')
    }
  }
})
