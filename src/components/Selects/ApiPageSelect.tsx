import type { ApiPageSelectProps } from './types';
import type { DefaultOptionType, SelectProps } from 'antd/es/select';
import { Select, Spin } from 'antd';
import { MAX_TAG_COUNT } from './constants';
import { useState, useEffect, useCallback, memo } from 'react';
import { Loading } from './components/Loading';
import { $t } from '@/locales';

/**
 * @description: 根据API获取分页数据下拉组件
 */
function ApiPageSelect(props: ApiPageSelectProps) {
  const {
    pageKey = 'page',
    pageSizeKey = 'pageSize',
    queryKey = 'query',
    page = 1,
    pageSize = 20,
    onSearch,
  } = props;
  const [isLoading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const [options, setOptions] = useState<DefaultOptionType[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const hasMore = useRef(true);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 卸载时丢弃未触发的搜索
  useEffect(() => () => clearTimeout(searchTimerRef.current), []);

  // 清除自定义属性
  const params: Partial<ApiPageSelectProps> = { ...props };
  delete params.api;
  delete params.params;
  delete params.apiResultKey;
  delete params.pageKey;
  delete params.pageSizeKey;

  /**
   * 获取接口数据
   * @param nextPage - 目标页码
   * @param query - 搜索关键字
   * @param isReset - 换关键字时重新允许翻页
   */
  const getApiData = useCallback(
    async (nextPage: number, query: string, isReset = false) => {
      if (isReset) hasMore.current = true;
      if (!props.api || !hasMore.current) return;
      try {
        const { api, params, apiResultKey } = props;

        const apiPageFun = {
          [pageKey]: nextPage,
          [pageSizeKey]: pageSize,
          [queryKey]: query || undefined,
        };

        if (Array.isArray(params)) {
          for (let i = 0; i < params?.length; i++) {
            const item = params[i];

            if (item.constructor === Object) {
              params[i] = { ...item, ...apiPageFun };
            }
          }
        }

        setLoading(true);
        if (api) {
          const apiFun = Array.isArray(params) ? api(...params) : api({ ...params, ...apiPageFun });
          const { code, data } = await apiFun;
          if (Number(code) !== 200) return;
          const result = (
            apiResultKey ? (data as { [apiResultKey: string]: unknown })?.[apiResultKey] : data
          ) as DefaultOptionType[];
          if (result?.length) {
            setOptions((prev) => prev.concat(result));
          }
          hasMore.current = !!result?.length;

          // 如果不存在更多数据，尾部显示没有更多数据且居中
          if (!hasMore.current) {
            setOptions((prev) => {
              if (prev.length) {
                return prev.concat([
                  {
                    [props?.fieldNames?.label || 'label']: $t('public.noMoreData'),
                    [props?.fieldNames?.value || 'value']: $t('public.noMoreData'),
                    disabled: true,
                    className: 'text-center',
                  },
                ]);
              }
              return prev;
            });
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [
      props.api,
      props.params,
      props.apiResultKey,
      props.fieldNames,
      pageKey,
      pageSizeKey,
      queryKey,
      pageSize,
    ],
  );

  useEffect(() => {
    // 当有值且列表为空时，自动获取接口
    if (props.value && options.length === 0) {
      getApiData(currentPage, searchValue);
    }
  }, [props.value]);

  /**
   * 展开下拉回调
   * @param open - 是否展开
   */
  const onOpenChange = (open: boolean) => {
    if (open && !options?.length) getApiData(currentPage, searchValue);

    props.onOpenChange?.(open);
  };

  /** 滚动事件处理 */
  const handleScroll = useCallback(
    async (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const threshold = 10; // 距离底部阈值

      // 触底判断
      if (scrollTop + clientHeight >= scrollHeight - threshold && !isLoading && hasMore.current) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        getApiData(nextPage, searchValue);
      }
    },
    [isLoading, currentPage, searchValue, getApiData],
  );

  /** 自定义下拉框内容 */
  const popupRender = (menu: React.ReactNode) => (
    <>
      {menu}
      <div className="py-3px text-center">
        {isLoading && !!options?.length && <Spin size="small" spinning />}
      </div>
    </>
  );

  /** 处理搜索, 停止输入 200ms 后才请求 */
  const handleSearch: SelectProps['onSearch'] = (value) => {
    clearTimeout(searchTimerRef.current);

    searchTimerRef.current = setTimeout(() => {
      onSearch?.(value);

      // 重置分页与已加载项, 换关键字后从第一页重新取数
      setOptions([]);
      setCurrentPage(page);
      setSearchValue(value);
      getApiData(page, value, true);
    }, 200);
  };

  return (
    <Select
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      placeholder={$t('public.inputPleaseSelect')}
      optionFilterProp={params?.fieldNames?.label || 'label'}
      {...params}
      onSearch={handleSearch}
      onPopupScroll={handleScroll}
      popupRender={popupRender}
      loading={isLoading}
      options={options}
      notFoundContent={isLoading && <Loading />}
      onOpenChange={onOpenChange}
    />
  );
}

const ApiPageSelectMemo = memo(ApiPageSelect, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value && prevProps.api === nextProps.api;
});

export { ApiPageSelectMemo as ApiPageSelect };
