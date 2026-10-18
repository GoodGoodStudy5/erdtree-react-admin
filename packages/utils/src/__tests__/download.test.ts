import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { downloadBlob, downloadFile } from '@south/utils';

describe('downloadFile', () => {
  it('建 a 标签交给浏览器: href、download 与新标签页三件齐, 点完自我清理', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.getAttribute('href')).toBe('https://oss.invalid/a/发票.pdf');
      expect(this.download).toBe('发票.pdf');
      expect(this.target).toBe('_blank');
      expect(this.isConnected).toBe(true);
    });

    downloadFile('https://oss.invalid/a/发票.pdf', '发票.pdf');

    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a')).toBeNull();
    click.mockRestore();
  });

  it('不给文件名就不设 download 属性, 让浏览器自己定名', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.hasAttribute('download')).toBe(false);
    });

    downloadFile('https://oss.invalid/a/b.pdf');

    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });
});

describe('downloadBlob', () => {
  const createObjectURL = vi.fn(() => 'blob:download');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it('让出当前栈再点 a[download], 不新开标签, 稍后才摘节点并释放地址', async () => {
    const blob = new Blob(['x'], { type: 'application/octet-stream' });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.getAttribute('href')).toBe('blob:download');
      expect(this.download).toBe('对账.xlsx');
      expect(this.hasAttribute('target')).toBe(false);
      expect(this.isConnected).toBe(true);
    });

    const done = downloadBlob(blob, '对账.xlsx');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersToNextTimer();
    await done;

    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a')).not.toBeNull();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersToNextTimer();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
    expect(document.querySelector('a')).toBeNull();
    click.mockRestore();
  });
});
