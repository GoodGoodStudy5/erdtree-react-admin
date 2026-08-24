/**
 * 带类型收窄的 includes. Array 自带的 includes 只回答 boolean,
 * 命中分支里 param 仍是原类型, 每个调用点都要补一次 as 断言.
 *
 * @param range - 取值范围, 用 as const 声明才能收窄到字面量联合
 * @param param - 待判定的值
 */
export function includesInArray<T>(range: readonly T[], param: unknown): param is T {
  return range.includes(param as T);
}

/**
 * 判断两个数组有交集.
 *
 * 已知边界: 谓词声明 `paramArr is T[]`, 但 some 只保证交集非空, 不保证 paramArr 每一项都是 T.
 * 这条收窄不健全, 只在调用方要的是"有交集"时使用; 要"全是成员"请用 every + includesInArray.
 *
 * @param range - 取值范围
 * @param paramArr - 待判定的数组
 */
export function includesInArraySome<T>(range: readonly T[], paramArr: unknown[]): paramArr is T[] {
  return paramArr.some((item) => range.includes(item as T));
}

/**
 * 给数组每项补上 key, 供 antd Table 的 rowKey 直接取用.
 *
 * @param data - 源数组, 不是数组时原样返回
 * @param keyName - 取哪个字段作 key, 不给则用下标
 */
export function arrayAddKey<T>(data?: T[], keyName?: keyof T) {
  if (Array.isArray(data)) {
    return data.map((item, i) => ({
      ...item,
      key: keyName ? item[keyName] : i,
    }));
  }
  return data;
}

/**
 * filter(Boolean) 并同步剔除类型里的 false / null / undefined, 后续链式调用不必再非空断言.
 *
 * 已知边界: 类型只剔这三个, 运行时却剔全部假值. `('' | 'a')[]` 过滤后类型仍含 `''`,
 * `(0 | 1)[]` 仍含 `0` —— 空串与 0 有意义时不要用它.
 *
 * @param arr - 源数组
 */
export function arrayFilterBoolean<T>(arr: T[]) {
  return arr.filter(Boolean) as Exclude<T, false | undefined | null>[];
}

/**
 * 数组按某字段转成映射对象, 供查表场景直接取件.
 *
 * 键重复时后一项覆盖前一项; 入参不是数组时给空对象.
 *
 * @param arr - 源数组
 * @param key - 取哪个字段作映射键, 会被转成字符串
 * @param options - needSort 为 true 时给每项带上原始下标 _sortIndex
 */
export function arrayToItemMap<Item, K extends keyof Item, Tns extends boolean = false>(
  arr: Item[],
  key: K,
  {
    needSort,
  }: {
    /** 是否需要排序标记, 默认 false */
    needSort?: Tns;
  } = {},
) {
  const obj = {} as Record<string, Item>;

  if (Array.isArray(arr) === false) {
    return {};
  }

  arr.forEach((item, i) => {
    obj[`${item?.[key]}`] = {
      ...(needSort ? { _sortIndex: i } : undefined),
      ...item,
    };
  });

  return obj as Record<string, Tns extends true ? Item & { _sortIndex: number } : Item>;
}
