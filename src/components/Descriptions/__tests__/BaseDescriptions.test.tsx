import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { BaseDescriptions } from '../BaseDescriptions';

/** 两项字段, 够看出列数就行 */
const ITEMS = [
  { key: 'a', label: '甲', children: '甲值' },
  { key: 'b', label: '乙', children: '乙值' },
];

/** 根节点带的是那套 size 与描边类名 */
function root() {
  const node = document.querySelector('.ant-descriptions');
  if (!node) throw new Error('字段块没渲染');
  return node;
}

describe('BaseDescriptions 默认值', () => {
  it('默认描边加紧凑', () => {
    render(<BaseDescriptions items={ITEMS} />);

    expect(root().classList.contains('ant-descriptions-bordered')).toBe(true);
    expect(root().classList.contains('ant-descriptions-small')).toBe(true);
  });

  it('默认三列: 两项字段占一行, 末格补满剩下那列', () => {
    const { container } = render(<BaseDescriptions items={ITEMS} />);

    expect(container.querySelectorAll('tr').length).toBe(1);
    expect(container.querySelector('td:last-child')?.getAttribute('colspan')).toBe('3');
  });

  // 布尔 false 不走这里: eR 对它的口径归 packages/utils 的 render 用例, 这条只验兜底接进了 items
  it('空值填占位符: null 与空串都算空, 0 与文本照原样', () => {
    const { container } = render(
      <BaseDescriptions
        column={1}
        items={[
          { key: 'a', label: '空串', children: '' },
          { key: 'b', label: '没给', children: null },
          { key: 'c', label: '零', children: 0 },
          { key: 'd', label: '假', children: String(false) },
        ]}
      />,
    );
    const cells = [...container.querySelectorAll('.ant-descriptions-item-content')];

    expect(cells.map((cell) => cell.textContent)).toEqual(['-', '-', '0', 'false']);
  });

  it('三项默认都能被调用方覆盖', () => {
    const { container } = render(
      <BaseDescriptions items={ITEMS} bordered={false} column={1} size="medium" />,
    );

    expect(root().classList.contains('ant-descriptions-bordered')).toBe(false);
    expect(root().classList.contains('ant-descriptions-medium')).toBe(true);
    expect(container.querySelectorAll('tr').length).toBe(2);
  });

  it('标签不折行, 调用方另设别的档位也带着', () => {
    const { container } = render(
      <BaseDescriptions items={ITEMS} styles={{ content: { color: 'red' } }} />,
    );
    const label = container.querySelector<HTMLElement>('.ant-descriptions-item-label');
    const content = container.querySelector<HTMLElement>('.ant-descriptions-item-content');

    expect(label?.style.whiteSpace).toBe('nowrap');
    expect(content?.style.color).toBe('red');
  });
});
