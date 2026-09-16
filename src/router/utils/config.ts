// 生成路由排除内容，不带后缀名转换成“/文件名/”格式
export const ROUTER_EXCLUDE = [
  'login',
  'forget',
  'components',
  'utils',
  'lib',
  'hooks',
  'model.tsx',
  // 业务挂给 @/modules 的实现文件, 不是页面
  '.mount.tsx',
  '404.tsx',
];
