import checkFile from 'eslint-plugin-check-file';
import jsdoc from 'eslint-plugin-jsdoc';
import { asyncFormValidator } from './rules/asyncFormValidator.js';
import { noRawColor } from './rules/noRawColor.js';

/** 外壳的 modalProps 只能展开到 antd Modal 系载体 */
const NO_MODAL_PROPS_ON_OTHER_CARRIER = [
  {
    selector:
      'JSXOpeningElement:not([name.name=/^(Modal|BaseModal|ModalShell)$/]) > JSXSpreadAttribute[argument.property.name="modalProps"]',
    message: 'modalProps 只能展开到 antd Modal 系载体, 其余载体请显式接 submit / close',
  },
  {
    selector:
      'JSXOpeningElement:not([name.name=/^(Modal|BaseModal|ModalShell)$/]) > JSXSpreadAttribute[argument.name="modalProps"]',
    message: 'modalProps 只能展开到 antd Modal 系载体, 其余载体请显式接 submit / close',
  },
];

/** 命令式底座取代了 ref 契约: openModal 的参数由 props 推导, 不再从 ref 类型反推 */
const NO_IMPERATIVE_HANDLE = {
  selector: 'CallExpression[callee.name="useImperativeHandle"]',
  message: '弹窗改走命令式, 不要用 useImperativeHandle 暴露 open()',
};

/**
 * 异步函数名以 async 开头.
 *
 * 事件处理器 (on / handle 开头) 豁免: 那两个前缀已经是角色标记, 再叠一层是重复.
 * 代价认下 —— 「算不算处理器」从此有得辩, 换来的是双前缀不进代码.
 */
const ASYNC_NAMING = [
  {
    selector: 'FunctionDeclaration[async=true][id.name!=/^(async|on|handle)/]',
    message: '异步函数名以 async 开头, 如 asyncGetBills',
  },
  {
    selector: 'VariableDeclarator[init.async=true][id.name!=/^(async|on|handle)/]',
    message: '异步函数名以 async 开头, 如 asyncGetBills',
  },
  {
    selector:
      "VariableDeclarator[init.callee.name='useCallback'][init.arguments.0.async=true][id.name!=/^(async|on|handle)/]",
    message: '异步函数名以 async 开头, 如 asyncGetBills',
  },
];

/**
 * useRequest 取 runAsync, 不取 run.
 *
 * 结果与异常都该到得了调用点; 没人接的那次失败由 main.tsx 的 unhandledrejection 兜住,
 * 不必每个调用点手抄一遍 catch.
 *
 * 辖区只到 src: packages 的 SearchSelect 靠 run 的防抖, 而防抖只作用于 run.
 */
const NO_SYNC_RUN = {
  selector:
    "VariableDeclarator[init.callee.name='useRequest'] > ObjectPattern > Property[key.name='run']",
  message: 'useRequest 取 runAsync, 不取 run',
};

/**
 * 请求函数的动作词. 资源型是封闭集合; 命令型按需增补 —— 增补要改这张表, 那次修改就是评审.
 * 若允许命令型用自由动词, 门禁就退化成只校 api 前缀, 封闭性当场失效.
 */
const API_ACTIONS = [
  // 资源型
  'Page',
  'Detail',
  'List',
  'Options',
  'Tree',
  'Create',
  'Update',
  'Delete',
  'BatchDelete',
  'Export',
  'Import',
  // 命令型
  'Login',
  'Logout',
  'PasswordUpdate',
  'PasswordReset',
  'PermissionRefresh',
  'StateUpdate',
  'Trends',
];

/**
 * 门禁开启前就存在的请求函数, 原样放行.
 *
 * 这张清单**只允许变短**: 改掉某个老接口时删掉对应那一条. 为了让新代码过关而加长,
 * 等于把门禁关掉. 豁免按符号名而非按文件 —— 新接口会加进这些既有文件, 按文件豁免就永久失效了.
 */
const LEGACY_API_NAMES = [
  'getDataTrends',
  'login',
  'updatePassword',
  'forgetPassword',
  'getGames',
  'getPartner',
  'getPartnerDemo',
  'getMenuPage',
  'getMenuById',
  'createMenu',
  'updateMenu',
  'deleteMenu',
  'batchDeleteMenu',
  'getMenuList',
  'changeMenuState',
  'getMenuPermissionList',
  'getRolePage',
  'getRoleById',
  'createRole',
  'updateRole',
  'deleteRole',
  'batchDeleteRole',
  'getRoleList',
  'getRolePermission',
  'getLogPage',
  'createLog',
  'deleteLog',
  'batchDeleteLog',
  'getUserPage',
  'getUserById',
  'createUser',
  'updateUser',
  'deleteUser',
  'batchDeleteUser',
  'getUserRefreshPermissions',
];

/** 合规形态: api + 资源(允许复合名词) + 动作词 */
const API_NAME_ALLOWED = `^(api[A-Z][A-Za-z0-9]*(${API_ACTIONS.join('|')})|${LEGACY_API_NAMES.join('|')})$`;

/** 请求函数命名. 名字要自证两件事: 这次调用跨网络; 它是哪个资源的哪个动作 */
const API_NAMING = [
  {
    selector: `ExportNamedDeclaration > FunctionDeclaration[id.name!=/${API_NAME_ALLOWED}/]`,
    message:
      '请求函数命名: api + 资源 + 动作词, 如 apiUserPage / apiUserOptions. 动作词见 eslint.config.js 的 API_ACTIONS; 需要新动作词请先改那张表',
  },
  {
    selector: `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[init.type=/^(ArrowFunctionExpression|FunctionExpression)$/][id.name!=/${API_NAME_ALLOWED}/]`,
    message:
      '请求函数命名: api + 资源 + 动作词, 如 apiUserPage / apiUserOptions. 动作词见 eslint.config.js 的 API_ACTIONS; 需要新动作词请先改那张表',
  },
];

/** 抽屉名整段进 URL, 要编码的字符会让分享出去的链接读不出开的是哪个抽屉 */
const NO_UNSAFE_DRAWER_NAME = {
  selector:
    "CallExpression[callee.name='useDrawerRoutes'] > ObjectExpression > Property > Literal[value=/[^a-zA-Z0-9_-]/]",
  message: '抽屉名只用字母、数字、- 与 _',
};

/** 页面本体不再自己管弹窗开关 */
const NO_SHELL_IN_PAGE = {
  selector: 'JSXOpeningElement[name.name=/^(BaseModal|ModalShell)$/]',
  message: '页面本体不要直接渲染弹窗外壳, 把弹窗抽成独立组件, 页面只用 openModal()',
};

/**
 * 用例与类型测试都住在被测目录的 __tests__/ 里: 一个组的用例集中一处, 实现目录只剩实现.
 * vitest 的 include 也只收这个位置, 两处同一口径 —— 放错地方的用例不会被"顺便跑掉".
 */
const TEST_HOME = {
  '*.test.{ts,tsx}': '**/__tests__/',
  '*.typetest.{ts,tsx}': '**/__tests__/',
};

/**
 * 跳转只从导航门面取件. useNavigate 拿到的是组件内专属入口, 有了它就必须把「想跳转的东西」
 * 做成组件, 于是请求层、store、工具函数一律跳不了 —— 门面同时服务组件内外, 不留这道分岔.
 */
const NO_USE_NAVIGATE = {
  selector: 'CallExpression[callee.name="useNavigate"]',
  message: '页面跳转 import { router } from "@/router" 调 router.navigate, 组件内外同一个入口',
};

/** 碰的时候怎么写: 命名、注释存在性、文件与目录名 */
export const conventions = [
  {
    // 全仓库都拦的两条. 窄辖区的块会把这条整个盖掉, 所以下面每条链都要从这里取全集
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', ...NO_MODAL_PROPS_ON_OTHER_CARRIER, NO_USE_NAVIGATE],
    },
  },
  {
    // 跨目录可见的能力自带说明书, 调用方读一行签名即可, 不必点进实现.
    // packages 的对外面比 src 更远 (独立发布, 调用方看不到实现), 所以整包都在辖区内;
    // 用例与类型测试不算对外能力, 排除
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/hooks/**/*.ts',
      'src/router/*.ts',
      'src/utils/**/*.ts',
      'src/servers/**/*.ts',
      'src/modals/**/*.ts',
      'src/stores/**/*.ts',
      'src/menus/**/*.ts',
      'packages/*/src/**/*.{ts,tsx}',
    ],
    ignores: ['packages/*/src/**/__tests__/**'],
    plugins: { jsdoc },
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: { FunctionDeclaration: false },
          // 注释附着在 export 语句上, 选择器必须落在 ExportNamedDeclaration 本身,
          // 落到子节点会把已写好的注释判为缺失
          contexts: [
            'ExportNamedDeclaration[declaration.type="FunctionDeclaration"]',
            'ExportNamedDeclaration[declaration.type="VariableDeclaration"]',
            'ExportNamedDeclaration[declaration.type="TSInterfaceDeclaration"]',
            'ExportNamedDeclaration[declaration.type="TSTypeAliasDeclaration"]',
            'ExportNamedDeclaration[declaration.type="TSEnumDeclaration"]',
            'ExportDefaultDeclaration',
          ],
        },
      ],
    },
  },
  {
    // 请求函数命名. servers/index.ts 只做转发, 归下面的门面规则管, 这里不重复设防
    files: ['src/servers/**/*.ts'],
    ignores: ['src/servers/index.ts'],
    rules: {
      // 通用块的选择器照文件顶部的说明重列: 眼下 servers 只有 .ts 文件, JSX 选择器命不中,
      // 但列全之后这里的保证与辖区写法无关, 日后把辖区放宽到 .tsx 不会静默漏掉一条
      'no-restricted-syntax': [
        'error',
        ...NO_MODAL_PROPS_ON_OTHER_CARRIER,
        ...API_NAMING,
        NO_USE_NAVIGATE,
      ],
    },
  },
  {
    // index 是目录门面, 只声明对外开放什么, 实现放同目录的具名文件
    files: ['src/**/index.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Program > :not(ImportDeclaration, ExportNamedDeclaration, ExportAllDeclaration, ExportDefaultDeclaration)',
          message: 'index 只能做 re-export, 实现请放到同目录的具名文件',
        },
        {
          selector: 'ExportNamedDeclaration[declaration]',
          message: 'index 只能转发已有符号, 不能在此声明变量、函数或类型',
        },
        {
          selector: 'ExportDefaultDeclaration > :not(Identifier)',
          message: 'index 的 default 导出必须先在具名文件中声明再转发',
        },
      ],
    },
  },
  {
    files: ['src/pages/**/*.tsx', 'src/layouts/**/*.tsx', 'src/modals/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...NO_MODAL_PROPS_ON_OTHER_CARRIER,
        NO_IMPERATIVE_HANDLE,
        NO_USE_NAVIGATE,
      ],
    },
  },
  {
    // 页面里自定义的函数: 上一块压在页面上的规则要重列, 否则这里会把它们盖掉
    files: ['src/pages/**/*.{ts,tsx}'],
    // index 连 .ts 一起排除: 只写 index.tsx 会让 components/index.ts 落进这一块, 门面那条当场被盖掉
    ignores: ['src/pages/**/index.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...NO_MODAL_PROPS_ON_OTHER_CARRIER,
        NO_IMPERATIVE_HANDLE,
        NO_USE_NAVIGATE,
        ...ASYNC_NAMING,
        NO_SYNC_RUN,
      ],
    },
  },
  {
    // 组件里自定义的函数. 通用块压在组件上的规则要重列 —— 抽屉路由的用例另有一块窄豁免, 那块在后面
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/components/**/index.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...NO_MODAL_PROPS_ON_OTHER_CARRIER,
        NO_USE_NAVIGATE,
        ...ASYNC_NAMING,
        NO_SYNC_RUN,
      ],
    },
  },
  {
    // 页面本体: 前面各块压在页面上的规则这里要一条不漏地重列, 后写的块会整条覆盖先写的
    files: ['src/pages/**/*Page.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...NO_MODAL_PROPS_ON_OTHER_CARRIER,
        NO_IMPERATIVE_HANDLE,
        NO_SHELL_IN_PAGE,
        NO_UNSAFE_DRAWER_NAME,
        NO_USE_NAVIGATE,
        ...ASYNC_NAMING,
        NO_SYNC_RUN,
      ],
    },
  },
  {
    // 抽屉路由的用例自己建 MemoryRouter, 导航门面持有的是另一个 router 实例, 调它跳不动这一个.
    // 辖区只收这一个目录: no-restricted-syntax 整条覆盖, 放宽到全部用例会连带摘掉另外三条
    files: ['src/components/Drawer/__tests__/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': ['error', ...NO_MODAL_PROPS_ON_OTHER_CARRIER] },
  },
  {
    // 路由生成把 PascalCase 视为"不参与路由", 命名走小写会让页面多出一条路由
    files: ['src/pages/**/*.tsx'],
    // index 与 model 是机制文件, 403 / 404 错误页沿用扁平数字命名;
    // 两种挂载点同理, 名字是被 import.meta.glob 写死的约定: 原型的 mount.tsx 与业务挂给
    // @/modules 插座的 *.mount.tsx, 改名当场扫不到
    ignores: [
      'src/pages/**/index.tsx',
      'src/pages/**/model.tsx',
      'src/pages/40[0-9].tsx',
      'src/pages/**/prototype/mount.tsx',
      'src/pages/**/*.mount.tsx',
    ],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { 'src/pages/**/*.tsx': 'PASCAL_CASE' },
        { ignoreMiddleExtensions: true },
      ],
    },
  },
  {
    // 页面 index 是路由机制入口, 不是公共门面, 只转发同目录的页面本体
    files: ['src/pages/**/index.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Program > :not(ExportNamedDeclaration)',
          message: '页面 index 只能写 export { default } from "./<页面名>Page"',
        },
      ],
    },
  },
  {
    // 测试文件的住所. 类型测试也归这条管, 所以 files 要把两种后缀都列上
    files: ['**/*.test.{ts,tsx}', '**/*.typetest.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-match-with-fex': ['error', TEST_HOME],
    },
  },
  {
    // 双词目录名写的是组件名, 装不下同品类的第二个实现: load-button 里放不进 DeleteButton.
    // 品类按能力域划分而不按渲染成什么 —— 复制按钮渲染成 Button 但归 copyable.
    // 已知边界: FLAT_CASE 只拦分隔符, loadbutton 与品类划错都过得去, 这两条靠评审.
    // 辖区不含二级, __tests__ 与 adapter/native 这些内部结构不受影响
    files: ['packages/components/src/**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/folder-naming-convention': [
        'error',
        { 'packages/components/src/*/': 'FLAT_CASE' },
      ],
    },
  },
  {
    // 三处豁免各有各的理由: antd 的 theme token 与 Tag 的 color prop 收的就是色值本身;
    // echarts 的 option 画在 canvas 上, 吃不了 CSS 变量
    files: ['**/*.{ts,tsx}'],
    ignores: [
      'src/router/AppRouter.tsx',
      'src/utils/constants.ts',
      'src/pages/dashboard/components/*.tsx',
    ],
    plugins: { style: { rules: { 'no-raw-color': noRawColor } } },
    rules: { 'style/no-raw-color': 'error' },
  },
  {
    // 独立规则: no-restricted-syntax 选项整体替换, 豁免一个文件要把其余规则一并摘掉再加回来
    files: ['**/*.{ts,tsx}'],
    plugins: { form: { rules: { 'async-validator': asyncFormValidator } } },
    rules: { 'form/async-validator': 'error' },
  },
];
