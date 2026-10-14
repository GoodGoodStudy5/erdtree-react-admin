import { act, fireEvent, render } from '@testing-library/react';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { BaseDatePicker, BaseRangePicker, BaseTimePicker, BaseTimeRangePicker } from '..';

/** 框里看见的字, 区间是两格 */
function shown(container: HTMLElement) {
  return Array.from(container.querySelectorAll('input')).map((input) => input.value);
}

describe('四个壳: string 进, 框里显示对', () => {
  it('单日', () => {
    const { container } = render(<BaseDatePicker value="2026-10-01" />);
    expect(shown(container)).toEqual(['2026-10-01']);
  });

  it('日期区间', () => {
    const { container } = render(<BaseRangePicker value={['2026-10-01', '2026-10-07']} />);
    expect(shown(container)).toEqual(['2026-10-01', '2026-10-07']);
  });

  it('时间', () => {
    const { container } = render(<BaseTimePicker value="08:30:00" />);
    expect(shown(container)).toEqual(['08:30:00']);
  });

  it('时间区间', () => {
    const { container } = render(<BaseTimeRangePicker value={['08:00:00', '18:00:00']} />);
    expect(shown(container)).toEqual(['08:00:00', '18:00:00']);
  });

  it('外部塞 dayjs: 照样显示, 并回写一次 string', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BaseRangePicker value={[dayjs('2026-10-01'), dayjs('2026-10-07')]} onChange={onChange} />,
    );
    expect(shown(container)).toEqual(['2026-10-01', '2026-10-07']);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['2026-10-01', '2026-10-07']);
  });
});

/** 聚焦第 at 格, 逐字打进 text, 再失焦到组件外 */
function typeAndLeave(container: HTMLElement, at: number, text: string) {
  const input = container.querySelectorAll('input')[at];
  act(() => {
    fireEvent.mouseDown(input);
    fireEvent.focus(input);
    fireEvent.mouseUp(input);
  });
  Array.from(text).forEach((_, i) => {
    act(() => {
      fireEvent.input(input, { target: { value: text.slice(0, i + 1) } });
    });
  });
  act(() => {
    fireEvent.blur(input);
  });
}

describe('打过字的端失焦即出门', () => {
  it('日期区间只改起始端', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BaseRangePicker value={['2026-10-01', '2026-10-07']} onChange={onChange} />,
    );
    typeAndLeave(container, 0, '2026/10/02');
    expect(onChange).toHaveBeenLastCalledWith(['2026-10-02', '2026-10-07']);
  });

  it('日期区间只改结束端', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BaseRangePicker value={['2026-10-01', '2026-10-07']} onChange={onChange} />,
    );
    typeAndLeave(container, 1, '20261009');
    expect(onChange).toHaveBeenLastCalledWith(['2026-10-01', '2026-10-09']);
  });

  it('时间不点确定也出门', () => {
    const onChange = vi.fn();
    const { container } = render(<BaseTimePicker value="08:00:00" onChange={onChange} />);
    typeAndLeave(container, 0, '09:30:00');
    expect(onChange).toHaveBeenLastCalledWith('09:30:00');
  });

  it('打完字又点面板, 失焦只出打进去的那份', () => {
    const onChange = vi.fn();
    const { container } = render(<BaseTimePicker value="08:00:00" onChange={onChange} />);
    const input = container.querySelectorAll('input')[0];
    act(() => {
      fireEvent.mouseDown(input);
      fireEvent.focus(input);
      fireEvent.mouseUp(input);
    });
    act(() => {
      fireEvent.input(input, { target: { value: '09:30:00' } });
    });
    // 面板改框不经 input, 这里直接改 DOM 模拟
    input.value = '09:00:00';
    act(() => {
      fireEvent.blur(input);
    });
    expect(onChange).toHaveBeenLastCalledWith('09:30:00');
  });

  it('非法字不出门', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BaseRangePicker value={['2026-10-01', '2026-10-07']} onChange={onChange} />,
    );
    typeAndLeave(container, 0, '2026/13/40');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('没打字只是进出, 不出门', () => {
    const onChange = vi.fn();
    const { container } = render(
      <BaseTimeRangePicker value={['08:00:00', '18:00:00']} onChange={onChange} />,
    );
    typeAndLeave(container, 0, '');
    expect(onChange).not.toHaveBeenCalled();
  });
});
