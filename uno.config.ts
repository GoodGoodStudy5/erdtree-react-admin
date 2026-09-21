import presetAttributify from '@unocss/preset-attributify';
import { defineConfig, presetWind3 } from 'unocss';
import { iconifyExtractor, iconsPreset, menuIconSafelist } from './build/unocss/icons.ts';

/**
 * 只收**角色类装不下**的色: 业务信号与底、线. 文字的几档归 `styles/common/roles.less`,
 * 表头的线与金额的红归各自的组件.
 *
 * 淡底档写全 `bg-error-bg`: `bg-error` 会被读成拿主色填底, 那是扎眼的纯红.
 *
 * 名字取自 antd 的同义 token 去掉 `--ant-color-` 前缀, 与 uno 属性前缀重复的那段再去掉.
 */
const THEME_COLORS = {
  error: { DEFAULT: 'var(--ant-color-error)', bg: 'var(--ant-color-error-bg)' },
  warning: {
    DEFAULT: 'var(--ant-color-warning)',
    bg: 'var(--ant-color-warning-bg)',
    border: 'var(--ant-color-warning-border)',
  },
  success: { DEFAULT: 'var(--ant-color-success)', bg: 'var(--ant-color-success-bg)' },
  link: { DEFAULT: 'var(--ant-color-primary)', hover: 'var(--ant-color-primary-hover)' },

  /** 红票与红冲. 项目自己的语义, 值在 theme-color.less 里借 error 的色 */
  'credit-note': 'var(--color-credit-note)',

  /** 比容器底凸一点的两档. antd 的 fill 是半透明叠加, 压在什么底上都对 */
  'fill-tertiary': 'var(--ant-color-fill-tertiary)',
  'fill-quaternary': 'var(--ant-color-fill-quaternary)',

  /** 线的强弱两档. antd 的 colorBorder 撞 uno 的 border- 前缀, 改叫 line */
  line: 'var(--ant-color-border)',
  split: 'var(--ant-color-split)',

  /** 最弱的一档文字: 弱分隔点, 帮助图标, 不可点的零. 比 text-muted 再浅一级 */
  quaternary: 'var(--ant-color-text-quaternary)',
};

export default defineConfig({
  presets: [
    // 显式声明预设版本, 避免 UnoCSS 升级时兜底预设变更导致样式漂移
    presetWind3(),
    // 原子类按语义拆分到属性上, 缓解长 className 的可读性问题
    presetAttributify(),
    // 图标按需生成, 判据与取舍见 build/unocss/icons.ts
    iconsPreset,
  ],
  theme: { colors: THEME_COLORS },
  // 源码里写的是 `集合:名字` 字面量而非类名, 默认扫描认不出
  extractors: [iconifyExtractor],
  // 菜单图标名来自数据, 构建期扫不到, 名单强制打进产物
  safelist: menuIconSafelist,
  // for 循环里的 `i--` 会被默认扫描当成 i- 前缀的图标名, 每次构建报一条假警告
  blocklist: ['i--'],
});
