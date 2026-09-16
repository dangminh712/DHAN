import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Intranet configuration: listen on all network interfaces (0.0.0.0)
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Cho phép toàn bộ mạng LAN truy cập qua IP máy chủ
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
