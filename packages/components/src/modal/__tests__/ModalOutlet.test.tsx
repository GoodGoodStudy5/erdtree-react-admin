import type { ModalControl } from '@south/components';
import { beforeEach, describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import {
  ModalOutlet,
  getModalInstances,
  openModal,
  requestCloseModal,
  useModalId,
} from '@south/components';

/** 各实例的渲染次数, 按标题记 */
const renders = new Map<string, number>();

function Counted(props: ModalControl<void> & { title: string }) {
  const { title } = props;
  renders.set(title, (renders.get(title) ?? 0) + 1);
  // 订阅显示态: 自己开合时该重渲染的那部分, 与兄弟无关
  const id = useModalId();

  return <span>{`${title}在屏上, id=${id ?? ''}`}</span>;
}

beforeEach(() => {
  renders.clear();
});

/**
 * 挂载点把每个实例渲染成平级兄弟, 于是任一实例开合都会重渲染挂载点自身.
 *
 * 这条用例锁的是**编译器看不见的那部分**: InstanceHost 的 memo 没了, 或者 store 改成每次
 * publish 都重建整张表, 别的弹窗开合就会把已经在屏上的重内容白重渲一遍 —— 一屏几百张卡时
 * 是数百毫秒的卡顿, 而界面上什么都没变, 从现象上查不出源头.
 */
describe('挂载点隔断兄弟实例的重渲染', () => {
  it('开第二个实例, 第一个不重渲染', async () => {
    render(<ModalOutlet />);
    await act(async () => {
      openModal(Counted, { title: '先开的' });
    });

    renders.clear();
    await act(async () => {
      openModal(Counted, { title: '后开的' });
    });

    expect(screen.getByText(/后开的在屏上/)).toBeTruthy();
    expect(renders.get('先开的')).toBeUndefined();
  });

  it('关第二个实例, 第一个不重渲染', async () => {
    render(<ModalOutlet />);
    await act(async () => {
      openModal(Counted, { title: '先开的' });
    });
    await act(async () => {
      openModal(Counted, { title: '后开的' });
    });
    const later = getModalInstances()[1].id;

    renders.clear();
    await act(async () => {
      requestCloseModal(later);
    });

    // 退场有动画, 实例要过一会儿才从表里移除 —— 等它真的走完, 不掐那个时长
    await waitFor(() => {
      expect(screen.queryByText(/后开的在屏上/)).toBeNull();
    });
    expect(screen.getByText(/先开的在屏上/)).toBeTruthy();
    expect(renders.get('先开的')).toBeUndefined();
  });
});
