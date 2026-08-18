/**
 * 目录边界规则. 判据与被否决的方案见 .design/plans/2026-08-18-工程规范治理.md
 */
export default {
  forbidden: [
    {
      name: 'no-deep-cross-dir',
      comment: '跨一级目录引用必须落在对方的 index 门面, 不得穿透到内部文件',
      severity: 'error',
      from: { path: '^src/([^/]+)/' },
      to: {
        path: '^src/([^/]+)/.+',
        pathNot: [
          '^src/$1/',
          '^src/[^/]+/index\\.(ts|tsx)$',
          // 页面目录的 index 与扁平错误页都是路由机制入口, 归 no-page-as-dependency 管辖
          '^src/pages/.*index\\.tsx$',
          '^src/pages/[0-9]+\\.tsx$',
        ],
      },
    },
    {
      name: 'no-self-barrel',
      comment: '目录内部直接相对引用兄弟文件, 绕回自己的 index 会成环',
      severity: 'error',
      from: { path: '^src/([^/]+)/.+' },
      to: { path: '^src/$1/index\\.(ts|tsx)$' },
    },
    {
      name: 'no-deep-page-subdir',
      comment: '页面引用自己的功能子目录时只能落在子目录 index',
      severity: 'error',
      from: { path: '^src/pages/(.+)/[^/]+\\.tsx?$' },
      to: {
        path: '^src/pages/$1/[^/]+/.+',
        pathNot: 'index\\.(ts|tsx)$',
      },
    },
    {
      name: 'no-page-as-dependency',
      comment: '页面 index 是路由机制入口, 只有 src/router 可以引用',
      severity: 'error',
      from: { pathNot: '^src/(pages/|router/|main\\.tsx$)' },
      to: { path: '^src/pages/' },
    },
    {
      name: 'no-circular',
      comment: '禁止循环依赖',
      severity: 'error',
      from: {},
      to: { circular: true, viaOnly: { dependencyTypesNot: ['type-only'] } },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)src/assets/' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  },
};
