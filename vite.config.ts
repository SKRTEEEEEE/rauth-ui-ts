import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'test/**/*'],
      rollupTypes: true,
    }),
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'RAuth',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'es') return 'index.mjs';
        if (format === 'cjs') return 'index.cjs';
        return `index.${format}.js`;
      },
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['react', 'react-dom', 'react/jsx-runtime', 'next/headers', 'next/server'],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.mjs',
          preserveModules: false,
          exports: 'named',
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          preserveModules: false,
          exports: 'named',
        },
      ],
    },
    sourcemap: true,
    // Minify with esbuild for better performance
    minify: 'esbuild',
    target: 'es2020',
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    exclude: ['react', 'react-dom'],
  },
});
