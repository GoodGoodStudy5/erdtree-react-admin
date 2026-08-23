import type { ReactNode } from 'react';
import type { SearchSelectColumnsTable, SearchSelectOption } from './types';

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

/** 取值转成可比较的小写字符串. 非字符串/数字的字段 (如 JSX label) 不参与匹配 */
function toSearchText(value: unknown): string {
  if (typeof value === 'string') {
    return value.toLowerCase();
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return '';
}

/**
 * 本地过滤的匹配规则: 关键字命中任一指定字段即算命中, 统一小写后做包含比较.
 *
 * 大小写模糊与首尾空格是固定默认 (zouwu 的 allowLowercaseSearch / filterInputTrans 两个开关
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
  return keys.some((key) => toSearchText(option?.[key]).includes(target));
}

/** 多列下拉的表头. 与选项行用同一套列宽规则, 所以两者对得齐 */
export function renderColumnsHeader<OT extends SearchSelectOption>(
  columnsTable: SearchSelectColumnsTable<OT>,
): ReactNode {
  return (
    <div className="search-select-table-header">
      {columnsTable.columns.map((column) => (
        <div
          className="search-select-table-cell"
          key={column.dataIndex}
          style={{ maxWidth: column.maxWidth, flexBasis: column.maxWidth }}
          title={typeof column.title === 'string' ? column.title : undefined}
        >
          {column.title}
        </div>
      ))}
    </div>
  );
}

/** 多列下拉的一行. 每个单元格按 dataIndex 取值, 给了 render 就交给它 */
export function renderColumnsRow<OT extends SearchSelectOption>(
  option: OT,
  columnsTable: SearchSelectColumnsTable<OT>,
): ReactNode {
  const { columns, allowWrap } = columnsTable;

  return (
    <div className="search-select-table-row">
      {columns.map((column) => {
        const value = option[column.dataIndex];

        return (
          <div
            className={
              allowWrap
                ? 'search-select-table-cell search-select-table-cell-wrap'
                : 'search-select-table-cell'
            }
            key={column.dataIndex}
            style={{ maxWidth: column.maxWidth, flexBasis: column.maxWidth }}
            title={toSearchText(value) === '' ? undefined : String(value)}
          >
            {column.render ? column.render(value, option) : (value as ReactNode)}
          </div>
        );
      })}
    </div>
  );
}
