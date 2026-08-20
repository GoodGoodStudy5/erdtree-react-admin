import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import nprogress from 'nprogress';

/** 等待短于这个时长不提示, 秒开的页面不打扰用户 */
const PROGRESS_DELAY = 300;

// 禁止进度条添加loading
nprogress.configure({ showSpinner: false });

/**
 * 带加载提示的页面跳转。
 *
 * 页面按需加载, 点下去到新页面出现之间有一段等待, 这段用顶部进度条告诉用户在等什么。
 * 判据是跳转本身有没有落地 —— 它涵盖代码下载与首屏渲染, 新页面就绪的那一刻进度条结束。
 */
export const useNavigateProgress = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isPending) {
      timer.current = window.setTimeout(() => nprogress?.start?.(), PROGRESS_DELAY);
      return;
    }

    window.clearTimeout(timer.current);
    nprogress?.done?.();
  }, [isPending]);

  // 跳转途中离开界面时不留下一条走不完的进度条
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      nprogress?.done?.();
    },
    [],
  );

  return useCallback(
    (to: string) => {
      startTransition(() => navigate(to));
    },
    [navigate, startTransition],
  );
};
