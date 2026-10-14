import type { TimeRangePickerProps } from 'antd';
import type { DateFieldProps, RangeFieldValue } from './DatePickerCore';
import { TimePicker } from 'antd';
import { DatePickerCore } from './DatePickerCore';

const { RangePicker } = TimePicker;

/** 时间区间的 props: antd 时间 RangePicker 的去掉值与格式, 换成 string 契约. 整天口径不适用 */
export type BaseTimeRangePickerProps = Omit<
  TimeRangePickerProps,
  'value' | 'defaultValue' | 'onChange' | 'onOk' | 'format'
> &
  Omit<DateFieldProps<RangeFieldValue>, 'wholeDay'>;

/** 时间区间选择器: 外面只认 string, 两端各自可空 */
export function BaseTimeRangePicker(props: BaseTimeRangePickerProps) {
  const { value, format, onChange, ...rest } = props;

  return (
    <DatePickerCore
      kind="timeRange"
      value={value}
      format={format}
      allowEmpty={rest.allowEmpty}
      onChange={onChange}
    >
      {(binding) => (
        <RangePicker
          {...rest}
          value={binding.range}
          format={binding.formats}
          onChange={binding.onChange}
        />
      )}
    </DatePickerCore>
  );
}
