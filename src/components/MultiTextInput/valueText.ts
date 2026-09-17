import { strUtils } from '@south/utils';

/**
 * 条目拼回框里的文本, 单空格连接 —— 值是数组, 文本只是它的视图, 粘进来的排版不保留.
 * @param values - 当前的多个值
 */
export function textOf(values: string[] | undefined) {
  return (values ?? []).join(' ');
}

/** 框里的文本切成条目. 面板与计数都读它 —— 框里看得见几截, 那两处就是几条 */
export function itemsOf(text: string) {
  return strUtils.strSplitForValues(text);
}

/**
 * 已结算的那几条: 末尾没跟分隔符的那一截不算数, 否则想查 `45457` 的人先看到一屏 `4545` 的结果.
 *
 * 判「打完没打完」靠最后一条还是不是文本的结尾, 不在这里另抄一份分隔符清单.
 * @param text - 框里的文本
 */
export function settledOf(text: string) {
  const items = itemsOf(text);
  const last = items.at(-1);

  return last && text.endsWith(last) ? items.slice(0, -1) : items;
}
