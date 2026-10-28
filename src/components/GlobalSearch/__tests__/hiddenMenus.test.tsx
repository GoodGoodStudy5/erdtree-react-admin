import type * as Stores from '@/stores';
import type * as Utils from '@/utils';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import type { SideMenu } from '#/public';
import type { SearchModalProps } from '../components/SearchModal';
import { createRef } from 'react';
import { createHashRouter } from 'react-router-dom';
import { bindRouter } from '@/router';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMenuStore } from '@/stores';
import { applyJumpAuthSearch } from '@/utils';
import { SearchModal } from '../components/SearchModal';

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  permissions: ['/hidden'],
  menus: [] as SideMenu[],
  result: { list: [] as SideMenu[], active: '' },
}));
vi.mock('@/hooks', () => ({
  useCommonStore: () => ({ permissions: state.permissions, menuList: state.menus }),
  useNavigateProgress: () => state.navigate,
  useKeyStroke: () => [() => undefined],
}));
vi.mock('@/stores', async (importOriginal) => ({
  ...(await importOriginal<typeof Stores>()),
  useTabsStore: { getState: () => ({ addTabs: vi.fn(), setActiveKey: vi.fn() }) },
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof Utils>()),
  LANG: 'lang',
}));
vi.mock('@/locales', () => ({ $t: (key: string) => key }));
vi.mock('../../Icon', () => ({ Icon: () => null }));
vi.mock('../components/SearchFooter', () => ({ SearchFooter: () => null }));
vi.mock('../components/SearchResult', () => ({
  SearchResult: (props: typeof state.result) => {
    state.result = props;
    return null;
  },
}));
vi.mock('antd', async (importOriginal) => ({
  ...(await importOriginal()),
  Modal: ({ children, open }: { children: ReactNode; open: boolean }) => (open ? children : null),
  Input: ({
    onPressEnter,
    ref: _ref,
    ...props
  }: {
    onPressEnter: () => void;
    ref: Ref<unknown>;
  } & InputHTMLAttributes<HTMLInputElement>) => (
    <input
      value={props.value}
      onChange={props.onChange}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onPressEnter();
      }}
    />
  ),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('requestAnimationFrame', () => 0);
  sessionStorage.clear();
  localStorage.clear();
  window.location.hash = '#/home';
  bindRouter(createHashRouter([{ path: '*', element: null }]));
  useMenuStore.setState({ showHiddenMenus: true, jumpAuth: false });
  applyJumpAuthSearch('?jumpAuth=0');
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  state.navigate.mockClear();
  state.permissions = ['/hidden'];
  state.menus = [
    { key: '/hidden', label: '隐藏菜单', labelEn: 'Hidden', hidden: true, rule: '/hidden' },
  ];
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function openSearch() {
  const modalRef = createRef<SearchModalProps>();
  const view = render(<SearchModal modalRef={modalRef} />);
  act(() => modalRef.current?.toggle());
  return { ...view, modalRef, input: screen.getByRole('textbox') };
}

describe('搜索状态与菜单展示状态的接线', () => {
  it('jumpAuth 切换会重算结果并清掉失权的选中项, 不等下次输入', () => {
    state.permissions = [];
    const { input } = openSearch();
    fireEvent.change(input, { target: { value: '隐藏' } });
    act(() => vi.advanceTimersByTime(200));
    expect(state.result.list).toEqual([]);
    act(() => useMenuStore.getState().setJumpAuth(applyJumpAuthSearch('?jumpAuth=1')));
    expect(state.result.active).toBe('/hidden');
    fireEvent.change(input, { target: { value: '菜单' } });
    act(() => useMenuStore.getState().setJumpAuth(applyJumpAuthSearch('?jumpAuth=0')));
    expect(state.result.list).toEqual([]);
    expect(state.result.active).toBe('');
    act(() => vi.advanceTimersByTime(200));
    expect(state.result.list).toEqual([]);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(state.navigate).not.toHaveBeenCalled();
  });

  it('关闭会移除当前 active, 待执行搜索不能把隐藏结果写回, Enter 不跳转', () => {
    const { input } = openSearch();
    fireEvent.change(input, { target: { value: '隐藏' } });
    act(() => vi.advanceTimersByTime(200));
    expect(state.result.active).toBe('/hidden');
    fireEvent.change(input, { target: { value: '菜单' } });
    act(() => useMenuStore.getState().applyMenuSearch('?showHiddenMenus=0'));
    expect(state.result.list).toEqual([]);
    expect(state.result.active).toBe('');
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(state.navigate).not.toHaveBeenCalled();
    act(() => useMenuStore.getState().applyMenuSearch('?showHiddenMenus=1'));
    expect(state.result.active).toBe('/hidden');
  });

  it('菜单和权限变化立即按当前输入重算, 卸载取消防抖', () => {
    const { input, rerender, modalRef, unmount } = openSearch();
    fireEvent.change(input, { target: { value: '隐藏' } });
    act(() => vi.advanceTimersByTime(200));
    state.permissions = [];
    rerender(<SearchModal modalRef={modalRef} />);
    expect(state.result.list).toEqual([]);
    state.permissions = ['/hidden'];
    rerender(<SearchModal modalRef={modalRef} />);
    expect(state.result.active).toBe('/hidden');
    state.menus = [];
    rerender(<SearchModal modalRef={modalRef} />);
    expect(state.result.list).toEqual([]);
    fireEvent.change(input, { target: { value: '待取消' } });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
