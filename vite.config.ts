import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    root: '.',
    base: './',
    plugins: [react()],
    build: {
        outDir: 'dist/renderer',
        emptyOutDir: true,
        rollupOptions: {
            input: path.resolve(__dirname, 'renderer/index.html')
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'renderer/src')
        }
    },
    server: {
        port: 5173
    }
});

