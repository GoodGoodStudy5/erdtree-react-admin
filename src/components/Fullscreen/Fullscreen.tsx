import { Tooltip } from 'antd';
import { Icon } from '@iconify/react';
import { useFullscreen } from '@/hooks';
import { $t } from '@/locales';

/**
 * @description: 全屏组件
 */
export function Fullscreen() {
  const [isFullscreen, toggleFullscreen] = useFullscreen();

  return (
    <Tooltip title={isFullscreen ? $t('public.exitFullscreen') : $t('public.fullScreen')}>
      <div
        className="flex items-center justify-center text-lg mr-3 cursor-pointer"
        onClick={toggleFullscreen}
      >
        <Icon
          icon="gridicons-fullscreen-exit"
          style={{ display: isFullscreen ? 'block' : 'none' }}
        />
        <Icon icon="gridicons-fullscreen" style={{ display: !isFullscreen ? 'block' : 'none' }} />
      </div>
    </Tooltip>
  );
}
