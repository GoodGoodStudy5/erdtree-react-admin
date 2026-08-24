import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';
import { useEffect } from 'react';
import {
  message as antdMessage,
  notification as antdNotification,
  Modal as antdModal,
  App,
} from 'antd';

let message: MessageInstance = antdMessage;
let notification: NotificationInstance = antdNotification;

const { ...resetFns } = antdModal;
let modal: Omit<ModalStaticFunctions, 'warn'> = resetFns;

/**
 * 该组件提供静态方法
 * 作用：跨页面message显示
 * 挂载前由 antd 全局静态方法兜底, 挂载后换成带主题上下文的实例
 */
function StaticMessage() {
  const staticFunctions = App.useApp();

  useEffect(() => {
    message = staticFunctions.message;
    notification = staticFunctions.notification;
    modal = staticFunctions.modal;
  }, [staticFunctions]);

  return null;
}

export { message, notification, modal };

/** 静态调用的挂载点: 渲染它一次, message / notification / modal 三个静态方法才有 antd 上下文 */
export default StaticMessage;
