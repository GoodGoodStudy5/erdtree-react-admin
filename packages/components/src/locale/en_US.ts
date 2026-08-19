import type { ComponentsLocale } from './types';

/**
 * 包内自带的兜底文案. 宿主不挂 Provider 时用它, 这是本包零配置可用的前提.
 * 取英文而非中文, 因为独立发布后宿主的语种未知, 英文是最不冒犯的默认.
 */
export const enUS: ComponentsLocale = {
  Modal: {
    maximize: 'Maximize',
    exitMaximized: 'Exit maximized',
    close: 'Close',
  },
};
