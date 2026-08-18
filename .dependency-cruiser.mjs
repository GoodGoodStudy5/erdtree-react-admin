/**
 * 目录边界规则. 判据与被否决的方案见 .design/plans/2026-08-18-工程规范治理.md
 */
export default {
  forbidden: [
    {
      name: 'no-deep-cross-dir',
      comment:
        '跨一级目录只能落在对方的 index 门面. 穿透到内部文件后, 对方调整内部结构就会波及这里. 改成 @/<一级目录>',
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
      comment:
        '目录内部绕回自己的 index 会形成 index -> 兄弟文件 -> index 的环. 改成相对路径直接引用兄弟文件',
      severity: 'error',
      from: { path: '^src/([^/]+)/.+' },
      to: { path: '^src/$1/index\\.(ts|tsx)$' },
    },
    {
      name: 'no-deep-page-subdir',
      comment:
        '页面引用自己的功能子目录只能落在子目录 index, 子目录才能自主决定对外暴露什么. 改成 ./<子目录>',
      severity: 'error',
      from: { path: '^src/pages/(.+)/[^/]+\\.tsx?$' },
      to: {
        path: '^src/pages/$1/[^/]+/.+',
        pathNot: 'index\\.(ts|tsx)$',
      },
    },
    {
      name: 'no-page-as-dependency',
      comment:
        '页面 index 是路由机制入口而非公共门面, 只有 src/router 可以引用. 页面里要复用的东西请抽到 components',
      severity: 'error',
      from: { pathNot: '^src/(pages/|router/|main\\.tsx$)' },
      to: { path: '^src/pages/' },
    },
    {
      name: 'no-circular',
      comment: '运行时循环依赖. 纯类型环已排除, 报出来的都是真环, 需要打断其中一条边',
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
