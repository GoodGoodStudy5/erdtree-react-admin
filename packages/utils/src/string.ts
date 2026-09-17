/** 多分隔符切分: 先把所有分隔符归一成换行再切, 空项丢掉 */
function strSplitForCommon(str: string | undefined | null, regex: RegExp) {
  return (str || '').replace(regex, '\n').split('\n').filter(Boolean);
}

/** 切分粘贴进来的邮箱文本. 空格、逗号、分号 (含全角) 与换行都算分隔符 */
function strSplitForEmail(no: string | undefined | null) {
  return strSplitForCommon(no, /[\s,，;；\u00A0\n]+/g);
}

/**
 * 切分多值文本框里的一串标识. 空白类 (含换行与制表符), 逗号与分号 (含全角) 都算分隔符.
 *
 * 与 {@link strSplitForEmail} 眼下逐字相同, 不合并成一个 —— 邮箱与标识日后各自调分隔符是两件事.
 */
function strSplitForValues(text: string | undefined | null) {
  return strSplitForCommon(text, /[\s,，;；\u00A0]+/g);
}

/** 字符串切分工具. 批量输入框拿到的粘贴文本靠它变成可用数组 */
export const strUtils = {
  strSplitForCommon,
  strSplitForEmail,
  strSplitForValues,
};

/**
 * 有效值转 string, 无效值转 undefined. 表单回填与查询参数拼装靠它省掉逐个三元.
 *
 * 已知边界: "无效"的判据是假值, 所以 0 与空串也转 undefined —— 0 有意义的字段不要用它.
 *
 * @param inp - 待转换的值, 给数组则逐项同形处理
 */
export function transString<T>(inp: T[]): (undefined | string)[];
export function transString<T>(inp: T): undefined | string;
export function transString<T>(inp: T | T[]) {
  if (Array.isArray(inp)) {
    return inp.map((item) => transString(item));
  }
  return inp ? `${inp}` : undefined;
}
