import path from 'path';
import { defineConfig } from 'vite';
import { createHtmlPlugin } from 'vite-plugin-html';
import inject from '@rollup/plugin-inject'
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import vitePluginRequire from "vite-plugin-require";

export default defineConfig({
    css: {
        lightningcss: {
            errorRecovery: true,
        },
        preprocessorOptions: {
            scss: {
                logger: {
                    warn(message, options) {}
                }
            }
        }
    },
    // define: {
    //     process: {
    //         env: {
    //             BROWSER: true,
    //             IS_APP: !!process.env.IS_APP,
    //             DESKTOP_APP: !!process.env.DESKTOP_APP,
    //             MOBILE_APP: !!process.env.MOBILE_APP,
    //             //NO_NOTIFY: 1,
    //         }
    //     }
    // },
    define: {
        'global_env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        'global_env.BROWSER': JSON.stringify(true),
        'global_env.IS_APP': JSON.stringify(!!process.env.IS_APP),
        'global_env.DESKTOP_APP': JSON.stringify(!!process.env.DESKTOP_APP),
        'global_env.MOBILE_APP': JSON.stringify(!!process.env.MOBILE_APP),
        //'global_env.NO_NOTIFY': JSON.stringify(1),
    },
    resolve: {
        alias: {
            "app": path.resolve(__dirname, "./src"),
            "@styles": path.resolve(__dirname, "./src"),
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
