import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// @ts-ignore - Optional plugin
// import { visualizer } from 'rollup-plugin-visualizer';
// @ts-ignore - Optional plugin
// import viteCompression from 'vite-plugin-compression';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression
    // viteCompression({
    //   algorithm: 'gzip',
    //   ext: '.gz',
    // }),
    // Brotli compression
    // viteCompression({
    //   algorithm: 'brotliCompress',
    //   ext: '.br',
    // }),
    // Bundle analyzer (only in analyze mode)
    // process.env.ANALYZE
    //   ? visualizer({
    //       open: true,
    //       filename: 'dist/stats.html',
    //       gzipSize: true,
    //       brotliSize: true,
    //     })
    //   : undefined,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Generate source maps for production debugging
    sourcemap: true,
    // Optimize build output
    target: 'es2015',
    minify: 'esbuild',
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // React and core dependencies
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // UI components
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
          ],
          // Form handling
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // State and data
          'vendor-data': ['zustand', '@supabase/supabase-js', 'dexie', 'dexie-react-hooks'],
          // Utilities
          'vendor-utils': [
            'i18next',
            'react-i18next',
            'date-fns',
            'papaparse',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // @ts-ignore - vitest types
  test: {
    globals: true,
    environment: 'node',
  },
});
