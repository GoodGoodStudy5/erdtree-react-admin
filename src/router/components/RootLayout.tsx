import { Outlet } from 'react-router-dom';
import { ModalOutlet } from '@south/components';

function RootLayout() {
  return (
    <>
      <Outlet />
      {/* 挂在路由树内, 切语言时随整树重挂载, 弹窗里的文案才跟得上 */}
      <ModalOutlet />
    </>
  );
}

export default RootLayout;
