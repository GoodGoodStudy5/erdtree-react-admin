import { Button, Upload, type UploadProps } from 'antd';

/** 文件上传, 请求自动带上登录令牌 */
export function BaseUpload(props: UploadProps) {
  const { t } = useTranslation();
  const [getToken] = useToken();
  const token = getToken();

  return (
    <Upload {...props} headers={{ ...props?.headers, Authorization: `Bearer ${token}` }}>
      <Button>{t('public.uploadFile')}</Button>
    </Upload>
  );
}
