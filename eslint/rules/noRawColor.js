/**
 * `#` 后跟 3 / 4 / 6 / 8 位十六进制, 且后面不再跟单词字符.
 *
 * 末尾的边界是为了放过 `#card` `#first` 这类锚点与选择器 —— 它们的前几位恰好也是合法十六进制.
 */
const RAW_COLOR = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

/**
 * 颜色不写字面十六进制: 它在暗色档不跟着变, 于是成了满屏暗色里唯一的一块白.
 *
 * 做成独立规则而不是 `no-restricted-syntax` 的选择器: 后者的选项是整体替换, 豁免一个文件要把
 * 该文件其余规则一并摘掉再加回来; 独立规则名的豁免就是一行 ignores.
 */
export const noRawColor = {
  meta: {
    type: 'problem',
    docs: { description: '颜色取角色类或语义色名, 不写字面十六进制' },
    messages: {
      rawColor:
        '颜色不写字面十六进制 ({{color}}): 说明小字用 text-hint, 次要文字用 text-muted, 业务信号色取 uno 注册的语义名',
    },
  },

  create(context) {
    // 一个字符串是一个修改单位, 因此它里面的色值一次报全 —— 只报第一个的话, 改完再跑还报同一行
    const report = (node, text) => {
      const hits = [...text.matchAll(RAW_COLOR)].map((each) => each[0]);

      if (hits.length > 0) {
        context.report({ node, messageId: 'rawColor', data: { color: hits.join(', ') } });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') report(node, node.value);
      },
      TemplateElement(node) {
        report(node, node.value.raw);
      },
    };
  },
};
