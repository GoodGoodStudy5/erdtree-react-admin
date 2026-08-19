import type { MouseEventHandler, ReactNode, RefObject } from 'react';
import type { ModalProps } from 'antd';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import { useRef, useState } from 'react';
import { Modal, Spin, Tooltip } from 'antd';
import { Icon } from '@iconify/react';
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
  /** 覆盖标题栏三个按钮的悬停提示. 不传则走 LocaleProvider, 再不济落回包内英文 */
  locale?: Partial<ModalLocale>;
}

/** 弹窗, 支持标题栏拖拽与全屏, 移动端自动铺满 */
export function BaseModal(props: BaseModalProps) {
  const { width, children, wrapClassName, onCancel, isLoading = false, locale } = props;
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
          <Icon
            className="text-lg"
            icon={
              !isFullscreen
                ? 'ant-design:fullscreen-outlined'
                : 'ant-design:fullscreen-exit-outlined'
            }
          />
        </div>
      </Tooltip>
      <Tooltip placement="bottom" title={text.close}>
        <div className="p-10px mt-3px cursor-pointer" onClick={handleCancel}>
          <Icon className="text-lg" icon="ant-design:close-outlined" />
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
      maskClosable={false}
      modalRender={!isPhone ? modalRender : undefined}
      {...props}
      className={`base-modal ${props.className}`}
      title={titleRender}
      wrapClassName={isFullscreen ? 'full-modal' : wrapClassName || ''}
      width={isFullscreen ? '100%' : width || 520}
    >
      <Spin spinning={isLoading}>
        <div className="base-modal-content">{children}</div>
      </Spin>
    </Modal>
  );
}
