import { useSyncExternalStore } from 'react';

/** 与应用侧 window.innerWidth <= 768 的判定保持一致 */
const PHONE_QUERY = '(max-width: 768px)';

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(PHONE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(PHONE_QUERY).matches;
}

/**
 * 是否手机屏. 包内自算而不由宿主注入 —— 视口宽度是环境事实, 不是业务状态.
 */
export function useIsPhone() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
