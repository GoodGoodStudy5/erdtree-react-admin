import { typeUtils } from './typeof';

/**
 * 给槽位垫默认值: 调用方给的赢, 两边都给的槽逐层往下填.
 *
 * 槽位可以是对象, 也可以是到取用时才求值的函数 (antd 的 styles 与 classNames 两种形态都有).
 * 函数原样留成函数: 提前求值就丢了取用方传进来的那份入参.
 *
 * @param defaults - 垫底的槽位, 键与 given 同一套, 只给要垫的那几个
 * @param given - 调用方给的槽位或求值函数
 */
export function mergeSlots<S extends object, A extends unknown[]>(
  defaults: NoInfer<S>,
  given: S | ((...args: A) => S) | undefined,
): S | ((...args: A) => S) {
  if (typeUtils.isFunction(given)) return (...args: A) => fillIn(defaults, given(...args));

  return fillIn(defaults, given);
}

/**
 * 逐层填: 两边都是对象的槽往下走, 其余由 given 整个拿走.
 *
 * 数组与 Date 这类不往下走 —— `superTypeof` 把它们与对象分开, 逐项并出来的数组没有意义.
 * @param defaults - 垫底的一层
 * @param given - 调用方的那一层
 */
function fillIn<S extends object>(defaults: S, given?: S): S {
  if (!given) return defaults;
  const merged = { ...defaults, ...given };

  for (const key of Object.keys(defaults) as (keyof S)[]) {
    const fallback = defaults[key];
    const wins = given[key];
    if (typeUtils.isObject(fallback) && typeUtils.isObject(wins)) {
      merged[key] = fillIn(fallback, wins) as S[keyof S];
    }
  }

  return merged;
}
