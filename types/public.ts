import type { ReactNode } from 'react';
import type { ColumnType } from 'antd/es/table';
import type { ItemType } from 'antd/es/menu/interface';
import type { MenuIcon } from '@/menus';

// 数组
export type ArrayData = string[] | number[] | boolean[];

// 空值
export type EmptyData = null | undefined;

/**
 * 报文原样的形状: 每个字段额外允许 null.
 *
 * 前端契约按 `.claude/rules/nullable.md` 一律写 `?: T`, 而 JSON 里没有 undefined —— 后端给的是
 * null. 逐字抄真实报文的测试样本用这个类型标注, 才能既留住 null 又受字段名与类型的校验.
 *
 * 不动可选修饰符: 报文里本来就没有的字段该省略, 逼着补一个 null 就是伪造.
 */
export type Wire<T> = { [K in keyof T]: T[K] | null };

// 分页接口响应数据
export interface PageServerResult<T = unknown> {
  items: T;
  total: number;
}

// 分页表格响应数据
export interface PaginationData {
  page?: number;
  pageSize?: number;
}

// 侧边菜单
export interface SideMenu extends Omit<ItemType, 'children' | 'label' | 'icon'> {
  label: string;
  labelZh?: string;
  labelEn: string;
  key: string;
  icon?: React.ReactElement | MenuIcon;
  rule?: string; // 路由权限
  nav?: string[]; // 面包屑路径
  children?: SideMenu[];
}

// 页面权限
export interface PagePermission {
  page?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  [key: string]: boolean | undefined;
}

export type EnumShowType = 'text' | 'tag';

// 表格列表枚举
export interface ColumnsEnum {
  label: string;
  value: unknown;
  color?: string;
  type?: EnumShowType;
}

// 表格列数据
export interface TableColumn<T = object> extends ColumnType<T> {
  enum?: ColumnsEnum[] | Record<string, unknown>;
  children?: TableColumn<T>[];
  isKeepFixed?: boolean; // 手机端默认关闭fixed，该属性开启fixed
}

// 表格参数
// 表格操作
export type TableOptions<T = object> = (value: unknown, record: T, index?: number) => ReactNode;
