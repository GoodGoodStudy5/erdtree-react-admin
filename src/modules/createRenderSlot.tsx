import type { ReactNode } from 'react';
import { emptyText } from '@south/utils';

/** 下定义的那个实现. 第一个参数固定是要渲染的值, 第二个是各插座自定的选项 */
type RenderImpl<O extends object> = (value: string | undefined, options: O) => ReactNode;

/** 渲染插座: 本身就是那个 render, 另带一个下定义的口子 */
type RenderSlot<O extends object> = {
  (value: string | undefined, options?: O): ReactNode;
  /** 业务侧下定义. 返回卸载函数, 只有用例用得上 */
  define(impl: RenderImpl<O>): () => void;
};

/**
 * 造一个渲染插座: 业务侧下定义, 任何地方都能调.
 *
 * 换来的是「调用方不认识业务」—— 应付单页与清账页渲染发票号码时, 不必 import 发票页的任何东西,
 * 于是发票页改抽屉、改点开方式, 那几处一个字都不用动.
 *
 * 定义处与调用处同名: 全仓库搜 renderXxx 一次看全声明、定义与所有调用点.
 *
 * 选项收一个对象而不是散参: 加一项时调用点不必按位置补 undefined, 各插座要什么自己定.
 *
 * 没人下定义时不抛异常: 渲染期抛会整页白屏, 而少一个可点状态只是少一个可点状态. 认下的代价是
 * 这一档只有 dev 控制台看得见.
 * @param name - 报错时说得出是谁没下定义
 */
export function createRenderSlot<O extends object = Record<string, never>>(
  name: string,
): RenderSlot<O> {
  let impl: RenderImpl<O> | undefined;

  const render = (value: string | undefined, options?: O): ReactNode => {
    // 选项整个缺席时给空对象, 于是下定义那侧可以直接解构
    if (impl) return impl(value, options ?? ({} as O));

    if (import.meta.env.DEV) console.error(`[${name}] 没有业务下定义, 已降级为纯文字`);
    return value ?? emptyText;
  };

  return Object.assign(render, {
    define(next: RenderImpl<O>) {
      impl = next;
      return () => {
        if (impl === next) impl = undefined;
      };
    },
  });
}
