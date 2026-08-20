import { useLocale as useAntdLocale } from 'antd/es/locale';

/**
 * 读宿主已经告诉过 antd 的语种.
 *
 * 宿主给 ConfigProvider 传过 locale, 就不必再对本包说第二遍 —— 本包的文案自己带,
 * 缺的只是"当前是哪个语种"这一个事实, 而这个事实已经存在了.
 *
 * 这是本包唯一一处碰 antd 非顶层入口的地方: antd 顶层没有导出读语种的能力.
 * 换实现只改这一个函数.
 */
export function useAntdLanguage(): string | undefined {
  // 第一个元素是某个组件的文案, 本包用不上; 要的是第二个元素的语种标识
  // 类型标注是 string, 但宿主没给 ConfigProvider 传 locale 时它是 undefined
  const [, language] = useAntdLocale('global');
  return language;
}
