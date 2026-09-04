import type { RouteObject } from 'react-router-dom';
import type { RouteModules } from './utils/helper';
import { handleRoutes } from './utils/helper';
import Login from '@/pages/login';
import Forget from '@/pages/forget';
import NotFound from '@/pages/404';
import Guards from './components/Guards';
import RootLayout from './components/RootLayout';

// 测试文件与页面同目录, 不排除会一并进产物
const pages = import.meta.glob(['../pages/**/*.tsx', '!**/__tests__/**'], {
  eager: false,
}) as RouteModules;

/** 全站路由表. 建在模块顶层, 路由才能在 React 之外装配一次, 组件外也拿得到跳转能力 */
export const routes: RouteObject[] = [
  {
    element: <RootLayout />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'forget',
        element: <Forget />,
      },
      {
        path: '',
        element: <Guards />,
        children: handleRoutes(pages),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
