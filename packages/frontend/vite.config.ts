import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import tailwindcss from '@tailwindcss/vite'

const frontendRoot = dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, frontendRoot, '');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:3001';
  const wsProxyTarget = env.VITE_DEV_WS_PROXY_TARGET || 'ws://localhost:3001';

  return {
    plugins: [
      vue(),
      tailwindcss(),
      // @ts-ignore because the plugin type might not perfectly match Vite's expected PluginOption type
      (monacoEditorPlugin as any).default({})
    ],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: wsProxyTarget,
          ws: true,
          changeOrigin: true,
        }
      }
    }
  };
});
