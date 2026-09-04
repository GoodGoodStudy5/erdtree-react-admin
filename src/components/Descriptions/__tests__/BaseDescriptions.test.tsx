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

  it('三项默认都能被调用方覆盖', () => {
    const { container } = render(
      <BaseDescriptions items={ITEMS} bordered={false} column={1} size="medium" />,
    );

    expect(root().classList.contains('ant-descriptions-bordered')).toBe(false);
    expect(root().classList.contains('ant-descriptions-medium')).toBe(true);
    expect(container.querySelectorAll('tr').length).toBe(2);
  });
});
