import type { ComponentProps, ComponentType } from 'react';

/**
 * 可被命令式调起的弹窗组件, 约定是把 ModalControl 混进自己的 props.
 * any 由 React 强加: ComponentProps<C> 要求 C extends JSXElementConstructor<any>,
 * 换成 never 或 unknown 会让下面所有推导失效.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ModalComponent = ComponentType<any>;

/** 底座注入给弹窗组件的控制面. 只有两件事: 交结果, 或不交 */
export type ModalControl<R> = {
  /** 交付业务结果并关闭 */
  resolve: (value: R) => void;
  /** 不交结果关闭, 调用方收到 undefined */
  cancel: () => void;
};

/** 从弹窗组件的 props 反推它交付的业务结果 */
export type ModalResult<C extends ModalComponent> =
  ComponentProps<C> extends ModalControl<infer R> ? R : never;

/** 调用侧需要自己传的 props, 即组件 props 去掉底座注入的控制面 */
export type OpenProps<C extends ModalComponent> = Omit<
  ComponentProps<C>,
  keyof ModalControl<never>
>;

/** 业务 props 全可选时允许省略 open 的第二个实参 */
export type OpenArgs<C extends ModalComponent> =
  object extends OpenProps<C> ? [props?: OpenProps<C>] : [props: OpenProps<C>];

/** 用户请求关闭弹窗的来源, 只传给弹窗组件自己, 不外泄给调用方 */
export type CloseReason = 'mask' | 'esc' | 'closeButton' | 'cancelButton';
