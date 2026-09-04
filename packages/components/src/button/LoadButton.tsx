import type { MouseEvent, ReactNode } from 'react';
import type { ButtonProps, PopconfirmProps } from 'antd';
import { useState } from 'react';
import { Button, Popconfirm } from 'antd';
import { QuestionCircleFilled } from '@ant-design/icons';
import { propsMerge } from '../utils';
import './LoadButton.less';

/** 确认气泡的配置. content 是 antd 没有的第二行说明文字, 给"这一下要删什么"留位置 */
export type LoadButtonConfirmProps = PopconfirmProps & { content?: ReactNode };

/** LoadButton 的 props. antd ButtonProps 全量透传, onClick 换成可返回 Promise 的版本 */
export interface LoadButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * 点击回调. 返回 Promise 时组件自动接管 loading 与防重复点击, 于是调用方一行
   * `onClick={() => apiUserDelete(id)}` 就得到完整异步态.
   *
   * 走确认气泡时这一下由 onConfirm 转发, antd 不保证带上事件对象, 所以 event 可缺席.
   */
  onClick?: (event?: MouseEvent<HTMLElement>) => void | Promise<unknown>;
  /** 二次确认气泡. 默认 false 不包 Popconfirm */
  popconfirmProps?: LoadButtonConfirmProps | false;
  /**
   * 异步 onClick 收场时的通知. isCatch 为 true 表示以异常收场, error 是原样的异常对象.
   *
   * 组件不替调用方消化异常: 它只收回 loading, 处理与否由这个回调的实现决定.
   *
   * 已知边界: 回调比收回 loading 早一个 React 周期, 回调执行时按钮仍是 loading 态.
   */
  onClickFinally?: (result: { isCatch: boolean; error?: unknown }) => void;
  /** loading 期间替换的按钮文案. 不传则沿用 children; 外部显式传 loading 时同样生效 */
  loadingChildren?: ReactNode;
  /** 点击前置校验. 返回 false 则短路后续事件, 且确认气泡不弹 */
  beforeClick?: (event: MouseEvent<HTMLElement>) => void | false;
}

/** popconfirmProps 给 false 表示不要气泡; 收窄掉之后才能安全读它的 title / content */
function hasConfirm(
  popconfirmProps: LoadButtonProps['popconfirmProps'],
): popconfirmProps is LoadButtonConfirmProps {
  return popconfirmProps !== false && popconfirmProps !== undefined;
}

/** 鸭子判断: 返回值能 then 就按异步态接管 */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';
}

/** antd 的 title 允许给渲染函数, 放进双行标题前要先兑换成节点 */
function toNode(value: PopconfirmProps['title']): ReactNode {
  return typeof value === 'function' ? value() : value;
}

/**
 * 按钮, 从 onClick 的返回值自动接管异步态: 返回 Promise 就自己转 loading、拦住重复点击,
 * 结束后经 onClickFinally 通知调用方.
 *
 * 异常处置的立场: 组件感知到异常也不处理它, 只有调用方知道该怎么处理. 所以 catch 只做两件事
 * —— 收回 loading, 给出通知通道 (外加一行 console.error 留线索), 不改写调用方看到的结果.
 */
export function LoadButton(props: LoadButtonProps) {
  const {
    beforeClick,
    onClick,
    onClickFinally,
    popconfirmProps = false,
    loadingChildren,
    children,
    ...restProps
  } = props;
  const [isLoading, setLoading] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  // 外部显式给了 loading 就以外部为准: 异步态内收不等于把覆盖口封死
  const loading = restProps.loading === true ? true : isLoading;

  const runClick = (event?: MouseEvent<HTMLElement>) => {
    const result = onClick?.(event);

    // 同步 onClick 没有异步态可接管, 到此为止
    if (!isThenable(result)) {
      return;
    }
    setLoading(true);
    Promise.resolve(result)
      .then(
        () => onClickFinally?.({ isCatch: false }),
        (error: unknown) => {
          console.error(error);
          onClickFinally?.({ isCatch: true, error });
        },
      )
      .finally(() => setLoading(false));
  };

  /**
   * 气泡的开合由这里定, 不交给触发器: rc-trigger 在本次点击事件里先请求打开、后调本回调,
   * 若把"开"交给它, beforeClick 的否决就永远晚一步, 校验不过的气泡照样闪一下.
   */
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (!hasConfirm(popconfirmProps)) {
      if (beforeClick?.(event) !== false) {
        runClick(event);
      }
      return;
    }
    // 气泡开着时这一下是"收起", 不必再跑一遍前置校验
    if (isConfirmOpen) {
      setConfirmOpen(false);
      return;
    }
    if (beforeClick?.(event) === false) {
      return;
    }
    setConfirmOpen(true);
  };

  const buttonProps = propsMerge(
    {
      type: 'link',
      // 没显式给 type 时这是一枚文字按钮, 去掉 antd link 按钮的内边距与行高, 好嵌在表格行里
      className: restProps.type === undefined ? 'load-button load-button-link-text' : 'load-button',
    } as ButtonProps,
    restProps,
  );
  const button = (
    <Button {...buttonProps} loading={loading} onClick={handleClick}>
      {loading ? (loadingChildren ?? children) : children}
    </Button>
  );

  if (!hasConfirm(popconfirmProps)) {
    return button;
  }

  const { content, ...restConfirmProps } = popconfirmProps;
  const confirmProps = propsMerge(
    {
      icon: <QuestionCircleFilled />,
      placement: 'topRight',
      disabled: restProps.disabled,
      open: isConfirmOpen,
    } as PopconfirmProps,
    restConfirmProps,
    {
      // 只接受"关"的请求 (点空白处 / 取消 / 确认后收起); "开"归 handleClick, 见那里的说明
      onOpenChange: (open: boolean) => {
        if (!open) {
          setConfirmOpen(false);
        }
      },
      onConfirm: runClick,
    },
  );

  return (
    <Popconfirm
      {...confirmProps}
      title={
        content === undefined ? (
          popconfirmProps.title
        ) : (
          <div className="load-button-pop-title">
            <div className="load-button-pop-title-label">{toNode(popconfirmProps.title)}</div>
            <div className="load-button-pop-title-content">{content}</div>
          </div>
        )
      }
    >
      {button}
    </Popconfirm>
  );
}
