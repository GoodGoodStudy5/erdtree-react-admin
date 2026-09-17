import type { CSSProperties, ReactNode } from 'react';
import type { SearchSelectColumnsTable, SearchSelectOption } from './types';

/**
 * 多列下拉的默认弹层宽度. 调用方要更宽的表格就传 `popupWidth`.
 *
 * **弹层, 表头, 选项行三处认同一个数, 列才对得齐**: 表头挂在弹层上, 选项行住在虚拟列表里,
 * 两者的父容器中间隔着好几层 antd 自己的结构, 宽度差得出几个像素. 各自撑满父容器的话,
 * `flex: 1` 会把那点差摊到每一列上; 都钉在同一个数上, 差多少都只落在行的右端, 被裁掉而已.
 */
export const DEFAULT_COLUMNS_POPUP_WIDTH = 360;

/**
 * 按 include / exclude 过滤选项.
 *
 * include 有值时只认它 (优先级高于 exclude): 正选与反选同时给是调用方的口径冲突,
 * 挑一条稳定的规则比两条一起生效更可预测.
 */
export function filterVisibleOptions<OT extends SearchSelectOption>(
  options: OT[] | undefined,
  { include, exclude }: { include?: OT['value'][]; exclude?: OT['value'][] },
): OT[] | undefined {
  if (!options) {
    return undefined;
  }
  if (include && include.length > 0) {
    return options.filter((option) => include.includes(option.value));
  }
  if (exclude && exclude.length > 0) {
    return options.filter((option) => !exclude.includes(option.value));
  }
  return options;
}

/** 取值的纯文本形态. 非字符串/数字的字段 (如 JSX label) 没有可比较也可展示的文本, 给空串 */
function toPlainText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

/**
 * 本地过滤的匹配规则: 关键字命中任一指定字段即算命中, 统一小写后做包含比较.
 *
 * 大小写模糊与首尾空格是固定默认
 * 并入这里): 没见过想要"区分大小写的下拉搜索"的需求, 留着开关只是多两条分支.
 */
export function matchOptionByKeys<OT extends SearchSelectOption>(
  option: OT | undefined,
  keyword: string,
  keys: string[],
): boolean {
  const target = keyword.trim().toLowerCase();

  if (target === '') {
    return true;
  }
  return keys.some((key) => toPlainText(option?.[key]).toLowerCase().includes(target));
}

/**
 * 多列下拉的一个单元格. 表头与选项行共用它, 列宽规则因此只有一份 —— 两者才对得齐.
 *
 * 写成渲染函数而不是组件: 它没有自己的状态, 也不需要独立的 reconciliation,
 * 而本文件的其余导出都是普通函数, 混进一个组件会让整个模块不适合 fast refresh.
 */
function renderCell({
  key,
  children,
  maxWidth,
  title,
  allowWrap,
}: {
  key: string;
  children: ReactNode;
  maxWidth?: CSSProperties['maxWidth'];
  title?: string;
  allowWrap?: boolean;
}) {
  return (
    <div
      key={key}
      className={
        allowWrap
          ? 'search-select-table-cell search-select-table-cell-wrap'
          : 'search-select-table-cell'
      }
      style={{ maxWidth, flexBasis: maxWidth }}
      title={title === '' ? undefined : title}
    >
      {children}
    </div>
  );
}

/**
 * 建一份多列下拉的渲染器: 表头与选项行从同一份上下文出来.
 *
 * **同宽由此成为结构上的事实**: 两处引用同一个 `size`, 想让它们不同宽得先改结构, 而不是某次漏传
 * 一个参数就悄悄发生 —— 列一错开只有截图上看得出来, 类型不会报错.
 *
 * 往后要加的共享项 (行高, 空态, hover 规则) 都进这里, 两个出口的签名不再长.
 * @param table - 列定义, 外加它们共用的宽度
 */
export function createColumnsRenderer<OT extends SearchSelectOption>({
  columns,
  allowWrap,
  width,
}: SearchSelectColumnsTable<OT> & { width: number }) {
  const size = { width };

  return {
    header: (): ReactNode => (
      <div className="search-select-table-header" style={size}>
        {columns.map((column) =>
          renderCell({
            key: column.dataIndex,
            maxWidth: column.maxWidth,
            title: toPlainText(column.title),
            children: column.title,
          }),
        )}
      </div>
    ),

    row: (option: OT): ReactNode => (
      <div className="search-select-table-row" style={size}>
        {columns.map((column) => {
          const value = option[column.dataIndex];

          return renderCell({
            key: column.dataIndex,
            allowWrap,
            maxWidth: column.maxWidth,
            title: toPlainText(value),
            children: column.render ? column.render(value, option) : (value as ReactNode),
          });
        })}
      </div>
    ),
  };
}
