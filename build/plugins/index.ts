import type { PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { resolveBuildId } from '../utils/helper.ts';
import { timePlugin } from './time.ts';
import { nojekyllPlugin } from './nojekyll.ts';
import { indexSnapshotPlugin } from './indexSnapshot.ts';
import { autoImportPlugin } from './autoImport.ts';
import { versionUpdatePlugin } from './version.ts';
import react from '@vitejs/plugin-react';
import unocss from 'unocss/vite';
import legacy from '@vitejs/plugin-legacy';
import viteCompression from 'vite-plugin-compression';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export function createVitePlugins() {
  const isDev = process.env.NODE_ENV === 'development';

  // 插件参数
  const vitePlugins: PluginOption[] = [
    // React 插件，配置以支持 React 19
    react({}),
    unocss(),
    // 自动导入
    autoImportPlugin(),
  ];

  // 开发环境才启用这些插件
  if (isDev) {
    vitePlugins.push(
      // 按住 alt + shift 点击页面元素, 直接跳到对应源码位置
      // 不指定 editor, 由插件自动探测, 避免团队内 IDE 不一致
      codeInspectorPlugin({
        bundler: 'vite',
        dev: isDev,
      }),
    );
  }

  // 生产环境才启用这些插件
  if (!isDev) {
    vitePlugins.push(
      // 压缩包
      viteCompression(),
      // 兼容低版本
      legacy({
        targets: [
          'Android > 39',
          'Chrome >= 60',
          'Safari >= 10.1',
          'iOS >= 10.3',
          'Firefox >= 54',
          'Edge >= 15',
        ],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      }),
      // 版本控制
      versionUpdatePlugin(),
      // 生成 .nojekyll 空文件
      nojekyllPlugin(),
      // index.html 存一份进构建目录, 让每个版本自包含
      indexSnapshotPlugin(resolveBuildId()),
      // 包分析
      visualizer({
        gzipSize: true,
        brotliSize: true,
      }),
      // 打包时间
      timePlugin(),
    );
  }

  return vitePlugins;
}
