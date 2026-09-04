import type { ModalControl } from '@south/components';
import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { Drawer } from 'antd';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { ModalOutlet, openModal, useModalId, useModalVisible } from '@south/components';

/**
 * 叠两层抽屉.
 *
 * 这条用例锁的是**没有类型保护的那部分**: 底座把每个实例渲染成平级兄弟, 所以两层抽屉的 z-index 完全
 * 相同 (antd 那套自动抬升靠 context 嵌套, 平级兄弟拿不到), 叠层只靠 DOM 顺序. 谁把渲染顺序动一下,
 * 第二层就会跑到第一层底下, 而那件事编译器一句话都不会说.
 */
function StackedDrawer(props: ModalControl<void> & { title: string; size?: 'large' }) {
  const { title, size, cancel } = props;
  const visible = useModalVisible(useModalId());

  return (
    <Drawer open={visible} onClose={cancel} title={title} size={size}>
      <span>{title}的内容</span>
    </Drawer>
  );
}

/** 抽屉的 portal 容器, 按挂载顺序排在 body 下 */
function drawerRoots() {
  return Array.from(document.querySelectorAll('.ant-drawer'));
}

describe('叠两层抽屉', () => {
  it('两层同时在, 内层排在外层之后 —— 叠层只靠这个顺序', async () => {
    render(<ModalOutlet />);

    await act(async () => {
      openModal(StackedDrawer, { title: '外层', size: 'large' });
    });
    await act(async () => {
      openModal(StackedDrawer, { title: '内层' });
    });

    expect(screen.getByText('外层的内容')).toBeTruthy();
    expect(screen.getByText('内层的内容')).toBeTruthy();

    const roots = drawerRoots();
    const outer = roots.findIndex((root) => root.textContent?.includes('外层的内容'));
    const inner = roots.findIndex((root) => root.textContent?.includes('内层的内容'));
    expect(inner).toBeGreaterThan(outer);
  });

  it('两层的 z-index 相同: 内层压不住外层这件事只能靠 DOM 顺序兜', async () => {
    render(<ModalOutlet />);

    await act(async () => {
      openModal(StackedDrawer, { title: '外层', size: 'large' });
    });
    await act(async () => {
      openModal(StackedDrawer, { title: '内层' });
    });

    const zIndexes = drawerRoots().map((root) => (root as HTMLElement).style.zIndex);

    expect(new Set(zIndexes).size).toBe(1);
  });

  it('关内层只结算内层, 外层还在', async () => {
    render(<ModalOutlet />);

    await act(async () => {
      openModal(StackedDrawer, { title: '外层', size: 'large' });
    });
    await act(async () => {
      openModal(StackedDrawer, { title: '内层' });
    });

    await act(async () => {
      screen.getAllByLabelText('Close')[1].click();
    });

    // 退场有动画, 实例要过一会儿才从表里移除 —— 断言等它真的走完, 不掐那个时长
    await waitFor(() => expect(screen.queryByText('内层的内容')).toBeNull());
    expect(screen.getByText('外层的内容')).toBeTruthy();
  });
});
