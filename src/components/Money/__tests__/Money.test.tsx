import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { EMPTY_VALUE } from '@/utils';
import { Money } from '../Money';

describe('Money', () => {
  it('千分位加两位小数, 不足两位补零', () => {
    const { container } = render(<Money value={30088.5} />);

    expect(container.textContent).toBe('30,088.50');
  });

  it('负数带负号且标红 —— 红蓝票没有别的表达', () => {
    const { container } = render(<Money value={-1234.56} />);
    const span = container.querySelector('span');

    expect(span?.textContent).toBe('-1,234.56');
    expect(span?.className).toContain('text-[#d6363b]');
  });

  it('正数不标红', () => {
    const { container } = render(<Money value={1234.56} />);

    expect(container.querySelector('span')?.className).not.toContain('text-[#d6363b]');
  });

  it('零按正数呈现, 不当空值', () => {
    const { container } = render(<Money value={0} />);
    const span = container.querySelector('span');

    expect(span?.textContent).toBe('0.00');
    expect(span?.className).not.toContain('text-[#d6363b]');
  });

  it('空值给占位符, 不显示 0', () => {
    expect(render(<Money value={null} />).container.textContent).toBe(EMPTY_VALUE);
    expect(render(<Money />).container.textContent).toBe(EMPTY_VALUE);
  });

  it('超过两位小数按四舍五入呈现, 存的值不变', () => {
    const { container } = render(<Money value={3911.505} />);

    expect(container.textContent).toBe('3,911.51');
  });

  it('等宽对齐是格式的一部分, 不由调用方补', () => {
    const { container } = render(<Money value={1} />);

    expect(container.querySelector('span')?.className).toContain('tabular-nums');
  });
});
