import type { QueryFetcher } from '../store/queryStore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryStore } from '../store/queryStore';

interface Row {
  id: string;
}

/** 造一个立刻成功的取数函数, 记下每次收到的入参 */
function okFetch(items: Row[] = [], total = 0) {
  return vi.fn(async () => ({ items, total })) as unknown as QueryFetcher<Row> & {
    mock: { calls: unknown[][] };
  };
}

/** 出口层在用例里退化成恒等, 转换本身归 transform 的用例 */
const identity = (committed: BaseFormData) => committed;

/** 实时表单值在用例里恒为空, 读它的行为单独一条用例管 */
const emptyDraft = () => ({});

/** 等一轮微任务, 让 store 内部那个 await 走完 */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('createQueryStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('search 改条件后重查, 并把页码归第一页', async () => {
    const fetch = okFetch([{ id: 'a' }], 1);
    const store = createQueryStore<Row>({
      fetch,
      toParams: identity,
      readDraft: emptyDraft,
      pagination: { initial: { page: 5, pageSize: 20 } },
    });

    store.search(() => ({ invoiceNo: 'X' }));
    await tick();

    expect(store.get('committed')).toEqual({ invoiceNo: 'X' });
    expect(store.get('pagination').page).toBe(1);
    expect(fetch).toHaveBeenCalledWith({ invoiceNo: 'X', page: 1, pageSize: 20 });
    expect(store.get('result')).toEqual({ items: [{ id: 'a' }], total: 1, loading: false });
  });

  it('updater 只收已提交条件那一片, 第二个参数是 store', () => {
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: identity,
      readDraft: emptyDraft,
    });
    const seen: unknown[] = [];

    store.search((committed, self) => {
      seen.push(committed, self.get('pagination'));
      return { a: 1 };
    });

    expect(seen[0]).toEqual({});
    expect(seen[1]).toEqual({ page: 1, pageSize: 20 });
  });

  it('早发晚到的响应整条作废, 只认最后一次', async () => {
    const order: string[] = [];
    const fetch = vi.fn(async (input: Record<string, unknown>) => {
      const tag = String(input.tag);
      // 第一次故意慢, 让它在第二次之后才回来
      await new Promise((resolve) => setTimeout(resolve, tag === 'slow' ? 20 : 0));
      order.push(tag);

      return { items: [{ id: tag }], total: 1 };
    }) as unknown as QueryFetcher<Row>;
    const store = createQueryStore<Row>({ fetch, toParams: identity, readDraft: emptyDraft });

    store.search(() => ({ tag: 'slow' }));
    store.search(() => ({ tag: 'fast' }));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(order).toEqual(['fast', 'slow']);
    expect(store.get('result').items).toEqual([{ id: 'fast' }]);
    expect(store.get('result').loading).toBe(false);
  });

  it('取数失败时保住上一次的数据, 并收掉 loading', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined);
    let ok = true;
    const fetch = vi.fn(async () => {
      // 失败走 reject: 业务码非成功由请求层抛出, 不进返回值
      if (!ok) throw new Error('炸了');
      return { items: [{ id: 'a' }], total: 1 };
    }) as unknown as QueryFetcher<Row>;
    const store = createQueryStore<Row>({ fetch, toParams: identity, readDraft: emptyDraft });

    store.reload();
    await tick();
    expect(store.get('result').items).toEqual([{ id: 'a' }]);

    ok = false;
    store.search(() => ({ q: 1 }));
    await tick();

    expect(store.get('result').items).toEqual([{ id: 'a' }]);
    expect(store.get('result').total).toBe(1);
    expect(store.get('result').loading).toBe(false);
  });

  it('set 调错片时抛出', () => {
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: identity,
      readDraft: emptyDraft,
    });

    expect(() =>
      (store.set as unknown as (slice: string, updater: unknown) => void)('committed', () => ({})),
    ).toThrow('不可 set');
  });

  it('set 改内部值并通知外部', () => {
    const onChange = vi.fn();
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: identity,
      readDraft: emptyDraft,
      pagination: { onChange },
    });

    store.set('pagination', (p) => ({ ...p, page: 2 }));

    expect(store.get('pagination').page).toBe(2);
    expect(onChange).toHaveBeenCalledWith({ page: 2, pageSize: 20 });
  });

  it('各片变更后通知外部, 页码没变则不通知分页', () => {
    const onCommitted = vi.fn();
    const onPagination = vi.fn();
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: identity,
      readDraft: emptyDraft,
      committed: { onChange: onCommitted },
      pagination: { onChange: onPagination },
    });

    // 已在第一页, 联动不改页码, 所以分页不该收到通知
    store.search(() => ({ a: 1 }));
    expect(onCommitted).toHaveBeenCalledWith({ a: 1 });
    expect(onPagination).not.toHaveBeenCalled();

    store.set('pagination', (p) => ({ ...p, page: 3 }));
    expect(onPagination).toHaveBeenCalledWith({ page: 3, pageSize: 20 });

    // 第 3 页上改条件, 这次页码归 1, 分页要收到通知
    store.search(() => ({ a: 2 }));
    expect(onPagination).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 });
  });

  it('按片订阅: 只有那片变了才通知', async () => {
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: identity,
      readDraft: emptyDraft,
    });
    const onCommitted = vi.fn();
    const onResult = vi.fn();

    store.subscribe('committed', onCommitted);
    store.subscribe('result', onResult);

    store.search(() => ({ a: 1 }));
    expect(onCommitted).toHaveBeenCalledTimes(1);
    await tick();

    // 取数只动 result 那一片, committed 不该再被通知
    expect(onCommitted).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls.length).toBeGreaterThan(0);
  });

  it('getDraft 借外部的读口, draft 不进 store 的状态', () => {
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: identity,
      readDraft: () => ({ typing: '还没搜' }),
    });

    expect(store.getDraft()).toEqual({ typing: '还没搜' });
  });

  it('toParams 把当前条件过出口层', () => {
    const store = createQueryStore<Row>({
      fetch: okFetch(),
      toParams: (committed) => ({ ...committed, marked: true }),
      readDraft: emptyDraft,
      committed: { initial: { a: 1 } },
    });

    expect(store.toParams()).toEqual({ a: 1, marked: true });
  });
});
