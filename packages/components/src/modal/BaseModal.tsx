import type { KeyboardEventHandler, MouseEventHandler, ReactNode, RefObject } from 'react';
import type { ModalProps } from 'antd';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import { useRef, useState } from 'react';
import { Modal, Spin, Tooltip } from 'antd';
import { CloseOutlined, FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import Draggable from 'react-draggable';
import { useLocale } from '../locale';
import type { ModalLocale } from '../locale';
import { useIsPhone } from './useIsPhone';
import './BaseModal.less';

/** 弹窗外壳的 props. 外壳层的 ModalShellProps 由它推导, 两处不必各写一遍 */
export interface BaseModalProps extends Omit<ModalProps, 'onCancel'> {
  /** 内容区加载态, 打开时先拉详情的场景用 */
  isLoading?: boolean;
  onCancel: () => void;
  /** 覆盖标题栏三个按钮的悬停提示. 不传则走 LocaleProvider, 再不济跟着 antd 的语种走 */
  locale?: Partial<ModalLocale>;
  /** 允许回车提交. 默认不允许, 判据见下面的 onContentKeyDown */
  submitOnEnter?: boolean;
}

/** 弹窗, 支持标题栏拖拽与全屏, 移动端自动铺满 */
export function BaseModal(props: BaseModalProps) {
  const {
    width,
    children,
    wrapClassName,
    onCancel,
    isLoading = false,
    locale,
    submitOnEnter = false,
  } = props;
  const isPhone = useIsPhone();
  const defaultLocale = useLocale('Modal');
  const text = { ...defaultLocale, ...locale };
  const [isDisabled, setDisabled] = useState(true);
  const [isFullscreen, setFullscreen] = useState(false);
  const [cacheBounds, setCacheBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
  const draggleRef = useRef<HTMLDivElement>(null);

  // 最大化时取消拖拽偏移, 还原时回到上次拖拽位置
  const bounds = isFullscreen ? { left: 0, top: 0, bottom: 0, right: 0 } : cacheBounds;

  /** 开始拖拽对话框 */
  const onStartMouse = (_event: DraggableEvent, uiData: DraggableData) => {
    const { clientWidth, clientHeight } = window.document.documentElement;
    const targetRect = draggleRef.current?.getBoundingClientRect?.();
    if (!targetRect) return;
    const data = {
      left: -targetRect.left + uiData.x,
      right: clientWidth - (targetRect.right - uiData.x),
      top: -targetRect.top + uiData.y,
      bottom: clientHeight - (targetRect.bottom - uiData.y),
    };
    setCacheBounds(data);
  };

  /** 鼠标拖拽移动 */
  const onMouseOver = () => {
    if (isDisabled) {
      setDisabled(false);
    }
  };

  /** 最大化 */
  const onFullscreen = () => {
    setFullscreen(!isFullscreen);
  };

  /**
   * 弹窗里回车不是提交手势: 确定按钮始终摆在眼前, 回车省不下操作成本,
   * 代价却是在任一输入框敲回车就可能提交并关窗.
   *
   * 拦在内容容器上, 所以每个弹窗不需要为此做任何配合 —— 要配合就会有人忘, 而忘了是静默的.
   * 只拦单行输入框: 多行输入要靠回车换行; 下拉与日期选择器自己已经处理完回车,
   * 这里取消的只是浏览器的默认动作(表单隐式提交), 不影响它们已经做完的选中.
   */
  const onContentKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (submitOnEnter || event.key !== 'Enter') return;
    // 输入法用回车确认候选词, 那一下不能碰
    if (event.nativeEvent.isComposing) return;
    if (!(event.target instanceof HTMLInputElement)) return;
    event.preventDefault();
  };

  /** 点击关闭 */
  const handleCancel: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onCancel?.();
  };

  /** 自定义关闭和放大图标 */
  const CloseRender = (
    <div className="flex items-center justify-end absolute right-15px">
      <Tooltip
        className="hover:text-#404040"
        placement="bottom"
        title={!isFullscreen ? text.maximize : text.exitMaximized}
      >
        <div className="p-10px mt-3px cursor-pointer" onClick={onFullscreen}>
          {!isFullscreen ? (
            <FullscreenOutlined className="text-lg" />
          ) : (
            <FullscreenExitOutlined className="text-lg" />
          )}
        </div>
      </Tooltip>
      <Tooltip placement="bottom" title={text.close}>
        <div className="p-10px mt-3px cursor-pointer" onClick={handleCancel}>
          <CloseOutlined className="text-lg" />
        </div>
      </Tooltip>
    </div>
  );

  /** 自定义标题 */
  const titleRender = (
    <div className="flex items-center">
      <div
        className="modal-custom-title"
        onMouseOver={onMouseOver}
        onMouseOut={() => setDisabled(true)}
      >
        <span className="cursor-text">{props.title || ''}</span>
      </div>
      {CloseRender}
    </div>
  );

  /** 自定义渲染对话框 */
  const modalRender = (modal: ReactNode) => (
    <Draggable
      nodeRef={draggleRef as RefObject<HTMLElement>}
      disabled={isDisabled}
      onStart={onStartMouse}
      bounds={isFullscreen ? undefined : bounds}
      position={isFullscreen ? { x: 0, y: 0 } : undefined}
    >
      <div ref={draggleRef}>{modal}</div>
    </Draggable>
  );

  return (
    <Modal
      destroyOnHidden
      closable={false}
      keyboard={false}
      mask={{ closable: false }}
      modalRender={!isPhone ? modalRender : undefined}
      {...props}
      className={`base-modal ${props.className}`}
      title={titleRender}
      wrapClassName={isFullscreen ? 'full-modal' : wrapClassName || ''}
      width={isFullscreen ? '100%' : width || 520}
    >
      <Spin spinning={isLoading}>
        <div className="base-modal-content" onKeyDown={onContentKeyDown}>
          {children}
        </div>
      </Spin>
    </Modal>
  );
}
