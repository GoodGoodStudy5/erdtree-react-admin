import type { PluginOption } from 'vite';
import path from 'path';
import AutoImport from 'unplugin-auto-import/vite';

/**
 * 自动导入处理
 */
export const autoImportPlugin = (): PluginOption => {
  return AutoImport({
    dirs: [
      'src/hooks/**',
      'src/components/**',
      // 这几处的符号同时由功能目录的 index 导出, 只登记 index 一处
      '!src/components/Buttons/components/**',
      '!src/components/Dates/components/**',
      '!src/components/Selects/Api*.tsx',
      '!src/components/Selects/Base*.tsx',
      // 这些组件目录的 index 只是转发, 组件定义在同名文件内, 登记定义处
      '!src/components/{Business,Count,Ellipsis,Fullscreen,GlobalSearch,I18n,PasswordStrength,Theme,WangEditor}/index.ts',
      // stores 的 index 只是转发, 类型定义在各 store 文件内, 登记定义处
      'src/stores/**',
      '!src/stores/index.ts',
      // types 下只有这两个是源文件, autoImports.d.ts 是本插件的产物
      'types/form.ts',
      'types/public.ts',
      'src/utils/permissions.ts',
      'src/utils/config.ts',
    ],
    imports: [
      'react',
      // react-router-dom 已完整 re-export react-router, 同时登记会让共用 hook 重复注册
      'react-router-dom',
      'react-i18next',
      { from: 'react', imports: ['FC'], type: true },
    ],
    dts: 'types/autoImports.d.ts',
    include: [/\.[tj]sx?$/],
    resolvers: [
      (name) => {
        // 处理 @/ 开头的路径别名
        if (name.startsWith('@/')) {
          return {
            from: name.replace('@/', path.resolve(process.cwd(), 'src/') + '/'),
          };
        }
      },
    ],
  });
};
