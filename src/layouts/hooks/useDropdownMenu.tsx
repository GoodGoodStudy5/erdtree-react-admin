import type { MenuProps } from 'antd';
import { useLocation } from 'react-router-dom';
import {
  RedoOutlined,
  CloseOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignMiddleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons';
import { useCommonStore, useNavigateProgress } from '@/hooks';
import { useTabsStore } from '@/stores';
import { useShallow } from 'zustand/shallow';
import { $t } from '@/locales';

enum ITabEnums {
  REFRESH = 'refresh', // 重新加载
  PIN = 'pin', // 固定/取消固定
  CLOSE_CURRENT = 'close_current', // 关闭当前
  CLOSE_OTHER = 'close_other', // 关闭其他
  CLOSE_LEFT = 'close_left', // 关闭左侧
  CLOSE_RIGHT = 'close_right', // 关闭右侧
  MAXIMIZE = 'maximize', // 最大化/退出最大化
}

interface Props {
  activeKey: string;
  onOpenChange?: (open: boolean) => void;
  handleRefresh: (activeKey: string) => void;
}

export function useDropdownMenu(props: Props) {
  const { activeKey, onOpenChange, handleRefresh } = props;
  const { pathname } = useLocation();
  const { tabs, isMaximize } = useCommonStore();
  const { closeLeft, closeOther, closeRight, closeTabs, toggleMaximize, toggleTabPin } =
    useTabsStore.getState();
  const aliveRef = usePublicStore(useShallow((state) => state.aliveRef));
  const navigate = useNavigateProgress();

  // 菜单项
  const items: (key?: string) => MenuProps['items'] = (key = activeKey) => {
    const index = tabs.findIndex((item) => item.key === key);
    const isPinned = !!tabs[index]?.pinned;
    // 固定的标签不参与批量关闭, 左右两侧只剩固定标签时无可关闭项
    const hasCloseableLeft = tabs.slice(0, index).some((item) => !item.pinned);
    const hasCloseableRight = tabs.slice(index + 1).some((item) => !item.pinned);
    const hasCloseableOther = tabs.some((item) => item.key !== key && !item.pinned);
    return [
      {
        key: ITabEnums.REFRESH,
        label: $t('public.reload'),
        disabled: key !== pathname,
        icon: <RedoOutlined className="mr-5px transform rotate-270" />,
      },
      {
        key: ITabEnums.PIN,
        label: isPinned ? $t('public.unpinTab') : $t('public.pinTab'),
        icon: isPinned ? (
          <PushpinFilled className="mr-5px" />
        ) : (
          <PushpinOutlined className="mr-5px" />
        ),
      },
      {
        key: ITabEnums.CLOSE_CURRENT,
        label: $t('public.closeTab'),
        disabled: tabs.length <= 1 || isPinned,
        icon: <CloseOutlined className="mr-5px" />,
      },
      {
        key: ITabEnums.CLOSE_OTHER,
        label: $t('public.closeOther'),
        disabled: !hasCloseableOther,
        icon: <VerticalAlignMiddleOutlined className="mr-5px transform rotate-90" />,
      },
      {
        key: ITabEnums.CLOSE_LEFT,
        label: $t('public.closeLeft'),
        disabled: !hasCloseableLeft,
        icon: <VerticalAlignTopOutlined className="mr-5px transform rotate-270" />,
      },
      {
        key: ITabEnums.CLOSE_RIGHT,
        label: $t('public.closeRight'),
        disabled: !hasCloseableRight,
        icon: <VerticalAlignTopOutlined className="mr-5px transform rotate-90" />,
      },
      {
        key: ITabEnums.MAXIMIZE,
        label: isMaximize ? $t('public.exitMaximized') : $t('public.maximize'),
        // 最大化作用于当前展示的内容区, 非当前标签无意义
        disabled: key !== pathname,
        icon: isMaximize ? (
          <FullscreenExitOutlined className="mr-5px" />
        ) : (
          <FullscreenOutlined className="mr-5px" />
        ),
      },
    ];
  };

  /** 点击菜单 */
  const onClick = (type: string, key = activeKey) => {
    // 复原箭头
    onOpenChange?.(false);

    switch (type) {
      // 重新加载
      case ITabEnums.REFRESH:
        handleRefresh(key);
        break;

      // 关闭当前
      case ITabEnums.CLOSE_CURRENT:
        if (activeKey === pathname) {
          const currentIndex = tabs.findIndex((tab) => tab.key === activeKey);
          const nextPath = tabs[currentIndex > 0 ? currentIndex - 1 : 0].key;
          if (nextPath) {
            navigate(nextPath);
          }
        }
        closeTabs(key, aliveRef.current?.destroy);

        break;

      // 关闭其他
      case ITabEnums.CLOSE_OTHER:
        closeOther(key, aliveRef.current?.destroy);
        navigate(key);
        break;

      // 关闭左侧
      case ITabEnums.CLOSE_LEFT:
        closeLeft(key, aliveRef.current?.destroy);
        navigate(key);
        break;

      // 关闭右侧
      case ITabEnums.CLOSE_RIGHT:
        closeRight(key, aliveRef.current?.destroy);
        navigate(key);
        break;

      // 固定/取消固定
      case ITabEnums.PIN:
        toggleTabPin(key);
        break;

      // 最大化/退出最大化
      case ITabEnums.MAXIMIZE:
        toggleMaximize(!isMaximize);
        break;

      default:
        break;
    }
  };

  return [items, onClick] as const;
}
