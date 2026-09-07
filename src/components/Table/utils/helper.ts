import type { TableColumn } from '#/public';
import type { ReactNode } from 'react';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import { eR } from '@south/utils';

/** 计算表格高度 */
export function getTableHeight(element: HTMLDivElement | null): number {
  // 获取屏幕高度
  const clientHeight = document.documentElement.clientHeight || document.body.clientHeight;

  // 获取元素顶部高度
  const top = element?.getBoundingClientRect?.()?.top || 0;

  // 分页高度
  const paginationElm = document.getElementById('pagination');
  const paginationHeight = paginationElm?.offsetHeight || 0;

  // 表格高度 = 屏幕高度 - 表格距离顶部高度 - 分页高度
  const tableHeight = clientHeight - top - paginationHeight;

  return tableHeight > 0 ? tableHeight - 65 : 450;
}

/**
 * 根据大小处理行高度
 * @param size - 大小
 */
export function handleRowHeight(size: SizeType): number {
  switch (size) {
    case 'large':
      return 62;

    case 'middle':
      return 54;

    default:
      return 46;
  }
}

/**
 * 没写 render 的列补一个空值兜底.
 *
 * 逐列浅拷贝而不深拷贝: 列的 title 可以是 JSX, 深拷贝会顺着 React 元素的 _owner 爬进 Fiber 图,
 * 当场爆栈.
 * @param columns - 表格的列
 */
export function filterTableColumns(columns: TableColumn[]) {
  return (columns ?? []).map((column) =>
    column.render ? column : { ...column, render: (text: ReactNode) => eR(text) },
  );
}
