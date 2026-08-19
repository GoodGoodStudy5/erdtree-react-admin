import { createContext } from 'react';
import type { PartialComponentsLocale } from './types';

/**
 * 文案注入点. 默认 undefined 而非某个默认值 —— 不挂 Provider 时 useLocale 直接落回包内 enUS,
 * 所以本包可以零配置使用.
 */
export const LocaleContext = createContext<PartialComponentsLocale | undefined>(undefined);
