import presetAttributify from '@unocss/preset-attributify';
import { defineConfig, presetWind3 } from 'unocss';
import { iconifyExtractor, iconsPreset, menuIconSafelist } from './build/unocss/icons.ts';

export default defineConfig({
  presets: [
    // 显式声明预设版本, 避免 UnoCSS 升级时兜底预设变更导致样式漂移
    presetWind3(),
    // 原子类按语义拆分到属性上, 缓解长 className 的可读性问题
    presetAttributify(),
    // 图标按需生成, 判据与取舍见 build/unocss/icons.ts
    iconsPreset,
  ],
  // 源码里写的是 `集合:名字` 字面量而非类名, 默认扫描认不出
  extractors: [iconifyExtractor],
  // 菜单图标名来自数据, 构建期扫不到, 名单强制打进产物
  safelist: menuIconSafelist,
  // for 循环里的 `i--` 会被默认扫描当成 i- 前缀的图标名, 每次构建报一条假警告
  blocklist: ['i--'],
});
