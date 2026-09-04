import type { StickyPlan } from './stickyStack';
import { planStickyStack } from './stickyStack';
import './index.less';

/** 两条吸附栈 */
const EDGES = ['top', 'bottom'] as const;

/**
 * 写一个变量.
 *
 * 值没变就不写: 写回同一个值会再触发一轮观察, 白跑一次排布.
 * @param element - 目标元素
 * @param name - 变量名
 * @param value - 变量值
 */
function setVar(element: HTMLElement, name: string, value: string) {
  if (element.style.getPropertyValue(name) === value) return;
  element.style.setProperty(name, value);
}

/**
 * 把排布结果写进元素.
 * @param element - 栈里的一员
 * @param plan - 它的排布结果
 */
function apply(element: HTMLElement, plan: StickyPlan) {
  setVar(element, '--sticky-offset', `${plan.offset}px`);
  setVar(element, '--sticky-order', String(plan.order));
}

/**
 * 在 root 的子树里装吸附栈, 返回拆除函数.
 *
 * 只认 `data-sticky` 标记, 不认元素是谁 —— 写哪贴哪. 退让距离按栈里的实际成员算, 因此成员增减
 * (搜索栏锁定后退出吸顶) 与高度变化 (摘要行的条件多到换行) 都不必通知这里.
 *
 * 每条栈的总高度发布在 root 上 (`--sticky-stacked-top` / `--sticky-stacked-bottom`), 给那些进不了栈
 * 的元素用: antd 自己渲染的吸顶表头就是一个 —— 它的 DOM 拿不到, 只能让它照着总高度自己贴.
 *
 * 认下的代价: 排布走 rAF, 吸附位置比滚动晚一帧; 只有一层栈, 抽屉里再想吸附得另起一个 root.
 * @param root - 装在哪棵子树上. 基准边由它自己或它的祖先用 `--sticky-top` / `--sticky-bottom` 给
 */
export function mountStickyStack(root: HTMLElement): () => void {
  let frame = 0;
  let members: HTMLElement[] = [];

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(layout);
  };

  // 观察的回调只改变量, 不改尺寸, 于是不会自激
  const resize = new ResizeObserver(schedule);
  const mutation = new MutationObserver(schedule);

  function layout() {
    frame = 0;
    const found = [...root.querySelectorAll<HTMLElement>('[data-sticky]')];

    // 成员换人才重新订阅: ResizeObserver 没有增量接口, 每轮都 disconnect 会丢掉这一帧的通知
    if (found.length !== members.length || found.some((one, index) => one !== members[index])) {
      resize.disconnect();
      found.forEach((one) => resize.observe(one));
      members = found;
    }

    for (const edge of EDGES) {
      // 吸底栈的吸附先后与文档顺序相反: 文档里最后一员先贴上底边
      const stack = members.filter((one) => one.dataset.sticky === edge);
      const ordered: HTMLElement[] = edge === 'bottom' ? [...stack].reverse() : stack;
      const heights = ordered.map((one) => one.getBoundingClientRect().height);

      planStickyStack(heights).forEach((plan, index) => apply(ordered[index], plan));
      setVar(root, `--sticky-stacked-${edge}`, `${heights.reduce((sum, one) => sum + one, 0)}px`);
    }
  }

  mutation.observe(root, { childList: true, subtree: true, attributeFilter: ['data-sticky'] });
  layout();

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();
  };
}
