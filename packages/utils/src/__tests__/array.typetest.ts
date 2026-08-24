/**
 * array 品类的类型测试. 这几个函数一半的价值在类型层 (收窄与推导), 值行为测不出来,
 * 所以规格落在本文件, 由 check:full 的 tsc 把关.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 */
import {
  arrayFilterBoolean,
  arrayToItemMap,
  includesInArray,
  includesInArraySome,
} from '@south/utils';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

type Row = { id: string; name: string };

const STATUS = ['draft', 'paid'] as const;

declare const raw: string;
declare const rows: Row[];
declare const mixed: (Row | false | null | undefined)[];

// ── includesInArray: includes 之后类型自动收窄 ────────────────

function 命中分支里收窄到联合成员() {
  if (includesInArray(STATUS, raw)) {
    expectType<'draft' | 'paid'>(raw);
  }
  // @ts-expect-error 分支外仍是 string, 收窄不外溢
  expectType<'draft' | 'paid'>(raw);
}

// ── includesInArraySome: 收窄发生, 但这条收窄不健全 ────────────

function some的收窄不健全() {
  const input: string[] = ['draft', '不是成员'];

  if (includesInArraySome(STATUS, input)) {
    // 谓词声明 paramArr is T[], 而 some 只保证交集非空: input 里仍可能留着非成员项.
    // 收窄不健全是已知取舍, 只在调用方要的是"有交集"而不是"全是成员"时才用它.
    expectType<('draft' | 'paid')[]>(input);
  }
}

// ── arrayFilterBoolean: filter(Boolean) 之后剔掉假值类型 ──────

function 剔除假值类型() {
  expectType<Row[]>(arrayFilterBoolean(mixed));
  // @ts-expect-error 源数组的假值还在类型上: 这条不成立才说明上一条的剔除发生在类型层
  expectType<Row[]>(mixed);
}

// ── arrayToItemMap: key 受 Item 约束, needSort 决定值类型 ─────

function 映射的键与值类型() {
  expectType<Record<string, Row>>(arrayToItemMap(rows, 'id'));
  expectType<Record<string, Row & { _sortIndex: number }>>(
    arrayToItemMap(rows, 'id', { needSort: true }),
  );
  // @ts-expect-error 没开 needSort 时值类型里没有 _sortIndex
  expectType<Record<string, Row & { _sortIndex: number }>>(arrayToItemMap(rows, 'id'));
  // @ts-expect-error 取值字段必须是 Item 上有的
  void arrayToItemMap(rows, 'idd');
}

export { 命中分支里收窄到联合成员, some的收窄不健全, 剔除假值类型, 映射的键与值类型 };
