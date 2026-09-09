import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { WatchData } from '../WatchData';

/**
 * 用例自带的订阅源. WatchData 不认识具体的 store, 能读能订阅就够 —— 自造一个最小的,
 * 用例失败时才能确定是 WatchData 的问题, 而不是 store 的.
 */
function createSignal(initial: number) {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next: number) => {
      value = next;
      for (const listener of [...listeners]) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}

describe('WatchData', () => {
  it('订阅值变化时 render 重跑', () => {
    const signal = createSignal(0);
    const { container } = render(
      <WatchData
        use={function useValue() {
          return useSyncExternalStore(signal.subscribe, signal.get);
        }}
        render={(value, children) => <div data-value={value}>{children}</div>}
      >
        <span>内容</span>
      </WatchData>,
    );

    expect(container.querySelector('div')?.dataset.value).toBe('0');

    act(() => signal.set(1));

    expect(container.querySelector('div')?.dataset.value).toBe('1');
  });

  it('children 的子组件不因订阅值变化而重跑 —— 这是这个组件存在的全部理由', () => {
    const signal = createSignal(0);
    let childRenders = 0;

    function Child() {
      childRenders++;

      return <span>内容</span>;
    }

    const { container } = render(
      <WatchData
        use={function useValue() {
          return useSyncExternalStore(signal.subscribe, signal.get);
        }}
        render={(value, children) => <div data-value={value}>{children}</div>}
      >
        <Child />
      </WatchData>,
    );

    expect(childRenders).toBe(1);

    act(() => signal.set(1));

    // 外壳跟着变了, 内容一次都没重跑
    expect(container.querySelector('div')?.dataset.value).toBe('1');
    expect(childRenders).toBe(1);
  });

  it('render 的第一参是 use 的返回值, 第二参是传入的 children', () => {
    const { container } = render(
      <WatchData
        use={function useValue() {
          return '订阅到的值';
        }}
        render={(value, children) => (
          <div>
            <i>{value}</i>
            {children}
          </div>
        )}
      >
        <b>穿过来的内容</b>
      </WatchData>,
    );

    expect(container.querySelector('i')?.textContent).toBe('订阅到的值');
    expect(container.querySelector('b')?.textContent).toBe('穿过来的内容');
  });
});
