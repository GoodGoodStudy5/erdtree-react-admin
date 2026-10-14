import type { Dayjs } from 'dayjs';
import type { DatePickerProps } from 'antd';
import type { DateFieldProps } from './DatePickerCore';
import { DatePicker } from 'antd';
import { DatePickerCore } from './DatePickerCore';

/** 单日的 props: antd DatePicker 的去掉值、格式、多选与时间面板, 换成 string 契约 */
export type BaseDatePickerProps = Omit<
  DatePickerProps<Dayjs, false>,
  'value' | 'defaultValue' | 'onChange' | 'onOk' | 'format' | 'multiple' | 'picker' | 'showTime'
> &
  DateFieldProps<string | Dayjs>;

/** 日期选择器: 外面只认 string */
export function BaseDatePicker(props: BaseDatePickerProps) {
  const { value, format, wholeDay, onChange, ...rest } = props;

  return (
    <DatePickerCore
      kind="date"
      value={value}
      format={format}
      wholeDay={wholeDay}
      onChange={onChange}
    >
      {(binding) => (
        <DatePicker
          {...rest}
          value={binding.single}
          format={binding.formats}
          onChange={binding.onChange}
        />
      )}
    </DatePickerCore>
  );
}
