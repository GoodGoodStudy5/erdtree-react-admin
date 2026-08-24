import type { FormItemProps } from 'antd';
import type { ReactNode } from 'react';

/** 两种取值形态共用的字段挂载面与空值兜底口径 */
interface FormItemValueCommonProps {
  /**
   * Form.Item 的字段路径. 给了它, 值就改由所在表单的上下文注入, 表单数据一变展示跟着变.
   *
   * 收数组形式, 所以 Form.List 的行内字段 (`[field.name, '字段名']`) 直接可用.
   */
  name?: FormItemProps['name'];
  /**
   * 字段标签, formItemProps.label 的快捷写法.
   *
   * 只在表单态生效: 标签是 Form.Item 的能力, 而表单态由 name 或 formItemProps 触发.
   */
  label?: FormItemProps['label'];
  /**
   * Form.Item 的完整转发面. 布局细节 (noStyle、labelCol) 一律从这里给,
   * 只读项因此能与相邻的可编辑项对齐到同一套排版.
   *
   * 它是完整面, 所以同名键以它为准 —— 顶级 name / label 只是它的快捷写法.
   *
   * 已知边界: 只给它而不给 name 时组件仍包一层 Form.Item, 但没有字段绑定,
   * 值不会被注入, 仍从 value 来.
   */
  formItemProps?: FormItemProps;
  /**
   * 空值兜底. 传 true 用统一占位符 `-`, 传节点则由调用方定内容;
   * 不给或传 false 就不兜底, 于是按条件开关兜底的调用方不必自己写分支.
   *
   * 判空看最终渲染结果 (children 调用之后): undefined、null、空字符串算空,
   * 0 与 false 不算 —— 金额为 0、开关为关都是有效值, 兜成占位符会把信息丢掉.
   */
  empty?: true | ReactNode;
}

/** 值本身就是可渲染节点时的 props: 不给 children, 值原样渲染 */
export interface FormItemValueNodeProps extends FormItemValueCommonProps {
  /** 展示的值. 表单态由 Form.Item 注入并盖掉这里传的 */
  value?: ReactNode;
  children?: never;
}

/** children 接管渲染时的 props: 值是什么类型都行, 怎么变成节点由 children 说 */
export interface FormItemValueRenderProps<VT> extends FormItemValueCommonProps {
  /** 展示的值. 表单态由 Form.Item 注入并盖掉这里传的 */
  value?: VT;
  /**
   * 值到节点的渲染函数. 字典映射、金额格式化这类展示加工都住这里,
   * 组件本身对值不做任何加工.
   *
   * 入参一定带 undefined: 表单字段可能没值. 不想在这里判空, 就让它返回空交给 empty 兜底.
   */
  children: (value: VT | undefined) => ReactNode;
}

/**
 * FormItemValue 的 props. 两条分支按有没有 children 分:
 * 给了 children 值类型任意, 不给则值必须自己就能渲染.
 *
 * 值类型渲染不出来时"不给 children"那条分支整条消失, 于是
 * `<FormItemValue<Money> name="fee" />` 在编译期就死, 而不是留到运行时让 React 抛.
 * 条件写成非分发形式 ([VT] extends [ReactNode]), 否则联合值类型会被逐个成员摊开.
 *
 * 泛型参数是值类型, 表单态推不出来 (值来自表单上下文), 需要它流入 children 时显式写上:
 * `<FormItemValue<string> name="state">{(value) => ...}</FormItemValue>`.
 */
export type FormItemValueProps<VT = ReactNode> =
  ([VT] extends [ReactNode] ? FormItemValueNodeProps : never) | FormItemValueRenderProps<VT>;
