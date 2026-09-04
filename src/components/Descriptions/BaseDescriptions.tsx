import type { DescriptionsProps } from 'antd';
import { Descriptions } from 'antd';

/**
 * 详情字段块: antd Descriptions 换一套默认值, 描边、三列、紧凑.
 *
 * 三项都可由调用方覆盖 —— 它们是默认值, 不是接管.
 * @param props - antd DescriptionsProps 原样, 无新增
 */
export function BaseDescriptions(props: DescriptionsProps) {
  return (
    <Descriptions
      {...{
        bordered: true,
        column: 3,
        size: 'small',
        ...props,
      }}
    />
  );
}
