import presetAttributify from '@unocss/preset-attributify';
import { defineConfig, presetWind3 } from 'unocss';

export default defineConfig({
  presets: [
    // 显式声明预设版本, 避免 UnoCSS 升级时兜底预设变更导致样式漂移
    presetWind3(),
    // 原子类按语义拆分到属性上, 缓解长 className 的可读性问题
    presetAttributify(),
  ],
});
