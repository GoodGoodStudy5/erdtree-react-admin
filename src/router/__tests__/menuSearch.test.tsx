import type { SideMenu } from '#/public';
import type { ReactNode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { bindRouter } from '../router';
import { useMenuStore, usePublicStore } from '@/stores';
import Layout from '@/layouts';
import { checkPermission } from '@/utils';
import RootLayout from '../components/RootLayout';
import HomePage from '@/pages';

const state = vi.hoisted(() => ({ menus: [] as SideMenu[], permissions: [] as string[] }));
vi.mock('@/hooks', () => ({
  useCommonStore: () => ({ menuList: state.menus, permissions: state.permissions, userId: '' }),
  useToken: () => [() => 'test-session'],
}));
vi.mock('@/servers', () => ({
  getUserRefreshPermissions: async () => ({ user: {}, permissions: state.permissions }),
  getMenuList: async () => state.menus,
}));
vi.mock('@/components', () => ({
  Forbidden: () => <div>无权占位</div>,
  WatchData: ({ children }: { children: ReactNode }) => children,
  mountStickyStack: () => () => undefined,
}));
vi.mock('../../layouts/components/Menu', () => ({ default: () => <div>侧栏入口</div> }));
vi.mock('../../layouts/components/Header', () => ({ default: () => null }));
vi.mock('../../layouts/components/Tabs', () => ({ default: () => <div>标签入口</div> }));
vi.mock('../../layouts/utils/helper', () => ({ versionCheck: () => undefined }));
vi.mock('keepalive-for-react', () => ({
  KeepAlive: ({ children }: { children: ReactNode }) => children,
  useKeepAliveRef: () => ({ current: null }),
}));
vi.mock('@south/components', () => ({ ModalOutlet: () => null }));

beforeEach(() => {
  vi.stubGlobal('usePublicStore', usePublicStore);
  vi.stubGlobal('requestAnimationFrame', () => 0);
  sessionStorage.clear();
  useMenuStore.setState({ showHiddenMenus: false, jumpAuth: false });
  state.menus = [
    { key: '/hidden', label: '隐藏', labelEn: 'Hidden', hidden: true, rule: '/hidden' },
    { key: '/visible', label: '可见', labelEn: 'Visible', rule: '/visible' },
  ];
  state.permissions = ['/hidden', '/visible'];
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mountRouter(hash: string) {
  window.location.hash = hash;
  const dataRouter = createHashRouter([
    {
      element: <RootLayout />,
      children: [
        {
          element: <Layout />,
          children: [
            { path: '/', element: <HomePage /> },
            { path: '*', element: <div>业务内容</div> },
          ],
        },
      ],
    },
  ]);
  bindRouter(dataRouter);
  render(<RouterProvider router={dataRouter} />);
  return dataRouter;
}

describe('导航参数与目标分支路由装配', () => {
  it('首页先应用展示指令, 再跳已授权的隐藏菜单, 查询串丢失后保持', async () => {
    const dataRouter = mountRouter('#/?showHiddenMenus=1');
    await waitFor(() => expect(dataRouter.state.location.pathname).toBe('/hidden'));
    expect(dataRouter.state.location.search).toBe('');
    expect(useMenuStore.getState().showHiddenMenus).toBe(true);
    expect(sessionStorage.getItem('menu:showHiddenMenus')).toBe('1');
    await act(() => dataRouter.navigate('/visible?showHiddenMenus=0'));
    expect(useMenuStore.getState().showHiddenMenus).toBe(false);
  });

  it('空权限也能在开发环境绕过并到达隐藏首页, 同路径切换立即更新镜像', async () => {
    state.permissions = [];
    const dataRouter = mountRouter('#/?showHiddenMenus=1&jumpAuth=1');
    await waitFor(() => expect(dataRouter.state.location.pathname).toBe('/hidden'));
    expect(useMenuStore.getState().jumpAuth).toBe(true);
    expect(checkPermission('/hidden', [])).toBe(true);
    expect(screen.getByText('侧栏入口')).toBeTruthy();
    expect(screen.getByText('标签入口')).toBeTruthy();
    expect(screen.getByText('业务内容')).toBeTruthy();
    expect(screen.queryByText('无权占位')).toBeNull();
    await act(() => dataRouter.navigate('/hidden?jumpAuth=0'));
    expect(useMenuStore.getState().jumpAuth).toBe(false);
    expect(checkPermission('/hidden', [])).toBe(false);
    expect(screen.getByText('无权占位')).toBeTruthy();
    expect(screen.queryByText('业务内容')).toBeNull();
    expect(screen.queryByText('侧栏入口')).toBeNull();
    expect(screen.queryByText('标签入口')).toBeNull();
    expect(useMenuStore.getState().showHiddenMenus).toBe(true);
    await act(() => dataRouter.navigate('/hidden?jumpAuth=1'));
    expect(useMenuStore.getState().jumpAuth).toBe(true);
    await act(() => dataRouter.navigate('/visible'));
    expect(useMenuStore.getState().jumpAuth).toBe(true);
  });
});
