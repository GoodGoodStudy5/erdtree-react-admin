import type { SideMenu } from '#/public';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const HIDDEN_MENUS_KEY = 'menu:showHiddenMenus';

function restoreHiddenMenus(): boolean {
  try {
    return sessionStorage.getItem(HIDDEN_MENUS_KEY) === '1';
  } catch (error) {
    console.warn('[菜单] 无法恢复隐藏菜单偏好, 使用默认关闭状态', error);
    return false;
  }
}

interface MenuState {
  showHiddenMenus: boolean;
  jumpAuth: boolean;
  setJumpAuth: (jumpAuth: boolean) => void;
  applyMenuSearch: (search: string) => void;
  isPhone: boolean;
  isCollapsed: boolean;
  selectedKeys: string; // 菜单选中值
  openKeys: string[]; // 菜单展开项
  menuList: SideMenu[]; // 菜单列表数据
  toggleCollapsed: (isCollapsed: boolean) => void;
  togglePhone: (isPhone: boolean) => void;
  setSelectedKeys: (selectedKeys: string) => void;
  setOpenKeys: (openKeys: string[]) => void;
  setMenuList: (menuList: SideMenu[]) => void;
}

/** 侧边菜单数据与折叠、展开状态 */
export const useMenuStore = create<MenuState>()(
  devtools(
    (set, get) => ({
      showHiddenMenus: restoreHiddenMenus(),
      jumpAuth: false,
      // 判定权仍在 permissions, 此镜像只唤醒导航组件重算
      setJumpAuth: (jumpAuth) => {
        if (get().jumpAuth !== jumpAuth) set({ jumpAuth });
      },
      applyMenuSearch: (search) => {
        const instruction = new URLSearchParams(search).get('showHiddenMenus');
        if (instruction !== '1' && instruction !== '0') return;
        const showHiddenMenus = instruction === '1';
        if (get().showHiddenMenus === showHiddenMenus) return;
        try {
          if (showHiddenMenus) sessionStorage.setItem(HIDDEN_MENUS_KEY, '1');
          else sessionStorage.removeItem(HIDDEN_MENUS_KEY);
        } catch (error) {
          console.warn('[菜单] 无法保存隐藏菜单偏好, 本次切换仅在内存生效', error);
        }
        set({ showHiddenMenus });
      },
      isPhone: false,
      isCollapsed: false,
      selectedKeys: 'dashboard', // 菜单选中值
      openKeys: ['Dashboard'], // 菜单展开项
      menuList: [], // 菜单列表数据
      toggleCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),
      togglePhone: (isPhone: boolean) => set({ isPhone }),
      setSelectedKeys: (selectedKeys: string) => set({ selectedKeys }),
      setOpenKeys: (openKeys: string[]) => set({ openKeys }),
      setMenuList: (menuList: SideMenu[]) => set({ menuList }),
    }),
    {
      enabled: process.env.NODE_ENV === 'development',
      name: 'menuStore',
    },
  ),
);
