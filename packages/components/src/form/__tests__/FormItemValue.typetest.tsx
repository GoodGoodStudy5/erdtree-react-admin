/**
 * FormItemValue 的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 *
 * 正向断言一律走 expectType 而非局部变量, 因为项目开了 noUnusedLocals.
 */
import { FormItemValue } from '../FormItemValue';

declare function expectType<T>(value: T): void;

/** 渲染不出来的值: 只读展示要先经 children 加工 */
interface Money {
  amount: number;
  currency: string;
}

const stateText: Record<string, string> = { on: '启用' };

/** 只吃非空字符串的渲染函数, 用来验证 children 的入参一定带 undefined */
function renderState(value: string) {
  return stateText[value];
}

// ── 无 children 时值必须自己就能渲染 ──────────────────────────

function 纯值态只收可渲染值() {
  return (
    <>
      <FormItemValue value="M-1" />
      <FormItemValue empty value={0} />
      <FormItemValue value={<span>已完成</span>} />
      {/* @ts-expect-error 对象渲染不出来, 要给 children 或先加工成节点 */}
      <FormItemValue value={{ amount: 1, currency: 'CNY' } satisfies Money} />
      {/* @ts-expect-error 表单态没有 value 可挂约束, 于是由泛型参数把关 */}
      <FormItemValue<Money> label="费用" name="fee" />
    </>
  );
}

// ── 泛型值类型流入 children ──────────────────────────────────

function children拿到泛型值() {
  return (
    <>
      <FormItemValue<Money> label="费用" name="fee">
        {(value) => {
          expectType<Money | undefined>(value);
          return value ? `${value.amount} ${value.currency}` : null;
        }}
      </FormItemValue>
      {/* 直传 value 时值类型由它反推, 不必写泛型参数 */}
      <FormItemValue value={{ amount: 1, currency: 'CNY' }}>
        {(value) => {
          expectType<Money | undefined>(value);
          return value?.currency;
        }}
      </FormItemValue>
      {/* @ts-expect-error 表单字段可能没值, 所以 children 的入参一定带 undefined */}
      <FormItemValue<string> children={renderState} name="state" />
    </>
  );
}

// ── children 只能是渲染函数 ──────────────────────────────────

function children只收函数() {
  return (
    <>
      <FormItemValue<string> name="state">
        {(value) => (value ? stateText[value] : null)}
      </FormItemValue>
      {/* @ts-expect-error children 是值到节点的渲染函数, 不是节点本身 */}
      <FormItemValue name="state">静态文本</FormItemValue>
    </>
  );
}

// ── 只读组件不暴露写把手 ─────────────────────────────────────

function 没有写把手() {
  return (
    <>
      {/* @ts-expect-error 只读组件不收 onChange */}
      <FormItemValue name="state" onChange={() => undefined} />
      {/* @ts-expect-error 同理, 也没有 onBlur 这类表单事件 */}
      <FormItemValue name="state" onBlur={() => undefined} />
    </>
  );
}

// ── 字段挂载面: name 支持 NamePath 数组, formItemProps 照 antd 校验 ──

function 字段挂载面() {
  return (
    <>
      <FormItemValue label="金额" name={['rows', 0, 'amount']} />
      <FormItemValue formItemProps={{ noStyle: true, labelCol: { span: 6 } }} name="id" />
      {/* @ts-expect-error 拼错的 Form.Item 字段要当场报 */}
      <FormItemValue formItemProps={{ noStyleee: true }} name="id" />
    </>
  );
}

// ── 空值兜底: true 用统一占位符, 其余当节点 ──────────────────

function 空值兜底面() {
  return (
    <>
      <FormItemValue empty value="M-1" />
      <FormItemValue empty={false} value="M-1" />
      <FormItemValue empty="暂无" value="M-1" />
      <FormItemValue empty={<span>无</span>} value="M-1" />
    </>
  );
}

export {
  纯值态只收可渲染值,
  children拿到泛型值,
  children只收函数,
  没有写把手,
  字段挂载面,
  空值兜底面,
};
