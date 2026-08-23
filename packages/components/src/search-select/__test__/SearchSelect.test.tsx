import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
// 用例站在包外看这个组件库, 所以从门面取件, 不走深层路径
import { SearchSelect } from '@south/components';
import type { SearchSelectRef } from '@south/components';

const CITY_OPTIONS = [
  { label: '北京', value: 'bj', code: 'BJ' },
  { label: '上海', value: 'sh', code: 'SH' },
  { label: '广州', value: 'gz', code: 'GZ' },
];

type CityOption = (typeof CITY_OPTIONS)[number];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** antd 的搜索下拉把 input 标成 combobox, 点它展开面板, 改它的值就是搜索 */
function selectInput() {
  return screen.getByRole('combobox');
}

function openPanel() {
  fireEvent.mouseDown(selectInput());
}

function typeSearch(keyword: string) {
  fireEvent.change(selectInput(), { target: { value: keyword } });
}

describe('SearchSelect', () => {
  it('挂载即拉一次选项, autoLoad 关掉就不拉', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);
    const { unmount } = render(<SearchSelect request={request} />);

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    unmount();

    const lazyRequest = vi.fn(async () => CITY_OPTIONS);

    render(<SearchSelect autoLoad={false} request={lazyRequest} />);
    await sleep(20);
    expect(lazyRequest).not.toHaveBeenCalled();
  });

  it('外部传 onSearch 后, 内部的防抖请求仍然发起 (回归钉)', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);
    const onSearch = vi.fn();

    render(<SearchSelect debounceWait={10} onSearch={onSearch} request={request} />);
    await waitFor(() => expect(request).toHaveBeenCalledOnce());

    typeSearch('北');

    // 外部回调照常收到
    expect(onSearch).toHaveBeenCalledWith('北');
    // 内部行为没被顶掉: 搜索词照样发出去了
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request).toHaveBeenLastCalledWith('北');
  });

  it('把 onSearch 写进 antd 6 的 showSearch 配置对象也一样共存', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);
    const onSearch = vi.fn();

    render(<SearchSelect debounceWait={10} request={request} showSearch={{ onSearch }} />);
    await waitFor(() => expect(request).toHaveBeenCalledOnce());

    typeSearch('北');

    expect(onSearch).toHaveBeenCalledWith('北');
    await waitFor(() => expect(request).toHaveBeenLastCalledWith('北'));
  });

  it('连续搜索合成一次请求, 只有最后一次输入生效', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);

    render(<SearchSelect debounceWait={20} request={request} />);
    await waitFor(() => expect(request).toHaveBeenCalledOnce());

    typeSearch('北');
    typeSearch('北京');
    typeSearch('北京市');

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(request).toHaveBeenLastCalledWith('北京市');
    await sleep(40);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('聚焦时补拉一次, allowFocusLoad 关掉就不拉', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);
    const { unmount } = render(<SearchSelect autoLoad={false} request={request} />);

    fireEvent.focus(selectInput());
    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    unmount();

    const quietRequest = vi.fn(async () => CITY_OPTIONS);

    render(<SearchSelect allowFocusLoad={false} autoLoad={false} request={quietRequest} />);
    fireEvent.focus(selectInput());
    await sleep(20);
    expect(quietRequest).not.toHaveBeenCalled();
  });

  it('联动请求期间旧选项立刻不可选, 新数据到位后恢复', async () => {
    // 逐次放行请求, 才看得到"请求在飞"那段时间下拉是什么样
    const releases: (() => void)[] = [];
    const request = vi.fn(async (keyword?: string) => {
      await new Promise<void>((resolve) => {
        releases.push(resolve);
      });
      return keyword === '深' ? [{ label: '深圳', value: 'sz', code: 'SZ' }] : CITY_OPTIONS;
    });
    const ref = createRef<SearchSelectRef<CityOption>>();

    // 关掉聚焦加载: 打开面板顺带发的请求会把这条用例的计数搅乱, 它自己有专门的用例
    render(<SearchSelect allowFocusLoad={false} ref={ref} request={request} />);
    await waitFor(() => expect(releases).toHaveLength(1));
    await act(async () => {
      releases[0]();
      await sleep(0);
    });
    openPanel();
    expect(await screen.findByTitle('北京')).toBeTruthy();

    // 上游变了: 旧选项当场失效, 不该还能被选中
    act(() => {
      void ref.current?.fetchOptionsForCascade('深');
    });
    expect(screen.queryByTitle('北京')).toBeNull();

    await waitFor(() => expect(releases).toHaveLength(2));
    await act(async () => {
      releases[1]();
      await sleep(0);
    });

    await waitFor(() => expect(screen.getByTitle('深圳')).toBeTruthy());
    expect(screen.queryByTitle('北京')).toBeNull();
  });

  it('options 受控时搜索也不发请求, 只本地过滤 (回归钉)', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);

    // 两个都给: 数据归调用方管, request 不该被搜索唤起, 否则请求白发、结果还被丢掉
    render(<SearchSelect debounceWait={10} options={CITY_OPTIONS} request={request} />);
    openPanel();
    typeSearch('北');

    await waitFor(() => expect(screen.getByTitle('北京')).toBeTruthy());
    expect(screen.queryByTitle('上海')).toBeNull();
    await sleep(30);
    expect(request).not.toHaveBeenCalled();
  });

  it('include 与 exclude 同时给时只认 include', async () => {
    render(<SearchSelect exclude={['bj']} include={['bj', 'sh']} options={CITY_OPTIONS} />);
    openPanel();

    expect(await screen.findByTitle('北京')).toBeTruthy();
    expect(screen.getByTitle('上海')).toBeTruthy();
    expect(screen.queryByTitle('广州')).toBeNull();
  });

  it('exclude 单独给时按 value 反选', async () => {
    render(<SearchSelect exclude={['gz']} options={CITY_OPTIONS} />);
    openPanel();

    expect(await screen.findByTitle('北京')).toBeTruthy();
    expect(screen.queryByTitle('广州')).toBeNull();
  });

  it('searchByLocal 时不因搜索发请求, 按 searchKeys 多字段模糊匹配', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);

    render(
      <SearchSelect
        allowFocusLoad={false}
        debounceWait={10}
        request={request}
        searchByLocal
        searchKeys={['code']}
      />,
    );
    await waitFor(() => expect(request).toHaveBeenCalledOnce());

    openPanel();
    // 小写输入命中大写的 code 字段
    typeSearch('sh');

    await waitFor(() => expect(screen.getByTitle('上海')).toBeTruthy());
    expect(screen.queryByTitle('北京')).toBeNull();
    await sleep(30);
    expect(request).toHaveBeenCalledOnce();
  });

  it('多列下拉给出表头与每列单元格', async () => {
    render(
      <SearchSelect
        columnsTable={{
          columns: [
            { title: '编码', dataIndex: 'code' },
            { title: '名称', dataIndex: 'label' },
          ],
        }}
        options={CITY_OPTIONS}
      />,
    );
    openPanel();

    expect(await screen.findByText('编码')).toBeTruthy();
    expect(screen.getByText('名称')).toBeTruthy();
    expect(screen.getByText('BJ')).toBeTruthy();
  });

  it('ref 把手四个成员: 取当前选项与加载态, 也能等一次重新取数', async () => {
    const request = vi.fn(async () => CITY_OPTIONS);
    const ref = createRef<SearchSelectRef<CityOption>>();

    render(<SearchSelect autoLoad={false} ref={ref} request={request} />);

    expect(ref.current?.isLoading).toBe(false);
    expect(ref.current?.options).toBeUndefined();

    const fetched = await act(() => ref.current?.fetchOptions() ?? Promise.resolve(undefined));

    expect(fetched).toEqual(CITY_OPTIONS);
    expect(ref.current?.options).toEqual(CITY_OPTIONS);
    expect(typeof ref.current?.fetchOptionsForCascade).toBe('function');
  });

  it('外部 className 与内部类名共存, 占位文案跟着语种走', () => {
    const { container } = render(<SearchSelect className="city-select" options={CITY_OPTIONS} />);

    expect(container.querySelector('.search-select.city-select')).toBeTruthy();
    expect(screen.getByText('Please select')).toBeTruthy();
  });
});
