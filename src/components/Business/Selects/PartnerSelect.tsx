import type { SelectProps } from 'antd';
import { getPartner } from '@/servers';
import { ApiSelect } from '../../Selects';

/**
 * @description: 合作公司下拉组件
 */
export function PartnerSelect(props: SelectProps) {
  return (
    <ApiSelect
      {...props}
      api={getPartner}
      mode="multiple"
      fieldNames={{ label: 'name', value: 'id' }}
    />
  );
}
