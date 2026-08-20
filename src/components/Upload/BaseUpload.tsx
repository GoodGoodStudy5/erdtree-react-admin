import { Button, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { $t } from '@/locales';

/** 文件上传, 请求自动带上登录令牌 */
export function BaseUpload(props: UploadProps) {
  const [getToken] = useToken();
  const token = getToken();

  return (
    <Upload {...props} headers={{ ...props?.headers, Authorization: `Bearer ${token}` }}>
      <Button>{$t('public.uploadFile')}</Button>
    </Upload>
  );
}
