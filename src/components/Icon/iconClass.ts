/**
 * iconify 记法的图标名换成 preset-icons 的类名: `mdi:keyboard-esc` 变 `i-mdi-keyboard-esc`.
 *
 * Icon 壳在浏览器里用它, build/unocss 的扫描器与 safelist 在构建期按路径直接引用它, 两边口径必须同源.
 */
export function iconClass(icon: string): string {
  return `i-${icon.replace(':', '-')}`;
}
