import type { TabPaneProps } from 'antd';
import type { NavData } from '@/menus';
import type { KeepAliveRef } from 'keepalive-for-react';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { LANG } from '@/utils';

/** 标签页数据, key 即路由路径 */
export interface TabsData extends Omit<TabPaneProps, 'tab'> {
  key: string;
  label: React.ReactNode;
  labelZh: React.ReactNode;
  labelEn: React.ReactNode;
  nav: NavData[];
  urlParams?: string; // url参数
  pinned?: boolean; // 固定标签: 不参与批量关闭, 且排在非固定标签之前
}

/**
 * 固定的标签不可关闭; 只剩一个标签时也不可关闭.
 *
 * 交出新数组与新成员, 不在原地改: zustand 按引用比对快照, 原地改等于写进去了却没人被叫醒 ——
 * 关掉非当前标签时一个字段都没变, 界面于是停在旧的一栏.
 */
const withClosable = (tabs: TabsData[]): TabsData[] =>
  tabs.map((item) => ({ ...item, closable: !item.pinned && tabs.length > 1 }));

/** 固定标签集中排在左侧, 组内保持既有顺序 */
const sortByPinned = (tabs: TabsData[]): TabsData[] => [
  ...tabs.filter((item) => item.pinned),
  ...tabs.filter((item) => !item.pinned),
];

interface TabsGoNext {
  key: string;
  nextPath: string;
  dropScope: KeepAliveRef['destroy'] | undefined;
}

interface TabsState {
  isCloseTabsLock: boolean;
  isMaximize: boolean;
  activeKey: string;
  nav: NavData[];
  tabs: TabsData[];
  toggleCloseTabsLock: (isCloseTabsLock: boolean) => void;
  toggleMaximize: (isMaximize: boolean) => void;
  setActiveKey: (key: string) => void;
  setNav: (nav: NavData[]) => void;
  switchTabsLang: (label: string) => void;
  addTabs: (payload: TabsData) => void;
  setTabs: (key: string, searchParams?: string) => void;
  sortTabs: (payload: TabsData[]) => void;
  toggleTabPin: (payload: string) => void;
  /** 关掉一个标签. 关的是当前标签时交回落点路径, 由调用方跳过去 —— 落点只在这里算一遍 */
  closeTabs: (
    payload: string,
    dropScope: KeepAliveRef['destroy'] | undefined,
  ) => string | undefined;
  closeTabGoNext: (payload: TabsGoNext) => void;
  closeLeft: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeRight: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeOther: (payload: string, dropScope: KeepAliveRef['destroy'] | undefined) => void;
  closeAllTab: () => void;
}

/** 标签页导航状态: 已打开的标签、当前激活项、最大化与关闭锁 */
export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set, get) => ({
        isCloseTabsLock: false,
        isMaximize: false,
        activeKey: '',
        nav: [],
        tabs: [],
        toggleCloseTabsLock: (isCloseTabsLock) => set({ isCloseTabsLock }),
        toggleMaximize: (isMaximize) => set({ isMaximize }),
        setActiveKey: (key) => set({ activeKey: key }),
        setNav: (nav) => set({ nav }),
        switchTabsLang: (label) =>
          set((state) => ({
            tabs: state.tabs.map((item) => ({
              ...item,
              label: label === 'en' ? item.labelEn : item.labelZh,
            })),
          })),
        addTabs: (payload) =>
          set((state) => {
            // 已在栏里的不再入栏, 也不换数组引用 —— 换一次是全栏重渲染, 而路由每变一次都会走到这里
            if (state.tabs.some((item) => item.key === payload.key)) return {};

            return { tabs: withClosable([...state.tabs, payload]) };
          }),
        setTabs: (key, searchParams) =>
          set((state) => {
            const has = state.tabs.find((item) => item.key === key);
            if (!has || has.urlParams === searchParams) return {};

            return {
              tabs: state.tabs.map((item) =>
                item.key === key ? { ...item, urlParams: searchParams } : item,
              ),
            };
          }),
        sortTabs: (payload) => set({ tabs: withClosable(sortByPinned(payload)) }),
        toggleTabPin: (payload) =>
          set((state) => ({
            tabs: withClosable(
              sortByPinned(
                state.tabs.map((item) =>
                  item.key === payload ? { ...item, pinned: !item.pinned } : item,
                ),
              ),
            ),
          })),
        closeTabs: (payload, dropScope) => {
          const { tabs: current, activeKey } = get();
          const index = current.findIndex((item) => item.key === payload);
          if (index < 0) return undefined;

          const tabs = withClosable(current.filter((item) => item.key !== payload));
          const isActive = payload === activeKey;
          // 关掉的是当前标签时落到右邻; 关的是最后一个则落到左邻
          const nextPath = isActive ? ((tabs[index] ?? tabs[index - 1])?.key ?? '') : '';

          set(isActive ? { tabs, activeKey: nextPath, isCloseTabsLock: true } : { tabs });

          // 清除当前标签的keepalive缓存
          dropScope?.(payload);

          return nextPath || undefined;
        },
        closeTabGoNext: (payload) =>
          set((state) => {
            const { key, nextPath, dropScope } = payload;
            if (!state.tabs.some((item) => item.key === key)) return {};

            // 清除非当前的keepalive缓存
            dropScope?.(key);

            return {
              tabs: withClosable(state.tabs.filter((item) => item.key !== key)),
              ...(key === state.activeKey ? { activeKey: nextPath, isCloseTabsLock: true } : {}),
            };
          }),
        closeLeft: (payload, dropScope) =>
          set((state) => {
            const index = state.tabs.findIndex((item) => item.key === payload);
            const tabs = withClosable(state.tabs.filter((item, i) => i >= index || item.pinned));

            // 清除非当前的keepalive缓存
            for (const item of tabs) {
              if (item.key !== payload) dropScope?.(item.key);
            }

            return {
              tabs,
              activeKey: payload,
              // 如果当前标签不是要关闭的标签，就导航到要关闭的标签
              ...(state.activeKey !== payload ? { isCloseTabsLock: true } : {}),
            };
          }),
        closeRight: (payload, dropScope) =>
          set((state) => {
            // 清除非当前的keepalive缓存
            for (const item of state.tabs) {
              if (item.key !== payload) dropScope?.(item.key);
            }

            const index = state.tabs.findIndex((item) => item.key === payload);
            const tabs = withClosable(state.tabs.filter((item, i) => i <= index || item.pinned));

            return {
              tabs,
              activeKey: payload,
              // 如果当前标签不是要关闭的标签，就导航到要关闭的标签
              ...(state.activeKey !== payload ? { isCloseTabsLock: true } : {}),
            };
          }),
        closeOther: (payload, dropScope) =>
          set((state) => {
            // 保留当前标签与固定标签，关闭其他标签
            const isKept = (item: TabsData) => item.key === payload || item.pinned;

            // 清除非当前的keepalive缓存
            for (const item of state.tabs) {
              if (!isKept(item)) dropScope?.(item.key);
            }

            return {
              tabs: withClosable(state.tabs.filter(isKept)),
              activeKey: payload,
              // 如果当前标签不是要关闭的标签，就导航到要关闭的标签
              ...(state.activeKey !== payload ? { isCloseTabsLock: true } : {}),
            };
          }),
        closeAllTab: () => set({ tabs: [], activeKey: '' }),
      }),
      {
        name: 'tabs_storage', // 存储中的项目名称，必须是唯一的
        storage: createJSONStorage(() => localStorage), // 使用sessionStorage作为存储
      },
    ),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'tabsStore',
    },
  ),
);

/**
 * 通过路由获取标签名
 * @param tabs - 标签
 * @param path - 路由路径
 */
export const getTabTitle = (tabs: TabsData[], path: string): string => {
  const lang = localStorage.getItem(LANG);

  for (let i = 0; i < tabs?.length; i++) {
    const item = tabs[i];

    if (item.key === path) {
      const { label, labelEn, labelZh } = item;
      const result = lang === 'en' ? labelEn : labelZh || label;
      return result as string;
    }
  }

  return '';
};
