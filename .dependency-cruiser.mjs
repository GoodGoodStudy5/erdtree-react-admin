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
        '页面 index 是路由机制入口而非公共门面, 只有 src/router 可以引用. 页面里要复用的东西请抽到 components. ' +
        '全局公共弹窗组「只收不属于任何页面的弹窗」这条口径也压在本规则上, 放宽 from 之前先看 docs/adr 与 src/modals 的归属说明',
      severity: 'error',
      from: { pathNot: '^src/(pages/|router/|main\\.tsx$)' },
      to: { path: '^src/pages/' },
    },
    {
      name: 'no-prototype-as-dependency',
      comment:
        '原型是一次性的, 生产代码不能依赖它. 判据: 删掉整个 prototype 目录后仓库照常构建 —— 反向 import 做不到这一点, 删了目录 tsc 当场报 Cannot find module. ' +
        '要把原型嵌进真实页面请用 PrototypeSlot: 它靠 import.meta.glob 扫 prototype/mount.tsx, 匹配不到时返回空对象而不报错, 因此不产生编译期依赖. ' +
        '本规则零豁免 —— 「就破例这一个文件」的名单一旦开口, 第二个名字就没有判据可以拦',
      severity: 'error',
      from: { pathNot: '/prototype/' },
      to: { path: '/prototype/' },
    },
    {
      name: 'no-module-to-page',
      comment:
        '模块层是页面的下游: 它只提供插座, 由各页面在自己的 *.mount.tsx 里把实现挂上来. 反过来引页面, ' +
        '插座就成了转发层 —— 调用方以为自己不认识业务, 实际仍被业务的目录结构绑着',
      severity: 'error',
      from: { path: '^src/modules/' },
      to: { path: '^src/pages/' },
    },
    {
      name: 'no-package-to-src',
      comment:
        'packages 是与本应用无关的可复用包, 依赖 src 会把它绑死在这个应用上. 需要的东西请由调用方注入, 或下沉到包内自足',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^src/' },
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
