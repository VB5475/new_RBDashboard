import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://mausam.imd.gov.in',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3')) {
              return 'recharts'; // Put recharts + d3 dependencies together
            }
            if (id.includes('leaflet')) {
              return 'leaflet'; // Leaflet dependencies
            }
            if (id.includes('react')) {
              return 'react'; // React core
            }
            return 'vendor'; // All other generic dependencies
          }
        }
      }
    }
  }
})
