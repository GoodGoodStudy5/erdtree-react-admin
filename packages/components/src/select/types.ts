import type { ReactNode, Ref } from 'react';
import type { SelectProps } from 'antd';

/** 选项值. value 的类型脏了是数据源的事, 组件按契约收, 不做归一 */
export type SearchSelectOptionValue = string | number;

/**
 * 选项形状 —— 这就是 request 的数据契约.
 *
 * 数据源必须交出 label 与 value, 业务字段照原样带着 (多列下拉的单元格与多属性搜索都从它们取值).
 * 组合展示 (如 "编码-名称") 请在数据源里加工好: 组件不提供 displayRender, 否则同一种拼法
 * 会在每个页面各写一遍, 而数据源才是它唯一该住的地方.
 */
export interface SearchSelectOption {
  label: ReactNode;
  value: SearchSelectOptionValue;
  disabled?: boolean;
  [key: string]: unknown;
}

/**
 * labelInValue 时的值形状: 调用方必须给完整的 `{label, value}`.
 *
 * 窄契约 —— 组件不为"选项还没拉回来时删不掉已选值"做回填缝补
 */
export interface SearchSelectLabeledValue<OT extends SearchSelectOption = SearchSelectOption> {
  key?: string;
  value: OT['value'];
  label: ReactNode;
}

/** 合法的取值形状: 单选、多选、labelInValue 单选与多选 */
export type SearchSelectValue<OT extends SearchSelectOption = SearchSelectOption> =
  OT['value'] | OT['value'][] | SearchSelectLabeledValue<OT> | SearchSelectLabeledValue<OT>[];

/**
 * 多列下拉的一列. dataIndex 与 render 的取值类型绑在一起,
 * 所以写错字段名或按错类型解析 value 都在编译期死.
 */
export type SearchSelectColumn<OT extends SearchSelectOption = SearchSelectOption> = {
  [K in Extract<keyof OT, string>]: {
    title: ReactNode;
    /** 取值字段. 它同时也是这一列参与搜索匹配的字段 */
    dataIndex: K;
    /** 列宽上限. 只在宽度够分时生效, 默认各列平分 */
    maxWidth?: number | string;
    render?: (value: OT[K], option: OT) => ReactNode;
  };
}[Extract<keyof OT, string>];

/** 多列下拉定义 */
export interface SearchSelectColumnsTable<OT extends SearchSelectOption = SearchSelectOption> {
  columns: SearchSelectColumn<OT>[];
  /** 单元格是否允许换行, 默认不允许 (一行一列, 对齐好读) */
  allowWrap?: boolean;
}

/**
 * 命令式把手, 只有四个成员.
 *
 * 交出去的都是"组件自己说了不算"的动作 —— 重新取数与联动屏蔽; 内部状态一概不给,
 * 想改选项就改数据源或 props.
 */
export interface SearchSelectRef<OT extends SearchSelectOption = SearchSelectOption> {
  /** 当前生效的选项 (已按 include / exclude 过滤) */
  options: OT[] | undefined;
  /** 是否有请求在飞 */
  isLoading: boolean;
  /**
   * 重新拉一次选项. 返回的 Promise 可以等.
   *
   * options 受控或没给 request 时不发请求, 直接 resolve `undefined` —— 那两种情况下
   * 数据不归组件管. 拿到 undefined 表示"这次没去取", 与"取到空数组"是两回事.
   */
  fetchOptions: (keyword?: string) => Promise<OT[] | undefined>;
  /** 联动时拉选项: 立刻屏蔽旧选项, 新数据到位前不给选. 不发请求时同样 resolve undefined */
  fetchOptionsForCascade: (keyword?: string) => Promise<OT[] | undefined>;
}

/** SearchSelect 的 props. antd SelectProps 全量透传, 另加数据源与搜索行为的口子 */
export interface SearchSelectProps<
  OT extends SearchSelectOption = SearchSelectOption,
  VT extends SearchSelectValue<OT> = OT['value'],
> extends Omit<SelectProps<VT, OT>, 'options' | 'onSearch'> {
  /**
   * 搜索词变化回调. 与内部的防抖请求事件合成 —— 传了它不会杀掉内部搜索.
   *
   * 顶层写法与 antd 6 的 `showSearch={{ onSearch }}` 两种都行: 组件会把配置对象摊平,
   * 所以 rc-select 里"配置对象盖掉顶层同名 props"那条规则伤不到内部行为.
   */
  onSearch?: (keyword: string) => void;
  /**
   * 远程数据源. 数据契约见 {@link SearchSelectOption}: 必须返回 `{label, value}` 形状.
   *
   * 入参是当前搜索词 (已 trim), 首次加载与聚焦加载时缺省.
   */
  request?: (keyword?: string) => Promise<OT[]>;
  /** 静态选项. 给了它组件就不发请求, 数据归调用方管 */
  options?: OT[];
  /** 搜索防抖毫秒数, 默认 500 (命名对齐 ahooks v3) */
  debounceWait?: number;
  /** 挂载时自动拉一次选项, 默认 true */
  autoLoad?: boolean;
  /** 聚焦时拉一次选项, 默认 true */
  allowFocusLoad?: boolean;
  /** 只用已有选项本地过滤, 不因搜索发请求, 默认 false */
  searchByLocal?: boolean;
  /**
   * 本地过滤时参与匹配的字段, 可多个. 不传则用 optionFilterProp (默认 label);
   * 多列下拉不传时默认取各列的 dataIndex.
   */
  searchKeys?: Extract<keyof OT, string>[];
  /** 只显示这些 value 的选项. 有值时优先级高于 exclude */
  include?: OT['value'][];
  /** 隐藏这些 value 的选项 */
  exclude?: OT['value'][];
  /** 多列下拉 (表头 + 每列取值) */
  columnsTable?: SearchSelectColumnsTable<OT>;
  /**
   * 命令式把手, 见 {@link SearchSelectRef}.
   *
   * 注意它不是底层 Select 的 ref: 交出去的是本组件的四个动作, 不是 DOM 或 antd 的实例.
   */
  ref?: Ref<SearchSelectRef<OT>>;
}
