import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  sessionStorage.clear();
});

afterEach(() => vi.restoreAllMocks());

const loadStore = async () => (await import('../menu')).useMenuStore;

describe('隐藏菜单标签页状态', () => {
  it('默认关闭, 缺省、空值及无效值不改变状态', async () => {
    const store = await loadStore();
    expect(store.getState().showHiddenMenus).toBe(false);
    const { applyMenuSearch } = store.getState();
    for (const search of ['', '?showHiddenMenus=', '?showHiddenMenus=true']) {
      applyMenuSearch(search);
      expect(store.getState().showHiddenMenus).toBe(false);
    }
    applyMenuSearch('?showHiddenMenus=1');
    for (const search of ['', '?showHiddenMenus=', '?showHiddenMenus=invalid']) {
      applyMenuSearch(search);
      expect(store.getState().showHiddenMenus).toBe(true);
    }
  });

  it('开启持久化, 菜单清空和模块重载仍保持, 关闭删除镜像', async () => {
    let store = await loadStore();
    store.getState().applyMenuSearch('?showHiddenMenus=1');
    store.getState().setMenuList([]);
    expect(store.getState().showHiddenMenus).toBe(true);
    expect(sessionStorage.getItem('menu:showHiddenMenus')).toBe('1');
    vi.resetModules();
    store = await loadStore();
    expect(store.getState().showHiddenMenus).toBe(true);
    store.getState().applyMenuSearch('?showHiddenMenus=0');
    expect(store.getState().showHiddenMenus).toBe(false);
    expect(sessionStorage.getItem('menu:showHiddenMenus')).toBeNull();
    vi.resetModules();
    expect((await loadStore()).getState().showHiddenMenus).toBe(false);
  });

  it('重复指令幂等, 重复参数只认首值', async () => {
    const store = await loadStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.getState().applyMenuSearch('?showHiddenMenus=1&showHiddenMenus=0');
    store.getState().applyMenuSearch('?showHiddenMenus=1');
    expect(listener).toHaveBeenCalledTimes(1);
    store.getState().applyMenuSearch('?showHiddenMenus=no&showHiddenMenus=0');
    expect(store.getState().showHiddenMenus).toBe(true);
    store.getState().applyMenuSearch('?showHiddenMenus=0&showHiddenMenus=1');
    expect(store.getState().showHiddenMenus).toBe(false);
    unsubscribe();
  });

  it('只恢复精确的开启值', async () => {
    sessionStorage.setItem('menu:showHiddenMenus', 'true');
    expect((await loadStore()).getState().showHiddenMenus).toBe(false);
  });

  it('存储读写被禁时记录告警并降级到内存切换', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const unavailable = () => {
      throw new Error('storage unavailable');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(unavailable);
    const store = await loadStore();
    expect(store.getState().showHiddenMenus).toBe(false);
    store.getState().applyMenuSearch('?showHiddenMenus=1');
    expect(store.getState().showHiddenMenus).toBe(true);
    store.getState().applyMenuSearch('?showHiddenMenus=0');
    expect(store.getState().showHiddenMenus).toBe(false);
    expect(warning).toHaveBeenCalledTimes(3);
  });
});
