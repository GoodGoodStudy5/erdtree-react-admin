import type { MenuProps } from 'antd';

/** antd 没把 onClick 的入参类型单独导出, 从 props 上取比摸 rc-menu 的内部路径稳 */
type MenuClickInfo = Parameters<NonNullable<MenuProps['onClick']>>[0];
import type { SideMenu } from '#/public';
import type { ItemType, MenuItemType } from 'antd/es/menu/interface';
import { useCallback, useMemo, memo } from 'react';
import { Menu } from 'antd';
import { isUrl, setTitle } from '@/utils';
import { Icon } from '@/components';
import { useCommonStore, useNavigateProgress } from '@/hooks';
import { useLocation } from 'react-router-dom';
import { useMenuStore, getTabTitle } from '@/stores';
import {
  filterMenus,
  getFirstMenu,
  getMenuByKey,
  getOpenMenuByRouter,
  handleFilterMenus,
  splitPath,
} from '@/menus';
import styles from '../index.module.less';
import Logo from '@/assets/images/logo.svg';
import { $t, i18n } from '@/locales';

/**
 * 叶子菜单的 label 包一层 `a`.
 *
 * 没有 href 就没有浏览器的原生能力 —— 中键、Ctrl / Cmd 点击、右键「在新标签页打开」、
 * 悬停看地址全都没有. 只包叶子: 有子菜单的那一层点下去是展开, 不是跳转.
 *
 * 路由是 `createHashRouter`, 所以内部地址要带上 `#`; 外链原样.
 * @param items - 已转成 antd 形状的菜单项
 */
function withLinks(items: ItemType<MenuItemType>[]): ItemType<MenuItemType>[] {
  return items.map((item) => {
    if (!item || !('key' in item) || item.key === undefined || item.key === null) return item;

    const children = 'children' in item ? item.children : undefined;
    if (children?.length) {
      return { ...item, children: withLinks(children as ItemType<MenuItemType>[]) };
    }

    const key = String(item.key);
    const label = (item as MenuItemType).label;
    return { ...item, label: <a href={isUrl(key) ? key : `#${key}`}>{label}</a> };
  });
}

/**
 * 转换菜单icon格式
 */
const filterMenuIcon = (menus: SideMenu[]): SideMenu[] => {
  if (!menus?.length) return [];

  return menus.map((item) => {
    const newItem: SideMenu = { ...item };

    if (item?.icon) {
      newItem.icon = <Icon icon={item.icon as string} />;
    }

    if (item?.children?.length) {
      newItem.children = filterMenuIcon(item.children as SideMenu[]);
    }

    return newItem;
  });
};

function LayoutMenu() {
  const navigate = useNavigateProgress();
  const { pathname } = useLocation();

  const tabs = useTabsStore((state) => state.tabs);
  const { setActiveKey, addTabs, setNav } = useTabsStore.getState();

  const { isMaximize, isCollapsed, isPhone, openKeys, selectedKeys, permissions, menuList } =
    useCommonStore();
  const { toggleCollapsed, setSelectedKeys, setOpenKeys } = useMenuStore.getState();
  const showHiddenMenus = useMenuStore((state) => state.showHiddenMenus);
  const jumpAuth = useMenuStore((state) => state.jumpAuth);

  // 菜单展开与选中项以 store 为唯一来源, 全局搜索等入口也从这里驱动菜单
  const currentOpenKeys = openKeys || [];
  const currentSelectedKeys = selectedKeys ? [selectedKeys] : [];

  // 过滤菜单
  const filteredMenus = useMemo(() => {
    if (menuList.length === 0) return [];
    const newMenus = filterMenus(menuList, permissions, showHiddenMenus);
    return filterMenuIcon(newMenus);
  }, [menuList, permissions, showHiddenMenus, jumpAuth, i18n.language]);

  // 刷新页面根据路由选中对应的菜单
  useEffect(() => {
    const newOpenKey = getOpenMenuByRouter(pathname);

    requestAnimationFrame(() => {
      setOpenKeys(newOpenKey);
      setSelectedKeys(pathname);
    });
  }, [pathname]);

  /**
   * 路由跳转
   */
  const goPath = useCallback(
    (path: string) => {
      navigate(path);
    },
    [navigate],
  );

  /**
   * 隐藏菜单（手机端）
   */
  const hiddenMenu = useCallback(() => {
    toggleCollapsed(true);
  }, [toggleCollapsed]);

  /**
   * 点击菜单
   */
  const onClickMenu: MenuProps['onClick'] = useCallback(
    ({ key, domEvent }: MenuClickInfo) => {
      // 带修饰键的点击让浏览器自己开新标签: 拦下来 label 上那个 href 就白给了
      if (domEvent.ctrlKey || domEvent.metaKey || domEvent.shiftKey) return;
      // 其余情况由下面的 SPA 导航负责, 不让 href 再写一次 hash
      domEvent.preventDefault();

      // 如果点击的菜单是当前菜单则退出
      if (key === pathname) return;

      // 手机端点击后隐藏菜单
      if (isPhone) {
        hiddenMenu();
      }

      // 如果是外链则跳转
      if (isUrl(key)) {
        window.open(key, '_blank');
        return;
      }

      // 立即更新菜单状态
      setSelectedKeys(key);

      // 使用 requestAnimationFrame 确保菜单状态先渲染，然后再跳转路由
      requestAnimationFrame(() => {
        // 标签栏操作
        setActiveKey(key);
        const menuByKeyProps = { menus: menuList, permissions, key };
        const newItems = getMenuByKey(menuByKeyProps);

        if (newItems?.key) {
          setActiveKey(newItems.key);
          setNav(newItems.nav);
          addTabs(newItems);
        } else {
          setActiveKey(key);
        }

        // 刷新标题
        const title = getTabTitle(tabs, key);
        if (title) setTitle(title);

        requestAnimationFrame(() => {
          navigate(key);
        });
      });
    },
    [pathname, isPhone, hiddenMenu, setSelectedKeys, navigate],
  );

  /**
   * 对比当前展开目录是否是同一层级
   */
  const diffOpenMenu = useCallback((arr: string[], lastArr: string[]) => {
    return arr.every((item, index) => item === lastArr[index]);
  }, []);

  /**
   * 展开/关闭回调
   */
  const onOpenChange = useCallback(
    (openKeys: string[]) => {
      const newOpenKey: string[] = [];

      if (openKeys.length > 0) {
        const last = openKeys[openKeys.length - 1];
        const lastArr: string[] = splitPath(last);
        newOpenKey.push(last);

        // 对比当前展开目录是否是同一层级
        for (let i = openKeys.length - 2; i >= 0; i--) {
          const arr = splitPath(openKeys[i]);
          const hasOpenKey = diffOpenMenu(arr, lastArr);
          if (hasOpenKey) {
            newOpenKey.unshift(openKeys[i]);
          }
        }
      }

      setOpenKeys(newOpenKey);
    },
    [diffOpenMenu, setOpenKeys],
  );

  /** 点击logo */
  const onClickLogo = useCallback(() => {
    const firstMenu = getFirstMenu(filteredMenus, permissions, '', showHiddenMenus);
    goPath(firstMenu);
    if (isPhone) {
      hiddenMenu();
    }
  }, [filteredMenus, permissions, showHiddenMenus, goPath, isPhone, hiddenMenu]);

  // 缓存菜单项
  const menuItems = useMemo(
    () => withLinks(handleFilterMenus(filteredMenus) as ItemType<MenuItemType>[]),
    [filteredMenus],
  );

  // 缓存 className
  const menuClassName = useMemo(
    () => `
      transition-all
      overflow-auto
      z-2
      ${styles.menu}
      ${isCollapsed ? styles['menu-close'] : ''}
      ${isMaximize || (isPhone && isCollapsed) ? styles['menu-none'] : ''}
      ${isPhone ? '!z-1002' : ''}
    `,
    [isCollapsed, isMaximize, isPhone],
  );

  const logoClassName = useMemo(
    () => `
      text-white
      flex
      content-center
      px-5
      py-2
      cursor-pointer
      ${styles['menu-logo']}
      ${isCollapsed ? 'justify-center' : ''}
    `,
    [isCollapsed],
  );

  const titleClassName = useMemo(
    () => `
      text-white
      ml-3
      text-xl
      font-bold
      truncate
      ${isCollapsed ? 'hidden' : ''}
    `,
    [isCollapsed],
  );

  return (
    <>
      <div className={menuClassName}>
        <div className={logoClassName} onClick={onClickLogo}>
          <img src={Logo} width={30} height={30} className="object-contain" alt="logo" />
          <span className={titleClassName}>{$t('public.currentName')}</span>
        </div>

        <Menu
          id="layout-menu"
          className="z-1000"
          selectedKeys={currentSelectedKeys}
          openKeys={currentOpenKeys}
          mode="inline"
          theme="dark"
          forceSubMenuRender
          inlineCollapsed={isPhone ? false : isCollapsed}
          items={menuItems}
          onClick={onClickMenu}
          onOpenChange={onOpenChange}
        />
      </div>

      {isPhone && !isCollapsed && (
        <div
          className={`
            ${styles.cover}
            fixed
            w-full
            h-full
            bg-gray-500
            bg-opacity-10
            z-1001
          `}
          onClick={hiddenMenu}
        />
      )}
    </>
  );
}

export default memo(LayoutMenu);
