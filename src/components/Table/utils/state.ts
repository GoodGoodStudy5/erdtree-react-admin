import type { Dispatch } from 'react';
import { createContext } from 'react';
import { TableAction } from './reducer';

interface ScrollContextProps {
  dispatch?: Dispatch<TableAction>;
  renderLen: number;
  start: number;
  offsetStart: number;
  rowHeight: number;
  totalLen: number;
}

/** 虚拟滚动上下文, 向行容器传递滚动位置与行高 */
export const ScrollContext = createContext<ScrollContextProps>({
  dispatch: undefined,
  renderLen: 1,
  start: 0,
  offsetStart: 0,
  rowHeight: 46,
  totalLen: 0,
});
