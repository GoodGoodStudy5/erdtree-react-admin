import type { ReadableSliceStore } from '../../SliceStore';
import { createSliceStore } from '../../SliceStore';
// 显式引而不靠自动导入: 用例跑在没有那个插件的环境里, 靠自动导入的值在测试中是 undefined
import { INIT_PAGINATION } from '@/utils';

/** store 管的三片状态 */
export type QuerySlice = 'committed' | 'pagination' | 'result';

/** 取数结果那一片 */
export interface QueryResult<TItem> {
  /** 当前页的数据 */
  items: TItem[];
  /** 总条数 */
  total: number;
  /** 是否有请求在飞. 被后发请求顶掉的旧请求不再影响它 */
  loading: boolean;
}

/**
 * 三片的形状.
 *
 * 写成 type 而不是 interface: 通用层的片约束是 `Record<string, unknown>`, 而 interface 没有隐式
 * 索引签名, 套不进去.
 */
export type QueryState<TItem> = {
  /** 已提交的查询条件. 表单原值形状 (日期仍是 dayjs, 空串仍在), 不含分页 */
  committed: BaseFormData;
  /** 分页. 页号从 1 起 */
  pagination: PaginationData;
  /** 取数结果 */
  result: QueryResult<TItem>;
};

/** 一片状态在 store 这一层的配置. 归属不在这里 —— 它只影响渲染取值, 是 props 层的事 */
export interface QuerySliceConfig<T> {
  /** 初值 */
  initial?: T;
  /** 该片变更后的通知 */
  onChange?: (next: T) => void;
}

/** 取数函数. 收平铺的条件与分页, 与 servers 层现有签名对齐, 页面可直接把 service 传进来 */
export type QueryFetcher<TItem> = (
  input: PaginationData & Record<string, unknown>,
) => Promise<PageServerResult<TItem[]>>;

/** 造 store 要的东西 */
export interface QueryStoreConfig<TItem> {
  /** 取数函数 */
  fetch: QueryFetcher<TItem>;
  /**
   * 出口层: 把已提交条件转成请求参数.
   *
   * 转换是独立于「实时 vs 已提交」的第三根轴, 只在条件出门时作用一次. 由 SearchTable 挂上固定的
   * 那一套, 不透给页面.
   */
  toParams: (committed: BaseFormData) => Record<string, unknown>;
  /**
   * 读实时表单值.
   *
   * draft 不是片 —— 02 票定了它永远住在 antd 的 `Form` 实例里, store 看不见也管不着,
   * 只能借一个读口. 由 `SearchTable` 接上 `QueryBar` 的 form.
   */
  readDraft: () => BaseFormData;
  /** 已提交条件那一片 */
  committed?: QuerySliceConfig<BaseFormData>;
  /** 分页那一片 */
  pagination?: QuerySliceConfig<PaginationData>;
}

/**
 * 查询状态管理器.
 *
 * 它是页面拿到的东西: `SearchTable` 的 ref 直接交出这个实例, 所以下面每个成员都是公共契约.
 *
 * **活在 React 外**: 读写与动词直接摸它, 不经 React, 因此在事件处理器与异步回调里调都读得准,
 * 没有陈旧闭包. 要影响渲染的地方用 `useSlice` 按片订阅.
 *
 * 它建在通用的多片容器上, 自己只加查询这一层特有的三件事: 取数与竞态屏蔽, 出口层,
 * 以及「改条件把页码归第一页」这条跨片联动.
 *
 * 显式继承只读视图而不只是碰巧同形: 那样 `useSlice` 才推得出片的类型, 调用点不必把片名在类型位
 * 再写一遍.
 *
 * @typeParam TItem - 表格一行的类型
 * @typeParam TSettable - 允许 `set` 的片. 分页受控时收窄成 `never`, 于是 `set` 在类型上不可调用
 */
export interface QueryStore<
  TItem,
  TSettable extends QuerySlice = 'pagination',
> extends ReadableSliceStore<QueryState<TItem>> {
  /**
   * 改一片并重查.
   *
   * 只有分页片可改: 已提交条件走 {@link QueryStore.search} (取数由它驱动, 两个动词会是同一件事),
   * 取数结果由 store 自己维护.
   */
  set: (slice: TSettable, updater: (current: PaginationData) => PaginationData) => void;
  /**
   * 改已提交条件并重查, 页码回到第一页.
   *
   * updater 只收已提交条件那一片, 收什么返回什么; 想读别的片用第二个参数.
   * 收整份状态却只返回一片会让人写出 `(s) => ({ ...s, x })` 把分页与数据一起塞进条件, 而那不报错.
   */
  search: (
    updater: (committed: BaseFormData, store: QueryStore<TItem, TSettable>) => BaseFormData,
  ) => void;
  /**
   * 读实时表单值: 用户正在填, 还没点搜索的那一份.
   *
   * 单给一个动词而不并进 `get`: draft **不是片** —— 它住在 antd 的 `Form` 实例里, 既不可订阅
   * 也不可 set, 给它一个片名会让调用方以为 `subscribe('draft')` 能用.
   */
  getDraft: () => BaseFormData;
  /** 按当前条件与分页重取, 不改任何片 */
  reload: () => void;
  /** 当前已提交条件过出口层的结果. 导出按当前条件取参数就用它 */
  toParams: () => Record<string, unknown>;
  /** 卸载时调. 之后所有动词记日志后静默返回, 在飞的响应一律作废 */
  destroy: () => void;
}

/**
 * 造一个查询状态管理器.
 *
 * 藏住四件事: 多片的读写与通知 (由通用层承担), 取数, 竞态, 跨片联动.
 * 页面不自己造它 —— 由 `SearchTable` 造好再从 ref 交出去.
 * @param config - 取数函数, 出口层与各片配置
 */
export function createQueryStore<TItem>(config: QueryStoreConfig<TItem>): QueryStore<TItem> {
  const slices = createSliceStore<QueryState<TItem>>({
    committed: { initial: config.committed?.initial ?? {}, onChange: config.committed?.onChange },
    pagination: {
      initial: { ...INIT_PAGINATION, ...config.pagination?.initial },
      onChange: config.pagination?.onChange,
    },
    result: { initial: { items: [], total: 0, loading: false } },
  });

  /** 发起序号. 每次取数自增, 响应回来对不上号就是被顶掉的旧请求, 整条作废 */
  let ticket = 0;

  const get: QueryStore<TItem>['get'] = (slice) => slices.get(slice);

  const toParams: QueryStore<TItem>['toParams'] = () => config.toParams(get('committed'));

  /**
   * 卸载后调动词只记日志不抛.
   *
   * 那多半是异步回调的竞态, 调用方无从处理; 此时抛会炸掉一条与本组件无关的 promise 链.
   * 挂载前调不必在这里管 —— 那时 `ref.current` 还是 null, 取属性自己就炸了.
   * @param verb - 被调的动词名, 只用于日志
   */
  const isGone = (verb: string) => {
    if (slices.isDestroyed()) console.warn(`[QueryStore] 组件已卸载, ${verb} 被忽略`);

    return slices.isDestroyed();
  };

  async function asyncRunFetch() {
    const current = (ticket += 1);

    slices.set('result', (result) => ({ ...result, loading: true }));
    try {
      const page = await config.fetch({ ...toParams(), ...get('pagination') });

      if (current !== ticket || slices.isDestroyed()) return;
      slices.set('result', () => ({
        items: page.items ?? [],
        total: page.total,
        loading: false,
      }));
    } catch (error) {
      if (current !== ticket || slices.isDestroyed()) return;
      // 提示由响应拦截器统一弹, 这一层只做两件事: 保住上一次的 items 不把表格清空, 收掉 loading
      console.error(error);
      slices.set('result', (result) => ({ ...result, loading: false }));
    }
  }

  const search: QueryStore<TItem>['search'] = (updater) => {
    if (isGone('search')) return;
    const next = updater(get('committed'), api);
    const prevPage = get('pagination');
    /**
     * 改条件把页码归第一页: 少了这句, 用户在第 5 页改条件后看到的是新条件下的第 5 页, 而那页多半是空的.
     *
     * 本来就在第一页时原样传回去而不是重造一个对象 —— 通用层按引用判「变没变」, 重造会让分页凭空
     * 通知一次.
     */
    const nextPage =
      prevPage.page === INIT_PAGINATION.page
        ? prevPage
        : { ...prevPage, page: INIT_PAGINATION.page };

    // 两片一起改, 只走一轮通知: 分两次改会让「新条件配旧页码」那个半截状态被订阅者看见
    slices.patch({ committed: next, pagination: nextPage });
    void asyncRunFetch();
  };

  const set: QueryStore<TItem>['set'] = (slice, updater) => {
    if (isGone('set')) return;
    // 判据是调用方需要知道自己调错了片. 不按归属挡: 受控片的写口在类型上已经收成 never,
    // 而组件内部改分页 (用户点了页码) 走的是同一条路 —— 运行期挡住会把自己人一起挡了
    if (slice !== 'pagination') throw new Error(`[QueryStore] ${slice} 片不可 set`);

    slices.set('pagination', updater);
    void asyncRunFetch();
  };

  const getDraft: QueryStore<TItem>['getDraft'] = () => config.readDraft();

  const reload: QueryStore<TItem>['reload'] = () => {
    if (isGone('reload')) return;
    void asyncRunFetch();
  };

  const destroy: QueryStore<TItem>['destroy'] = () => {
    slices.destroy();
    // 推掉序号, 在飞的响应回来时一律对不上号
    ticket += 1;
  };

  const api: QueryStore<TItem> = {
    get,
    set,
    search,
    getDraft,
    reload,
    subscribe: slices.subscribe,
    toParams,
    destroy,
  };

  return api;
}
