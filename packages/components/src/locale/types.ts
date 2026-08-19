/** 弹窗外壳自带的文案. 确定与取消不在此列 —— 它们由 antd 的 ConfigProvider locale 供给 */
export type ModalLocale = {
  /** 标题栏最大化按钮的悬停提示 */
  maximize: string;
  /** 标题栏还原按钮的悬停提示 */
  exitMaximized: string;
  /** 标题栏关闭按钮的悬停提示 */
  close: string;
};

/** 本包全部组件的文案集合 */
export type ComponentsLocale = {
  Modal: ModalLocale;
};

/** 宿主注入时可以只覆盖关心的部分, 其余落回包内默认 */
export type PartialComponentsLocale = {
  [K in keyof ComponentsLocale]?: Partial<ComponentsLocale[K]>;
};
