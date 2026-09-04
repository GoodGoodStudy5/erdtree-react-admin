import type { ButtonProps } from 'antd';
import { Button, message } from 'antd';
import { Icon } from '../Icon';
import { useClipboard } from '@/hooks';
import { $t } from '@/locales';

interface Props extends ButtonProps {
  text: string;
  value: string;
}

/** 复制按钮, 成功与失败都以全局提示反馈 */
export function CopyBtn(props: Props) {
  const { text, value } = props;
  const [isCopied, error, copyText] = useClipboard();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isCopied && !error) {
      messageApi.success({ content: $t('public.copySuccessfully'), key: 'copy' });
    }

    if (error) {
      messageApi.warning({ content: error || $t('public.copyFailed'), key: 'copy' });
    }
  }, [isCopied, error]);

  /** 点击处理 */
  const onClick = () => {
    try {
      copyText(value);
    } catch (e) {
      console.error(e);
      messageApi.warning({ content: $t('public.copyFailed'), key: 'copy' });
    }
  };

  return (
    <>
      {contextHolder}
      <Button {...props} icon={<Icon icon="ant-design:copy-outlined" />} onClick={onClick}>
        {text}
      </Button>
    </>
  );
}
