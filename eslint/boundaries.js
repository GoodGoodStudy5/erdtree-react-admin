/** 弹窗挂载点只允许路由层引用 */
const NO_MODAL_OUTLET = {
  name: '@south/components',
  importNames: ['ModalOutlet'],
  message: 'ModalOutlet 是挂载点, 只有 src/router 可以引用',
};

/**
 * 原型挂载点: 一个文件引用了它, 就说明这一页还在验证阶段, 不该进仓库.
 *
 * **拦在 eslint 而不是单开一个提交脚本**: lint-staged 本来就对暂存文件跑 eslint, 于是「引用了
 * 它的文件进不了提交」这件事不需要新增任何管道. 红线同时是给作者看的状态标记 —— 文件里有红,
 * 就是还没定稿.
 *
 * 机制自身不会被误伤: `PrototypeSlot` 目录内不 import 自己, barrel 的 `export * from
 * './PrototypeSlot'` 源路径也不是 `@/components`. 绕过 barrel 直接深引由
 * dependency-cruiser 的 no-deep-cross-dir 拦.
 */
const NO_PROTOTYPE_SLOT = {
  name: '@/components',
  importNames: ['PrototypeSlot', 'hasPrototype'],
  message:
    '引用 PrototypeSlot 说明这个页面还在验证阶段, 不能提交. 本地演示照常跑, 提交前把这个文件撤出暂存区',
};

/**
 * 反向 import 原型目录, 与 dependency-cruiser 的 no-prototype-as-dependency 同一判据.
 * 这里重列一条只为把它提前到 pre-commit: depcruise 只在 pre-push 的 check:full 里跑,
 * 在那之前错的提交已经进了本地历史.
 */
const NO_PROTOTYPE_IMPORT = {
  group: ['**/prototype', '**/prototype/**'],
  message:
    '生产代码不引用原型目录 —— 它不进版本库, 这条 import 一提交别人 clone 后 tsc 就报 Cannot find module. 要嵌进页面用 @/components 的 PrototypeSlot',
};

/**
 * 语言变化只由路由出口订阅一次, 切语言时整树重挂载, 各处直接调用的 $t 借此重新取值.
 * 多处订阅会让部分文案更新, 部分留在旧语言.
 */
const NO_USE_TRANSLATION = {
  name: 'react-i18next',
  importNames: ['useTranslation'],
  message: '国际化直接 import { $t } from "@/locales", 语言订阅只在 AppRouter 一处',
};

/** 拖拽调宽与关窗重置只实现在公共封装一处 */
const NO_ANTD_DRAWER = {
  name: 'antd',
  importNames: ['Drawer'],
  message: '侧抽屉用 @/components 的 BaseDrawer: 直接用 antd Drawer 会绕开拖拽调宽与关窗重置',
};

/** 详情字段块的疏密与列数只在一处定 */
const NO_ANTD_DESCRIPTIONS = {
  name: 'antd',
  importNames: ['Descriptions'],
  message: '详情字段块用 @/components 的 BaseDescriptions: 描边、三列、紧凑三项默认只在那里定',
};

/**
 * src 全域的导入红线. 公共封装自己要包 antd 原件, 传入自己那一条免掉.
 * @param except - 免掉的那一条
 */
const srcRestrictedImports = (except) => [
  'error',
  {
    paths: [
      NO_MODAL_OUTLET,
      NO_USE_TRANSLATION,
      NO_PROTOTYPE_SLOT,
      NO_ANTD_DRAWER,
      NO_ANTD_DESCRIPTIONS,
    ].filter((one) => one !== except),
    patterns: [NO_PROTOTYPE_IMPORT],
  },
];

/**
 * 用例只从包门面取件. 从深层文件取件的用例会把包的内部结构写进断言,
 * 于是内部一动就要改用例 —— 缝退化成实现的镜子, 照不出对外行为有没有变.
 */
const TEST_ONLY_VIA_FACADE = {
  patterns: [
    {
      group: ['.', '..', './**', '../**'],
      message: '用例只从 @south/<包名> 门面导入, 不引用包内深层文件',
    },
  ],
};

/**
 * 请求原语只有一个切换点: hooks/requestAdapter.ts. 组件绕过它直接引实现, 换 ahooks 时
 * 就不再是"改一行导出", 而要满仓库找调用点 —— 适配器层当场失去意义.
 */
const NO_REQUEST_IMPL_DIRECT = {
  patterns: [
    {
      group: ['**/hooks/useRequest', './useRequest'],
      message: '请求原语从 hooks 门面 (背后是 requestAdapter) 取, 不直接引实现',
    },
  ],
};

/** 谁能碰谁: 目录之间的引用方向 */
export const boundaries = [
  {
    // 挂载点只此一处, 其余地方拿不到也不该拿
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/router/**', 'src/components/Drawer/**', 'src/components/Descriptions/**'],
    rules: {
      'no-restricted-imports': srcRestrictedImports(),
    },
  },
  {
    // 语言订阅只此一处; 挂载点在本目录内合法, 故只重列其余几条
    files: ['src/router/**/*.{ts,tsx}'],
    ignores: ['src/router/AppRouter.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [NO_USE_TRANSLATION, NO_ANTD_DRAWER, NO_ANTD_DESCRIPTIONS] },
      ],
    },
  },
  {
    // 公共封装自己要包 antd 原件, 各自只免掉自己那一条
    files: ['src/components/Drawer/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': srcRestrictedImports(NO_ANTD_DRAWER) },
  },
  {
    files: ['src/components/Descriptions/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': srcRestrictedImports(NO_ANTD_DESCRIPTIONS) },
  },
  {
    // 「挂载点只此一处」防的是产物, 而用例不进产物 —— 要覆盖 openModal 那条路径就得挂一个
    files: ['src/**/__tests__/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': srcRestrictedImports(NO_MODAL_OUTLET) },
  },
  {
    // 适配器是唯一切换点. 用例走门面导入, 本就碰不到实现, 不必进这条辖区
    files: ['packages/components/src/**/*.{ts,tsx}'],
    ignores: ['packages/components/src/hooks/requestAdapter.ts', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', NO_REQUEST_IMPL_DIRECT],
    },
  },
  {
    files: ['packages/*/src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', TEST_ONLY_VIA_FACADE],
    },
  },
];
