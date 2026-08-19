import type { ComponentProps, ComponentType, ReactNode } from 'react';
import type { ModalProps } from 'antd';

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

/**
 * 用户请求关闭弹窗的来源, 只传给弹窗组件自己, 不外泄给调用方.
 * 目前只区分得出"用户主动请求" —— antd 的 onCancel 不区分遮罩 / Esc / 按钮.
 * 写成联合类型而非字面量, 日后补充来源不破坏既有的 reason === 'userRequest' 判断.
 */
export type CloseReason = 'userRequest';

/** 外壳层接管的 antd Modal 字段. 提交期间要禁止关闭, 故取消按钮与遮罩键盘也在内 */
export type ShellOwnedModalProps = Pick<
  ModalProps,
  | 'open'
  | 'confirmLoading'
  | 'onOk'
  | 'onCancel'
  | 'cancelButtonProps'
  | 'maskClosable'
  | 'keyboard'
>;

/** useModalShell 的入参 */
export type UseModalShellOptions<R> = {
  /** 返回值即业务结果. 返回 Promise 时提交期间阻塞并禁止关闭 */
  onOk: () => R | Promise<R>;
  /** 提交失败时接管异常. 不传则重抛, 走 unhandledrejection 由监控兜住 */
  onError?: (error: unknown) => void;
};

/** useModalShell 的产出. 中性原语给任意载体, modalProps 只给 antd Modal 系 */
export type UseModalShellResult = {
  /** 提交进行中 */
  confirmLoading: boolean;
  /** 触发提交 */
  submit: () => void;
  /** 请求关闭. 会先过 useCloseGuard */
  close: () => void;
  /**
   * 给 antd Modal 系载体整包展开.
   * 非 Modal 载体请改用上面的中性原语 —— JSX 展开不做多余属性检查,
   * 把这个包展开到 Drawer 上编译器不会报错, 而 onCancel 会被静默忽略.
   */
  modalProps: ShellOwnedModalProps;
};

/** ModalShell 的 props. control 是类型连通的关键, 不能改走 context */
export type ModalShellProps<R> = Omit<ModalProps, keyof ShellOwnedModalProps> & {
  /** 直接把弹窗组件自己的 props 传进来, R 由此反推 */
  control: ModalControl<R>;
  /** 返回值即业务结果 */
  onOk: () => R | Promise<R>;
  /** 提交失败时接管异常. 不传则重抛 */
  onError?: (error: unknown) => void;
  children?: ReactNode;
};

/** ModalForm 的 props. V 从 onSubmit 的参数标注推出, R 从 control 推出 */
export type ModalFormProps<V, R> = Omit<ModalShellProps<R>, 'onOk'> & {
  /** 收到已通过校验的表单值, 返回值即业务结果 */
  onSubmit: (values: V) => R | Promise<R>;
};

/** 命令式入口的签名. 自由函数, 不依赖 React 上下文, 实现必须 satisfies 它 */
export type OpenFn = <C extends ModalComponent>(
  comp: C,
  ...args: OpenArgs<C>
) => Promise<ModalResult<C> | undefined>;

/** 集合门面的签名. 只做命名绑定, 不产出待挂载的节点 */
export type CreateModalSetFn = <T extends Record<string, ModalComponent>>(
  set: T,
) => {
  [K in keyof T]: {
    open: (...args: OpenArgs<T[K]>) => Promise<ModalResult<T[K]> | undefined>;
  };
};

/** 关闭拦截的签名. 返回 false 则不关 */
export type UseCloseGuardFn = (guard: (reason: CloseReason) => boolean | Promise<boolean>) => void;

/** 外壳 hook 的签名 */
export type UseModalShellFn = <R>(
  control: ModalControl<R>,
  options: UseModalShellOptions<R>,
) => UseModalShellResult;

/** 外壳组件的签名 */
export type ModalShellFn = <R>(props: ModalShellProps<R>) => ReactNode;

/** 表单外壳组件的签名 */
export type ModalFormFn = <V, R>(props: ModalFormProps<V, R>) => ReactNode;
