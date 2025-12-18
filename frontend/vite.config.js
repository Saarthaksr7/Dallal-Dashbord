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

      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction, // Remove console.log in production
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : []
        },
      },

      // Chunk size warnings
      chunkSizeWarningLimit: 1000, // 1MB

      // Manual chunk splitting for better caching
      rollupOptions: {
        output: {
          // Entry point
          manualChunks: (id) => {
            // Vendor chunks - libraries that rarely change
            if (id.includes('node_modules')) {
              // UI libraries - CHECK FIRST before React (lucide-react contains 'react')
              if (id.includes('lucide-react')) {
                return 'vendor-ui'
              }

              if (id.includes('recharts')) {
                return 'vendor-ui'
              }

              // React core
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react'
              }

              // Heavy editors
              if (id.includes('monaco-editor') || id.includes('xterm')) {
                return 'vendor-editors'
              }

              // ReactFlow (topology)
              if (id.includes('reactflow') || id.includes('dagre')) {
                return 'vendor-flow'
              }

              // i18n
              if (id.includes('i18next')) {
                return 'vendor-i18n'
              }

              // Other dependencies
              return 'vendor-misc'
            }
          },

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
