import type { TimePickerProps } from 'antd';
import { TimePicker } from 'antd';
import { string2Dayjs } from '../utils/helper';

/** 时间选择器, 字符串时间自动转 dayjs 后回填 */
export function BaseTimePicker(props: TimePickerProps) {
  const { value } = props;
  const params = { ...props };

  // 如果值不是dayjs类型则进行转换
  if (value) params.value = string2Dayjs(value);

  return <TimePicker {...params} />;
}
