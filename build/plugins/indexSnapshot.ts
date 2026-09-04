import type { PluginOption } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 把 index.html 复制一份进本次构建的产物目录.
 *
 * <p>根目录那份是"当前版本"指针, 每次发布覆盖; 副本让每个构建目录自包含 —— 回滚时把副本拷回
 * 根目录即可, 不必先查这一版引用了哪些文件.
 *
 * @param buildId - 构建标识, 与产物目录同名
 */
export const indexSnapshotPlugin = (buildId: string): PluginOption => {
  return {
    name: 'vite-index-snapshot',
    // closeBundle 时 index.html 已落盘, 此前的钩子里它还不在
    closeBundle: () => {
      const dist = path.resolve(process.cwd(), 'dist');
      const source = path.join(dist, 'index.html');
      const target = path.join(dist, 'assets', buildId, 'index.html');

      try {
        fs.copyFileSync(source, target);
        console.log(`生成 index.html 副本: assets/${buildId}/index.html`);
      } catch (error) {
        console.error('生成 index.html 副本失败:', error);
      }
    },
  };
};
