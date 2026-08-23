import type { ReactElement } from 'react';
import type { SelectProps } from 'antd';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Select } from 'antd';
import { useEvent, useRequest } from '../hooks';
import { useLocale } from '../locale';
import { propsMerge } from '../utils';
import {
  filterVisibleOptions,
  matchOptionByKeys,
  renderColumnsHeader,
  renderColumnsRow,
} from './options';
import type {
  SearchSelectOption,
  SearchSelectProps,
  SearchSelectRef,
  SearchSelectValue,
} from './types';
import './SearchSelect.less';

/** 搜索防抖默认 500ms: 再快就是边打字边发请求, 再慢用户会觉得下拉卡住了 */
const DEFAULT_DEBOUNCE_WAIT = 500;
/** 多列下拉的默认弹层宽度. 跟着输入框宽度走放不下几列表格 */
const COLUMNS_POPUP_WIDTH = 360;
/** request 缺省时的占位. fetchOptions 会先挡住调用, 它只为让 useRequest 的签名成立 */
const NO_REQUEST = async () => [];

/**
 * 自带远程搜索的下拉框: request + 防抖 + 首次/聚焦加载 + 联动屏蔽全部内收, 调用方只给数据源.
 *
 * 四条设计:
 *
 * 1. 异步态内收 —— loading、防抖、竞态屏蔽都在组件里, 页面不再各写一遍;
 * 2. 外部同名回调经事件合成共存 —— 传了自己的 onSearch / onFocus 不会杀掉内部行为;
 * 3. 联动时立刻屏蔽旧选项 (fetchOptionsForCascade) —— 上游一变, 用户就选不到已失效的项;
 * 4. 数据契约前移 —— request 必须返回 `{label, value}`, 组件不为脏数据兜底.
 */
export function SearchSelect<
  OT extends SearchSelectOption = SearchSelectOption,
  VT extends SearchSelectValue<OT> = OT['value'],
>(props: SearchSelectProps<OT, VT>) {
  const {
    ref,
    request,
    options,
    debounceWait = DEFAULT_DEBOUNCE_WAIT,
    autoLoad = true,
    allowFocusLoad = true,
    searchByLocal = false,
    searchKeys,
    include,
    exclude,
    columnsTable,
    ...restProps
  } = props;
  const locale = useLocale('SearchSelect');
  /** 联动请求期间屏蔽旧选项, 直到新数据到位 */
  const [isCascadeBlocked, setCascadeBlocked] = useState(false);
  const searchKeywordRef = useRef('');
  const isOptionsControlled = options !== undefined;
  const { data, loading, run, runAsync } = useRequest<OT[], [string?]>(request ?? NO_REQUEST, {
    manual: true,
    debounceWait,
    onSuccess: () => setCascadeBlocked(false),
    onError: (error) => {
      setCascadeBlocked(false);
      // 选项拉不回来时下拉只是空的, 不该把页面搞崩; 留一行日志给排查
      console.error(error);
    },
  });

  const fetchOptions = useEvent(async (keyword?: string) => {
    // options 受控时数据归调用方管, 没有 request 时也无处可拉
    if (isOptionsControlled || !request) {
      return undefined;
    }
    return runAsync(keyword);
  });

  const fetchOptionsForCascade = useEvent(async (keyword?: string) => {
    // 拉不了数据就别屏蔽: 没有新数据来解除屏蔽, 等于把下拉锁死
    if (isOptionsControlled || !request) {
      return undefined;
    }
    setCascadeBlocked(true);
    return fetchOptions(keyword);
  });

  /** 不等结果的内部触发. 失败已由 onError 记过日志, 这里只是不让它变成未处理的 rejection */
  const triggerFetch = useEvent((keyword?: string) => {
    void fetchOptions(keyword).catch(() => undefined);
  });

  const handleSearch = useEvent((keyword: string) => {
    searchKeywordRef.current = keyword;
    run(keyword.trim());
  });

  const handleOpenChange = useEvent((open: boolean) => {
    // 关闭时若还留着搜索词, 内部补一次空搜索, 下次打开看到的才是完整选项.
    // 不转发给外部 onSearch —— 这一下不是用户输入
    if (!open && searchKeywordRef.current !== '') {
      handleSearch('');
    }
  });

  useEffect(() => {
    // 首次加载只在挂载时打一次, 之后由搜索、聚焦与联动驱动
    if (autoLoad) {
      triggerFetch();
    }
  }, [autoLoad, triggerFetch]);

  const flatProps = flattenShowSearch(restProps);
  const visibleOptions = filterVisibleOptions(options ?? data, { include, exclude });
  /** 远程搜索: 服务端按关键字给结果, 本地就不再过滤一遍 */
  const isRemoteSearch = request !== undefined && !searchByLocal && flatProps.showSearch !== false;
  /** 本地过滤参与匹配的字段: searchKeys 优先, 多列下拉默认取各列, 否则跟 optionFilterProp */
  const localSearchKeys =
    searchKeys ??
    columnsTable?.columns.map((column) => column.dataIndex as string) ??
    (Array.isArray(flatProps.optionFilterProp)
      ? flatProps.optionFilterProp
      : [flatProps.optionFilterProp ?? 'label']);

  const mergedProps = propsMerge(
    {
      className: 'search-select',
      showSearch: true,
      allowClear: true,
      placeholder: locale.placeholder,
      loading,
      // 远程搜索交给服务端, 本地不再过滤一遍; 本地模式下按 localSearchKeys 多字段模糊匹配
      filterOption: isRemoteSearch
        ? false
        : (keyword: string, option?: OT) => matchOptionByKeys(option, keyword, localSearchKeys),
      ...(columnsTable
        ? {
            popupMatchSelectWidth: COLUMNS_POPUP_WIDTH,
            classNames: { popup: { root: 'search-select-table-popup' } },
            popupRender: (menu: ReactElement) => (
              <>
                {renderColumnsHeader(columnsTable)}
                {menu}
              </>
            ),
            optionRender: ({ data: option }: { data: OT }) =>
              renderColumnsRow(option, columnsTable),
          }
        : undefined),
    } as SelectProps<VT, OT>,
    flatProps,
    {
      onSearch: isRemoteSearch ? handleSearch : undefined,
      onFocus: allowFocusLoad ? () => triggerFetch() : undefined,
      onOpenChange: handleOpenChange,
    },
  );

  useImperativeHandle(ref, (): SearchSelectRef<OT> => ({
    options: visibleOptions,
    isLoading: loading,
    fetchOptions,
    fetchOptionsForCascade,
  }));

  return (
    <Select<VT, OT>
      {...(mergedProps as SelectProps<VT, OT>)}
      // 联动请求期间清空选项: 旧选项已经失效, 让用户选到它比让他等一下更糟
      options={isCascadeBlocked ? [] : visibleOptions}
    />
  );
}

/**
 * 把 antd 6 的 showSearch 配置对象摊平成顶层同名 props.
 *
 * rc-select 里配置对象会盖掉顶层同名 props, 于是调用方写
 * `showSearch={{ onSearch }}` 就会静默杀掉内部的防抖搜索 —— 正是 SearchAutoComplete 的死法.
 * 摊平之后事件合成只有一条路, 两种写法都能与内部行为共存.
 */
function flattenShowSearch<T extends { showSearch?: unknown }>(props: T): T {
  const { showSearch } = props;

  if (typeof showSearch !== 'object' || showSearch === null) {
    return props;
  }
  return { ...props, showSearch: true, ...showSearch };
}
