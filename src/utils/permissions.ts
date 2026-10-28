import { router } from '@/router';

const BYPASS_KEY = 'dev:jumpAuth';
let bypass = false;
let warned = false;
let storageAvailable = true;

/** 仅开发环境绕过前端权限, 不绕过登录或后端鉴权. */
export function applyJumpAuthSearch(search: string): boolean {
  if (!import.meta.env.DEV) {
    document.documentElement.removeAttribute('data-jump-auth');
    return false;
  }

  const instruction = new URLSearchParams(search).get('jumpAuth');
  if (instruction === '1' || instruction === '0') bypass = instruction === '1';
  if (storageAvailable) {
    try {
      if (instruction === '1') sessionStorage.setItem(BYPASS_KEY, '1');
      if (instruction === '0') sessionStorage.removeItem(BYPASS_KEY);
      bypass = sessionStorage.getItem(BYPASS_KEY) === '1';
    } catch (error) {
      // 写失败后不能再用旧存储覆盖内存指令, 本次页面会话持续降级
      storageAvailable = false;
      console.warn('[权限] 无法读写 jumpAuth 会话状态, 本次仅在内存生效', error);
    }
  }

  document.documentElement.toggleAttribute('data-jump-auth', bypass);
  if (bypass !== warned) {
    warned = bypass;
    console.warn(bypass ? '[权限] jumpAuth 生效, 跳过全部前端权限判定' : '[权限] jumpAuth 已关闭');
  }
  return bypass;
}

/**
 * 检测是否有权限
 * @param value - 检测值
 * @param permissions - 权限
 */
export const checkPermission = (value: string, permissions: string[]): boolean => {
  if (import.meta.env.DEV && applyJumpAuthSearch(router.location.search)) return true;
  if (!permissions || permissions.length === 0) return false;
  return permissions.includes(value);
};
