import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [
      react(),

      // Gzip compression for production
      isProduction && compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),

      // Brotli compression for production (better than gzip)
      isProduction && compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
      }),

      // Bundle analyzer for production builds
      isProduction && visualizer({
        filename: './dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
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
              // React core
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react'
              }

              // UI libraries
              if (id.includes('lucide-react') || id.includes('recharts')) {
                return 'vendor-ui'
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
