import { useMenuStore, usePublicStore, useTabsStore, useUserStore } from '@/stores';
import { createTrackedSelector, getUntrackedObject } from 'react-tracked';

const useTrackedUser = createTrackedSelector(useUserStore);
const useTrackedTabs = createTrackedSelector(useTabsStore);
const useTrackedMenu = createTrackedSelector(useMenuStore);
const useTrackedPublic = createTrackedSelector(usePublicStore);

/** 交出代理背后的原对象; 标量没有代理可脱, 原样返回 */
const unwrap = <T>(value: T): T => getUntrackedObject(value) ?? value;

type Lazy<T extends Record<string, () => unknown>> = { readonly [K in keyof T]: ReturnType<T[K]> };

/**
 * 逐字段惰性求值, 取值结果交出代理背后的原对象。
 *
 * 惰性决定订阅面: 取哪个字段才执行哪个取值函数, 没被取到的字段不进订阅面。
 * 脱壳是因为菜单树这类结构会被递归遍历, 也会被塞进标签数据再持久化 ——
 * 读到属性那一刻订阅已经成立, 代理没有必要跟着流到那些地方。
 */
const lazy = <T extends Record<string, () => unknown>>(getters: T): Lazy<T> => {
  const facade = {} as Lazy<T>;

  for (const key of Object.keys(getters)) {
    Object.defineProperty(facade, key, { get: () => unwrap(getters[key]()), enumerable: true });
  }

  return facade;
};

/**
 * 常用状态的取值口。
 *
 * 只订阅组件读到的字段: 表格读了 `isPhone`, 菜单展开项换成新数组时它不会被叫醒。
 * 下面这张表是唯一的暴露面 —— 没列进来的 store 字段取不到, 也就订不上。
 *
 * 两条边界:
 * - 订阅面只增不减, 读过一次就订到组件卸载, 条件分支里读过的也算。
 * - 不要展开 (`{...}`, `Object.keys`) —— 一次读遍所有字段, 订阅面回到全量。
 */
export const useCommonStore = () => {
  const user = useTrackedUser();
  const tabs = useTrackedTabs();
  const menu = useTrackedMenu();
  const global = useTrackedPublic();

  // 一个字段都没读的 store 会被判定成「变了」, 先摸一个引用恒定的 action 把账本开上
  void user.setUserInfo;
  void tabs.setNav;
  void menu.setMenuList;
  void global.setThemeValue;

  return lazy({
    permissions: () => user.permissions,
    userId: () => user.userInfo.id,
    roles: () => user.userInfo.roles,
    username: () => user.userInfo.username,
    isMaximize: () => tabs.isMaximize,
    nav: () => tabs.nav,
    tabs: () => tabs.tabs,
    isCollapsed: () => menu.isCollapsed,
    isPhone: () => menu.isPhone,
    openKeys: () => menu.openKeys,
    selectedKeys: () => menu.selectedKeys,
    menuList: () => menu.menuList,
    isRefresh: () => global.isRefresh,
    isFullscreen: () => global.isFullscreen,
    theme: () => global.theme,
  });
};
