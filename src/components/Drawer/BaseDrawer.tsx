import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import type { CSSProperties } from 'react';
import { useEffect, useId, useState } from 'react';
import { useModalId } from '@south/components';
import {
  enterDrawerStack,
  forgetDrawerStack,
  leaveDrawerStack,
  useDrawerBadge,
} from './drawerStack';
import { DrawerRouteSync } from './useDrawerRoutes';
import './index.less';

/** 拖拽下限: antd 只封顶不保底, 拖到 0 会开着抽屉却看不见内容 */
const MIN_DRAG_SIZE = 240;

/** 标了层号的抽屉根上多这个类, 样式见 index.less */
const STACKED_CLASS = 'drawer-stacked';

/** 层号写在这个自定义属性上, 样式见 index.less */
const DEPTH_VAR = '--drawer-stack-depth';

/**
 * 把层号挂到抽屉根上, 自定义属性由此继承到遮罩. 走 rootStyle 而不走 styles ——
 * 后者允许函数形态, 合并时要多一条分支, 而 rootStyle 恒是普通对象.
 * @param rootStyle - 调用方传的 rootStyle
 * @param badge - 层号, 0 表示这一层不标
 */
function withMark(rootStyle: DrawerProps['rootStyle'], badge: number): DrawerProps['rootStyle'] {
  if (!badge) return rootStyle;

  return { ...rootStyle, [DEPTH_VAR]: badge } as CSSProperties;
}

/**
 * 可拖宽的侧抽屉: antd Drawer 之上默认开启 resizable, 拖拽尺寸由这里受控接管.
 *
 * 接管的原因: antd 的 size 恒盖内部拖拽值, 调用方一传宽度拖拽就静默失效.
 * 接管后调用方的 size/width 恒为初始宽, 拖拽宽只活到关窗 —— 重开回到初始宽.
 *
 * 与路由的往来整条交给 DrawerRouteSync, 且只在 openModal 调起时挂 —— 内联受控的抽屉
 * 开合归页面自己, 挂了它就会连路由上下文一起要, 而那不是抽屉该有的前提.
 * @param props - antd DrawerProps 原样, 无新增
 */
export function BaseDrawer(props: DrawerProps) {
  const { size, resizable = true, afterOpenChange, rootClassName, rootStyle, ...rest } = props;
  const [draggedSize, setDraggedSize] = useState<number>();
  const resizableConfig = typeof resizable === 'object' ? resizable : {};
  const modalId = useModalId();
  const key = useId();
  const open = rest.open ?? false;
  const badge = useDrawerBadge(key);
  const stackedRootClassName = badge
    ? [rootClassName, STACKED_CLASS].filter(Boolean).join(' ')
    : rootClassName;

  // 进出栈跟着 open 走而不是跟着挂载走: 关闭已经落定, 层号不等那 300ms 的退场动画
  useEffect(() => {
    if (!open) return;

    enterDrawerStack(key);

    return () => leaveDrawerStack(key);
  }, [key, open]);

  // 退场那一笔活到卸载: 退场途中改这一层的层号会掐掉面板的滑出动画, 判据见 drawerStack
  useEffect(() => () => forgetDrawerStack(key), [key]);

  return (
    <>
      {modalId !== null && <DrawerRouteSync modalId={modalId} open={open} />}
      <Drawer
        size={draggedSize ?? size ?? '70%'}
        {...rest}
        rootClassName={stackedRootClassName}
        rootStyle={withMark(rootStyle, badge)}
        resizable={
          resizable === false
            ? false
            : {
                ...resizableConfig,
                onResize(dragged) {
                  const next = Math.max(dragged, MIN_DRAG_SIZE);
                  setDraggedSize(next);
                  resizableConfig.onResize?.(next);
                },
              }
        }
        afterOpenChange={(open) => {
          // 退场动画走完再清: 关闭途中跳回初始宽看得见
          if (!open) setDraggedSize(undefined);
          afterOpenChange?.(open);
        }}
      />
    </>
  );
}
