import type { ComponentsLocale } from './types';

/**
 * 英文文案, 同时充当语种识别不出来时的兜底 —— 独立发布后宿主的语种未知, 英文是最不冒犯的默认.
 */
export const enUS: ComponentsLocale = {
  Modal: {
    maximize: 'Maximize',
    exitMaximized: 'Exit maximized',
    close: 'Close',
  },
  SearchSelect: {
    placeholder: 'Please select',
  },
};
