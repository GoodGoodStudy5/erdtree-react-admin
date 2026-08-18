import type { Dayjs } from 'dayjs';
import type { DatePickerProps } from 'antd';
import { DatePicker } from 'antd';
import { string2Dayjs } from '../utils/helper';

/** 日期选择器, 字符串日期自动转 dayjs 后回填 */
export function BaseDatePicker(props: DatePickerProps) {
  const { value } = props;
  const params = { ...props };

  // 如果值不是dayjs类型则进行转换
  if (value) params.value = string2Dayjs(value as Dayjs);

  return <DatePicker {...params} />;
}
