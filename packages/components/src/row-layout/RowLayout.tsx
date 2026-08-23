import type { ColProps } from 'antd';
import type { ReactNode } from 'react';
import { Children, cloneElement, isValidElement, useContext, useMemo } from 'react';
import { Col, Row } from 'antd';
import { propsMerge } from '../utils';
import { DEFAULT_COLUMN_NUM, RowLayoutContext } from './context';
import type {
  RowInnerProps,
  RowLayoutChildProps,
  RowLayoutColumnNum,
  RowLayoutProps,
} from './types';

/** 栅格总列数 */
const GRID_SPAN = 24;
/** 中屏 (md/lg) 的保底列宽. 真列宽再窄也不用: 一行挤进太多字段, 谁都看不清 */
const MEDIUM_MIN_SPAN = 8;
const DEFAULT_GUTTER: RowLayoutProps['gutter'] = [16, 16];

/**
 * 调用方自带宽度的键. 给了它们, 库的这套断点就整套让位.
 *
 * 因为 antd 的 `-xs` 类是不带媒体查询发出的, 且排在 span 之后 —— 两套一起下发,
 * 调用方的 span 在任何视口下都不生效, 正是要销掉的死属性问题.
 * 单独给某个断点 (如 xl) 不算自带宽度: 那一个键盖掉库的同名键即可, 其余档照旧兜着.
 */
const OWN_WIDTH_KEYS = ['span', 'flex'] as const;

/** Col 的跨度上限是 24 格 */
function limitSpan(span: number) {
  return Math.min(GRID_SPAN, span);
}

/** 按列数与所占列格算出全套断点 */
function breakpointsOf(colSize: number, baseSpan: number) {
  return {
    xs: limitSpan(colSize * GRID_SPAN),
    sm: limitSpan(colSize * (GRID_SPAN / 2)),
    md: limitSpan(colSize * Math.max(baseSpan, MEDIUM_MIN_SPAN)),
    lg: limitSpan(colSize * Math.max(baseSpan, MEDIUM_MIN_SPAN)),
    xl: limitSpan(colSize * baseSpan),
  };
}

/**
 * 把子元素逐个裹进 Col, 断点按列数算出来.
 *
 * 三类子元素分开处理: RowLayout 与 RowInner 原样放行 (它们自己管栅格流);
 * 直接写的 Col 拆壳 —— props 当 colProps 用、children 当内容, 于是全量 ColProps 都能透传;
 * 其余元素读它的 colProps 协议.
 *
 * 已知边界: 拆壳识别靠 `child.type` 的同一性, 只认直接写的 Col / RowInner.
 * 被 memo、forwardRef 或自定义包装过一层的同名组件认不出来, 会被当成普通子元素裹进 Col.
 */
function buildCols(children: ReactNode, columnNum: RowLayoutColumnNum) {
  const baseSpan = GRID_SPAN / columnNum;

  // Children.map 官方标了 legacy 但未移除. 留着它是因为 key 的分配与嵌套数组的展平都由它负责
  return Children.map(children, (child) => {
    if (!child) {
      return null;
    }
    if (isValidElement(child) && (child.type === RowLayout || child.type === RowInner)) {
      return child;
    }

    let content: ReactNode = child;
    let childColProps: RowLayoutChildProps['colProps'];

    if (isValidElement<RowLayoutChildProps & ColProps>(child)) {
      if (child.type === Col) {
        const { children: colChildren, colProps: _unused, ...restColProps } = child.props;

        content = colChildren;
        childColProps = restColProps;
      } else if (child.props.colProps) {
        childColProps = child.props.colProps;
        // 布局协议摘掉再交给子元素, 别让 colProps 落到它自己的 props 上.
        // 用 cloneElement 而不是重建元素: 重建会把调用方挂在子元素上的 ref 静默丢掉
        content = cloneElement(child, { colProps: undefined } as Partial<RowLayoutChildProps>);
      }
    }

    // 浅拷贝剥离 colSize, 不 delete 调用方传进来的对象: 那是别人的数据, 还可能是冻结的
    const { colSize = 1, ...restColProps } = childColProps ?? {};
    const ownsWidth = OWN_WIDTH_KEYS.some((key) => key in restColProps);
    const colProps = propsMerge(ownsWidth ? {} : breakpointsOf(colSize, baseSpan), restColProps);

    return <Col {...colProps}>{content}</Col>;
  });
}

/**
 * 整页表单的行布局: 给一个 columnNum 就排完一行, 调用方不写一个 Col.
 *
 * 断点策略是本库的固执选择, 不提供配置: xs 整行、sm 半行、md/lg 不小于 8 格、
 * xl 按 columnNum 的真列宽. 全站版式因此收口在这一个文件里, 改版只改这里;
 * 需要另一套版式请在外面包一层, 不要 fork 本组件.
 *
 * 逃生舱分层: 默认等宽 → 子元素带 `colProps={{ colSize: n }}` 占多列 →
 * 直接写 `<Col>` 拆壳透传全量 ColProps. 最后一层里调用方一旦自带宽度 (span / flex),
 * 库的断点整套让位, 见 OWN_WIDTH_KEYS.
 */
export function RowLayout(props: RowLayoutProps) {
  const {
    columnNum = DEFAULT_COLUMN_NUM,
    ifShow = true,
    gutter = DEFAULT_GUTTER,
    children,
    ...restRowProps
  } = props;
  // gutter 先经解构给默认值再进合并: 显式传 undefined 时该落回默认, 而合并层会让 undefined 覆盖
  const rowProps = propsMerge({ gutter }, restRowProps);
  // context 的值要稳定, 否则每次渲染都让整棵 RowInner 白重渲染一遍
  const contextValue = useMemo(() => ({ columnNum }), [columnNum]);

  if (!ifShow) {
    return null;
  }

  return (
    <RowLayoutContext.Provider value={contextValue}>
      <Row {...rowProps}>{buildCols(children, columnNum)}</Row>
    </RowLayoutContext.Provider>
  );
}

/**
 * RowLayout 内部的成组续行: 渲染成 Fragment 而不是新的 Row, 所以这一组 Col 仍然流在父级的
 * 栅格里 —— 整组字段按条件出现或消失 (ifShow) 不会打断父级的 gutter 与列对齐.
 *
 * 列数经 context 继承父级, 调用方不必抄一遍.
 *
 * 与 RowLayout 同住一个文件: 拆壳时要靠 `child.type` 认出彼此, 分成两个文件就成了模块环.
 */
export function RowInner({ ifShow = true, children }: RowInnerProps) {
  const { columnNum } = useContext(RowLayoutContext);

  if (!ifShow) {
    return null;
  }

  return <>{buildCols(children, columnNum)}</>;
}

RowLayout.RowInner = RowInner;
