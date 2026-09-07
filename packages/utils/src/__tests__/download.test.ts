import { describe, expect, it, vi } from 'vitest';
// 用例站在包外看这个工具库, 所以从门面取件, 不走深层路径
import { downloadFile } from '@south/utils';

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
