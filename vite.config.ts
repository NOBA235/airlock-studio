import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    // Critical: Prevent "process is not defined" runtime error in Excalidraw
    'process.env.IS_PREACT': JSON.stringify('false'),
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw', '@excalidraw/mermaid-to-excalidraw'],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'excalidraw-core': ['@excalidraw/excalidraw'],
          'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'firebase-ai': ['firebase/ai'],
        },
      },
    },
  },
});
