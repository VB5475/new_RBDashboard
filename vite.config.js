import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function vendorChunk(id) {
  if (!id.includes('node_modules')) return undefined;

  // Keep React core separate from every package with "react" in the path.
  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/scheduler/') ||
    id.includes('/react-is/')
  ) {
    return 'react-core';
  }

  if (id.includes('react-router')) return 'router';
  if (id.includes('@tanstack')) return 'query';
  if (id.includes('recharts') || id.includes('/d3-') || id.includes('/victory-')) {
    return 'recharts';
  }
  if (id.includes('leaflet') || id.includes('esri-leaflet')) return 'maps';
  if (id.includes('axios')) return 'axios';
  if (id.includes('lucide-react')) return 'icons';
  if (id.includes('fflate')) return 'fflate';
  if (id.includes('qrcode')) return 'qrcode';
  if (
    id.includes('react-simple-captcha') ||
    id.includes('htmlparser2') ||
    id.includes('domutils') ||
    id.includes('domelementtype') ||
    id.includes('domhandler') ||
    id.includes('dom-serializer') ||
    id.includes('/entities/') ||
    id.includes('nth-check') ||
    id.includes('boolbase') ||
    id.includes('css-select') ||
    id.includes('css-what')
  ) {
    return 'captcha';
  }

  return 'vendor';
}

function stripHeavyEntryAssets() {
  return {
    name: 'strip-heavy-entry-assets',
    transformIndexHtml(html) {
      return html
        .replace(/<link rel="stylesheet"[^>]*\/maps-[^>]*>\s*/g, '')
        .replace(/<link rel="stylesheet"[^>]*\/recharts-[^>]*>\s*/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripHeavyEntryAssets()],
  server: {
    proxy: {
      '/api': {
        target: 'https://mausam.imd.gov.in',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    modulePreload: {
      resolveDependencies(filename, deps) {
        // Do not preload heavy route-only chunks on first paint (login/shell).
        return deps.filter(
          (dep) =>
            !/(^|\/)(maps|recharts|DataGrid|qrcode|captcha|RnbHomePage|RnbModulesHomePage|RnbWorkMapModal|RnbChartClick|FilterDrawer|RnbDrilldown|chartGridData)-/.test(
              dep,
            ),
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks: vendorChunk,
      },
    },
  },
});
