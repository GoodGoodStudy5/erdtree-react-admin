import type { SelectProps } from 'antd';
import { getGames } from '@/servers';
import { ApiSelect } from '../../Selects';

/**
 * @description: 游戏下拉组件
 */
export function GameSelect(props: SelectProps) {
  return (
    <>
      <ApiSelect
        {...props}
        mode="multiple"
        api={getGames}
        fieldNames={{ label: 'name', value: 'id' }}
      />
    </>
  );
}
