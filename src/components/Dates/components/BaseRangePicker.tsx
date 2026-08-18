import { DatePicker } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { stringRang2DayjsRang } from '../utils/helper';

const { RangePicker } = DatePicker;

/** 日期区间选择器, 字符串区间自动转 dayjs 后回填 */
export function BaseRangePicker(props: RangePickerProps) {
  const { value } = props;
  const params = { ...props };

  // 如果值不是dayjs类型则进行转换
  if (value) params.value = stringRang2DayjsRang(value);

  return <RangePicker {...params} />;
}
