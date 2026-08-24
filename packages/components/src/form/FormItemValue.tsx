import type { ReactNode } from 'react';
import { Form } from 'antd';
import type { FormItemValueProps } from './types';

/** 空值的统一显示. 是符号而不是文案, 所以不接 locale; 要文案级占位请走 empty 传节点 */
const EMPTY_TEXT = '-';

/** 算作空的渲染结果. 只此三个, 判据见 FormItemValueProps 的 empty */
function isEmptyNode(node: ReactNode) {
  return node === undefined || node === null || node === '';
}

/**
 * ValueContent 的 props. 值与渲染函数在 ValueContent 上都是未知类型: 表单态的值由 Form.Item
 * 克隆注入, 类型上无从得知. 对外的值类型契约由 FormItemValueProps 的泛型担保.
 */
interface ValueContentProps {
  value?: unknown;
  empty?: true | ReactNode;
  render?: (value: unknown) => ReactNode;
}

/**
 * 值渲染与空值兜底. 单独成一个组件而不是内联一段结果: Form.Item 只把值克隆注入给它的那个
 * React 元素, 注入不进一段渲染结果.
 */
function ValueContent({ value, empty, render }: ValueContentProps) {
  // 没有 render 时值就是节点, 这由 FormItemValueNodeProps 的 ReactNode 约束保证
  const node = render ? render(value) : (value as ReactNode);

  if (empty === undefined || empty === false || !isEmptyNode(node)) {
    return <>{node}</>;
  }
  return <>{empty === true ? EMPTY_TEXT : empty}</>;
}

/**
 * 表单字段的只读展示: 一行声明拿到字段挂载、自动取值与空值兜底.
 *
 * 详情页、确认弹窗、审批页里的只读字段与可编辑字段混排在同一个 Form 里, 靠本组件走 Form.Item
 * 承接, 于是 label、冒号、栅格与相邻可编辑项是同一套排版, 页面读起来是一张表单而不是两套版式.
 *
 * 双形态由 props 决定, 与是否真的处在 Form 里无关: 给了 name 或 formItemProps 就自包一层
 * Form.Item, 两者都不给则直接渲染 value 或 children 的结果, 空值口径不变.
 *
 * 永远只读, 不暴露 onChange 这类写把手. 值的展示加工 (字典、金额、日期) 一律走 children,
 * 组件内不做任何加工, 所以它除 react / antd 外零依赖, 不接业务字典与请求.
 */
export function FormItemValue<VT = ReactNode>(props: FormItemValueProps<VT>) {
  const { name, label, formItemProps, empty, value, children } = props;
  const content = (
    <ValueContent empty={empty} render={children as ValueContentProps['render']} value={value} />
  );

  // 按值判断而不是按键存在: `name={undefined}` 意思是"没给", 不该因此包出一层 Form.Item
  if (name === undefined && formItemProps === undefined) {
    return content;
  }
  const itemProps = { label, name, ...formItemProps };

  return <Form.Item {...itemProps}>{content}</Form.Item>;
}
