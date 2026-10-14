import type { RangePickerProps } from 'antd/es/date-picker';
import type { DateFieldProps, RangeFieldValue } from './DatePickerCore';
import { DatePicker } from 'antd';
import { DatePickerCore } from './DatePickerCore';

const { RangePicker } = DatePicker;

/** 日期区间的 props: antd RangePicker 的去掉值、格式与时间面板, 换成 string 契约 */
export type BaseRangePickerProps = Omit<
  RangePickerProps,
  'value' | 'defaultValue' | 'onChange' | 'onOk' | 'format' | 'picker' | 'showTime'
> &
  DateFieldProps<RangeFieldValue>;

/** 日期区间选择器: 外面只认 string, 两端各自可空 */
export function BaseRangePicker(props: BaseRangePickerProps) {
  const { value, format, wholeDay, onChange, ...rest } = props;

  return (
    <DatePickerCore
      kind="dateRange"
      value={value}
      format={format}
      wholeDay={wholeDay}
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
