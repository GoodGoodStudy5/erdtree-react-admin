import type * as Permissions from '../permissions';
import { createHashRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let applyJumpAuthSearch: typeof Permissions.applyJumpAuthSearch;
let checkPermission: typeof Permissions.checkPermission;

beforeEach(async () => {
  vi.resetModules();
  ({ applyJumpAuthSearch, checkPermission } = await import('../permissions'));
  const { bindRouter } = await import('@/router');
  sessionStorage.clear();
  window.location.hash = '#/dashboard';
  bindRouter(createHashRouter([{ path: '*', element: null }]));
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  applyJumpAuthSearch('?jumpAuth=0');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('开发环境权限绕过', () => {
  it('缺省沿用 rule 精确匹配, 不改变页面与动作码格式', () => {
    expect(checkPermission('/system/user', ['/system/user'])).toBe(true);
    expect(checkPermission('/system/user/delete', ['/system/user'])).toBe(false);
    expect(checkPermission('/system/user', [])).toBe(false);
  });

  it('开启后覆盖页面与动作判定, 无查询串时保持, 关闭后恢复权限', () => {
    applyJumpAuthSearch('?jumpAuth=1');
    expect(sessionStorage.getItem('dev:jumpAuth')).toBe('1');
    expect(document.documentElement.hasAttribute('data-jump-auth')).toBe(true);
    expect(checkPermission('/system/user/delete', [])).toBe(true);
    applyJumpAuthSearch('');
    expect(checkPermission('/system/user', [])).toBe(true);
    applyJumpAuthSearch('?jumpAuth=0');
    expect(checkPermission('/system/user', [])).toBe(false);
    expect(sessionStorage.getItem('dev:jumpAuth')).toBeNull();
    expect(document.documentElement.hasAttribute('data-jump-auth')).toBe(false);
  });

  it('恢复精确的会话值, 无效及重复参数只按首值解释', () => {
    sessionStorage.setItem('dev:jumpAuth', '1');
    expect(applyJumpAuthSearch('?jumpAuth=x&jumpAuth=0')).toBe(true);
    expect(applyJumpAuthSearch('?jumpAuth=0&jumpAuth=1')).toBe(false);
    sessionStorage.setItem('dev:jumpAuth', 'true');
    expect(applyJumpAuthSearch('')).toBe(false);
  });

  it('生产环境不绕过, 即使 URL 和会话都开启', () => {
    vi.stubEnv('DEV', false);
    sessionStorage.setItem('dev:jumpAuth', '1');
    expect(applyJumpAuthSearch('?jumpAuth=1')).toBe(false);
    expect(checkPermission('/dashboard', [])).toBe(false);
    expect(document.documentElement.hasAttribute('data-jump-auth')).toBe(false);
  });

  it.each(['setItem', 'removeItem'] as const)('只在 %s 失败后持续使用内存状态', (method) => {
    const enabled = method === 'setItem';
    if (!enabled) applyJumpAuthSearch('?jumpAuth=1');
    vi.spyOn(Storage.prototype, method).mockImplementation(() => {
      throw new Error('write unavailable');
    });
    expect(applyJumpAuthSearch(enabled ? '?jumpAuth=1' : '?jumpAuth=0')).toBe(enabled);
    expect(applyJumpAuthSearch('')).toBe(enabled);
    expect(checkPermission('/dashboard', [])).toBe(enabled);
    expect(console.warn).toHaveBeenCalled();
  });

  it('存储被禁时记录告警并仅在内存切换', () => {
    const unavailable = () => {
      throw new Error('storage unavailable');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(unavailable);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(unavailable);
    expect(applyJumpAuthSearch('?jumpAuth=1')).toBe(true);
    expect(checkPermission('/dashboard', [])).toBe(true);
    expect(applyJumpAuthSearch('?jumpAuth=0')).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });
});
