import { useEffect, useCallback } from 'react';
import { router } from '@/router';
import { getFirstMenu } from '@/menus';
import { useCommonStore } from '@/hooks';
import { useMenuStore } from '@/stores';

function HomePage() {
  const { permissions, menuList } = useCommonStore();

  /** 跳转第一个有效菜单路径 */
  const goFirstMenu = useCallback(() => {
    const { showHiddenMenus } = useMenuStore.getState();
    const firstMenu = getFirstMenu(menuList, permissions, '', showHiddenMenus);
    router.navigate(firstMenu);
  }, [menuList, permissions]);

  useEffect(() => {
    // 跳转第一个有效菜单路径
    goFirstMenu();
  }, [menuList, permissions]);

  return <div></div>;
}

export default HomePage;
