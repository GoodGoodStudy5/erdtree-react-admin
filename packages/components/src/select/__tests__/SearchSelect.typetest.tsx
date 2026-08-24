/**
 * SearchSelect 的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 */
import { createRef } from 'react';
import { SearchSelect } from '../SearchSelect';
import type { SearchSelectRef } from '../types';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

type CityOption = { label: string; value: string; code: string };

declare function apiCityOptions(keyword?: string): Promise<CityOption[]>;
/** 不守数据契约的数据源: 给的是 {name, id} */
declare function apiBadOptions(): Promise<{ name: string; id: number }[]>;

// ── 选项类型经 request 的返回值推导 ───────────────────────────
// 推导出来之后, include / exclude / searchKeys / columnsTable 全都跟着收窄

function 泛型经request推导() {
  return (
    <>
      <SearchSelect exclude={['gz']} include={['bj', 'sh']} request={apiCityOptions} />
      <SearchSelect request={apiCityOptions} searchKeys={['code', 'label']} />
      {/* @ts-expect-error 数据源里没有 codee 这个字段 */}
      <SearchSelect request={apiCityOptions} searchKeys={['codee']} />
      {/* @ts-expect-error value 是 string, include 收不了 number */}
      <SearchSelect include={[1]} request={apiCityOptions} />
      {/* @ts-expect-error 数据契约要 {label, value}, 这个数据源给的是 {name, id} */}
      <SearchSelect request={apiBadOptions} />
    </>
  );
}

// ── 多列下拉: dataIndex 与 render 的取值类型绑在一起 ──────────

function columnsTable取值类型() {
  return (
    <>
      <SearchSelect
        columnsTable={{
          columns: [
            {
              title: '编码',
              dataIndex: 'code',
              render: (value) => {
                expectType<string>(value);
                return value;
              },
            },
          ],
        }}
        request={apiCityOptions}
      />
      <SearchSelect
        columnsTable={{
          // @ts-expect-error 列取值字段必须是数据源里有的
          columns: [{ title: '编码', dataIndex: 'codee' }],
        }}
        request={apiCityOptions}
      />
    </>
  );
}

// ── 取值形状: 单选 / 多选 / labelInValue ─────────────────────

function 取值形状() {
  return (
    <>
      <SearchSelect request={apiCityOptions} value="bj" />
      <SearchSelect
        mode="multiple"
        onChange={(value) => expectType<string[]>(value)}
        request={apiCityOptions}
        value={['bj', 'sh']}
      />
      <SearchSelect labelInValue request={apiCityOptions} value={{ label: '北京', value: 'bj' }} />
      {/* @ts-expect-error labelInValue 的值必须是完整的 {label, value}, 只给 value 不算 */}
      <SearchSelect labelInValue request={apiCityOptions} value={{ value: 'bj' }} />
      {/* @ts-expect-error 数据源的 value 是 string, 给 boolean 不成立 */}
      <SearchSelect request={apiCityOptions} value={true} />
    </>
  );
}

// ── ref 把手只有四个成员 ──────────────────────────────────────

function ref四成员() {
  const ref = createRef<SearchSelectRef<CityOption>>();

  expectType<boolean | undefined>(ref.current?.isLoading);
  expectType<CityOption[] | undefined>(ref.current?.options);
  expectType<Promise<CityOption[] | undefined> | undefined>(ref.current?.fetchOptions('北'));
  expectType<Promise<CityOption[] | undefined> | undefined>(
    ref.current?.fetchOptionsForCascade('北'),
  );
  // @ts-expect-error 内部状态不外露: 把手上没有改选项的口子
  void ref.current?.setOptions;

  return <SearchSelect ref={ref} request={apiCityOptions} />;
}

// ── 砍掉的 props 不存在 ──────────────────────────────────────
// 它们是 antd 4 时代的补丁, 迁移时逐条销掉; 拼着旧名字来的调用要当场报, 不能静默失效

function 砍掉的props不存在() {
  return (
    <>
      {/* @ts-expect-error 防抖时长的名字对齐 ahooks v3, 是 debounceWait */}
      <SearchSelect debounceTimeout={500} request={apiCityOptions} />
      {/* @ts-expect-error allowRequest 已砍: 不想请求就别给 request */}
      <SearchSelect allowRequest={false} request={apiCityOptions} />
      {/* @ts-expect-error filterInputTrans 已砍: trim 是固定默认行为 */}
      <SearchSelect filterInputTrans={(value: string) => value} request={apiCityOptions} />
      {/* @ts-expect-error allowLowercaseSearch 已砍: 大小写模糊是固定默认行为 */}
      <SearchSelect allowLowercaseSearch request={apiCityOptions} />
      {/* @ts-expect-error requestOptionsParams 已砍: 请求原语的实现层选项不外泄 */}
      <SearchSelect request={apiCityOptions} requestOptionsParams={{}} />
    </>
  );
}

export { 泛型经request推导, columnsTable取值类型, 取值形状, ref四成员, 砍掉的props不存在 };
