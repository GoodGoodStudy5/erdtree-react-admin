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

/**
 * 装着指定内容的那一层抽屉根. 三层同时在场, 所以按内容认人而不按下标.
 * @param text - 那一层的内容
 */
function drawerOf(text: string) {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('.ant-drawer'));
  const root = roots.find((one) => one.textContent?.includes(text));

  if (!root) throw new Error(`${text} 那一层没挂出来`);

  return root;
}

/**
 * 这一层标出来的层号. 自定义属性挂在抽屉根上, 由它继承到遮罩; 空串表示这一层没标.
 * @param text - 那一层的内容
 */
function badgeOf(text: string) {
  const root = drawerOf(text);

  return root.classList.contains('drawer-stacked')
    ? root.style.getPropertyValue('--drawer-stack-depth')
    : '';
}

/**
 * 叠到第 depth 层. 三层都是内联受控的 —— 层号认的是 BaseDrawer, 不是 openModal 实例.
 * @param props - 叠到第几层
 */
function Stack(props: { depth: number }) {
  const { depth } = props;

  return (
    <>
      <BaseDrawer open title="一层">
        一层的内容
      </BaseDrawer>
      <BaseDrawer open={depth >= 2} title="二层">
        二层的内容
      </BaseDrawer>
      <BaseDrawer open={depth >= 3} title="三层">
        三层的内容
      </BaseDrawer>
    </>
  );
}

describe('BaseDrawer 叠层层号', () => {
  it('只有一层时不标: 底下压的是页面, 不是抽屉', () => {
    render(<Stack depth={1} />);

    expect(document.querySelector('.drawer-stacked')).toBeNull();
  });

  it('叠三层: 只有最上面那层标, 标的是 3', () => {
    render(<Stack depth={3} />);

    expect(badgeOf('一层的内容')).toBe('');
    expect(badgeOf('二层的内容')).toBe('');
    expect(badgeOf('三层的内容')).toBe('3');
  });

  it('关掉最上面那层: 层号挪到下一层并变 2, 不等退场动画', async () => {
    const { rerender } = render(<Stack depth={3} />);

    expect(badgeOf('三层的内容')).toBe('3');

    rerender(<Stack depth={2} />);

    await waitFor(() => expect(badgeOf('二层的内容')).toBe('2'));
  });

  it('退场途中不改自己那一层: 改了会掐掉面板的滑出动画', async () => {
    const { rerender } = render(<Stack depth={3} />);

    rerender(<Stack depth={2} />);

    // 关的是第三层, 它在退场动画跑完前仍标着 3 —— 这一条锁的是它不许变
    await waitFor(() => expect(badgeOf('二层的内容')).toBe('2'));
    expect(badgeOf('三层的内容')).toBe('3');
  });
});
