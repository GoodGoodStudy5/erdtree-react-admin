export {
  ModalOutlet,
  createModalSet,
  getModalInstances,
  openModal,
  requestCloseModal,
  useModalId,
  useModalInstances,
  useModalVisible,
} from './adapter';
export type { ModalInstance } from './adapter';
export { BaseModal } from './BaseModal';
export type { BaseModalProps } from './BaseModal';
export { ModalAbort, isModalAbort } from './abort';
export { ModalShell } from './ModalShell';
export { useCloseGuard } from './useCloseGuard';
export { useIsPhone } from './useIsPhone';
export { useModalForm } from './useModalForm';
export { useModalShell } from './useModalShell';
export type {
  ModalComponent,
  ModalControl,
  ModalResult,
  OpenProps,
  OpenArgs,
  CloseReason,
  ShellOwnedModalProps,
  UseModalShellOptions,
  UseModalShellResult,
  ModalShellProps,
  UseModalFormOptions,
  UseModalFormResult,
  OpenFn,
  CreateModalSetFn,
  UseModalIdFn,
  UseModalVisibleFn,
  UseCloseGuardFn,
  UseModalShellFn,
  ModalShellFn,
  UseModalFormFn,
} from './types';
