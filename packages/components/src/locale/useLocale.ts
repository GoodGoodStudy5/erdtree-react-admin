import { useContext, useMemo } from 'react';
import { useAntdLanguage } from './antdLanguage';
import { LocaleContext } from './context';
import { enUS } from './en_US';
import { zhCN } from './zh_CN';
import type { ComponentsLocale } from './types';

/** 按语种挑包内文案. 识别不出来时给英文 */
function pickPack(language: string | undefined): ComponentsLocale {
  return language?.toLowerCase().startsWith('zh') ? zhCN : enUS;
}

/**
 * 取某个组件的文案. 优先级为包内默认 < Provider 注入,
 * 组件自己的 props 覆盖由调用处再做一层, 这里不管.
 *
 * 包内默认跟着宿主给 antd 的语种走, 所以宿主不挂 Provider 也是对的语种;
 * 挂了 Provider 则以注入的为准, 那是给"只想改个别文案"或"宿主语种与 antd 不一致"留的口.
 */
export function useLocale<K extends keyof ComponentsLocale>(componentName: K): ComponentsLocale[K] {
  const injected = useContext(LocaleContext);
  const language = useAntdLanguage();

  return useMemo(
    () => ({ ...pickPack(language)[componentName], ...(injected?.[componentName] ?? {}) }),
    [componentName, injected, language],
  );
}
