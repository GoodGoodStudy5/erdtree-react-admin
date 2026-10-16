/**
 * Form.Item 的 validator 必须是 async 函数.
 *
 * antd 底层 async-validator 只认 Promise / true / false / callback.
 * 同步函数 `return` 得到 undefined, 既不调 callback 也不返回 Promise,
 * validateFields 永不 settle, promise 会一直padding.
 * throw 会被 rc-form 包成 reject, 只有成功路径的 return 会挂死.
 */
export const asyncFormValidator = {
  meta: {
    type: 'problem',
    docs: { description: 'Form.Item 的 validator 必须是 async 函数' },
    messages: {
      mustBeAsync:
        'validator 必须是 async 函数: 同步 return 时 validateFields 不会 settle, promise 会一直padding',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    const isFn = (node) =>
      node &&
      (node.type === 'ArrowFunctionExpression' ||
        node.type === 'FunctionExpression' ||
        node.type === 'FunctionDeclaration');

    /** 函数节点直接看; 标识符跟到声明处, 跟不到就当没看见 */
    const resolveFn = (node) => {
      if (isFn(node)) return node;
      if (node?.type !== 'Identifier') return null;
      const variable = sourceCode.getScope(node).set.get(node.name);
      const def = variable?.defs[0];
      if (!def) return null;
      if (def.node.type === 'FunctionDeclaration') return def.node;
      if (def.node.type === 'VariableDeclarator') return resolveFn(def.node.init);
      return null;
    };

    return {
      Property(node) {
        if (node.key.type !== 'Identifier') return;
        if (node.key.name !== 'validator' && node.key.name !== 'asyncValidator') return;

        const fn = resolveFn(node.value);
        if (fn && !fn.async) {
          context.report({ node: fn, messageId: 'mustBeAsync' });
        }
      },
    };
  },
};
