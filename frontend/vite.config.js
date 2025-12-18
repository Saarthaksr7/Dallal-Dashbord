import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      react(),
    ].filter(Boolean),

    // Build optimizations
    build: {
      // Target modern browsers for smaller bundles
      target: 'es2020',

      // Output directory
      outDir: 'dist',

      // Generate sourcemaps for production debugging (can be disabled)
      sourcemap: isProduction ? 'hidden' : true,

      // Minification - use esbuild instead of terser (terser has issues with lucide-react)
      minify: 'esbuild',

      // Chunk size warnings
      chunkSizeWarningLimit: 1000, // 1MB

      // Manual chunk splitting disabled - letting Vite handle it automatically
      // to avoid lucide-react bundling issues
      rollupOptions: {
        output: {
          // Asset naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },

      // Optimize dependencies
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    // Development server
    server: {
      port: 5173,
      strictPort: false,
      host: true,

      // Proxy API requests to backend
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/ws': {
          target: 'ws://localhost:8000',
          ws: true,
        },
      },
    },

    // Preview server (for testing production build locally)
    preview: {
      port: 4173,
      strictPort: false,
      host: true,
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-i18next',
        'i18next',
        'zustand',
        'axios',
        'wouter',
        'lucide-react',
      ],
      exclude: [
        '@monaco-editor/react', // Lazy loaded
        'xterm', // Lazy loaded
      ],
    },

    // Define environment variables accessible in code
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
  }
})
