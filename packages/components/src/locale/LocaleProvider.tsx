import type { ReactNode } from 'react';
import { LocaleContext } from './context';
import type { PartialComponentsLocale } from './types';

type Props = {
  /** 只需给出要覆盖的部分, 其余落回包内默认 */
  locale: PartialComponentsLocale;
  children?: ReactNode;
};

/** 覆盖本包组件的文案. 不挂也能用, 那时组件跟着宿主给 antd 的语种走 */
export function LocaleProvider({ locale, children }: Props) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
