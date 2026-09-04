import type { DrawerProps } from 'antd';
import { Drawer } from 'antd';
import { useState } from 'react';
import { useModalId } from '@south/components';
import { DrawerRouteSync } from './useDrawerRoutes';

/** 拖拽下限: antd 只封顶不保底, 拖到 0 会开着抽屉却看不见内容 */
const MIN_DRAG_SIZE = 240;

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
  const { size, resizable = true, afterOpenChange, ...rest } = props;
  const [draggedSize, setDraggedSize] = useState<number>();
  const resizableConfig = typeof resizable === 'object' ? resizable : {};
  const modalId = useModalId();

  return (
    <>
      {modalId !== null && <DrawerRouteSync modalId={modalId} open={rest.open ?? false} />}
      <Drawer
        size={draggedSize ?? size ?? '70%'}
        {...rest}
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
