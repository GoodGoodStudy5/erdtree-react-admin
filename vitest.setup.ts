import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 用例之间不共享 DOM, 上一个弹窗留在 body 里会让下一个用例的查询命中两次
afterEach(cleanup);

/** jsdom 起手的视口宽度, 即"桌面"这一档 */
const DEFAULT_WIDTH = window.innerWidth;

// 视口宽度是用例可以改的环境事实, 用完还原, 否则下一条用例站在别人设好的档上
afterEach(() => {
  window.innerWidth = DEFAULT_WIDTH;
});

/**
 * jsdom 不实现 ResizeObserver, 而 antd 的弹层 (下拉、气泡) 挂载时就会订阅尺寸变化.
 *
 * 替身只做到"能被订阅", 不派发任何回调: jsdom 没有排版, 元素尺寸恒为 0, 报出来的变化是假的.
 * 依赖真实尺寸的行为 (弹层翻转、虚拟列表可视区) 因此测不了, 那是浏览器环境的活.
 */
window.ResizeObserver = class {
  observe = () => undefined;
  unobserve = () => undefined;
  disconnect = () => undefined;
};

/** 会自带换行的标签. 只是近似, 真实的块级判定要看计算样式 */
const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'BLOCKQUOTE',
  'DIV',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'LI',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TR',
  'UL',
]);

/** 按 DOM 结构近似 innerText: 块级标签的边界给一个换行, 其余照文本内容 */
function approximateInnerText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (!(node instanceof window.HTMLElement)) {
    return '';
  }
  if (node.tagName === 'BR') {
    return '\n';
  }
  const inner = Array.from(node.childNodes).map(approximateInnerText).join('');

  return BLOCK_TAGS.has(node.tagName) ? `${inner}\n` : inner;
}

/**
 * jsdom 不实现 innerText —— 它要排版才算得出来, 而 jsdom 没有排版.
 * "复制用户眼睛看到的文本"这类能力正是靠它取值, 所以用例环境得给个替身.
 *
 * 替身只够验证"组件读的是渲染后的文本、块级结构带来的换行没丢";
 * 真实的排版折行 (自动换行、隐藏元素、CSS 生成内容) 只有浏览器算得准, 那不进这条缝.
 */
if (!('innerText' in window.HTMLElement.prototype)) {
  Object.defineProperty(window.HTMLElement.prototype, 'innerText', {
    configurable: true,
    get(this: HTMLElement) {
      // 结尾的换行不算: 它来自容器自身的块级边界, 不是用户看到的空行
      return approximateInnerText(this).replace(/\n+$/, '');
    },
  });
}

const MAX_WIDTH_QUERY = /^\(max-width:\s*(\d+)px\)$/;

function matchesViewport(query: string) {
  const matched = MAX_WIDTH_QUERY.exec(query);
  if (!matched) {
    throw new Error(`用例环境的 matchMedia 只答"窄于某宽度", 答不了: ${query}`);
  }
  return window.innerWidth <= Number(matched[1]);
}

/**
 * jsdom 不实现 matchMedia, 而组件要按视口宽度分手机与桌面, 用例得能指定站在哪一档.
 * 结果按 window.innerWidth 现算, 默认那档是桌面; 要手机档就在渲染前把宽度改小.
 *
 * 答不了的查询当场抛错而不是给 false —— 静默的 false 会让"没这么窄"和"问错了"长得一样.
 * 也不派发 change: 挂载之后改宽度不会重新求值. 视口变化不是任何组件的行为契约,
 * 真要测它, 值得的是浏览器环境而不是更像浏览器的替身.
 */
window.matchMedia = (query: string) =>
  Object.assign(new EventTarget(), {
    media: query,
    matches: matchesViewport(query),
    onchange: null,
  }) as unknown as MediaQueryList;
