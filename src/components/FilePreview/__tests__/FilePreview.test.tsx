import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { FilePreview } from '../FilePreview';

const URL_PDF = 'https://oss.invalid/dev/originals/invoice/uuid/发票.pdf';

/** 装一个只认 type 的假响应: 组件只看 ok 与 blob().type, 字节内容无关 */
function respondWith(type: string, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 404,
    blob: () => Promise.resolve(new Blob(['x'], { type })),
  });
}

describe('FilePreview', () => {
  const createObjectURL = vi.fn(() => 'blob:preview');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', respondWith('application/pdf'));
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('PDF 取回来转成 blob 地址交给 iframe, 不把归档地址直接交出去', async () => {
    const { container } = render(<FilePreview url={URL_PDF} />);

    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull());
    expect(container.querySelector('iframe')?.getAttribute('src')).toBe('blob:preview');
    expect(fetch).toHaveBeenCalledWith(URL_PDF);
  });

  it('不是 PDF 给降级提示, 不建 blob', async () => {
    vi.stubGlobal('fetch', respondWith('application/json'));

    const { container } = render(<FilePreview url={URL_PDF} />);

    await waitFor(() => expect(container.textContent).toContain('不支持预览'));
    expect(container.querySelector('iframe')).toBeNull();
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('取不到文件把状态码说出来', async () => {
    vi.stubGlobal('fetch', respondWith('application/pdf', false));

    const { container } = render(<FilePreview url={URL_PDF} />);

    await waitFor(() => expect(container.textContent).toContain('404'));
  });

  it('卸载时释放 blob: 抽屉每开一次都要还回去', async () => {
    const { container, unmount } = render(<FilePreview url={URL_PDF} />);
    await waitFor(() => expect(container.querySelector('iframe')).not.toBeNull());

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});
