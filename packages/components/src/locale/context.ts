import { createContext } from 'react';
import type { PartialComponentsLocale } from './types';

/**
 * 文案注入点. 默认 undefined 而非某个默认值 —— 不挂 Provider 时 useLocale 落回包内按语种自选的那份,
 * 所以本包可以零配置使用.
 */
export const LocaleContext = createContext<PartialComponentsLocale | undefined>(undefined);
