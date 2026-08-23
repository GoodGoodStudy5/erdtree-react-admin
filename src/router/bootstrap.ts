import { createHashRouter } from 'react-router-dom';
import { bindRouter } from './router';
import { routes } from './routes';

/** 全站唯一的路由实例, 只交给 RouterProvider 挂载 */
export const dataRouter = createHashRouter(routes);

// 装配完即登记, 首帧之前发生的跳转也有人承接
bindRouter(dataRouter);
