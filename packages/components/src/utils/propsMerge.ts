/** 合并期间的读写视角. 对外的类型由调用点的泛型还原, 这里只负责按键取值 */
type PropsRecord = Record<string, unknown>;

/**
 * 要与外部同名回调合成的内部行为. 值不是函数 (false / undefined / null) 就表示这次不需要
 * 该行为, 于是外部回调原样生效 —— 调用方按条件开关内部行为时不必自己写分支.
 */
export type EventComposition = Record<
  string,
  ((...args: never[]) => unknown) | false | undefined | null
>;

/** 合并结果. props 缺省时只剩默认值, 不该塌成 never */
export type MergedProps<D, P> = P extends object ? D & P : D;

/**
 * 事件合成出来的回调. 一律可选: fnObjs 的值给了 false / undefined 时这个键可能根本不存在.
 * 参数与返回值都收不窄 —— 内部行为与外部回调的签名在这一层是未知的, 由调用点的 props 类型还原.
 */
export type ComposedHandlers<F extends EventComposition> = {
  [K in keyof F]?: (...args: never[]) => unknown;
};

/** 摘掉值为 undefined 的键, 让它们落回默认值 */
function omitUndefined(props: object | undefined): PropsRecord {
  const entries = Object.entries((props ?? {}) as PropsRecord);

  return Object.fromEntries(entries.filter(([, value]) => value !== undefined));
}

/** className 拼接. 空串不进结果, 免得渲染出 class=" " 这种噪音 */
function joinClassName(...names: unknown[]): string | undefined {
  const valid = names.filter((name): name is string => typeof name === 'string' && name !== '');

  return valid.length > 0 ? valid.join(' ') : undefined;
}

/**
 * 组件内部默认值与外部 props 的三层合并:
 *
 * 1. 默认值可覆盖 —— 外部同名键盖掉内部默认, 组件不替调用方做决定. 但外部显式传 undefined
 *    视为"没给": React 生态里 undefined 就是缺省, 而默认值层的意义正是补上没给的键 ——
 *    让 `placeholder={undefined}` 抹掉组件的默认占位、`xs={undefined}` 抹掉一档断点,
 *    是把"我不管"读成了"我要空的";
 * 2. className 是例外, 两边拼接而不是覆盖 —— 内部靠类名挂样式, 被盖掉组件就散了;
 * 3. fnObjs 里列出的回调事件合成 —— 内部行为先跑, 再调外部同名回调并把它的返回值交出去.
 *
 * 第三条是通用组件的生死线: 裸展开 `{...props}` 会让"外部传了个同名回调"静默杀掉组件的
 * 核心能力 (搜索下拉传了 onSearch 就不再发请求, 复制组件传了 onCopy 就不再复制),
 * 而调用方看到的只是"这组件坏了".
 *
 * 泛型约束取 object 而不是带 className 的形状: 后者是弱类型, antd 那些没有 className 的
 * 配置对象 (如 Typography 的 copyable) 会被判为"没有共同属性"而进不来.
 */
export function propsMerge<
  D extends object,
  P extends object | undefined,
  F extends EventComposition = EventComposition,
>(defaultProps: D, props: P, fnObjs?: F): MergedProps<D, P> & ComposedHandlers<F> {
  const merged = { ...defaultProps, ...omitUndefined(props) } as PropsRecord;
  const className = joinClassName(
    (defaultProps as PropsRecord).className,
    (props as PropsRecord | undefined)?.className,
  );

  // 两边都没给就不要凭空造出这个键: 合并不该给本来没有 className 的配置对象加字段
  if (className !== undefined) {
    merged.className = className;
  }

  Object.entries(fnObjs ?? {}).forEach(([key, innerFn]) => {
    if (typeof innerFn !== 'function') {
      return;
    }
    const outerFn = merged[key];

    merged[key] = (...args: never[]) => {
      innerFn(...args);
      return typeof outerFn === 'function' ? outerFn(...args) : undefined;
    };
  });

  return merged as MergedProps<D, P> & ComposedHandlers<F>;
}
