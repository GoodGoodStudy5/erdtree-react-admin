/**
 * LoadButton 的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 */
import { LoadButton } from '../LoadButton';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

declare function apiUserDelete(id: string): Promise<void>;

// ── onClick 的两态返回值 ──────────────────────────────────────
// 异步态内收靠的就是"返回 Promise 就接管", 所以两态都要合法

function onClick两态() {
  return (
    <>
      <LoadButton onClick={() => apiUserDelete('1')}>删除</LoadButton>
      <LoadButton onClick={() => console.log('同步动作')}>保存</LoadButton>
      <LoadButton
        onClick={(event) => {
          // 走确认气泡时 antd 不保证带上事件对象, 所以这里必须当它可能缺席
          expectType<boolean | undefined>(event?.altKey);
        }}
      >
        保存
      </LoadButton>
    </>
  );
}

// ── popconfirmProps 的 | false 判别 ──────────────────────────
// false 是"不要气泡", 配置对象是"要气泡且必须有 title". 两条路不许混成一个 boolean

function popconfirmProps判别() {
  return (
    <>
      <LoadButton popconfirmProps={false}>删除</LoadButton>
      <LoadButton popconfirmProps={{ title: '确认删除?' }}>删除</LoadButton>
      <LoadButton popconfirmProps={{ title: '确认删除?', content: '删除后不可恢复' }}>
        删除
      </LoadButton>
      {/* @ts-expect-error 没有 title 的气泡问不出问题 */}
      <LoadButton popconfirmProps={{ content: '删除后不可恢复' }}>删除</LoadButton>
      {/* @ts-expect-error true 不是合法取值: 要气泡就得给配置 */}
      <LoadButton popconfirmProps>删除</LoadButton>
    </>
  );
}

// ── 回调的参数形状 ────────────────────────────────────────────

function 回调参数形状() {
  return (
    <>
      <LoadButton
        onClickFinally={({ isCatch, error }) => {
          expectType<boolean>(isCatch);
          // 异常类型未知是刻意的: 组件不该假设调用方的 onClick 抛的是什么
          expectType<unknown>(error);
        }}
      >
        提交
      </LoadButton>
      {/* @ts-expect-error beforeClick 用 false 表示否决, 不认 true */}
      <LoadButton beforeClick={() => true}>提交</LoadButton>
    </>
  );
}

// ── ButtonProps 照原样透传 ────────────────────────────────────

function ButtonProps透传() {
  return (
    <>
      <LoadButton danger size="small" type="primary" htmlType="submit">
        删除
      </LoadButton>
      {/* @ts-expect-error 拼错的 props 要当场报, 不静默落到 DOM 上 */}
      <LoadButton dangerr>删除</LoadButton>
    </>
  );
}

export { onClick两态, popconfirmProps判别, 回调参数形状, ButtonProps透传 };
