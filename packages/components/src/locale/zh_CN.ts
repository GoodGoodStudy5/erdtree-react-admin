import type { ComponentsLocale } from './types';

/** 简体中文文案. 类型是完整的 ComponentsLocale, 新增 key 时缺翻译在此处编译期就红 */
export const zhCN: ComponentsLocale = {
  Modal: {
    maximize: '最大化',
    exitMaximized: '还原',
    close: '关闭',
  },
};
