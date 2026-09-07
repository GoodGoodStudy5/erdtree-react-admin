import type {
  InputProps,
  InputNumberProps,
  SelectProps,
  TreeSelectProps,
  RadioProps,
  DatePickerProps,
  TimePickerProps,
  UploadProps,
  RateProps,
  CheckboxProps,
  SliderSingleProps,
  TimeRangePickerProps,
  TransferProps,
  FormItemProps,
  SwitchProps,
} from 'antd';
import type {
  ApiSelectProps,
  ApiTreeSelectProps,
  ApiPageSelectProps,
} from '@/components/Selects/types';
import type { Key, ReactNode } from 'react';
import type { RangePickerProps } from 'antd/lib/date-picker';
import type { DefaultOptionType } from 'antd/lib/select';
import type { RuleObject } from 'antd/lib/form';
import type { BusinessComponents } from '@/components/Business';
import type { EditorProps } from '@/components/WangEditor';
import type { TextAreaProps } from 'antd/es/input';

/** 表单数据的通用形状: 字段名到值, 无契约约束 */
export type BaseFormData = Record<string, unknown>;

// 基础数据组件
type DefaultDataComponents =
  'Input' | 'InputNumber' | 'TextArea' | 'InputPassword' | 'AutoComplete' | 'customize';

// 下拉组件
type SelectComponents = 'Select' | 'TreeSelect' | 'ApiSelect' | 'ApiTreeSelect' | 'ApiPageSelect';

// 复选框组件
type CheckboxComponents = 'Checkbox' | 'CheckboxGroup';

// 单选框组件
type RadioComponents = 'RadioGroup' | 'Switch';

// 时间组件
type TimeComponents = 'DatePicker' | 'RangePicker' | 'TimePicker' | 'TimeRangePicker';

// 上传组件
type UploadComponents = 'Upload';

// 星级组件
type RateComponents = 'Rate';

// 穿梭俊组件
type TransferComponents = 'Transfer';

// 滑动输入条组件
type SliderComponents = 'Slider';

// 自定义组件
type CustomizeComponents = 'Customize';

// 富文本编辑器
type EditorComponents = 'RichEditor';

// 密码强度组件
type PasswordStrength = 'PasswordStrength';

/** 表单项可用的组件名全集, BaseFormList.component 的值域 */
export type ComponentType =
  | DefaultDataComponents
  | SelectComponents
  | CheckboxComponents
  | TimeComponents
  | RadioComponents
  | CustomizeComponents
  | UploadComponents
  | RateComponents
  | SliderComponents
  | EditorComponents
  | PasswordStrength
  | TransferComponents
  | BusinessComponents;

/** Api 系下拉组件的选项形状 */
export interface ApiResult extends Omit<DefaultOptionType, 'value'> {
  /** 选项文案 */
  label: ReactNode;
  /** 悬浮提示 */
  title?: ReactNode;
  /** React key */
  key?: Key;
  /** 选项值 */
  value?: string | number;
}

/** API 请求函数, 入参个数与形状由具体接口决定 */
export type ApiFn = (...params: unknown[]) => Promise<unknown>;

/** 各表单组件入参的联合: 按 component 分发, 单个组件只收自己那份 */
export type ComponentProps =
  | InputProps
  | InputNumberProps
  | TextAreaProps
  | SelectProps
  | TreeSelectProps
  | CheckboxProps
  | RadioProps
  | DatePickerProps
  | TimePickerProps
  | UploadProps
  | RateProps
  | SliderSingleProps
  | TimeRangePickerProps
  | TransferProps
  | RangePickerProps
  | ApiSelectProps
  | ApiTreeSelectProps
  | ApiPageSelectProps
  | SwitchProps
  | EditorProps;

/** 各表单组件入参的交叉: 自定义渲染函数一次拿到全部可能的入参 */
export type RenderComponentProps = InputProps &
  InputNumberProps &
  TextAreaProps &
  SelectProps &
  TreeSelectProps &
  CheckboxProps &
  RadioProps &
  DatePickerProps &
  TimePickerProps &
  UploadProps &
  RateProps &
  SliderSingleProps &
  TimeRangePickerProps &
  TransferProps &
  RangePickerProps &
  ApiSelectProps &
  ApiTreeSelectProps &
  ApiPageSelectProps &
  EditorProps;

/** 表单校验规则: antd 规则加触发时机 */
export type FormRule = RuleObject & {
  /** 校验触发时机 */
  trigger?: 'blur' | 'change' | ['change', 'blur'];
};

/** 表单自定义渲染函数 */
export type CustomizeRender = (props: RenderComponentProps) => ReactNode;

/** 一个表单项的配置 */
export interface BaseFormList extends FormItemProps {
  /** 表单域字段名, 数组表示嵌套路径 */
  name: string | string[];
  /** 标签 */
  label: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 单位, 无法和 extra 一起显示 */
  unit?: string;
  /** 校验规则 */
  rules?: FormRule[];
  /** label 宽度 */
  labelWidth?: number;
  /** 内容宽度 */
  wrapperWidth?: number;
  /** 渲染成哪个组件 */
  component: ComponentType;
  /** 组件参数 */
  componentProps?: ComponentProps;
  /** 自定义渲染 */
  render?: CustomizeRender;
}

/** 搜索区的一个表单项配置 */
export interface BaseSearchList extends BaseFormList {
  /** label 宽度, 单位 px; 不给则用搜索栏的统一宽度 */
  labelWidth?: number;
  /**
   * 占几列, 默认 1.
   *
   * 区间类字段 (日期区间, 数值上下限) 给 2: 一列装不下两端. 值超过当前断点的列数时只占满一行.
   */
  colSize?: number;
}
