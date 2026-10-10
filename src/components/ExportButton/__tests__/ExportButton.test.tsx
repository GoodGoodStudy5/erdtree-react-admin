import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Form } from 'antd';
import { ModalOutlet } from '@south/components';
import { ExportButton } from '..';

function renderButton(ui: ReactElement) {
  return render(
    <>
      <ModalOutlet />
      {ui}
    </>,
  );
}

describe('ExportButton', () => {
  it('form: 点按钮开窗, 确定后 request 拿到表单值, 同步返回则关窗', async () => {
    const request = vi.fn();
    renderButton(
      <ExportButton defaultFileName="进项对账明细" request={request}>
        对账导出
      </ExportButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: '对账导出' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('dialog').textContent).toContain('对账导出');
    expect((screen.getByLabelText('文件名') as HTMLInputElement).value).toBe('进项对账明细');

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(request).toHaveBeenCalledWith({ fileName: '进项对账明细' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('form: 文件名为空时不确定, request 不被调', async () => {
    const request = vi.fn();
    renderButton(<ExportButton request={request} />);

    fireEvent.click(screen.getByRole('button', { name: '导出' }));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('文件名'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    expect(request).not.toHaveBeenCalled();
  });

  it('defaultFileName 是函数时点下去才取', async () => {
    const defaultFileName = vi.fn(() => '刚才');
    renderButton(<ExportButton defaultFileName={defaultFileName} request={() => undefined} />);

    expect(defaultFileName).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: '导出' }));
    await screen.findByRole('dialog');
    expect(defaultFileName).toHaveBeenCalledOnce();
    expect((screen.getByLabelText('文件名') as HTMLInputElement).value).toBe('刚才');
  });

  it('title 覆盖窗标题, 不传则跟按钮文案', async () => {
    renderButton(
      <ExportButton title="导出文件" request={() => undefined}>
        对账导出
      </ExportButton>,
    );
    fireEvent.click(screen.getByRole('button', { name: '对账导出' }));
    expect((await screen.findByRole('dialog')).textContent).toContain('导出文件');
  });

  it('formChildren 决定放不放文件名, 附加项进 request', async () => {
    const request = vi.fn();
    renderButton(
      <ExportButton
        request={request}
        formChildren={({ nodeFileName }: { nodeFileName: ReactNode }) => (
          <>
            {nodeFileName}
            <Form.Item name="scope" initialValue="GROUP" label="范围">
              <input />
            </Form.Item>
          </>
        )}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '导出' }));
    await screen.findByRole('dialog');
    fireEvent.change(screen.getByLabelText('文件名'), { target: { value: 'a.xlsx' } });
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() =>
      expect(request).toHaveBeenCalledWith({ fileName: 'a.xlsx', scope: 'GROUP' }),
    );
  });

  it('noForm: 点按钮不开窗, request 立刻被调', () => {
    const request = vi.fn();
    renderButton(
      <ExportButton mode="noForm" defaultFileName="应付对账明细" request={request}>
        导出
      </ExportButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: '导出' }));

    expect(request).toHaveBeenCalledWith({ fileName: '应付对账明细' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('noForm 且没有 defaultFileName 时 request 拿到空对象', () => {
    const request = vi.fn();
    renderButton(<ExportButton mode="noForm" request={request} />);

    fireEvent.click(screen.getByRole('button', { name: '导出' }));

    expect(request).toHaveBeenCalledWith({});
  });

  it('asyncForm: reject 后窗还在, 没有成功通知', async () => {
    const error = new Error('任务没建上');
    const request = vi.fn(() => Promise.reject(error));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    renderButton(
      <ExportButton mode="asyncForm" defaultFileName="a.xlsx" request={request}>
        导出
      </ExportButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: '导出' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith(error));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByText('正在异步导出中')).toBeNull();
    consoleError.mockRestore();
  });

  it('asyncForm: resolve 后出现正在异步导出中且关窗', async () => {
    let settle!: (value?: void) => void;
    const request = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        }),
    );
    renderButton(
      <ExportButton mode="asyncForm" defaultFileName="a.xlsx" request={request}>
        导出
      </ExportButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: '导出' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(screen.queryByText('正在异步导出中')).toBeNull();
    expect(screen.getByRole('dialog')).toBeTruthy();

    await act(async () => settle());

    expect((await screen.findByRole('alert')).textContent).toContain('正在异步导出中');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('beforeClick 返回 false 则 request 不被调', () => {
    const request = vi.fn();
    renderButton(
      <ExportButton mode="noForm" beforeClick={() => false} request={request}>
        导出
      </ExportButton>,
    );

    fireEvent.click(screen.getByRole('button', { name: '导出' }));

    expect(request).not.toHaveBeenCalled();
  });
});
