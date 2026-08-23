/* eslint-disable react-refresh/only-export-components -- 本文件是类型测试, 不参与运行时渲染 */
/**
 * RowLayout 的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 */
import { Col } from 'antd';
import { RowLayout } from '../RowLayout';
import type { RowLayoutChildProps } from '../types';

/** 采纳布局协议的字段组件: 调用方自己的组件可以这样把 colProps 变成有类型的 props */
function Field(props: { label: string } & RowLayoutChildProps) {
  return <span>{props.label}</span>;
}

// ── columnNum 只认 24 格整除得开的四个值 ──────────────────────

function columnNum字面量() {
  const 列数: number = 3;

  return (
    <>
      <RowLayout columnNum={1}>
        <Field label="a" />
      </RowLayout>
      <RowLayout columnNum={4}>
        <Field label="a" />
      </RowLayout>
      {/* @ts-expect-error 5 列在 24 格里排不出来 */}
      <RowLayout columnNum={5}>
        <Field label="a" />
      </RowLayout>
      {/* @ts-expect-error 宽的 number 也不收: 越界值要在编译期死, 不留到运行时算出 4.8 格 */}
      <RowLayout columnNum={列数}>
        <Field label="a" />
      </RowLayout>
    </>
  );
}

// ── 子元素的 colProps 协议 ────────────────────────────────────

function colProps协议推导() {
  return (
    <RowLayout>
      <Field colProps={{ colSize: 2 }} label="a" />
      <Field colProps={{ colSize: 2, offset: 1 }} label="b" />
      {/* @ts-expect-error colSize 是列数, 不是宽度字符串 */}
      <Field colProps={{ colSize: '2' }} label="c" />
      {/* @ts-expect-error 拼错的 ColProps 字段要当场报 */}
      <Field colProps={{ colSizee: 2 }} label="d" />
    </RowLayout>
  );
}

// ── 逃生舱: 直接写 Col ────────────────────────────────────────

function 直接写Col() {
  return (
    <RowLayout>
      <Col span={12} offset={2}>
        <Field label="a" />
      </Col>
    </RowLayout>
  );
}

// ── RowInner 只有 ifShow 与 children ─────────────────────────
// 列数经 context 继承, 不留第二个入口: 两处都能给就会有两处不一致

function RowInner的props面() {
  return (
    <RowLayout columnNum={2}>
      <RowLayout.RowInner ifShow>
        <Field label="a" />
      </RowLayout.RowInner>
      {/* @ts-expect-error 列数从父级继承, RowInner 不收 */}
      <RowLayout.RowInner columnNum={3}>
        <Field label="a" />
      </RowLayout.RowInner>
    </RowLayout>
  );
}

// ── RowProps 照原样透传 ───────────────────────────────────────

function RowProps透传() {
  return (
    <>
      <RowLayout align="middle" gutter={[8, 8]} justify="space-between">
        <Field label="a" />
      </RowLayout>
      {/* @ts-expect-error 拼错的 props 要当场报, 不静默落到 DOM 上 */}
      <RowLayout justifyy="space-between">
        <Field label="a" />
      </RowLayout>
    </>
  );
}

export { columnNum字面量, colProps协议推导, 直接写Col, RowInner的props面, RowProps透传 };
