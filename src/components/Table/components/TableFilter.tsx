import { Button, Popover, Divider, Checkbox } from 'antd';
import type { TableProps, CheckboxProps } from 'antd';
import { useState, memo } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import type { TableColumn } from '#/public';
import { DragContent } from './DragContent';
import { $t } from '@/locales';

/**
 * 表格字段筛选
 */
export interface CheckboxList {
  label: string;
  value: string;
}

interface Props {
  columns: TableProps['columns'];
  cacheColumns: TableProps['columns'];
  className?: string;
  getTableChecks: (checks: string[], sortList: string[]) => void;
}

/**
 * 过滤表格数据为多选组数据
 * @param columns - 表格数据
 */
const filterColumns = (columns: TableProps['columns']) => {
  const result: CheckboxList[] = [],
    currentOptions: string[] = [];

  if (!columns?.length) return { list: result, checkedList: currentOptions };

  for (let i = 0; i < columns.length; i++) {
    const item = columns[i];
    const { dataIndex } = item as { dataIndex: string };

    if (!item.hidden && dataIndex) {
      currentOptions?.push(dataIndex);
    }

    result.push({
      label: item.title as string,
      value: dataIndex,
    });
  }

  return { list: result, checkedList: currentOptions };
};

function TableFilter(props: Props) {
  const { columns, cacheColumns, className, getTableChecks } = props;
  const [isOpen, setOpen] = useState(false);
  // 首屏字段勾选状态由 columns 播种, 后续由用户勾选与拖拽接管
  const [list, setList] = useState<CheckboxList[]>(() => filterColumns(columns).list);
  const [checkedList, setCheckedList] = useState<string[]>(
    () => filterColumns(columns).checkedList,
  );
  // 已生效的勾选与顺序. 暂存与它的差就是待确认的改动 —— 面板据此标色, 也据此决定给不给取消按钮
  const [applied, setApplied] = useState(() => {
    const seeded = filterColumns(columns);

    return { checked: seeded.checkedList, list: seeded.list };
  });
  const pendingValues = list
    .map((item) => item.value)
    .filter((value) => checkedList.includes(value) !== applied.checked.includes(value));
  // 顺序变了也算待确认, 但标不出色: 顺序是整体的, 落不到单条上
  const isOrderChanged =
    list.map((item) => item.value).join() !== applied.list.map((item) => item.value).join();
  const hasPending = pendingValues.length > 0 || isOrderChanged;
  const checkAll = list.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < list.length;
  const params: Partial<Props> = { ...props };
  delete params.getTableChecks;
  delete params.cacheColumns;

  /** 处理点击事件 */
  const handleClick = () => {
    setOpen(!isOpen);
  };

  /**
   * 监听多选组数据
   * @param checkedValue - 已选数据
   */
  const onChangeCheckbox = (checkedValue: string[]) => {
    setCheckedList(checkedValue);
  };

  /** 确认. 面板里的勾选与拖拽只改暂存, 这里是唯一的生效出口 */
  const handleConfirm = () => {
    getTableChecks(
      checkedList,
      list.map((item) => item.value),
    );
    setApplied({ checked: checkedList, list });
    setOpen(false);
  };

  /** 取消. 暂存回到已生效状态, 待确认的勾选与顺序一并丢弃 */
  const handleCancel = () => {
    setCheckedList(applied.checked);
    setList(applied.list);
  };

  /** 全选 */
  const onCheckAllChange: CheckboxProps['onChange'] = (e) => {
    setCheckedList(e.target.checked ? list.map((item) => item.value) : []);
  };

  /** 重置列表 */
  const handleReset = () => {
    const newList: CheckboxList[] = [];
    const allCheckedList = (cacheColumns as TableColumn[])
      ?.map((item) => (item as { dataIndex: string })?.dataIndex)
      ?.filter(Boolean);

    for (let i = 0; i < (cacheColumns as TableColumn[])?.length; i++) {
      const item = (cacheColumns as TableColumn[])[i];
      newList.push({
        label: item.title as string,
        value: item.dataIndex as string,
      });
    }

    setCheckedList(allCheckedList);
    setList(newList);
  };

  /** 处理拖拽结束 */
  const handleDragEnd = (list: CheckboxList[]) => {
    setList(list);
  };

  // 渲染内容
  const content = () => {
    return (
      <div className="min-w-140px flex flex-col">
        <div className="px-5px">
          <Checkbox
            className="w-full !pl-10px !py-3px hover:bg-blue-100 border-rd-5px"
            indeterminate={indeterminate}
            onChange={onCheckAllChange}
            checked={checkAll}
          >
            {$t('public.checkAll')}
          </Checkbox>
        </div>

        <Divider className="!my-5px" />

        {/* 列多时条目会顶穿视口, 因此只让条目区滚动, 全选与重置留在滚动区外 */}
        <Checkbox.Group
          className="flex flex-col !px-5px !pb-5px relative max-h-50vh overflow-y-auto"
          value={checkedList}
          onChange={onChangeCheckbox}
        >
          <DragContent list={list} pendingValues={pendingValues} handleDragEnd={handleDragEnd} />
        </Checkbox.Group>

        <Divider className="!mt-10px !mb-5px" />

        <div className="flex items-center gap-4px px-5px">
          <Button className="flex-1" type="link" onClick={handleReset}>
            {$t('public.reset')}
          </Button>
          {hasPending && (
            <Button className="flex-1" onClick={handleCancel}>
              {$t('public.cancel')}
            </Button>
          )}
          <Button className="flex-1" type="primary" onClick={handleConfirm}>
            {$t('public.confirm')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottom"
      styles={{
        container: {
          padding: '8px 0 5px',
        },
      }}
      open={isOpen}
      onOpenChange={handleClick}
    >
      <div {...params} className={`${className} inline-block`}>
        <Button icon={<SettingOutlined />}>{$t('public.columnFilter')}</Button>
      </div>
    </Popover>
  );
}

const TableFilterMemo = memo(TableFilter, (prevProps, nextProps) => {
  return (
    prevProps.columns === nextProps.columns && prevProps.cacheColumns === nextProps.cacheColumns
  );
});

export { TableFilterMemo as TableFilter };
