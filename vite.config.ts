import path from 'node:path';
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
      devSourcemap: true,
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          charset: false,
          // less 变量只在编译期存在, 每个 less 文件都得先拿到它们; 自动注入把这份 import
          // 收成一处, 于是搬家时路径只改 vite 配置. variable.less 自己要跳过, 否则成了自引用
          paths: [path.resolve(root, 'src/styles')],
          additionalData: (source: string, filename: string) =>
            filename.endsWith('variable.less') ? source : `@import 'variable.less';\n${source}`,
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
