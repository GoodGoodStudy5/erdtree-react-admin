import { describe, expect, it } from 'vitest';
import { mountStickyStack } from '../mountStickyStack';

/**
 * 造一个成员.
 *
 * 标记用 setAttribute 写, 与 JSX 里落到 DOM 上的形态一致 —— 实现若读错属性名, 这里就该失败.
 * 高度要现安: jsdom 没有排版, 尺寸恒为 0, 而退让距离正是按高度累加出来的.
 * @param edge - 贴哪条边
 * @param height - 撑起的高度
 */
function member(edge: string, height: number) {
  const element = document.createElement('div');

  element.setAttribute('data-sticky', edge);
  element.getBoundingClientRect = () => ({ height }) as DOMRect;

  return element;
}

/**
 * 装一棵已经长好的子树.
 * @param members - 按文档顺序给的成员
 */
function mountWith(members: HTMLElement[]) {
  const root = document.createElement('div');

  root.append(...members);
  document.body.append(root);

  return { root, unmount: mountStickyStack(root) };
}

/** 等观察者跑完它那一帧 */
function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

/**
 * 读一个成员身上的变量.
 * @param element - 成员
 * @param name - 变量名
 */
function varOf(element: HTMLElement, name: string) {
  return element.style.getPropertyValue(name);
}

describe('mountStickyStack', () => {
  it('挂载时就把已在场的成员排好, 不等下一帧', () => {
    const [first, second] = [member('top', 56), member('top', 42)];
    const { unmount } = mountWith([first, second]);

    expect(varOf(first, '--sticky-offset')).toBe('0px');
    expect(varOf(second, '--sticky-offset')).toBe('56px');
    unmount();
  });

  it('层级序按吸附先后递减', () => {
    const [first, second] = [member('top', 56), member('top', 42)];
    const { unmount } = mountWith([first, second]);

    expect(varOf(first, '--sticky-order')).toBe('2');
    expect(varOf(second, '--sticky-order')).toBe('1');
    unmount();
  });

  it('吸底栈按文档倒序排: 最后一员先贴上底边', () => {
    const [upper, lower] = [member('bottom', 40), member('bottom', 30)];
    const { unmount } = mountWith([upper, lower]);

    // 文档靠下的那个先贴底, 于是它不退让, 靠上的那个退让它的高度
    expect(varOf(lower, '--sticky-offset')).toBe('0px');
    expect(varOf(upper, '--sticky-offset')).toBe('30px');
    unmount();
  });

  it('两条栈各排各的, 吸底的不占吸顶的退让距离', () => {
    const [top, bottom] = [member('top', 56), member('bottom', 40)];
    const { unmount } = mountWith([top, bottom]);

    expect(varOf(top, '--sticky-offset')).toBe('0px');
    expect(varOf(bottom, '--sticky-offset')).toBe('0px');
    unmount();
  });

  it('成员后进场也排得上', async () => {
    const first = member('top', 56);
    const { root, unmount } = mountWith([first]);
    const second = member('top', 42);

    root.append(second);
    await nextFrame();

    expect(varOf(second, '--sticky-offset')).toBe('56px');
    unmount();
  });

  it('成员撤掉标记后退出栈, 后面的补位', async () => {
    const [first, second, third] = [member('top', 56), member('top', 42), member('top', 38)];
    const { unmount } = mountWith([first, second, third]);

    expect(varOf(third, '--sticky-offset')).toBe('98px');

    // 搜索栏锁定展开时走的就是这条路: 标记撤掉, 整条退出吸顶
    second.removeAttribute('data-sticky');
    await nextFrame();

    expect(varOf(third, '--sticky-offset')).toBe('56px');
    unmount();
  });

  it('每条栈的总高度发布在 root 上, 供进不了栈的元素照着贴', () => {
    const { root, unmount } = mountWith([
      member('top', 56),
      member('top', 42),
      member('bottom', 40),
    ]);

    expect(varOf(root, '--sticky-stacked-top')).toBe('98px');
    expect(varOf(root, '--sticky-stacked-bottom')).toBe('40px');
    unmount();
  });

  it('成员退出后总高度跟着降, 照着贴的元素才不会悬空', async () => {
    const [first, second] = [member('top', 56), member('top', 42)];
    const { root, unmount } = mountWith([first, second]);

    second.removeAttribute('data-sticky');
    await nextFrame();

    expect(varOf(root, '--sticky-stacked-top')).toBe('56px');
    unmount();
  });

  it('拆除之后不再排布', async () => {
    const first = member('top', 56);
    const { root, unmount } = mountWith([first]);

    unmount();
    const second = member('top', 42);
    root.append(second);
    await nextFrame();

    expect(varOf(second, '--sticky-offset')).toBe('');
  });
});
