import type { BuildOptions } from 'vite';
import { resolveBuildId, splitJSModules } from '../utils/helper.ts';

/**
 * @description 分包配置
 */
export function buildOptions(): BuildOptions {
  // 产物按构建标识分目录: 一次发布的文件收在一处, 清理时以根 index.html 引用的那个为准,
  // 其余目录整个删 —— 判据是"有没有被当前版本引用", 不是"多久没改过"
  const buildId = resolveBuildId();

  return {
    chunkSizeWarningLimit: 1000, // 大于1000k才警告
    sourcemap: process.env.NODE_ENV !== 'production', // 非生产环境开启
    minify: 'terser',
    terserOptions: {
      compress: {
        // 生产环境时移除console和debugger
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        chunkFileNames: `assets/${buildId}/js/[name].[hash].js`,
        entryFileNames: `assets/${buildId}/js/[name].[hash].js`,
        assetFileNames: `assets/${buildId}/[ext]/[name].[hash].[ext]`,
        manualChunks(id) {
          // JS模块
          if (id.includes('node_modules')) {
            return splitJSModules(id);
          }
        },
      },
    },
  };
}
