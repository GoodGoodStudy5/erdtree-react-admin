import { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ModalOutlet } from '@south/components';
import { useMenuStore } from '@/stores';
import { applyJumpAuthSearch } from '@/utils';

function RootLayout() {
  const { search } = useLocation();
  const applyMenuSearch = useMenuStore((state) => state.applyMenuSearch);
  const setJumpAuth = useMenuStore((state) => state.setJumpAuth);

  // 首页的 effect 会跳第一个菜单, 参数必须先于该跳转落入会话
  useLayoutEffect(() => {
    setJumpAuth(applyJumpAuthSearch(search));
    applyMenuSearch(search);
  }, [search, applyMenuSearch, setJumpAuth]);
  return (
    <>
      <Outlet />
      {/* 挂在路由树内, 切语言时随整树重挂载, 弹窗里的文案才跟得上 */}
      <ModalOutlet />
    </>
  );
}

export default RootLayout;
