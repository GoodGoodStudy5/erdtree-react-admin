import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BaseDrawer } from '../BaseDrawer';

/** rc-drawer 把尺寸写在 content-wrapper 的行内样式上, 断言都读这里 */
function drawerWrapper() {
  const wrapper = document.querySelector<HTMLElement>('.ant-drawer-content-wrapper');
  if (!wrapper) throw new Error('抽屉没挂出来');
  return wrapper;
}

/**
 * 拖一把把手.
 *
 * 右侧抽屉往左拖变宽, 所以正的 delta 对应 clientX 减小.
 * @param delta - 想拖出的宽度增量, 负数是收窄
 */
function dragBy(delta: number) {
  const dragger = document.querySelector<HTMLElement>('.ant-drawer-resizable-dragger');
  if (!dragger) throw new Error('拖拽把手没渲染');
  fireEvent.mouseDown(dragger, { clientX: 500 });
  fireEvent.mouseMove(document, { clientX: 500 - delta });
  fireEvent.mouseUp(document);
}

describe('BaseDrawer 拖拽调宽', () => {
  it('默认可拖: 拖把手后宽度跟手, 松手保持', () => {
    render(
      <BaseDrawer open size={600} title="标题">
        内容
      </BaseDrawer>,
    );

    expect(drawerWrapper().style.width).toBe('600px');
    dragBy(200);
    expect(drawerWrapper().style.width).toBe('800px');
  });

  it('窄过下限被扣在下限上', () => {
    render(
      <BaseDrawer open size={600} title="标题">
        内容
      </BaseDrawer>,
    );

    dragBy(-500);
    expect(drawerWrapper().style.width).toBe('240px');
  });

  it('关窗重置: 拖过的宽度不带进下一次打开', async () => {
    const { rerender } = render(
      <BaseDrawer open size={600} title="标题">
        内容
      </BaseDrawer>,
    );

    dragBy(200);
    expect(drawerWrapper().style.width).toBe('800px');

    rerender(
      <BaseDrawer open={false} size={600} title="标题">
        内容
      </BaseDrawer>,
    );
    // 重置挂在退场动画结束上, 等它走完而不是掐时长
    await waitFor(() => expect(drawerWrapper().style.width).toBe('600px'));

    rerender(
      <BaseDrawer open size={600} title="标题">
        内容
      </BaseDrawer>,
    );
    expect(drawerWrapper().style.width).toBe('600px');
  });

  it('外部 onResize 合成不替换: 拖拽后仍被调到, 拿到的是扣完下限的值', () => {
    const onResize = vi.fn();

    render(
      <BaseDrawer open size={600} title="标题" resizable={{ onResize }}>
        内容
      </BaseDrawer>,
    );

    dragBy(-500);
    expect(onResize).toHaveBeenLastCalledWith(240);
    expect(drawerWrapper().style.width).toBe('240px');
  });

  it('resizable=false 关掉能力: 不渲染把手', () => {
    render(
      <BaseDrawer open size={600} title="标题" resizable={false}>
        内容
      </BaseDrawer>,
    );

    expect(document.querySelector('.ant-drawer-resizable-dragger')).toBeNull();
  });
});
