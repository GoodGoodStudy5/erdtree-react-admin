import type { ModalControl } from '@south/components';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import { RouterProvider, createMemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import {
  ModalOutlet,
  openModal,
  useModalId,
  useModalInstances,
  useModalVisible,
} from '@south/components';
import { useTabsStore } from '@/stores';
import { BaseDrawer } from '../BaseDrawer';
import { useDrawerRoutes } from '../useDrawerRoutes';

/** 被调起的抽屉. 与生产里的详情抽屉同形: 靠 useModalVisible 拿开合, onClose 交给 cancel */
function DetailDrawer(props: ModalControl<void> & { id: number; leaveTo?: string }) {
  const { id, leaveTo, cancel } = props;
  const visible = useModalVisible(useModalId());
  const navigate = useNavigate();

  return (
    <BaseDrawer open={visible} onClose={cancel} title={`详情 ${id}`}>
      正文
      {leaveTo && (
        <button
          onClick={() => {
            // 与附件表跳发票列表同形: 关自己与导航在同一拍
            cancel();
            void navigate(leaveTo);
          }}
        >
          跳走
        </button>
      )}
    </BaseDrawer>
  );
}

/** 把 query 与实例表摊到 DOM 上, 断言直接读它们 */
function Probe() {
  const { search } = useLocation();
  const instances = useModalInstances();

  return (
    <>
      <span data-testid="query">{search}</span>
      <span data-testid="instances">
        {instances.map((one) => `${one.id}:${one.visible ? '开' : '关'}`).join(',')}
      </span>
    </>
  );
}

function Page() {
  useDrawerRoutes({ detail: DetailDrawer });

  return (
    <>
      <Probe />
      <button onClick={() => void openModal(DetailDrawer, { id: 7 })}>开详情</button>
      {/* 与组内兄弟单同形: 从详情里再开一层同一个抽屉, 两层共用 detail 这个名字 */}
      <button onClick={() => void openModal(DetailDrawer, { id: 8 })}>开另一张详情</button>
      <button onClick={() => void openModal(DetailDrawer, { id: 7, leaveTo: '/invoice' })}>
        开可跳走的详情
      </button>
    </>
  );
}

/**
 * 用 data router 而非 MemoryRouter: 生产是 createHashRouter, 它的导航是异步的,
 * 而这条缝上的时序错正是异步导航才露出来的.
 * @param initial - 初始地址
 */
function mount(initial = '/bill') {
  const router = createMemoryRouter(
    [
      {
        path: '/bill',
        element: (
          <>
            <Page />
            <ModalOutlet />
          </>
        ),
      },
    ],
    { initialEntries: [initial] },
  );

  return render(<RouterProvider router={router} />);
}

const query = () => screen.getByTestId('query').textContent;
const instances = () => screen.getByTestId('instances').textContent;

/** 关抽屉走标题栏的关闭按钮, 与用户点的是同一个 */
function clickClose() {
  const close = document.querySelector<HTMLElement>('.ant-drawer-close');
  if (!close) throw new Error('关闭按钮没渲染');
  act(() => {
    close.click();
  });
}

describe('抽屉路由', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('开抽屉写进 query', async () => {
    mount();

    act(() => {
      screen.getByText('开详情').click();
    });

    await waitFor(() =>
      expect(query()).toBe('?openDrawer=%7B%22detail%22%3A%7B%22id%22%3A7%7D%7D'),
    );
    expect(instances()).toBe('1:开');
  });

  it('关掉就擦掉 query, 退场兜底移除那一拍不会把它开回来', async () => {
    mount();

    act(() => {
      screen.getByText('开详情').click();
    });
    await waitFor(() => expect(query()).not.toBe(''));

    clickClose();

    // 退场兜底计时到点, 实例真正移除 —— 擦 URL 的导航此时可能还没落地
    act(() => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => expect(query()).toBe(''));
    expect(instances()).toBe('');
  });

  it('进页面时 query 里点了名, 补开一次', () => {
    mount('/bill?openDrawer=%7B%22detail%22%3A%7B%22id%22%3A9%7D%7D');

    expect(screen.getByText('详情 9')).toBeTruthy();
    expect(instances()).toMatch(/^\d+:开$/);
  });
});

/**
 * 页面挂在 layout route 上, 切路由时不卸载 —— keepalive 下页面就是这个待遇.
 * @param initial - 初始地址
 */
function mountKeptAlive(initial = '/bill') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <>
            <Page />
            <ModalOutlet />
          </>
        ),
        children: [
          { path: 'bill', element: null },
          { path: 'invoice', element: null },
        ],
      },
    ],
    { initialEntries: [initial] },
  );

  render(<RouterProvider router={router} />);
  return router;
}

describe('抽屉路由 · 页面活过路由切换', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('切走再切回, 抽屉按 query 重开一次就停住', async () => {
    const router = mountKeptAlive();

    act(() => {
      screen.getByText('开详情').click();
    });
    await waitFor(() => expect(query()).not.toBe(''));
    const kept = query();

    await act(async () => {
      await router.navigate('/invoice');
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    await act(async () => {
      await router.navigate(`/bill${kept}`);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(instances()).toMatch(/^\d+:开$/);
    expect(query()).toBe(kept);
  });

  it('切走再切回之后关掉, 不会又开回来', async () => {
    const router = mountKeptAlive();

    act(() => {
      screen.getByText('开详情').click();
    });
    await waitFor(() => expect(query()).not.toBe(''));
    const kept = query();

    await act(async () => {
      await router.navigate('/invoice');
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {
      await router.navigate(`/bill${kept}`);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    clickClose();
    act(() => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => expect(query()).toBe(''));
    expect(instances()).toBe('');
  });
});

describe('抽屉路由 · 标签页那份 query', () => {
  beforeEach(() => {
    useTabsStore.setState({
      tabs: [{ key: '/bill', label: '', labelZh: '', labelEn: '', nav: [] }],
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const billTabQuery = () =>
    useTabsStore.getState().tabs.find((one) => one.key === '/bill')?.urlParams ?? '';

  it('抽屉不进标签页的记账, 于是切回来不会自己弹出来', async () => {
    const router = mountKeptAlive();

    act(() => {
      screen.getByText('开详情').click();
    });
    await waitFor(() => expect(query()).toContain('openDrawer'));

    // 地址栏带着, 标签页那份不带 —— 刷新与分享认地址栏, 切标签认这份
    expect(billTabQuery()).not.toContain('openDrawer');

    await act(async () => {
      await router.navigate('/invoice');
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });
    await act(async () => {
      await router.navigate(`/bill${billTabQuery()}`);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(instances()).toBe('');
  });

  it('抽屉里关掉自己再跳走: 不写到新页面的地址栏上', async () => {
    mountKeptAlive();

    act(() => {
      screen.getByText('开可跳走的详情').click();
    });
    await waitFor(() => expect(query()).toContain('openDrawer'));

    act(() => {
      screen.getByText('跳走').click();
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(query()).not.toContain('openDrawer');
    expect(instances()).toBe('');
  });
});

/** 关最上面那一层. 抽屉的 portal 按挂载顺序排在 body 下, 末位压在最上面 */
function clickCloseTop() {
  const closes = document.querySelectorAll<HTMLElement>('.ant-drawer-close');
  const close = closes[closes.length - 1];
  if (!close) throw new Error('关闭按钮没渲染');
  act(() => {
    close.click();
  });
}

describe('抽屉路由 · 只记本页自己那一格', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('同名叠开: 内层不记账, 关内层也不动外层那一格', async () => {
    mount();

    act(() => {
      screen.getByText('开详情').click();
    });
    await waitFor(() => expect(query()).not.toBe(''));
    const outer = query();

    act(() => {
      screen.getByText('开另一张详情').click();
    });
    await waitFor(() => expect(instances()).toMatch(/^\d+:开,\d+:开$/));

    // 一个名字放不下两格, 内层的 props 不该盖掉外层的
    expect(query()).toBe(outer);

    clickCloseTop();
    act(() => {
      vi.advanceTimersByTime(400);
    });

    await waitFor(() => expect(instances()).toMatch(/^\d+:开$/));
    expect(query()).toBe(outer);
  });

  it('抽屉登记在别的页上: 开出来了也一个字不写进当前这页的 query', async () => {
    const router = mountKeptAlive();

    await act(async () => {
      await router.navigate('/invoice');
    });

    act(() => {
      screen.getByText('开详情').click();
    });

    await waitFor(() => expect(instances()).toMatch(/^\d+:开$/));
    expect(query()).toBe('');
  });
});
