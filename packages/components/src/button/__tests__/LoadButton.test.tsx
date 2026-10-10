import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { LoadButton } from '@south/components';

/** 让异步点击有一段能被观察到的 loading 期 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('LoadButton', () => {
  it('同步 onClick 不进 loading, 每次点击都触发', () => {
    const onClick = vi.fn();

    render(<LoadButton onClick={onClick}>保存</LoadButton>);
    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(button.className).not.toContain('ant-btn-loading');
  });

  it('异步 onClick 期间的重复点击被拦, 结束后经 onClickFinally 通知', async () => {
    const onClick = vi.fn(async () => sleep(20));
    const onClickFinally = vi.fn();

    render(
      <LoadButton onClick={onClick} onClickFinally={onClickFinally}>
        提交
      </LoadButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(button.className).toContain('ant-btn-loading');
    // loading 期间的这一下不该到达 onClick
    fireEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
    await waitFor(() => expect(onClickFinally).toHaveBeenCalledWith({ isCatch: false }));
    // 收回 loading 比 onClickFinally 晚一个 React 周期, 回调到了不代表 class 已经摘掉
    await waitFor(() => expect(button.className).not.toContain('ant-btn-loading'));
  });

  it('失败时 onClickFinally 拿到原样的异常, 并留下一行日志', async () => {
    const error = new Error('接口炸了');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const onClickFinally = vi.fn();

    render(
      <LoadButton onClick={() => Promise.reject(error)} onClickFinally={onClickFinally}>
        提交
      </LoadButton>,
    );
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(onClickFinally).toHaveBeenCalledWith({ isCatch: true, error }));
    expect(consoleError).toHaveBeenCalledWith(error);
    // 收回 loading 比 onClickFinally 晚一个 React 周期, 回调到了不代表 class 已经摘掉
    await waitFor(() =>
      expect(screen.getByRole('button').className).not.toContain('ant-btn-loading'),
    );
    consoleError.mockRestore();
  });

  it('外部显式传 loading 时以外部为准, 文案也跟着换', () => {
    render(
      <LoadButton loading loadingChildren="提交中">
        提交
      </LoadButton>,
    );

    expect(screen.getByRole('button').className).toContain('ant-btn-loading');
    expect(screen.getByText('提交中')).toBeTruthy();
  });

  it('loading 期间换成 loadingChildren, 结束后换回来', async () => {
    render(
      <LoadButton loadingChildren="提交中" onClick={async () => sleep(20)}>
        提交
      </LoadButton>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('提交中')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('提交')).toBeTruthy());
  });

  it('beforeClick 返回 false 时确认气泡不弹; 通过后弹出, 确认才执行 onClick', async () => {
    const onClick = vi.fn();
    let isFirstClick = true;

    render(
      <LoadButton
        popconfirmProps={{ title: '确认删除?' }}
        beforeClick={() => {
          if (isFirstClick) {
            isFirstClick = false;
            return false;
          }
        }}
        onClick={onClick}
      >
        删除
      </LoadButton>,
    );
    const button = screen.getByRole('button');

    fireEvent.click(button);
    expect(screen.queryByText('确认删除?')).toBeNull();
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(button);
    expect(await screen.findByText('确认删除?')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('气泡的第二行说明文字与标题同时在场', async () => {
    render(
      <LoadButton popconfirmProps={{ title: '确认删除?', content: '删除后不可恢复' }}>
        删除
      </LoadButton>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText('删除后不可恢复')).toBeTruthy();
    expect(screen.getByText('确认删除?')).toBeTruthy();
  });

  it('外部传 popconfirmProps.onConfirm 后, 核心的 onClick 仍然执行', async () => {
    const onClick = vi.fn();
    const onConfirm = vi.fn();

    render(
      <LoadButton popconfirmProps={{ title: '确认删除?', onConfirm }} onClick={onClick}>
        删除
      </LoadButton>,
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(await screen.findByRole('button', { name: 'OK' }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('disabled 时气泡不弹', () => {
    render(
      <LoadButton disabled popconfirmProps={{ title: '确认删除?' }}>
        删除
      </LoadButton>,
    );
    fireEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('确认删除?')).toBeNull();
  });

  it('没显式给 type 时是文字按钮, 外部 className 照样带上', () => {
    render(<LoadButton className="my-btn">保存</LoadButton>);

    const { className } = screen.getByRole('button');

    expect(className).toContain('load-button-link-text');
    expect(className).toContain('my-btn');
  });

  it('默认禁选; selectable 打开后文案可选', () => {
    const { rerender } = render(<LoadButton>应付对账明细_20261010</LoadButton>);
    expect(screen.getByRole('button').className).not.toContain('load-button-selectable');

    rerender(<LoadButton selectable>应付对账明细_20261010</LoadButton>);
    expect(screen.getByRole('button').className).toContain('load-button-selectable');
  });
});
