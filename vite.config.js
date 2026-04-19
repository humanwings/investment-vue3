import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 9529,
      proxy: {
        '/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (requestPath) => requestPath.replace(/^\/api/, '')
        }
      }
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js'
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/vue') ||
              id.includes('node_modules/@vue/') ||
              id.includes('node_modules/pinia')
            ) {
              return 'vue-vendor'
            }

            if (
              id.includes('node_modules/axios') ||
              id.includes('node_modules/js-cookie')
            ) {
              return 'axios-vendor'
            }

            if (id.includes('node_modules/@element-plus/icons-vue')) {
              return 'element-plus-icons'
            }

            if (id.includes('node_modules/element-plus')) {
              if (
                id.includes('/components/message') ||
                id.includes('/components/message-box') ||
                id.includes('/components/notification') ||
                id.includes('/components/loading')
              ) {
                return 'element-plus-feedback'
              }

              return 'element-plus-core'
            }
          }
        }
      }
    },
    define: {
      __APP_TITLE__: JSON.stringify(
        env.VITE_APP_TITLE || 'investment-front-vue3'
      )
    }
  }
})
