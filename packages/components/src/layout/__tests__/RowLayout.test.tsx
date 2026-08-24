import type { Ref } from 'react';
import { createRef, StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Col } from 'antd';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { RowLayout } from '@south/components';
import type { RowLayoutChildProps } from '@south/components';

/** 用例里的字段组件: 采纳 colProps 协议, 所以不必靠对象展开绕类型 */
function Field({
  label,
  ref,
}: { label?: string; ref?: Ref<HTMLInputElement> } & RowLayoutChildProps) {
  return <input defaultValue={label} ref={ref} />;
}

/** 取某个 Col 上的断点类名 */
function colClassNames(container: HTMLElement, index = 0) {
  return Array.from(container.querySelectorAll('.ant-row > .ant-col'))[index].className;
}

describe('RowLayout', () => {
  it('默认三列: 子元素自动裹进 Col, 全套断点由列数推出', () => {
    const { container } = render(
      <RowLayout>
        <Field label="a" />
        <Field label="b" />
      </RowLayout>,
    );

    expect(container.querySelectorAll('.ant-row > .ant-col')).toHaveLength(2);

    const className = colClassNames(container);

    expect(className).toContain('ant-col-xs-24');
    expect(className).toContain('ant-col-sm-12');
    expect(className).toContain('ant-col-md-8');
    expect(className).toContain('ant-col-lg-8');
    expect(className).toContain('ant-col-xl-8');
    // span 是死属性: 全套断点都给了之后它永不生效, 所以不下发
    expect(className).not.toMatch(/ant-col-\d+(\s|$)/);
  });

  it('四列时 xl 按真列宽, md/lg 仍不小于保底的 8 格', () => {
    const { container } = render(
      <RowLayout columnNum={4}>
        <Field label="a" />
      </RowLayout>,
    );
    const className = colClassNames(container);

    expect(className).toContain('ant-col-xl-6');
    expect(className).toContain('ant-col-md-8');
    expect(className).toContain('ant-col-lg-8');
  });

  it('colProps.colSize 让字段占多列', () => {
    const { container } = render(
      <RowLayout>
        <Field colProps={{ colSize: 2 }} label="a" />
      </RowLayout>,
    );
    const className = colClassNames(container);

    expect(className).toContain('ant-col-xl-16');
    expect(className).toContain('ant-col-xs-24');
  });

  it('直接写 Col 时拆壳: 自带宽度就由它说了算, 库的断点整套让位', () => {
    const { container, getByText } = render(
      <RowLayout>
        <Col span={12} className="my-col">
          <span>自己排</span>
        </Col>
      </RowLayout>,
    );
    const className = colClassNames(container);

    expect(className).toContain('ant-col-12');
    expect(className).toContain('my-col');
    // antd 的 -xs 类不带媒体查询且排在 span 之后, 一起下发会让调用方的 span 永不生效
    expect(className).not.toContain('ant-col-xs-24');
    expect(className).not.toContain('ant-col-xl-8');
    expect(getByText('自己排')).toBeTruthy();
  });

  it('只覆盖某一个断点时, 其余档仍由库兜着', () => {
    const { container } = render(
      <RowLayout>
        <Field colProps={{ xl: 24 }} label="a" />
      </RowLayout>,
    );
    const className = colClassNames(container);

    expect(className).toContain('ant-col-xl-24');
    expect(className).toContain('ant-col-md-8');
    expect(className).toContain('ant-col-xs-24');
  });

  it('子元素挂的 ref 一定能拿到 (回归钉: 重建元素会静默丢掉它)', () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <RowLayout>
        <Field colProps={{ colSize: 2 }} label="a" ref={ref} />
      </RowLayout>,
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('colProps 里显式传 undefined 的断点落回库的默认, 不留空档', () => {
    const { container } = render(
      <RowLayout>
        {/* 调用方按条件算 colProps 时很容易算出 undefined; 那是"我不管", 不是"要空的" */}
        <Field colProps={{ xs: undefined, xl: 24 }} label="a" />
      </RowLayout>,
    );
    const className = colClassNames(container);

    expect(className).toContain('ant-col-xs-24');
    expect(className).toContain('ant-col-xl-24');
  });

  it('gutter 显式传 undefined 时仍用库的默认间距', () => {
    const explicit = render(
      <RowLayout gutter={[16, 16]}>
        <Field label="a" />
      </RowLayout>,
    );
    const expected = explicit.container.querySelector<HTMLElement>('.ant-row')?.style.cssText;

    explicit.unmount();

    const implicit = render(
      <RowLayout gutter={undefined}>
        <Field label="a" />
      </RowLayout>,
    );

    // 不硬编码 antd 落 gutter 的方式, 只要"没给"与"给了默认值"渲染成同一个样子
    expect(implicit.container.querySelector<HTMLElement>('.ant-row')?.style.cssText).toBe(expected);
    expect(expected).not.toBe('');
  });

  it('StrictMode 下不改写调用方传进来的 colProps: 冻结对象也照样渲染', () => {
    const colProps = Object.freeze({ colSize: 2 });

    // zouwu 版 delete 掉输入对象上的 colSize, 冻结对象在严格模式下会当场抛
    expect(() =>
      render(
        <StrictMode>
          <RowLayout>
            <Field colProps={colProps} label="a" />
          </RowLayout>
        </StrictMode>,
      ),
    ).not.toThrow();
    expect(colProps).toEqual({ colSize: 2 });
  });

  it('RowInner 的 Col 直接流在父级 Row 里, 列数继承父级', () => {
    const { container } = render(
      <RowLayout columnNum={2}>
        <Field label="a" />
        <RowLayout.RowInner>
          <Field label="b" />
          <Field label="c" />
        </RowLayout.RowInner>
      </RowLayout>,
    );

    // 不新建 Row, 所以父级的 gutter 与列对齐不断
    expect(container.querySelectorAll('.ant-row')).toHaveLength(1);
    expect(container.querySelectorAll('.ant-row > .ant-col')).toHaveLength(3);
    expect(colClassNames(container, 2)).toContain('ant-col-xl-12');
  });

  it('RowInner 的 ifShow 关掉时整组消失, 其余列不受影响', () => {
    const { container } = render(
      <RowLayout columnNum={2}>
        <Field label="a" />
        <RowLayout.RowInner ifShow={false}>
          <Field label="b" />
        </RowLayout.RowInner>
      </RowLayout>,
    );

    expect(container.querySelectorAll('.ant-row > .ant-col')).toHaveLength(1);
  });

  it('ifShow 关掉时整行不渲染', () => {
    const { container } = render(
      <RowLayout ifShow={false}>
        <Field label="a" />
      </RowLayout>,
    );

    expect(container.querySelector('.ant-row')).toBeNull();
  });

  it('嵌套的 RowLayout 不被裹进 Col, 自己管自己的栅格', () => {
    const { container } = render(
      <RowLayout>
        <Field label="a" />
        <RowLayout columnNum={1}>
          <Field label="b" />
        </RowLayout>
      </RowLayout>,
    );

    expect(container.querySelectorAll('.ant-row')).toHaveLength(2);
    expect(container.querySelectorAll('.ant-row > .ant-col')).toHaveLength(2);
  });
});
