/**
 * 取值的运行时类型. typeof 把 null、数组、Date、RegExp 全答成 object,
 * 落到 object 这一档时改问 Object.prototype.toString 的内部类别.
 *
 * 已知边界: 返回的联合只列常见几种, Map / Set / Promise 这类实际会返回联合里没有的字符串.
 * 要拿它们比对请先把成员加进联合 —— 那次修改就是评审.
 *
 * @param val - 待判定的值
 */
export function superTypeof(val: unknown) {
  const basic = typeof val;

  if (basic !== 'object') {
    return basic;
  }
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase() as
    'object' | 'null' | 'array' | 'date' | 'regexp' | 'math' | 'error';
}

function isObject(val: unknown): val is object {
  return superTypeof(val) === 'object';
}

function isObjectEmpty(val: unknown): val is object {
  return isObject(val) && Object.keys(val).length === 0;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- 运行时只判定出"可调用", 收窄成具体调用签名等于凭空断言形参与返回值
function isFunction(val: unknown): val is Function {
  return superTypeof(val) === 'function';
}

/**
 * 判断是数字或字符串形式的数字. 需要连安全范围一起判时用 isSafeNumOrNumString.
 */
function isNumOrNumString(val: unknown): val is number | string {
  if (['number', 'string'].includes(superTypeof(val)) === false) {
    return false;
  }
  // 空串要单独挡: Number('') 是 0, 但空串不是数字
  return val !== '' && Number.isNaN(Number(val)) === false;
}

/** 判断是安全整数范围内的数字 */
function isSafeNumOrNumString(val: unknown): val is number | string {
  if (isNumOrNumString(val) === false) {
    return false;
  }
  const value = Number(val);

  return value <= Number.MAX_SAFE_INTEGER && value >= -Number.MAX_SAFE_INTEGER;
}

/** 带类型谓词的运行时类型判断. 命中分支里既有运行时保护又有类型收窄 */
export const typeUtils = {
  isObject,
  isObjectEmpty,
  isFunction,
  isNumOrNumString,
  isSafeNumOrNumString,
};
