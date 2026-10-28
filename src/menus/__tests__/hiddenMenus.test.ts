import type * as Utils from '@/utils';
import type { SideMenu } from '#/public';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHashRouter } from 'react-router-dom';
import { bindRouter } from '@/router';
import { filterMenus, getFirstMenu, handleFilterMenus, searchMenuValue } from '../utils/helper';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof Utils>()),
  LANG: 'lang',
}));

const leaf = (key: string, extra: Partial<SideMenu> = {}): SideMenu => ({
  key,
  label: '测试菜单',
  labelEn: 'Test Menu',
  rule: key,
  ...extra,
});
const menus: SideMenu[] = [
  leaf('/hidden', {
    hidden: true,
    children: [leaf('/hidden/child'), leaf('/hidden/denied')],
  }),
  leaf('/group', { children: [leaf('/group/hidden', { hidden: true })] }),
  leaf('/public', { hidden: true }),
  leaf('/visible'),
];
const permissions = ['/hidden/child', '/group/hidden', '/public', '/visible'];
const search = (showHiddenMenus?: boolean, grants = permissions) =>
  searchMenuValue({ menus, permissions: grants, value: '测试', showHiddenMenus });

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.hash = '#/home';
  bindRouter(createHashRouter([{ path: '*', element: null }]));
});

afterEach(() => vi.unstubAllEnvs());

describe('隐藏菜单的三个导航入口', () => {
  it('缺省或关闭时剪掉隐藏父分支和隐藏叶子', () => {
    expect(filterMenus(menus, permissions).map((item) => item.key)).toEqual(['/visible']);
    expect(search().map((item) => item.key)).toEqual(['/visible']);
    expect(getFirstMenu(menus, permissions)).toBe('/visible');
    expect(filterMenus(menus, permissions, false)).toEqual(filterMenus(menus, permissions));
  });

  it('开启后保留层级, 仅展示已授权后代及已有 rule 授权菜单', () => {
    const original = structuredClone(menus);
    const filtered = filterMenus(menus, permissions, true);
    expect(filtered.map((item) => item.key)).toEqual(['/hidden', '/group', '/public', '/visible']);
    expect(filtered[0].children?.map((item) => item.key)).toEqual(['/hidden/child']);
    expect(filtered[1].children?.map((item) => item.key)).toEqual(['/group/hidden']);
    expect(search(true).map((item) => item.key)).toEqual([
      '/hidden/child',
      '/group/hidden',
      '/public',
      '/visible',
    ]);
    expect(getFirstMenu(menus, permissions, '', true)).toBe('/hidden/child');
    expect(getFirstMenu(filtered, permissions, '', true)).toBe('/hidden/child');
    expect(menus).toEqual(original);
  });

  it('按展示开关和权限计算菜单项后隔离 hidden, 不改写过滤树或原始声明', () => {
    const original = structuredClone(menus);
    const filtered = filterMenus(menus, permissions, true);
    const snapshot = structuredClone(filtered);
    const items = handleFilterMenus(filtered);

    expect(items.map((item) => item.key)).toEqual(['/hidden', '/group', '/public', '/visible']);
    expect(items[0].children?.map((item) => item.key)).toEqual(['/hidden/child']);
    expect(items[1].children?.map((item) => item.key)).toEqual(['/group/hidden']);
    const assertNoHidden = (nodes: SideMenu[]) => {
      for (const item of nodes) {
        expect(item).not.toHaveProperty('hidden');
        if (item.children?.length) assertNoHidden(item.children);
      }
    };
    assertNoHidden(items);
    expect(handleFilterMenus(filterMenus(menus, [], true)).map((item) => item.key)).toEqual([]);
    expect(filtered).toEqual(snapshot);
    expect(menus).toEqual(original);
    expect(
      handleFilterMenus(filterMenus(menus, permissions, false)).map((item) => item.key),
    ).toEqual(['/visible']);
  });

  it('开关不授予权限, 父权限也不授予子页面', () => {
    expect(filterMenus(menus, [], true).map((item) => item.key)).toEqual([]);
    expect(search(true, []).map((item) => item.key)).toEqual([]);
    expect(getFirstMenu(menus, [], '', true)).toBe('');
    expect(search(true, ['/hidden']).map((item) => item.key)).toEqual([]);
    expect(getFirstMenu(menus, permissions, '/existing', true)).toBe('/existing');
  });

  it.each([true, false])('jumpAuth 保持原有环境边界: DEV=%s', (dev) => {
    vi.stubEnv('DEV', dev);
    window.location.hash = '#/home?jumpAuth=1';
    bindRouter(createHashRouter([{ path: '*', element: null }]));
    const keys = search(true, []).map((item) => item.key);
    expect(keys.includes('/hidden/denied')).toBe(dev);
    expect(filterMenus(menus, [], true).some((item) => item.key === '/hidden')).toBe(dev);
    expect(getFirstMenu(menus, [], '', true)).toBe(dev ? '/hidden/child' : '');
    expect(getFirstMenu(menus, [])).toBe(dev ? '/visible' : '');
  });
});
