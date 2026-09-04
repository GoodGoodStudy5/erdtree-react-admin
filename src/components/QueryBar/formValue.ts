/**
 * 表单值的判空与比对. 摘要 chips 与「已提交条件同步进表单」共用这一份 ——
 * 两处分家会让「摘要说没填, 同步说动过」这类矛盾出现.
 */

/** 判空只认这四样. 0 与 false 是填了的值, 不能算空 */
export function isBlank(value: unknown) {
  return (
    value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)
  );
}

/**
 * 归一后比两个表单值是否相同.
 *
 * 各种空视作同一个空: 用户在框里输了又删光, 表单留下 `''` 而已提交条件里根本没这个键,
 * 严格比会把它算成「动过」, 于是屏幕上无端多出一枚未搜索的 chip.
 *
 * 数组逐项比而不看引用: 多选控件每次都给新数组, 比引用会次次判为变了.
 * @param a - 一个值
 * @param b - 另一个值
 */
export function isBlankEqual(a: unknown, b: unknown) {
  if (isBlank(a) && isBlank(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((one, index) => one === b[index]);
  }

  return a === b;
}

/**
 * 算出「已提交条件变了之后, 要写回表单的那几项」.
 *
 * 两个条件都要满足:
 *
 * 1. **这一项的已提交值确实变了** —— 没变的项不碰, 用户在别的框里填了一半的内容因此保得住;
 * 2. **它与表单里现在的值不同** —— 点搜索时已提交条件正是从表单来的, 两者本来就一样,
 *    再写一遍是空动作. 而 antd 的 `setFieldsValue` 会把字段标成 touched 且没有开关可关,
 *    空写会一次次污染它.
 *
 * 少了第 1 条会冲掉用户输入, 少了第 2 条会形成「同步→搜索→同步」的回环.
 * @param prev - 上一次的已提交条件
 * @param next - 这一次的已提交条件
 * @param readForm - 读表单里某项当前的值
 */
export function syncKeys(
  prev: BaseFormData,
  next: BaseFormData,
  readForm: (name: string) => unknown,
) {
  const names = new Set([...Object.keys(prev), ...Object.keys(next)]);

  return [...names].filter(
    (name) => !isBlankEqual(prev[name], next[name]) && !isBlankEqual(next[name], readForm(name)),
  );
}
