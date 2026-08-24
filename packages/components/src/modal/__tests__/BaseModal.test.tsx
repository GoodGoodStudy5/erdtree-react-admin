import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { BaseModal } from '@south/components';

describe('BaseModal', () => {
  it('打开时标题与内容都在', () => {
    render(
      <BaseModal open title="新建用户" onCancel={vi.fn()}>
        表单内容
      </BaseModal>,
    );

    expect(screen.getByText('新建用户')).toBeTruthy();
    expect(screen.getByText('表单内容')).toBeTruthy();
  });

  it('点取消把关闭意图交回调用方', () => {
    const onCancel = vi.fn();
    render(
      <BaseModal open title="新建用户" onCancel={onCancel}>
        表单内容
      </BaseModal>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('手机屏铺满时内容照样在', () => {
    window.innerWidth = 375;

    render(
      <BaseModal open title="新建用户" onCancel={vi.fn()}>
        表单内容
      </BaseModal>,
    );

    expect(screen.getByText('表单内容')).toBeTruthy();
  });
});
