export * from './BaseDrawer';
// DrawerRouteSync 不出门面: 它只服务 BaseDrawer, 页面要的是下面这个
export { useDrawerRoutes } from './useDrawerRoutes';
export type { DrawerTable } from './useDrawerRoutes';
