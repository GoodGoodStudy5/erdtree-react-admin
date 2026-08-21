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
