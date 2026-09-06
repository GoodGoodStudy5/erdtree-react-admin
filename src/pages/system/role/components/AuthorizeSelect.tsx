import type { Key } from 'react';
import { Spin } from 'antd';
import type { SelectProps } from 'antd';
import { getRolePermission } from '@/servers';
import type { PermissionData } from '@/servers';
import MenuAuthorize from './MenuAuthorize';

interface Props extends SelectProps {
  id: string;
}

function AuthorizeSelect(props: Props) {
  const { id, value, onChange } = props;
  const [list, setList] = useState<PermissionData[]>([]);
  const [isLoading, setLoading] = useState(false);

  /** 获取数据 */
  const getList = async () => {
    const params = { roleId: id };

    try {
      setLoading(true);
      const data = await getRolePermission(params);
      setList(data?.treeData || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getList();
  }, []);

  /** 点击复选框 */
  const handleCheckedKeysChange = (checkedKeys: Key[]) => {
    // 将字符串数组转换为整数数组
    const numberKeys = checkedKeys.map((key) =>
      typeof key === 'string' ? parseInt(key, 10) : (key as number),
    );
    onChange?.(numberKeys);
  };

  return (
    <Spin spinning={isLoading}>
      <MenuAuthorize
        isBordered
        treeData={list}
        defaultCheckedKeys={value || []}
        onChange={handleCheckedKeysChange}
      />
    </Spin>
  );
}

export default AuthorizeSelect;
