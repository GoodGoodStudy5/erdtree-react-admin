import { TreeSelect } from 'antd';
import type { TreeSelectProps } from 'antd';
import { MAX_TAG_COUNT } from './constants';
import { $t } from '@/locales';

/** 树形下拉, 多选标签数超出后按容器宽度收起 */
export function BaseTreeSelect(props: TreeSelectProps) {
  const { treeData } = props;

  const currentTreeData =
    treeData?.map((item) => {
      // 如果数组不是对象，则拼接数组
      if (typeof item !== 'object') {
        return { label: item, value: item };
      }
      return item;
    }) || [];

  return (
    <TreeSelect
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      treeNodeFilterProp={props?.fieldNames?.label || 'label'}
      placeholder={$t('public.inputPleaseSelect')}
      {...props}
      treeData={currentTreeData}
    />
  );
}
