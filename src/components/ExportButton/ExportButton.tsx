import type { LoadButtonProps, ModalControl } from '@south/components';
import type { ReactNode } from 'react';
import { Form, Input } from 'antd';
import { BaseModal, LoadButton, openModal, useModalForm } from '@south/components';
import { message } from '@south/message';

/** 默认 form: 开窗、同步提交即关. noForm 跳过窗. asyncForm 等 Promise 再通知 */
export type ExportButtonMode = 'form' | 'noForm' | 'asyncForm';

/** 窗里收集到的值. 默认只有 fileName, formChildren 可追加 */
export type ExportFormValues = Record<string, unknown> & { fileName?: string };

type ExportButtonPropsOmit = Omit<
  LoadButtonProps,
  'onClick' | 'href' | 'htmlType' | 'target' | 'children' | 'beforeClick'
>;

/** 导出按钮的 props */
export interface ExportButtonProps {
  /**
   * form / asyncForm 交窗里的值; noForm 交 `{ fileName: defaultFileName }`, 没传默认名则是 `{}`.
   * 同步下载在里面调 submitHiddenForm.
   */
  request: (values: ExportFormValues) => void | Promise<void>;
  /** 默认 form, 不用填 */
  mode?: ExportButtonMode;
  /** 开窗或 noForm 提交那一刻才取值. 函数用于带时点的默认名 */
  defaultFileName?: string | (() => string);
  /** 不传则跟按钮文案 */
  title?: string;
  /** 返回 false 则不开窗、不提交 */
  beforeClick?: LoadButtonProps['beforeClick'];
  /** 类型拿掉会让开窗静默死掉的那些键 */
  buttonProps?: ExportButtonPropsOmit;
  /** 默认「导出」. 窗标题不传时跟这份走 */
  children?: ReactNode;
  /** 不传则壳自己放必填 fileName. noForm 无窗可放 */
  formChildren?: (params: { nodeFileName: ReactNode }) => ReactNode;
}

function resolveFileName(value?: string | (() => string)): string | undefined {
  return typeof value === 'function' ? value() : value;
}

function fileNameItem(defaultFileName?: string) {
  return (
    <Form.Item
      label="文件名"
      name="fileName"
      rules={[{ required: true, message: '请填写文件名' }]}
      initialValue={defaultFileName}
    >
      <Input />
    </Form.Item>
  );
}

function ExportFormModal(
  props: ModalControl<void> & {
    title: ReactNode;
    defaultFileName?: string;
    formChildren?: ExportButtonProps['formChildren'];
    request: (values: ExportFormValues) => void | Promise<void>;
    notify: boolean;
  },
) {
  const { title, defaultFileName, formChildren, request, notify, ...control } = props;
  const { form, handleFinish, modalProps } = useModalForm<ExportFormValues, void>(control, {
    async onSubmit(values) {
      await request(values);
      if (notify) message.success('正在异步导出中');
    },
    onError(error) {
      console.error(error);
    },
  });

  const nodeFileName = fileNameItem(defaultFileName);

  return (
    <BaseModal {...modalProps} title={title}>
      <Form form={form} labelCol={{ flex: '0 0 100px' }} onFinish={handleFinish}>
        {formChildren ? formChildren({ nodeFileName }) : nodeFileName}
      </Form>
    </BaseModal>
  );
}

/**
 * 确认后一律调 request. 同步下载由调用方在 request 里走 submitHiddenForm;
 * 壳不认识 CSRF, 也不认识业务字段.
 */
export function ExportButton(props: ExportButtonProps) {
  const {
    request,
    mode = 'form',
    defaultFileName,
    title,
    beforeClick,
    buttonProps,
    children = '导出',
    formChildren,
  } = props;

  const onClick = () => {
    if (mode === 'noForm') {
      const fileName = resolveFileName(defaultFileName);
      const values: ExportFormValues = fileName === undefined ? {} : { fileName };
      return request(values);
    }
    void openModal(ExportFormModal, {
      title: title ?? children,
      defaultFileName: resolveFileName(defaultFileName),
      formChildren,
      request,
      notify: mode === 'asyncForm',
    });
  };

  return (
    <LoadButton {...buttonProps} beforeClick={beforeClick} onClick={onClick}>
      {children}
    </LoadButton>
  );
}
