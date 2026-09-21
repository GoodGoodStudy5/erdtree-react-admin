import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import importX from 'eslint-plugin-import-x';
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

/** 浏览器基线与通用清单. 必须最先: 它装插件, 后两份只写规则 */
export const base = [
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
      // 禁止多次声明同一变量. 用 TS 版本: 基础版把函数重载判成重复声明
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'warn',
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
      // 官方hooks校验
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
