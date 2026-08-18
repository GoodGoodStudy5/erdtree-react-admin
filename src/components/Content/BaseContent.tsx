import type { ReactNode } from 'react';
import { Forbidden } from '../Forbidden';

interface Props {
  isPermission?: boolean;
  children: ReactNode;
}

/** 页面内容容器. isPermission 为 false 时以无权限页替代内容 */
export function BaseContent(props: Props) {
  const { isPermission, children } = props;

  return (
    <>
      {isPermission !== false && (
        <div id="content" className="p-10px">
          {children}
        </div>
      )}
      {isPermission === false && (
        <div className="h-full p-10px box-border overflow-auto">
          <Forbidden />
        </div>
      )}
    </>
  );
}
