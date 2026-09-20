import type { ReactNode } from 'react';
import type { TableProps } from 'antd';
import { Empty } from 'antd';
import type { TableColumn } from '#/public';
import { emptyText } from '@south/utils';
import { BaseTable } from './BaseTable';
import './SimpleTable.less';

/**
 * 密排小表: 卡片里两三行的从属表格, 不排序不筛选不分页不选择.
 *
 * 缺省用原生 `<table>` 渲染: antd Table 每一个单元格都是一个 React 组件, 一屏 5472 个格子就是
 * 5472 个组件, 而这张表一样能力都不用. 逃生门留着 —— 真要分页或虚拟滚动时传 `isNative` 为假.
 */

/** 一列: 名与这一格写什么. 没有 `dataIndex` —— 密排小表的格子基本都是拼出来的 */
export interface SimpleColumn<T> {
  /** 列名 */
  title: ReactNode;
  /** 这一格写什么 */
  render: (row: T) => ReactNode;
  /** 右对齐: 金额与数量 */
  right?: boolean;
  /** 列宽 */
  width?: number;
}

interface Props<T extends object> extends Omit<
  TableProps<T>,
  'columns' | 'dataSource' | 'bordered' | 'rowKey'
> {
  /** 列 */
  columns: SimpleColumn<T>[];
  /** 行 */
  rows: T[];
  /** 一行的键 */
  rowKey: (row: T) => string;
  /** 用原生 `<table>` 渲染. 缺省真; 传假回到 antd Table, 下面四个开关与 antd 专属的 prop 只在那条路上有效 */
  isNative?: boolean;
  /** 开边框. 缺省关 —— 小表住在卡片里, 边框归卡片 */
  isBordered?: boolean;
  /** 开斑马线. 缺省关 */
  isZebra?: boolean;
  /** 开刷新与列筛选那条工具栏. 缺省关 */
  isOperate?: boolean;
  /** 素色: 表体、表头、悬浮一律不上底色, 只留分隔线. 缺省真 —— 底色归外面的卡片 */
  isPlain?: boolean;
  /**
   * 撞上列宽的内容折行. 缺省关 —— 固定列宽下超出就溢出, 那是 CSS 的缺省, 这里不替调用方改掉它.
   *
   * 只管元素内容: 字符串由 {@link cell} 一直包着能折行的 span, 与这个开关无关.
   */
  isWrap?: boolean;
}

/**
 * 密排小表.
 * @param props - 组件参数
 */
export function SimpleTable<T extends object>(props: Props<T>) {
  const { isNative = true } = props;

  return isNative ? <NativeTable<T> {...props} /> : <AntdTable<T> {...props} />;
}

/**
 * 一格的内容, 两种模式共用.
 *
 * 不是元素的值一律当文字: 给不出值就落到全站占位符, 文字外面包一层才折得了行 —— 不包的话长串
 * 撑破列宽上限. 判据照抄 BaseTable 的列管线, 两种模式对外要给出同一个结果.
 * @param content - 列的 render 结果
 */
function cell(content: ReactNode) {
  if (['object', 'function'].includes(typeof content)) return content;

  return (
    <span className="break-all break-words whitespace-pre-wrap">
      {String(content ?? emptyText)}
    </span>
  );
}

/**
 * 原生形态: 一个格子就是一个 `<td>` 宿主节点, 不建 React 组件.
 *
 * 列宽自适应与封顶纯靠样式 —— 不测量, 不挂 ResizeObserver, 不渲染测量行.
 * @param props - 组件参数
 */
function NativeTable<T extends object>(props: Props<T>) {
  const { columns, rows, rowKey, rowClassName, onRow, showHeader, locale, className, style } =
    props;
  // 缺省交给样式表那条 auto, 不在这里重复写一个默认值
  const tableStyle = props.tableLayout ? { tableLayout: props.tableLayout } : undefined;
  const classes = ['simple-table', 'is-native', props.isWrap && 'is-wrap', className];
  const hasWidth = columns.some((column) => column.width !== undefined);
  const words = typeof locale?.emptyText === 'function' ? locale.emptyText() : locale?.emptyText;

  return (
    <div className={classes.filter(Boolean).join(' ')} style={style}>
      <table style={tableStyle}>
        {hasWidth && (
          <colgroup>
            {columns.map((column, index) => (
              <col
                key={index}
                style={column.width === undefined ? undefined : { width: column.width }}
              />
            ))}
          </colgroup>
        )}
        {showHeader !== false && (
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} style={column.right ? { textAlign: 'right' } : undefined}>
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.length === 0 ? (
            <tr>
              {/* 没有 locale 时给 antd 那张空图, 与 antd 模式落在同一处 */}
              <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                {words ?? <Empty />}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const rowProps = onRow?.(row, index);
              const tone =
                typeof rowClassName === 'string' ? rowClassName : rowClassName?.(row, index, 0);
              const classes = [tone, rowProps?.className].filter(Boolean).join(' ');

              return (
                <tr key={rowKey(row)} {...rowProps} className={classes || undefined}>
                  {columns.map((column, columnIndex) => (
                    <td key={columnIndex} style={column.right ? { textAlign: 'right' } : undefined}>
                      {cell(column.render(row))}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * antd 形态: 逃生门. 分页、排序、虚拟滚动这些真要用时走这条路.
 * @param props - 组件参数
 */
function AntdTable<T extends object>(props: Props<T>) {
  const { columns, rows, isPlain = true, isNative, isWrap, ...rest } = props;
  const classes = ['simple-table', isPlain && 'is-plain', isWrap && 'is-wrap'];

  /*
   * 合成 `dataIndex`: BaseTable 的列筛选按它取键, 一个都取不到时 `useFiler` 返回空列表, 整张表
   * 一列都不渲染. 小表的格子没有 dataIndex 可给, 于是按下标编一个喂它.
   */
  const tableColumns: TableColumn<T>[] = columns.map((column, index) => ({
    title: column.title,
    dataIndex: `simple-${index}`,
    width: column.width,
    align: column.right ? 'right' : undefined,
    render: (_value: unknown, row: T) => column.render(row),
  }));

  return (
    <div className={classes.filter(Boolean).join(' ')}>
      <BaseTable<T>
        columns={tableColumns}
        dataSource={rows}
        isOperate={false}
        isBordered={false}
        isZebra={false}
        {...rest}
        style={{ border: 'none', ...rest.style }}
      />
    </div>
  );
}
