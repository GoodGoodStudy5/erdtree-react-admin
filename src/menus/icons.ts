/**
 * 动态菜单可用的图标名单, iconify 记法 `集合:名字`.
 *
 * 菜单图标名来自数据, 构建期扫不到, 这份名单经 uno.config 的 safelist 强制打进产物;
 * 名单外的名字渲染为空白, 没有联网兜底.
 */
export const MENU_ICONS = [
  'la:tachometer-alt',
  'icon-park:transaction-order',
  'icon-park:peoples',
  'icon-park:paper-money',
  'icon-park:game-handle',
] as const;

/** 菜单图标名: 只允许名单内的值 */
export type MenuIcon = (typeof MENU_ICONS)[number];
