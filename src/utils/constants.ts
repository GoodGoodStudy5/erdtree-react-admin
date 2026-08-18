import { DefaultOptionType } from 'antd/es/select';
import { $t } from '@/locales';

/**
 * @description: 公用常量
 */

/**
 * 颜色
 */
export enum colors {
  success = '#87d068',
  primary = '#409EFF',
  warning = '#E6A23C',
  danger = '#f50',
  info = '#909399',
  magenta = 'magenta',
  red = 'red',
  volcano = 'volcano',
  orange = 'orange',
  gold = 'gold',
  lime = 'lime',
  green = 'green',
  cyan = 'cyan',
  blue = 'blue',
  geekblue = 'geekblue',
  purple = 'purple',
}

/** 枚举选项的统一结构. value / label 供下拉与表格回显, type 与 color 控制标签样式 */
export interface Constant extends Omit<DefaultOptionType, 'children'> {
  value: string | number;
  label: string;
  type?: EnumShowType;
  color?: colors;
  children?: Constant[];
}

/**
 * 开启状态
 */
export const OPEN_CLOSE = (): Constant[] => [
  { label: $t('public.open'), value: 1, color: colors.green, type: 'tag' },
  { label: $t('public.close'), value: 0, color: colors.red, type: 'tag' },
];

/**
 * 菜单状态
 */
export const MENU_STATUS = (): Constant[] => [
  { label: $t('public.show'), value: 1, color: colors.green, type: 'tag' },
  { label: $t('public.hide'), value: 0, color: colors.red, type: 'tag' },
];

/**
 * 菜单类型
 */
export const MENU_TYPES = (): Constant[] => [
  { label: $t('systems:menu.catalog'), value: 1, type: 'tag', color: colors.green },
  { label: $t('systems:menu.menu'), value: 2, type: 'tag', color: colors.blue },
  { label: $t('systems:menu.button'), value: 3, type: 'tag', color: colors.cyan },
];

/**
 * 菜单作用类型
 */
export const MENU_ACTIONS = (): Constant[] => [
  { value: 'create', label: $t('system.create') },
  { value: 'update', label: $t('system.update') },
  { value: 'delete', label: $t('system.delete') },
  { value: 'detail', label: $t('system.detail') },
  { value: 'export', label: $t('system.export') },
  { value: 'status', label: $t('system.status') },
];
