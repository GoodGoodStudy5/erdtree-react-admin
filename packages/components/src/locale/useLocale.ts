import { useContext, useMemo } from 'react';
import { LocaleContext } from './context';
import { enUS } from './en_US';
import type { ComponentsLocale } from './types';

/**
 * 取某个组件的文案. 优先级为包内默认 < Provider 注入,
 * 组件自己的 props 覆盖由调用处再做一层, 这里不管.
 */
export function useLocale<K extends keyof ComponentsLocale>(componentName: K): ComponentsLocale[K] {
  const injected = useContext(LocaleContext);

  return useMemo(
    () => ({ ...enUS[componentName], ...(injected?.[componentName] ?? {}) }),
    [componentName, injected],
  );
}
