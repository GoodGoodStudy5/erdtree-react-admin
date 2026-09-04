import type { Extractor, Preset } from 'unocss';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { createNodeLoader, createPresetIcons } from '@unocss/preset-icons';
import { MENU_ICONS } from '../../src/menus/icons.ts';
import { iconClass } from '../../src/components/Icon/iconClass.ts';

// 装了的图标集就是 @iconify-json 下的目录名. 只认装了的, 于是 "12:30" 这类字面量不会被当成图标
const installed = new Set(readdirSync(path.resolve(process.cwd(), 'node_modules/@iconify-json')));

// 引号包住的 `集合:名字`. 名字段紧跟收尾引号, 模板串里的 ${} 插值于是命不中, 与 Icon 壳只认字面量的口径一致
const ICON_LITERAL = /['"`]([a-z0-9]+(?:-[a-z0-9]+)*):([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g;

/**
 * 图标预设: 只为扫到的 `i-集合-名字` 生成 CSS, 不带运行时, 不请求 iconify API.
 *
 * 不直接用 presetIcons(): 它见到 VSCODE_CWD 环境变量就不装文件系统加载器, 从 VSCode 终端里跑
 * dev 或 build 会得到一份没有任何图标的产物, 且只有 warn 日志. 这里显式拿 Node 加载器建预设.
 */
export const iconsPreset: Preset = createPresetIcons(async () => {
  const loader = await createNodeLoader();
  if (!loader) throw new Error('@iconify/utils 的 Node 图标加载器不可用');
  return loader;
})({
  // 图标名写错在构建日志里暴露, 不然只是页面上一块空白
  warn: true,
  // span 是行内元素, 不设 inline-block 宽高不生效; -0.125em 是 iconify 行内图标的基线
  extraProperties: { display: 'inline-block', 'vertical-align': '-0.125em' },
});

/**
 * 从源码字符串字面量里找 iconify 记法的图标名, 交给图标预设按需生成样式.
 *
 * Icon 壳保留 `<Icon icon="mdi:keyboard-esc">` 的写法, 源码里出现的是图标名而非类名,
 * UnoCSS 默认的类名扫描认不出, 这里补一条按图标名认的.
 */
export const iconifyExtractor: Extractor = {
  name: 'iconify-literal',
  extract({ code }) {
    const found = new Set<string>();

    for (const [, prefix, name] of code.matchAll(ICON_LITERAL)) {
      if (installed.has(prefix)) found.add(iconClass(`${prefix}:${name}`));
    }

    return found;
  },
};

/** 菜单图标名单对应的类名. 菜单图标名来自数据, 构建期扫不到, 名单强制打进产物 */
export const menuIconSafelist = MENU_ICONS.map(iconClass);
