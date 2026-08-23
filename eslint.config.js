import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import checkFile from 'eslint-plugin-check-file';
import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import tseslint from 'typescript-eslint';

/**
 * flat config 的规则选项是整体替换而非合并, 所以每个用到 no-restricted-syntax 的块
 * 都要把该生效的选择器重新列全, 否则后写的块会把先写的整条盖掉.
 */

/**
 * 只报错, 不自动改.
 *
 * 用于合并类修复不可靠的规则: import-x 的重复导入修复遇到"内联 type 与值写在同一条"的导入时,
 * 会把值一并塞进 import type, 产出编译不过的代码, 而 eslint 之后不再报错 —— 破坏被放过去了.
 * 让人手动合并一次, 比让工具悄悄改坏一次便宜.
 */
function reportOnly(rule) {
  return {
    ...rule,
    meta: { ...rule.meta, fixable: undefined, hasSuggestions: false },
    create(context) {
      const noFix = Object.create(context, {
        report: {
          value: (descriptor) =>
            context.report({ ...descriptor, fix: undefined, suggest: undefined }),
        },
      });
      return rule.create(noFix);
    },
  };
}

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

/** 弹窗挂载点只允许路由层引用 */
const NO_MODAL_OUTLET = {
  name: '@south/components',
  importNames: ['ModalOutlet'],
  message: 'ModalOutlet 是挂载点, 只有 src/router 可以引用',
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

/** 页面本体不再自己管弹窗开关 */
const NO_SHELL_IN_PAGE = {
  selector: 'JSXOpeningElement[name.name=/^(BaseModal|ModalShell)$/]',
  message: '页面本体不要直接渲染弹窗外壳, 把弹窗抽成独立组件, 页面只用 openModal()',
};

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
 * 用例与类型测试都住在被测目录的 __test__/ 里: 一个组的用例集中一处, 实现目录只剩实现.
 * vitest 的 include 也只收这个位置, 两处同一口径 —— 放错地方的用例不会被"顺便跑掉".
 */
const TEST_HOME = {
  '*.test.{ts,tsx}': '**/__test__/',
  '*.typetest.{ts,tsx}': '**/__test__/',
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

export default tseslint.config(
  // 构建产物不参与校验, 包的 dist 在任意层级都要排除
  // .design / .scratch 是设计草稿与工作区, 不进版本库, 也不受工程规范约束
  { ignores: ['**/dist/**', '.design/**', '.scratch/**'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': {
        ...importX,
        rules: { ...importX.rules, 'no-duplicates': reportOnly(importX.rules['no-duplicates']) },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-var': 'error',
      // "prettier/prettier": "error",
      // 禁止出现console
      'no-console': 'off',
      // 禁用debugger
      'no-debugger': 'warn',
      // 禁止出现重复的 case 标签
      'no-duplicate-case': 'warn',
      // 禁止出现空语句块
      'no-empty': 'warn',
      // 禁止不必要的括号
      'no-extra-parens': 'off',
      // 禁止对 function 声明重新赋值
      'no-func-assign': 'warn',
      // 禁止在 return、throw、continue 和 break 语句之后出现不可达代码
      'no-unreachable': 'warn',
      // 强制所有控制语句使用一致的括号风格
      curly: 'off',
      // 要求 switch 语句中有 default 分支
      'default-case': 'warn',
      // 强制尽可能地使用点号
      'dot-notation': 'warn',
      // 要求使用 === 和 !==
      eqeqeq: 'warn',
      // 禁止 if 语句中 return 语句之后有 else 块
      'no-else-return': 'warn',
      // 禁止出现空函数
      'no-empty-function': 'warn',
      // 禁用不必要的嵌套块
      'no-lone-blocks': 'warn',
      // 禁止使用多个空格
      'no-multi-spaces': 'warn',
      // 禁止多次声明同一变量
      'no-redeclare': 'warn',
      // 禁止在 return 语句中使用赋值语句
      'no-return-assign': 'warn',
      // 禁用不必要的 return await
      'no-return-await': 'warn',
      // 禁止自我赋值
      'no-self-assign': 'warn',
      // 禁止自身比较
      'no-self-compare': 'warn',
      // 禁止不必要的 catch 子句
      'no-useless-catch': 'warn',
      // 禁止多余的 return 语句
      'no-useless-return': 'warn',
      // 禁止变量声明与外层作用域的变量同名
      'no-shadow': 'off',
      // 允许delete变量
      'no-delete-var': 'off',
      // 强制数组方括号中使用一致的空格
      'array-bracket-spacing': 'warn',
      // 强制在代码块中使用一致的大括号风格
      'brace-style': 'warn',
      // 强制使用骆驼拼写法命名约定
      camelcase: 'off',
      // 强制使用一致的缩进
      indent: 'off',
      // 强制在 JSX 属性中一致地使用双引号或单引号
      // "jsx-quotes": "warn",
      // 强制可嵌套的块的最大深度4
      'max-depth': 'warn',
      // 强制最大行数 300
      // "max-lines": ["warn", { "max": 1200 }],
      // 强制函数最大代码行数 50
      // "max-lines-per-function": ["warn", { max: 70 }],
      // 强制函数块最多允许的的语句数量20
      'max-statements': ['warn', 100],
      // 强制回调函数最大嵌套深度
      'max-nested-callbacks': ['warn', 3],
      // 强制函数定义中最多允许的参数数量
      'max-params': ['warn', 3],
      // 强制每一行中所允许的最大语句数量
      'max-statements-per-line': ['warn', { max: 1 }],
      // 要求方法链中每个调用都有一个换行符
      'newline-per-chained-call': ['warn', { ignoreChainWithDepth: 3 }],
      // 禁止 if 作为唯一的语句出现在 else 语句中
      'no-lonely-if': 'warn',
      // 禁止空格和 tab 的混合缩进
      'no-mixed-spaces-and-tabs': 'warn',
      // 禁止出现多行空行
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      // 禁止出现;
      semi: ['warn', 'always'],
      // 强制在块之前使用一致的空格
      'space-before-blocks': 'warn',
      // 强制在 function的左括号之前使用一致的空格
      // "space-before-function-paren": ["warn", "never"],
      // 强制在圆括号内使用一致的空格
      'space-in-parens': 'warn',
      // 要求操作符周围有空格
      'space-infix-ops': 'warn',
      // 强制在一元操作符前后使用一致的空格
      'space-unary-ops': 'warn',
      // 强制在注释中 // 或 /* 使用一致的空格
      // "spaced-comment": "warn",
      // 强制在 switch 的冒号左右有空格
      'switch-colon-spacing': 'warn',
      // 强制箭头函数的箭头前后使用一致的空格
      'arrow-spacing': 'warn',
      'prefer-const': 'warn',
      'prefer-rest-params': 'warn',
      'no-useless-escape': 'off',
      'no-irregular-whitespace': 'warn',
      'no-prototype-builtins': 'off',
      'no-fallthrough': 'warn',
      'no-extra-boolean-cast': 'warn',
      'no-case-declarations': 'off',
      'no-async-promise-executor': 'warn',
      // 禁止使用后缀运算符的非空断言"!"
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // 禁止未使用变量, 解构剔除字段与 _ 前缀视为有意不使用
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          // varsIgnorePattern: '^_',
          // argsIgnorePattern: '^_',
          // caughtErrorsIgnorePattern: '^_',
        },
      ],
      // 同一模块只留一条导入语句, 读一行就知道从这个模块取了什么.
      // type 与值分属两条: 类型是编译期契约, 值是运行时依赖, 混在一行看不出哪些会进产物
      'import-x/no-duplicates': ['error', { 'prefer-inline': false }],
      // 承接上一条的分条口径: 类型说明符不许内联到值导入里, 一律提到顶层 import type
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      // 纯类型不许走值导入 —— 值导入进产物, 类型不进, 形态得能自证.
      // 内联形态会让"一个模块两条语句"和"一条混合语句"同时合法, 分条就失去判据
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      // 见文件顶部常量的说明
      'no-restricted-syntax': ['error', ...NO_MODAL_PROPS_ON_OTHER_CARRIER],
      // 官方hooks校验
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    // 跨目录可见的能力自带说明书, 调用方读一行签名即可, 不必点进实现.
    // packages 的对外面比 src 更远 (独立发布, 调用方看不到实现), 所以整包都在辖区内;
    // 用例与类型测试不算对外能力, 排除
    files: [
      'src/components/**/*.{ts,tsx}',
      'src/hooks/**/*.ts',
      'src/utils/**/*.ts',
      'src/servers/**/*.ts',
      'src/modals/**/*.ts',
      'src/stores/**/*.ts',
      'src/menus/**/*.ts',
      'packages/*/src/**/*.{ts,tsx}',
    ],
    ignores: ['packages/*/src/**/__test__/**'],
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
      'no-restricted-syntax': ['error', ...NO_MODAL_PROPS_ON_OTHER_CARRIER, ...API_NAMING],
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
      'no-restricted-syntax': ['error', ...NO_MODAL_PROPS_ON_OTHER_CARRIER, NO_IMPERATIVE_HANDLE],
    },
  },
  {
    // 页面本体: 三条规则都要列全, 后写的块会整条覆盖先写的
    files: ['src/pages/**/*Page.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...NO_MODAL_PROPS_ON_OTHER_CARRIER,
        NO_IMPERATIVE_HANDLE,
        NO_SHELL_IN_PAGE,
      ],
    },
  },
  {
    // 挂载点只此一处, 其余地方拿不到也不该拿
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/router/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: [NO_MODAL_OUTLET, NO_USE_TRANSLATION] }],
    },
  },
  {
    // 语言订阅只此一处; 挂载点在本目录内合法, 故只重列语言这一条
    files: ['src/router/**/*.{ts,tsx}'],
    ignores: ['src/router/AppRouter.tsx'],
    rules: {
      'no-restricted-imports': ['error', { paths: [NO_USE_TRANSLATION] }],
    },
  },
  {
    // 路由生成把 PascalCase 视为"不参与路由", 命名走小写会让页面多出一条路由
    files: ['src/pages/**/*.tsx'],
    // index 与 model 是机制文件, 403 / 404 错误页沿用扁平数字命名
    ignores: ['src/pages/**/index.tsx', 'src/pages/**/model.tsx', 'src/pages/40[0-9].tsx'],
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
);
