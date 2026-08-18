import { Select, type SelectProps } from 'antd';
import { MAX_TAG_COUNT } from './constants';
import { $t } from '@/locales';

/**
 * @description: 基础下拉组件
 */
export function BaseSelect(props: SelectProps) {
  const { options } = props;

  const currentOptions =
    options?.map((item) => {
      // 如果数组不是对象，则拼接数组
      if (typeof item !== 'object') {
        return { label: item, value: item };
      }
      return item;
    }) || [];

  return (
    <Select
      allowClear
      showSearch
      maxTagCount={MAX_TAG_COUNT}
      placeholder={$t('public.inputPleaseSelect')}
      optionFilterProp={props?.fieldNames?.label || 'label'}
      {...props}
      options={currentOptions}
    />
  );
}
