import type { Dayjs } from 'dayjs';
import type { TimePickerProps } from 'antd';
import type { DateFieldProps } from './DatePickerCore';
import { TimePicker } from 'antd';
import { DatePickerCore } from './DatePickerCore';

/** 时间的 props: antd TimePicker 的去掉值、格式与多选, 换成 string 契约. 整天口径不适用 */
export type BaseTimePickerProps = Omit<
  TimePickerProps,
  'value' | 'defaultValue' | 'onChange' | 'onOk' | 'format' | 'multiple'
> &
  Omit<DateFieldProps<string | Dayjs>, 'wholeDay'>;

/** 时间选择器: 外面只认 string */
export function BaseTimePicker(props: BaseTimePickerProps) {
  const { value, format, onChange, ...rest } = props;

  return (
    <DatePickerCore kind="time" value={value} format={format} onChange={onChange}>
      {(binding) => (
        <TimePicker
          {...rest}
          value={binding.single}
          format={binding.formats}
          onChange={binding.onChange}
        />
      )}
    </DatePickerCore>
  );
}
