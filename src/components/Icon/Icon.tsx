import type { HTMLAttributes } from 'react';
import { iconClass } from './iconClass';

/** Icon 的 props: span 的原生属性全量透传, 只多一个图标名 */
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * 图标名, iconify 记法 `集合:名字`, 如 `mdi:keyboard-esc`.
   *
   * 只有源码里的完整字面量与 MENU_ICONS 名单里的名字有样式, 拼接出来的名字渲染为空白.
   */
  icon: string;
}

/** 图标壳: 图标名换成 preset-icons 类名, 样式由 UnoCSS 构建期按需生成, 不带运行时 */
export function Icon(props: IconProps) {
  const { icon, ...rest } = props;

  // 修饰与图标分两层: preset-icons 用 mask 画图, mask 会把同一元素的 box-shadow 与 padding 区域一起裁掉
  return (
    <span {...rest}>
      <span className={iconClass(icon)} />
    </span>
  );
}
