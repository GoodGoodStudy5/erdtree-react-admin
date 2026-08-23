import { useEffect, useCallback } from 'react';
import { router } from '@/router';
import { getFirstMenu } from '@/menus';
import { useCommonStore } from '@/hooks';

function HomePage() {
  const { permissions, menuList } = useCommonStore();

  /** 跳转第一个有效菜单路径 */
  const goFirstMenu = useCallback(() => {
    const firstMenu = getFirstMenu(menuList, permissions);
    router.navigate(firstMenu);
  }, [menuList, permissions]);

  useEffect(() => {
    // 跳转第一个有效菜单路径
    goFirstMenu();
  }, [menuList, permissions]);

  return <div></div>;
}

export default HomePage;
