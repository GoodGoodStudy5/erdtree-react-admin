/**
 * typeof 品类的类型测试. 这些谓词的价值全在收窄 —— 分支里既有运行时保护又有类型收窄,
 * 所以规格落在本文件, 由 check:full 的 tsc 把关.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 */
import { superTypeof, typeUtils } from '@south/utils';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

declare const value: unknown;

// ── 谓词在命中分支里收窄 ──────────────────────────────────────

function 命中分支里收窄() {
  if (typeUtils.isObject(value)) {
    expectType<object>(value);
  }
  if (typeUtils.isNumOrNumString(value)) {
    expectType<number | string>(value);
  }
  if (typeUtils.isSafeNumOrNumString(value)) {
    expectType<number | string>(value);
  }
  // @ts-expect-error 分支外仍是 unknown, 收窄不外溢
  expectType<object>(value);
}

// ── superTypeof 的返回值是封闭联合 ───────────────────────────

function 返回值是封闭联合() {
  expectType<string>(superTypeof(value));
  // @ts-expect-error 联合里没有 map: Map / Set / Promise 这些要用请先扩联合, 那次修改就是评审
  void (superTypeof(value) === 'map');
}

export { 命中分支里收窄, 返回值是封闭联合 };
