import path from 'path';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import inject from '@rollup/plugin-inject'
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vitePluginRequire from "vite-plugin-require";

export default defineConfig({
    css: {
      preprocessorOptions: {
            scss: {
                logger: {
                    warn(message, options) {}
                }
            }
        }
    },
    define: {
        'process.env': {}
    },
    resolve: {
        alias: {
            "app": path.resolve(__dirname, "./src"),
        }
    },
    plugins: [
        nodePolyfills(),
        react(),
        vitePluginRequire({}),
        createHtmlPlugin({
            entry: '../src/index.jsx',
            template: 'public/index.html',
        })
    ],
    build: { outDir: './build' }
});
