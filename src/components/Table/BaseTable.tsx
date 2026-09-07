import type { ResizeCallbackData } from 'react-resizable';
import type { ColumnsType } from 'antd/es/table';
import type { EnumShowType, TableColumn } from '#/public';
import { Table, Button, message, Tag } from 'antd';
import type { TableProps } from 'antd';
import { useMemo, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useFiler } from './hooks/useFiler';
import { emptyText } from '@south/utils';
import { useCommonStore } from '@/hooks';
import { PlusOutlined, RedoOutlined } from '@ant-design/icons';
import { getTableHeight, handleRowHeight, filterTableColumns } from './utils/helper';
import { ResizableTitle } from './components/ResizableTitle';
import { useVirtualTable } from './hooks/useVirtual';
import { TableFilter } from './components/TableFilter';
import { EllipsisText } from './components/EllipsisText';
import './index.less';
import { $t } from '@/locales';

type Components = TableProps<object>['components'];

interface Props extends Omit<TableProps<object>, 'bordered'> {
  isLoading?: boolean; // 是否加载
  isBordered?: boolean; // 是否开启边框
  isZebra?: boolean; // 是否开启斑马线
  isVirtual?: boolean; // 是否开启虚拟滚动
  isOperate?: boolean; // 是否开启顶部操作栏
  isAuthHeight?: boolean; // 是否自动计算高度
  isStickyToolbar?: boolean; // 操作行是否吸在标签栏底下
  isStickyHeader?: boolean; // 表头是否吸在吸附栈的下沿, 判据见 index.less
  isCreate?: boolean;
  scrollX?: number;
  scrollY?: number;
  leftContent?: ReactNode; // 左侧额外内容
  rightContent?: ReactNode; // 右侧额外内容
  getPage?: () => void;
  onCreate?: () => void;
}

/** 表格, 支持虚拟滚动、列筛选、列宽拖拽与斑马纹 */
export function BaseTable(props: Props) {
  const {
    isLoading,
    isVirtual,
    isCreate,
    isZebra = true,
    isBordered = true,
    isOperate = true,
    isAuthHeight,
    isStickyToolbar,
    isStickyHeader,
    scrollX,
    scrollY,
    rowClassName,
    size,
    leftContent,
    rightContent,
    getPage,
    onCreate,
  } = props;
  const { isPhone } = useCommonStore();
  const [handleFilterTable] = useFiler();
  const [columns, setColumns] = useState(filterTableColumns(props.columns as TableColumn[]));
  const tableRef = useRef<HTMLDivElement>(null);
  const [tableFilters, setTableFilters] = useState<string[]>([]);
  const [sortList, setSortList] = useState<string[]>([]);
  // 初值留空: 首次渲染也要走下面那段播种, 否则勾选列表是空的而表格一列都不显示
  const [prevColumns, setPrevColumns] = useState<Props['columns']>(undefined);
  // 行高取自真实渲染结果, 虚拟滚动需要它换算可视条数
  /* eslint-disable-next-line react-hooks/refs */
  const rows = tableRef.current?.querySelectorAll('.ant-table-row');

  // 清除自定义属性
  const params: Partial<Props> = { ...props };
  delete params.isLoading;
  delete params.isVirtual;
  delete params.isCreate;
  delete params.isBordered;
  delete params.isOperate;
  delete (params as TableColumn).enum;

  // 外部换掉列定义时丢弃用户的筛选、排序与列宽调整
  if (prevColumns !== props.columns) {
    const newColumns = filterTableColumns(props.columns as TableColumn[]);
    const checkedKeys = newColumns
      ?.filter((col) => !(col as TableColumn).hidden)
      .map((col) => col.dataIndex)
      .filter(Boolean) as string[];
    // 顺序必须含隐藏列: useFiler 按 sortList 下标排序, 缺列的 indexOf 得 -1 会把隐藏列甩到最前
    const sortKeys = newColumns?.map((col) => col.dataIndex).filter(Boolean) as string[];
    setPrevColumns(props.columns);
    setColumns(newColumns);
    setTableFilters(checkedKeys);
    setSortList(sortKeys);
  }

  // 添加新增缺少方法警告
  if (isCreate && !onCreate) {
    message.warning({
      content: $t('public.createMethodWarning'),
      key: 'createMethodWarning',
    });
  }

  // 添加分页缺少方法警告
  if (isOperate && !getPage) {
    message.warning({
      content: $t('public.getPageWarning'),
      key: 'getPageWarning',
    });
  }

  // 表格高度, 虚拟滚动需要在渲染期得到它才能算出这一帧的可视条数
  /* eslint-disable-next-line react-hooks/refs */
  const tableHeight = getTableHeight(tableRef.current);

  /**
   * 获取勾选表格数据
   * @param checks - 勾选
   */
  const getTableChecks = (checks: string[], newSortList: string[]) => {
    setTableFilters(checks);
    setSortList(newSortList);
  };

  /**
   * 处理拖拽
   * @param index - 下标
   */
  const handleResize = useCallback(
    (index: number) => {
      return (_: React.SyntheticEvent<Element>, { size }: ResizeCallbackData) => {
        const newColumns = [...columns];
        newColumns[index] = {
          ...newColumns[index],
          width: size.width,
        };
        setColumns(newColumns);
      };
    },
    [columns],
  );

  // 合并列表
  const mergedColumns = useMemo(() => {
    const newColumns = handleFilterTable(columns, tableFilters, sortList);
    if (!newColumns) return [];
    const result = newColumns
      .filter((col) => !(col as TableColumn).hidden)
      .map((col, index) => ({
        ...col,
        // 手机端去除列固定，除非设置了isKeepFixed
        fixed: col?.fixed && !(isPhone && !(col as TableColumn)?.isKeepFixed) ? col.fixed : false,
        onHeaderCell: (column: object, i: number) => ({
          ...col?.onHeaderCell?.(column, i),
          width: col.width,
          onResize: handleResize(index),
        }),
        onCell: (data: object, index?: number) => {
          return {
            ...col?.onCell?.(data, index),
            style: {
              ...col?.onCell?.(data, index)?.style,
              maxWidth: col.width,
              width: col.width,
            },
          };
        },
        render: (value: unknown, record: object, index: number) => {
          const renderContent = col?.render?.(value, record, index);
          let showValue: ReactNode | string = renderContent as ReactNode;
          let showType: EnumShowType = 'text';
          let color: string | undefined = undefined;
          let isStringArr = false; // 是否是字符串数组
          const enumList = (col as TableColumn)?.enum;

          if (enumList && typeof enumList === 'object') {
            if (Array.isArray(enumList)) {
              for (let i = 0; i < enumList?.length; i++) {
                const item = enumList[i];
                if (String(item.value) === String(showValue)) {
                  showValue = item.label;
                  color = item.color;
                  showType = item?.type || 'text';
                  break;
                }
              }
            } else {
              for (const key in enumList) {
                if (key === String(showValue)) {
                  showValue = enumList[key] as string;
                  break;
                }
              }
            }
          }

          // 如果是字符串数组则用逗号分隔
          if (Array.isArray(showValue)) {
            isStringArr = showValue?.every((item) => typeof item === 'string');
            if (isStringArr) showValue = showValue?.join(', ') || emptyText;
          }

          if (!['object', 'function'].includes(typeof renderContent) || isStringArr) {
            const textContent = String(showValue ?? emptyText);

            // 如果显示类型为标签
            if (showType === 'tag') {
              return <Tag color={color}>{textContent}</Tag>;
            }

            // 列宽撞上上限后折行, 不打省略号; 要省略号的列自己声明 ellipsis
            if (!col.ellipsis) {
              return (
                <span className="break-all break-words whitespace-pre-wrap" style={{ color }}>
                  {textContent}
                </span>
              );
            }

            return (
              <EllipsisText
                width={col.width}
                text={textContent}
                color={color}
                className="break-all"
              />
            );
          }

          return renderContent;
        },
      }));

    return result;
  }, [columns, tableFilters, sortList, isPhone, size, handleFilterTable]);

  // 虚拟滚动操作值
  const virtualOptions = useVirtualTable({
    height: tableHeight, // 设置可视高度
    rowHeight: rows?.[0]?.clientHeight || handleRowHeight(size),
    total: props.dataSource?.length || 0,
  });

  // 虚拟滚动组件
  const virtualComponents = useMemo(() => {
    return {
      header: {
        cell: ResizableTitle,
      },
      body: {
        wrapper: virtualOptions.body.wrapper,
      },
      table: virtualOptions.table,
    } as Components;
  }, [virtualOptions]);

  // 只带拖拽功能组件
  const components: Components = isVirtual
    ? virtualComponents
    : {
        header: {
          cell: ResizableTitle,
        },
      };

  // 滚动
  const scroll = {
    ...props.scroll,
    x: scrollX ?? 'max-content',
    y: scrollY ?? (isAuthHeight ? tableHeight : undefined),
  };

  /**
   * 处理行内样式
   */
  const handleRowClassName: TableProps<object>['rowClassName'] = (
    record: object,
    index: number,
    indent: number,
  ) => {
    const className =
      typeof rowClassName === 'string' ? rowClassName : rowClassName?.(record, index, indent);

    return `${className || ''}`;
  };

  return (
    <div
      id="table"
      className={`
        ${isStickyHeader ? 'sticky-header' : ''}
        ${isBordered !== false ? 'bordered' : ''}
        ${isZebra !== false ? 'zebra' : ''}
      `}
    >
      {isOperate && (
        <div
          data-sticky={isStickyToolbar ? 'top' : undefined}
          className="flex justify-between !mb-10px"
        >
          <div className="flex flex-wrap items-center gap-6px">
            {!!isCreate && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
                {$t('public.create')}
              </Button>
            )}
            {leftContent}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-6px">
            {rightContent ? <div>{rightContent}</div> : undefined}

            <Button
              icon={<RedoOutlined className="transform rotate-270" disabled={!!isLoading} />}
              onClick={getPage}
            >
              {$t('public.refresh')}
            </Button>

            <TableFilter
              columns={columns}
              cacheColumns={props.columns}
              getTableChecks={getTableChecks}
            />
          </div>
        </div>
      )}
      <div ref={tableRef}>
        <Table
          rowKey="id"
          // 显式声明: 靠 rc-table 推导时, 列宽自适应会取决于页面有没有写 fixed 列
          tableLayout="auto"
          pagination={false}
          loading={isLoading}
          {...props}
          rowClassName={handleRowClassName}
          style={{
            borderRadius: 10,
            borderRight: '1px solid rgba(0, 0, 0, .05)',
            borderBottom: '1px solid rgba(0, 0, 0, .05)',
            // 表头贴顶时这一层不能有 overflow: 它会成为贴顶的参照容器, 而它自己从不滚动
            ...(isStickyHeader ? undefined : { overflow: 'auto' }),
            ...props.style,
          }}
          bordered={isBordered !== false}
          scroll={scroll}
          // 位置归 CSS, 不传 offsetHeader —— 顶栏高度归布局层, 不该复制进表格组件
          sticky={isStickyHeader ? { offsetHeader: 0 } : undefined}
          components={components}
          columns={mergedColumns as ColumnsType<object>}
        />
      </div>
    </div>
  );
}
