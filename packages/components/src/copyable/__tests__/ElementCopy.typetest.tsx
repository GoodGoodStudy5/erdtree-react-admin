/**
 * ElementCopy 的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 */
import { ElementCopy } from '../ElementCopy';

// ── 接口就三个键 ──────────────────────────────────────────────

function 三个props() {
  return (
    <>
      <ElementCopy className="order-cell">
        <span>A1</span>
      </ElementCopy>
      {/* @ts-expect-error children 是必填: 没有内容就没有复制载荷 */}
      <ElementCopy />
      {/* @ts-expect-error 拼错的 props 要当场报, 不静默落到 DOM 上 */}
      <ElementCopy classNames="order-cell">
        <span>A1</span>
      </ElementCopy>
    </>
  );
}

// ── copyProps 就是 antd 的 copyable 配置 ─────────────────────
// 覆盖复制口径的口子必须留着: text 支持定值、取值函数与异步取值三态

function copyProps三态() {
  return (
    <>
      <ElementCopy copyProps={{ text: '我说了算' }}>
        <span>A1</span>
      </ElementCopy>
      <ElementCopy copyProps={{ text: () => '现算' }}>
        <span>A1</span>
      </ElementCopy>
      <ElementCopy copyProps={{ text: async () => '远端取' }}>
        <span>A1</span>
      </ElementCopy>
      <ElementCopy copyProps={{ onCopy: () => undefined, tooltips: ['复制', '已复制'] }}>
        <span>A1</span>
      </ElementCopy>
      {/* @ts-expect-error copyable 给 true 是 antd 的开关口径, 本组件的复制一直开着 */}
      <ElementCopy copyProps>
        <span>A1</span>
      </ElementCopy>
      {/* @ts-expect-error text 取值函数不收参数: 复制口径只认渲染出来的内容 */}
      <ElementCopy copyProps={{ text: (extra: string) => extra }}>
        <span>A1</span>
      </ElementCopy>
    </>
  );
}

export { 三个props, copyProps三态 };
