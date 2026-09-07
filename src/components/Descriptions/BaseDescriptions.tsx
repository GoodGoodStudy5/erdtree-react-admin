import type { DescriptionsProps } from 'antd';
import { Descriptions } from 'antd';
import { eR } from '@south/utils';

/**
 * 详情字段块: antd Descriptions 换一套默认值, 描边、三列、紧凑, 外加空值填占位符.
 *
 * 前三项调用方可覆盖, 空值兜底不可 —— 占位符是全仓库一个口径, 开口子就会有页面显示 `-` 有页面空白.
 * 要某一格真空白就传得出内容的节点; 要某一行不出就别把它放进 items.
 * @param props - antd DescriptionsProps 原样, 无新增
 */
export function BaseDescriptions(props: DescriptionsProps) {
  const items = props.items?.map((item) => ({ ...item, children: eR(item.children) }));

  return (
    <Descriptions
      {...{
        bordered: true,
        column: 3,
        size: 'small',
        ...props,
        // 排在展开之后: props.items 是加工前的原件, 放前面会把兜底整个盖掉
        items,
      }}
    />
  );
}
