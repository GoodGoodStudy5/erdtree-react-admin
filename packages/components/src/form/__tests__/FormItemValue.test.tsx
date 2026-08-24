import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { FormInstance } from 'antd';
import { Form } from 'antd';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { FormItemValue } from '@south/components';

/** 状态码到文案. 故意留下 miss 分支, 好验证映射失败也走空值兜底 */
const stateText: Record<string, string> = { on: '启用', off: '停用' };

describe('FormItemValue', () => {
  it('纯值态: 不给 name 与 formItemProps 时不包 Form.Item, 直接渲染值', () => {
    const { container } = render(<FormItemValue value="M-1" />);

    expect(container.textContent).toBe('M-1');
    expect(container.querySelector('.ant-form-item')).toBeNull();
  });

  it('empty 传 true 时空值落到统一占位符', () => {
    const { container } = render(<FormItemValue empty value={undefined} />);

    expect(container.textContent).toBe('-');
  });

  it('empty 传节点时空值落到调用方给的内容', () => {
    render(<FormItemValue empty={<span data-testid="none">暂无</span>} value={null} />);

    expect(screen.getByTestId('none').textContent).toBe('暂无');
  });

  it('不给 empty 或给 false 都不兜底: 空值渲染成空, 不凭空出现占位符', () => {
    const absent = render(<FormItemValue value={undefined} />);

    expect(absent.container.textContent).toBe('');
    absent.unmount();

    // 按条件开关兜底的调用方直接传 false, 不必自己写分支
    const off = render(<FormItemValue empty={false} value={undefined} />);

    expect(off.container.textContent).toBe('');
  });

  it('0 与 false 不是空值: 金额 0 如实显示, false 也不被兜成占位符', () => {
    const zero = render(<FormItemValue empty value={0} />);

    expect(zero.container.textContent).toBe('0');
    zero.unmount();

    // false 在 React 里本就渲染成空, 但它是有效值, 不该冒出占位符
    const off = render(<FormItemValue empty value={false} />);

    expect(off.container.textContent).toBe('');
  });

  it('空字符串是空值, 触发兜底', () => {
    const { container } = render(<FormItemValue empty value="" />);

    expect(container.textContent).toBe('-');
  });

  it('表单态: 值由表单上下文注入, 表单数据一改展示跟着变', () => {
    const formRef = createRef<FormInstance>();

    render(
      <Form initialValues={{ id: 'M-1' }} ref={formRef}>
        <FormItemValue label="菜单主键" name="id" />
      </Form>,
    );

    expect(screen.getByText('M-1')).toBeTruthy();

    act(() => formRef.current?.setFieldsValue({ id: 'M-2' }));

    expect(screen.getByText('M-2')).toBeTruthy();
  });

  it('表单态: 数组 NamePath 取到 Form.List 的行内值', () => {
    render(
      <Form initialValues={{ rows: [{ amount: 10 }, { amount: 0 }] }}>
        <Form.List name="rows">
          {(fields) =>
            fields.map((field) => (
              <FormItemValue empty key={field.key} label="金额" name={[field.name, 'amount']} />
            ))
          }
        </Form.List>
      </Form>,
    );

    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText('-')).toBeNull();
  });

  it('children 拿到注入值并接管渲染, 渲染成任意节点', () => {
    render(
      <Form initialValues={{ state: 'on' }}>
        <FormItemValue<string> name="state">
          {(value) => <span data-testid="tag">{value ? stateText[value] : null}</span>}
        </FormItemValue>
      </Form>,
    );

    expect(screen.getByTestId('tag').textContent).toBe('启用');
  });

  it('children 返回空时同样兜底: 字典 miss 不留下空白', () => {
    render(
      <Form initialValues={{ state: 'unknown' }}>
        <FormItemValue<string> empty="暂无" name="state">
          {(value) => (value ? stateText[value] : null)}
        </FormItemValue>
      </Form>,
    );

    expect(screen.getByText('暂无')).toBeTruthy();
  });

  it('label 挂到 Form.Item 上, 与相邻可编辑项同一套排版', () => {
    const { container } = render(
      <Form initialValues={{ id: 'M-1' }}>
        <FormItemValue label="菜单主键" name="id" />
      </Form>,
    );

    expect(container.querySelector('.ant-form-item-label')?.textContent).toContain('菜单主键');
  });

  it('只给 formItemProps 也包 Form.Item, noStyle 降级由它承接', () => {
    const { container } = render(
      <Form>
        {/* 没有 name 就没有字段绑定, 所以值仍从 value 来 */}
        <FormItemValue formItemProps={{ noStyle: true }} value="M-1" />
      </Form>,
    );

    expect(container.textContent).toContain('M-1');
    expect(container.querySelector('.ant-form-item')).toBeNull();
  });

  it('formItemProps 是完整转发面, 同名键盖掉顶级快捷', () => {
    const { container } = render(
      <Form initialValues={{ id: 'M-1' }}>
        <FormItemValue formItemProps={{ label: '以我为准' }} label="被盖掉" name="id" />
      </Form>,
    );

    expect(container.querySelector('.ant-form-item-label')?.textContent).toContain('以我为准');
    expect(container.textContent).not.toContain('被盖掉');
  });
});
