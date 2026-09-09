import type { StickyPlan } from './stickyStack';
import { planStickyStack } from './stickyStack';
import './index.less';

/** 两条吸附栈 */
const EDGES = ['top', 'bottom'] as const;

/** 吸住的标记, 样式见 index.less */
const STUCK = 'data-sticky-stuck';

/**
 * 成员吸附时的参照容器: 最近的滚动祖先, 返回 null 表示参照视口.
 *
 * 判据与浏览器认 sticky 参照的口径一致, 于是 `overflow: hidden` 的层也算 —— 它同样把 sticky
 * 关在自己的框里, 认它才能与吸不吸得住对上.
 *
 * 只看纵向: 两条栈都贴水平边, 而横向非 visible 时 `overflow-y` 不会保持 visible, CSS 自己会
 * 算成 auto.
 * @param element - 栈里的一员
 */
function scrollportOf(element: HTMLElement): HTMLElement | null {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (getComputedStyle(parent).overflowY !== 'visible') return parent;
  }

  return null;
}

/**
 * 按参照容器把成员分成几条栈.
 *
 * 一个滚动容器一条: 抽屉与弹窗 portal 到 body 之后与页面成员同在一棵树里, 不分开算就会互相退让.
 * @param members - 按文档顺序给的成员
 */
function groupByScrollport(members: HTMLElement[]) {
  const groups = new Map<HTMLElement | null, HTMLElement[]>();

  for (const one of members) {
    const port = scrollportOf(one);
    const group = groups.get(port);

    if (group) group.push(one);
    else groups.set(port, [one]);
  }

  return groups;
}

/** 一条栈的参照: 吸附线量在这上面 */
interface Scrollport {
  /** 内容区顶在视口里的纵坐标 */
  top: number;
  /** 内容区高 */
  height: number;
  /** 上下内边距 */
  pad: { top: number; bottom: number };
}

/**
 * 量一条栈的参照.
 *
 * 量的是内容区而不是边框内沿: CSS 给 sticky 定位的起点在那里. 内边距于是落在吸附线之外, 这个数
 * 两头都要用 —— 判据拿它找线, 成员拿它把线抬回边框内沿.
 * @param container - 参照容器, null 表示视口
 */
function measure(container: HTMLElement | null): Scrollport {
  if (!container) return { top: 0, height: window.innerHeight, pad: { top: 0, bottom: 0 } };

  const box = getComputedStyle(container);
  const pad = { top: parseFloat(box.paddingTop), bottom: parseFloat(box.paddingBottom) };

  return {
    // clientTop 是上边框宽, clientHeight 是含内边距的高: 两者都要再退掉内边距才落到内容区
    top: container.getBoundingClientRect().top + container.clientTop + pad.top,
    height: container.clientHeight - pad.top - pad.bottom,
    pad,
  };
}

/**
 * 写上吸住的标记.
 *
 * 判据是「它停在该停的那条线上」: 吸住的成员报回来的位置恒等于 CSS 算出的 top / bottom,
 * 而没吸住的停在线的另一侧 —— 滚过头被父容器带走时也一样离开那条线.
 *
 * 不走 `@container scroll-state(stuck)`: 底色落在成员自己的 background 上, 而容器查询改不了
 * 容器自己 —— 换过去就得把底色退回某个后代身上, 那正是上一版删掉的那一层.
 * @param element - 栈里的一员
 * @param edge - 贴哪条边
 * @param port - 它那条栈的参照
 */
function markStuck(element: HTMLElement, edge: (typeof EDGES)[number], port: Scrollport) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const line = parseFloat(edge === 'top' ? style.top : style.bottom);
  const actual = edge === 'top' ? rect.top - port.top : port.top + port.height - rect.bottom;

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
 * @param pad - 参照容器在这条边上的内边距, 吸住时盖过它
 */
function apply(element: HTMLElement, plan: StickyPlan, pad: number) {
  setVar(element, '--sticky-offset', `${plan.offset}px`);
  setVar(element, '--sticky-order', String(plan.order));
  setVar(element, '--sticky-pad', `${pad}px`);
}

/**
 * 在 root 的子树里装吸附栈, 返回拆除函数.
 *
 * 只认 `data-sticky` 标记, 不认元素是谁 —— 写哪贴哪, 也不问它在哪个滚动容器里: 参照容器由成员
 * 自己的位置推出来, 一个容器一条栈, 于是抽屉与页面各退各的让. 退让距离按栈里的实际成员算, 因此
 * 成员增减 (搜索栏锁定后退出吸顶) 与高度变化 (摘要行的条件多到换行) 都不必通知这里.
 *
 * 每条栈的总高度发布在它的参照容器上 (`--sticky-stacked-top` / `--sticky-stacked-bottom`), 给那些
 * 进不了栈的元素用: antd 自己渲染的吸顶表头就是一个 —— 它的 DOM 拿不到, 只能让它照着总高度自己贴.
 *
 * 认下的代价两条: 排布走 rAF, 吸附位置比滚动晚一帧; 一个成员都没有的滚动容器不发布总高度, 里面
 * 照着总高度贴的元素会继承到外层那条栈的值.
 * @param root - 装在哪棵子树上. 参照视口的那条栈把总高度发布在它身上
 */
export function mountStickyStack(root: HTMLElement): () => void {
  let frame = 0;
  let members: HTMLElement[] = [];
  let stacks = new Map<HTMLElement | null, HTMLElement[]>();
  let hosts = new Set<HTMLElement>();

  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(layout);
  };

  // 排布只写变量与吸住的标记, 既不改尺寸也不动 DOM, 而听的属性只有 data-sticky, 于是不会自激
  const resize = new ResizeObserver(schedule);
  const mutation = new MutationObserver(schedule);

  function layout() {
    frame = 0;
    const found = [...root.querySelectorAll<HTMLElement>('[data-sticky]')];

    /**
     * 成员换人才重新订阅并重认参照容器: ResizeObserver 没有增量接口, 每轮都 disconnect 会丢掉
     * 这一帧的通知; 认参照容器要走祖先链读 overflow, 每帧都走一遍是滚动时最贵的那一段.
     *
     * 代价认下: 成员没动而祖先中途改了 overflow 的话, 分组要等下一次成员增减才纠正.
     */
    if (found.length !== members.length || found.some((one, index) => one !== members[index])) {
      resize.disconnect();
      found.forEach((one) => resize.observe(one));
      members = found;
      stacks = groupByScrollport(found);
    }

    const written = new Set<HTMLElement>();

    for (const [container, group] of stacks) {
      const host = container ?? root;
      // 一条栈量一次: 同一个容器里的成员吸的是同一条线, 退的是同一道内边距
      const port = measure(container);

      written.add(host);
      for (const edge of EDGES) {
        // 吸底栈的吸附先后与文档顺序相反: 文档里最后一员先贴上底边
        const stack = group.filter((one) => one.dataset.sticky === edge);
        const ordered: HTMLElement[] = edge === 'bottom' ? [...stack].reverse() : stack;
        const heights = ordered.map((one) => one.getBoundingClientRect().height);

        planStickyStack(heights).forEach((plan, index) => {
          apply(ordered[index], plan, port.pad[edge]);
          markStuck(ordered[index], edge, port);
        });
        setVar(host, `--sticky-stacked-${edge}`, `${heights.reduce((sum, one) => sum + one, 0)}px`);
      }
    }

    // 这一轮没成员的容器要清零: 留着旧值, 照它贴的元素会悬在一段已经不存在的栈下面
    for (const host of hosts) {
      if (written.has(host)) continue;
      EDGES.forEach((edge) => setVar(host, `--sticky-stacked-${edge}`, '0px'));
    }
    hosts = written;
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
