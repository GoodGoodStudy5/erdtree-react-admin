import { Typography } from 'antd';
import type { CSSProperties } from 'react';
import type { CellEllipsis } from '#/public';

interface EllipsisTextProps {
  text: string;
  color?: string;
  /** 与内置的 tooltip 合并而非替换; 给了 rows 才多行折叠 */
  ellipsis?: CellEllipsis;
  /** 多行折叠缺省 pre-line, 折掉报文里的连续空格而留住换行符; 单行省略缺省不干预 */
  whiteSpace?: CSSProperties['whiteSpace'];
}

/** 文本超长时省略, 悬停以气泡展示全文 */
export function EllipsisText(props: EllipsisTextProps) {
  const { text, color, ellipsis, whiteSpace } = props;
  // 单行省略靠 nowrap, 多行折叠要能折行 —— 两者要的 white-space 相反, 单行一律交还给 antd
  const mergedWhiteSpace = whiteSpace ?? ((ellipsis?.rows ?? 1) > 1 ? 'pre-line' : undefined);

  return (
    <Typography.Paragraph
      // antd 给 div 形态的 Paragraph 补的 1em 下边距会把文字顶离单元格的垂直中线
      style={{ color, marginBottom: 0, whiteSpace: mergedWhiteSpace }}
      ellipsis={{ tooltip: text, ...ellipsis }}
    >
      {text}
    </Typography.Paragraph>
  );
}
