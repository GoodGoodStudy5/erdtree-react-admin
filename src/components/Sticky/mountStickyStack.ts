import type { StickyPlan } from './stickyStack';
import { planStickyStack } from './stickyStack';
import './index.less';

/** 两条吸附栈 */
const EDGES = ['top', 'bottom'] as const;

/** 铺底色那一层的标记, 判据见 index.less */
const BACKDROP = 'data-sticky-backdrop';

/** 吸住的标记, 样式见 index.less */
const STUCK = 'data-sticky-stuck';

/**
 * 给成员补上铺底色的那一层.
 *
 * 位置不限, 只要是直接子代: 它是 absolute, 不参与成员内部的排布, 也不占成员的 `::before`.
 * @param element - 栈里的一员
 */
function ensureBackdrop(element: HTMLElement) {
  if (element.querySelector(`:scope > [${BACKDROP}]`)) return;

  const backdrop = document.createElement('div');

  backdrop.setAttribute(BACKDROP, '');
  // 追加在末尾而不是开头: React 认节点引用而不认下标, 但插在它管的第一个孩子之前风险更大
  element.append(backdrop);
}

/**
 * 这一批变更里有没有成员的增减.
 *
 * 自己注入的那一层不算: 它每轮排布都要补, 当成变更就是自己唤醒自己, 逐帧空转.
 * @param records - 观察到的变更
 */
function hasMemberChange(records: MutationRecord[]) {
  return records.some((record) => {
    if (record.type !== 'childList') return true;

    return [...record.addedNodes, ...record.removedNodes].some(
      (node) => !(node instanceof HTMLElement) || !node.hasAttribute(BACKDROP),
    );
  });
}

/**
 * 写上吸住的标记.
 *
 * 判据是「它停在该停的那条线上」: 吸住的成员报回来的位置恒等于 CSS 算出的 top / bottom,
 * 而没吸住的停在线的另一侧 —— 滚过头被父容器带走时也一样离开那条线.
 *
 * 不走 `@container scroll-state(stuck)`: 那条查询改不了容器自己, 落点仍要靠这里注入的那一层,
 * 于是两套判据并存而只省下一个滚动监听.
 *
 * 认下的代价: 线的参照取视口, 于是抽屉里另起的那条栈判不准.
 * @param element - 栈里的一员
 * @param edge - 贴哪条边
 */
function markStuck(element: HTMLElement, edge: (typeof EDGES)[number]) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const line = parseFloat(edge === 'top' ? style.top : style.bottom);
  const actual = edge === 'top' ? rect.top : window.innerHeight - rect.bottom;

  element.toggleAttribute(STUCK, Math.abs(actual - line) < 1);
}

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

  // 排布只改变量与补那一层底色, 不改尺寸; 补出来的那一层又被 hasMemberChange 滤掉, 于是不会自激
  const resize = new ResizeObserver(schedule);
  const mutation = new MutationObserver((records) => {
    if (hasMemberChange(records)) schedule();
  });

  function layout() {
    frame = 0;
    const found = [...root.querySelectorAll<HTMLElement>('[data-sticky]')];

    // 成员换人才重新订阅: ResizeObserver 没有增量接口, 每轮都 disconnect 会丢掉这一帧的通知
    if (found.length !== members.length || found.some((one, index) => one !== members[index])) {
      resize.disconnect();
      found.forEach((one) => {
        ensureBackdrop(one);
        resize.observe(one);
      });
      members = found;
    }

    for (const edge of EDGES) {
      // 吸底栈的吸附先后与文档顺序相反: 文档里最后一员先贴上底边
      const stack = members.filter((one) => one.dataset.sticky === edge);
      const ordered: HTMLElement[] = edge === 'bottom' ? [...stack].reverse() : stack;
      const heights = ordered.map((one) => one.getBoundingClientRect().height);

      planStickyStack(heights).forEach((plan, index) => {
        apply(ordered[index], plan);
        markStuck(ordered[index], edge);
      });
      setVar(root, `--sticky-stacked-${edge}`, `${heights.reduce((sum, one) => sum + one, 0)}px`);
    }
  }

  mutation.observe(root, { childList: true, subtree: true, attributeFilter: ['data-sticky'] });

  // 捕获阶段听: 元素身上的 scroll 不冒泡, 而滚的是哪一层由页面结构定, 这里不该知道
  window.addEventListener('scroll', schedule, { capture: true, passive: true });

  layout();

  return () => {
    cancelAnimationFrame(frame);
    resize.disconnect();
    mutation.disconnect();
    window.removeEventListener('scroll', schedule, { capture: true });
  };
}
