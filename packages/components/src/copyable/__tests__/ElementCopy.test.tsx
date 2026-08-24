import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { ElementCopy } from '@south/components';

/** 剪贴板是平台能力, 用例只关心交到它手上的是什么文本 */
const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

afterEach(() => {
  writeText.mockClear();
});

/** antd 的复制按钮只有 aria-label, 没有可见文案 */
function clickCopy() {
  fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
}

describe('ElementCopy', () => {
  it('复制到的是渲染出来的文本, 多行结构的换行不丢', async () => {
    render(
      <ElementCopy>
        <div>第一行</div>
        <div>第二行</div>
      </ElementCopy>,
    );
    clickCopy();

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());

    const [copied] = writeText.mock.calls[0];

    expect(copied).toContain('第一行');
    expect(copied).toContain('第二行');
    expect(copied).toContain('\n');
  });

  it('外部传 copyProps.onCopy 后核心复制仍然工作', async () => {
    const onCopy = vi.fn();

    render(
      <ElementCopy copyProps={{ onCopy }}>
        <span>订单号 A1</span>
      </ElementCopy>,
    );
    clickCopy();

    await waitFor(() => expect(onCopy).toHaveBeenCalledOnce());
    expect(writeText).toHaveBeenCalledWith('订单号 A1');
  });

  it('copyProps.text 显式覆盖复制口径', async () => {
    render(
      <ElementCopy copyProps={{ text: '我说了算' }}>
        <span>看到的文本</span>
      </ElementCopy>,
    );
    clickCopy();

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('我说了算'));
  });

  it('外部 className 与内部类名共存', () => {
    const { container } = render(
      <ElementCopy className="order-cell">
        <span>A1</span>
      </ElementCopy>,
    );

    expect(container.querySelector('.element-copy.order-cell')).toBeTruthy();
  });

  it('StrictMode 下不往 body 里留隐藏元素', () => {
    render(
      <StrictMode>
        <ElementCopy>
          <span>A1</span>
        </ElementCopy>
      </StrictMode>,
    );

    // zouwu 版在渲染期就往 body 塞隐藏 textarea 做 execCommand, 重挂载一次就漏一个
    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });
});
