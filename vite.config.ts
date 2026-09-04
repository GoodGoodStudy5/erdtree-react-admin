import { defineConfig, loadEnv } from 'vite';
import { handleEnv } from './build/utils/helper.ts';
import { createProxy } from './build/vite/proxy.ts';
import { createVitePlugins } from './build/plugins/index.ts';
import { buildOptions } from './build/vite/build.ts';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = handleEnv(env);
  const { VITE_SERVER_PORT, VITE_PROXY } = viteEnv;

  return {
    base: '/',
    plugins: createVitePlugins(),
    define: {
      // react-draggable 4.6.0 的 log() 运行时会读取 process.env.DRAGGABLE_DEBUG，
      // 浏览器环境中 process 未定义会抛出 "process is not defined"，
      // 导致拖拽回调 handleDragStart 中断、模态框无法拖动。这里将其置为 false。
      'process.env.DRAGGABLE_DEBUG': JSON.stringify(false),
      // i18next-http-backend 与 motion 这类双环境包用 global 探测运行时, 浏览器里没有这个
      // 全局量. 它们原先各自独立成 chunk 且跟着懒加载走, 合进 vendor 后进了首屏, 一加载即抛
      // ReferenceError. globalThis 是标准全局对象, 两处语义一致
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': '/src',
        '#': '/types',
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          charset: false,
        },
      },
    },
    server: {
      open: true,
      port: VITE_SERVER_PORT,
      // 跨域处理
      proxy: createProxy(VITE_PROXY),
      // 减少文件监听开销
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        usePolling: false,
      },
      // HMR 优化，减少开发环境切换卡顿
      hmr: {
        overlay: true,
      },
    },
    build: buildOptions(),
  };
});
