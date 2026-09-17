import type { TableProps } from 'antd';
import type { RowLayoutColumnNum } from '@south/components';
import type { ReactNode, Ref } from 'react';
import type { QueryFetcher, QueryState, QueryStore } from './store/queryStore';
import { useEvent } from '@south/components';
import { Form } from 'antd';
import { useEffect, useImperativeHandle, useState } from 'react';
import { BaseCard } from '../Card';
import { BasePagination } from '../Pagination';
import { QueryBar } from '../QueryBar';
import { useSlice } from '../SliceStore';
import { BaseTable } from '../Table';
import { createQueryStore } from './store/queryStore';
import { toQueryParams } from './store/transform';

/**
 * 一片状态的归属.
 *
 * `external` 的准确含义是**显示覆盖**, 不是接管行为 —— 组件内部始终维护并使用自己那份值,
 * 取数, 跨片联动与订阅通知一律按内部值走, 页面传的值只在渲染取值时盖住显示.
 *
 * 因此页面拿到 `onChange` 却不回写时, 会看到「条件没变但结果变了」: 表格已按内部值取了新数据,
 * 而摘要显示的还是页面那份旧值. 这是本设计认下的代价, 不做告警.
 */
export type SliceOwner = 'internal' | 'external';

/**
 * 一片状态在 props 上的声明.
 *
 * 判别联合: 写了 `owner: 'external'`, `value` 与 `onChange` 就是必给的, 漏一个是编译错误.
 * 不做成「owner 单列一个 prop」或「受控清单数组」—— 那两种的约束建立在泛型推导不退化上,
 * 而页面用对象展开传 props 时它会安静退化, 一个静默失效的类型约束比没有约束更糟.
 */
export type SliceProp<T> =
  | {
      /** 归属, 缺省 internal. 语义见 {@link SliceOwner} */
      owner?: 'internal';
      /** 初值 */
      initial?: T;
      /** 该片变更后的通知. 非受控片给它只为观察 */
      onChange?: (next: T) => void;
    }
  | {
      /** 归属. 语义见 {@link SliceOwner} —— external 只是显示覆盖 */
      owner: 'external';
      /** 显示用的值 */
      value: T;
      /** 该片变更后的通知. 受控片必须给, 否则页面永远收不到变更 */
      onChange: (next: T) => void;
    };

/** 分页受控时 ref 上没有 `set` —— 受控片只读, 见 {@link SliceOwner} */
type SettableOf<T> = T extends { owner: 'external' } ? never : 'pagination';

/**
 * 取一片的起点.
 *
 * 受控片拿首次的受控值当内部初值: 内部那份才是驱动取数的, 不播种的话首屏会按空条件取一次.
 * @param slice - 该片的 props 声明
 */
function initialOf<T>(slice?: SliceProp<T>) {
  if (!slice) return undefined;

  return slice.owner === 'external' ? slice.value : slice.initial;
}

interface Props<TItem, TPagination extends SliceProp<PaginationData> | false | undefined> {
  /** 搜索项定义, 声明顺序就是排布顺序 */
  searchList: BaseSearchList[];
  /** 表格列定义 */
  columns: TableColumn<TItem>[];
  /** 取数函数. 收平铺的条件与分页, 可以把 service 直接传进来 */
  fetchPage: QueryFetcher<TItem>;
  /** 已提交条件那一片. 不传即由组件自己维护 */
  committed?: SliceProp<BaseFormData>;
  /**
   * 分页那一片. 不传即由组件自己维护, 给 `false` 则这张表没有分页可言 —— 分页器不渲染.
   *
   * 关掉的只是分页器: 那一片状态照常活着, 没人改它于是恒为第一页, 取数函数收到的 `page`
   * 与 `pageSize` 由它自己决定要不要看.
   */
  pagination?: TPagination;
  /** 搜索栏一行几列, 透传 QueryBar */
  columnNum?: RowLayoutColumnNum;
  /** 搜索栏的行数档位, 透传 QueryBar */
  rowOptions?: number[];
  /** 行的唯一键, 原样透传 antd. 键要由几个字段拼出来时给函数 */
  rowKey?: TableProps<TItem>['rowKey'];
  /** 展开行, 原样透传 antd. 展开了哪几行归页面, 这一层不碰 */
  expandable?: TableProps<TItem>['expandable'];
  /**
   * true 则挂载时不自动取数, 全部由 ref 触发.
   *
   * 给在 keepalive 里的页面用: 那里的 `useEffectOnActive` 挂载时也跑一次, 不关掉就与组件自己的
   * 挂载取数重一发.
   */
  manual?: boolean;
  /** 表格操作行左侧的操作区, 与右侧的刷新, 列筛选同行. 哑的: 放什么由页面决定, 这里只留位置 */
  toolbar?: ReactNode;
  /** 操作行是否跟着吸顶, 表头恒吸, 不受它影响 —— 滚动时看不见列名, 数据就读不成 */
  stickyToolbar?: boolean;
  /**
   * 外部取数中, 与内部那一次取或.
   *
   * 本地模式下真正的等待在页面那次取全量上 —— 内部的 `fetchPage` 只是一遍同步的筛, 它的 loading
   * 一闪而过, 表格靠它会先空一屏再冒出数据.
   */
  isLoading?: boolean;
  /**
   * 重拉数据. **给了它就进本地模式**, 语义见 `QueryBar` 的同名 prop.
   *
   * 一次拉全在客户端筛的页面走这条: 全量归页面, `fetchPage` 只对手上那份做筛选与排序,
   * 而这个回调负责把全量取新, 取回来后由页面调一次 `reload` 让它重筛.
   */
  onRefresh?: () => Promise<unknown>;
  /** 拿到查询状态管理器: 读条件, 改条件, 重查都从它走 */
  ref?: Ref<QueryStore<TItem, SettableOf<TPagination>>>;
}

/**
 * 搜索栏加表格加分页的排布, 外带查询状态.
 *
 * 状态与请求都在内部的 store 里, 页面只给声明与一个取数函数, 其余从 ref 交出去的 store 上走.
 * 它认识查询与分页, 但不认识任何业务 —— 列与搜索项都从 props 来.
 *
 * 形状上通用而位置先留在 src, 第二个列表页落地时再看要不要搬进包.
 * @param props - 组件参数
 */
export function SearchTable<
  TItem extends object,
  TPagination extends SliceProp<PaginationData> | false | undefined = undefined,
>(props: Props<TItem, TPagination>) {
  const {
    searchList,
    columns,
    fetchPage,
    committed: committedProp,
    columnNum,
    rowOptions,
    rowKey,
    manual,
    toolbar,
    stickyToolbar,
    expandable,
    isLoading,
    onRefresh,
    ref,
  } = props;
  // 泛型收窄只服务 ref 的类型; 组件内部要改得动分页 (用户点页码走的就是这条路), 所以这里放宽
  const paginationInput = props.pagination as SliceProp<PaginationData> | false | undefined;
  /** 分页器要不要渲染. 与「那一片归谁」是两件事, 后者在关掉分页时无从谈起 */
  const isPaged = paginationInput !== false;
  const paginationProp = isPaged ? paginationInput : undefined;

  // 表单实例由这一层持有: ref 的 getDraft 要读实时值, 而 draft 只住在这个实例里
  const [form] = Form.useForm();

  // 转发身份恒定而内部读到最新: store 只造一次, 直接把闭包交进去会把第一帧的 fetch 与回调焊死在里面
  const runFetch = useEvent(fetchPage);
  const runToParams = useEvent((values: BaseFormData) => toQueryParams(values, searchList));
  const notifyCommitted = useEvent((next: BaseFormData) => committedProp?.onChange?.(next));
  const notifyPagination = useEvent((next: PaginationData) => paginationProp?.onChange?.(next));

  const [store] = useState(() =>
    createQueryStore<TItem>({
      fetch: runFetch,
      toParams: runToParams,
      readDraft: () => form.getFieldsValue(),
      committed: { initial: initialOf(committedProp), onChange: notifyCommitted },
      pagination: { initial: initialOf(paginationProp), onChange: notifyPagination },
    }),
  );

  useImperativeHandle(ref, () => store as QueryStore<TItem, SettableOf<TPagination>>, [store]);

  useEffect(() => {
    // 挂载即取一次: 列表页首屏就该有数据. 卸载时销毁, 在飞的响应一律作废
    if (!manual) store.reload();

    return () => store.destroy();
    // manual 只在挂载那一刻起作用, 中途改它不该重新取数
  }, [store]);

  // 片的类型要显式给: 组件里 TItem 还没定, TS 沿 QueryStore 的继承链反推不出 QueryState<TItem>
  const innerCommitted = useSlice<QueryState<TItem>, 'committed'>(store, 'committed');
  const innerPagination = useSlice<QueryState<TItem>, 'pagination'>(store, 'pagination');
  const result = useSlice<QueryState<TItem>, 'result'>(store, 'result');
  // 受控只盖显示: 内部那份照常驱动取数, 这里只决定屏幕上显示谁
  const committed = committedProp?.owner === 'external' ? committedProp.value : innerCommitted;
  const pagination = paginationProp?.owner === 'external' ? paginationProp.value : innerPagination;

  return (
    <>
      <QueryBar
        isSticky
        list={searchList}
        form={form}
        committed={committed}
        isLoading={result.loading}
        columnNum={columnNum}
        rowOptions={rowOptions}
        onSearch={(values) => store.search(() => values)}
        onRefresh={onRefresh}
      />

      <BaseCard className="mt-10px">
        <BaseTable
          isStickyHeader
          isStickyToolbar={stickyToolbar}
          isLoading={result.loading || isLoading}
          rowKey={rowKey}
          columns={columns}
          dataSource={result.items}
          leftContent={toolbar}
          expandable={expandable}
          getPage={() => store.reload()}
        />

        {isPaged && (
          <BasePagination
            isSticky
            disabled={result.loading}
            current={pagination.page}
            pageSize={pagination.pageSize}
            total={result.total}
            onChange={(page, pageSize) => store.set('pagination', () => ({ page, pageSize }))}
          />
        )}
      </BaseCard>
    </>
  );
}
