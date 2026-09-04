import type { BaseSearchList } from '#/form';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryBar } from '../QueryBar';

/**
 * 四项里最后一项占两列. 全用 Input: 其余控件是懒加载的, 等它们落地与本组件的行为无关.
 */
const LIST: BaseSearchList[] = [
  { label: '发票号码', name: 'invoiceNo', component: 'Input' },
  { label: '销售方名称', name: 'sellerName', component: 'Input' },
  { label: '购买方名称', name: 'buyerName', component: 'Input' },
  { label: '价税合计', name: 'grandTotal', component: 'Input', colSize: 2 },
];

/**
 * 取搜索栏的壳, 状态量与限高用的变量都写在它身上.
 *
 * 壳是表单那一层而不是 .query-bar: 后者只装摘要行 —— 它要吸顶, 高度就不能含条件区.
 */
function barOf(container: HTMLElement) {
  return container.querySelector('.query-bar-form') as HTMLElement;
}

/** 一行占多少像素 */
function rowHeightOf(container: HTMLElement) {
  return parseFloat(barOf(container).style.getPropertyValue('--query-bar-row-h'));
}

describe('QueryBar', () => {
  // 表单值的订阅是攒批的 (rc-form 用 MessageChannel 推), 所以摘要总要等一个宏任务才出
  it('摘要只列已填的条件, 未填的收成一枚计数', async () => {
    render(<QueryBar list={LIST} committed={{ invoiceNo: '25600001' }} onSearch={vi.fn()} />);

    expect(await screen.findByText('发票号码: 25600001')).toBeTruthy();
    expect(screen.getByText('另 3 项未填')).toBeTruthy();
  });

  it('已提交条件后来变了, 新增那几项照样进得去搜索区', async () => {
    const { rerender } = render(<QueryBar list={LIST} committed={{}} onSearch={vi.fn()} />);

    // 用户先搜过一次
    rerender(<QueryBar list={LIST} committed={{ invoiceNo: 'A' }} onSearch={vi.fn()} />);
    expect(await screen.findByText('发票号码: A')).toBeTruthy();

    // 再由外部注入一批条件: 只回填一次的话, 这一批会看不见也清不掉
    rerender(
      <QueryBar
        list={LIST}
        committed={{ invoiceNo: 'A', sellerName: '某某公司' }}
        onSearch={vi.fn()}
      />,
    );

    expect(await screen.findByText('销售方名称: 某某公司')).toBeTruthy();
    expect(screen.getByText('发票号码: A')).toBeTruthy();
  });

  it('已提交条件没变的项不碰, 用户填了一半的内容保得住', async () => {
    const committed = { invoiceNo: 'A' };
    const { container, rerender } = render(
      <QueryBar list={LIST} committed={committed} onSearch={vi.fn()} />,
    );

    // 用户正在另一个框里输入, 还没点搜索
    const seller = container.querySelector('#sellerName') as HTMLInputElement;

    fireEvent.change(seller, { target: { value: '半截' } });

    // 外部只改了发票号码那一项
    rerender(<QueryBar list={LIST} committed={{ invoiceNo: 'B' }} onSearch={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('发票号码: B')).toBeTruthy());
    expect(seller.value).toBe('半截');
  });

  it('关掉已提交过的 chip 不消失: 转划线态, 显的是已提交那份值', async () => {
    const { container } = render(
      <QueryBar list={LIST} committed={{ invoiceNo: '25600001' }} onSearch={vi.fn()} />,
    );

    await screen.findByText('发票号码: 25600001');
    fireEvent.click(container.querySelector('.ant-tag-close-icon') as HTMLElement);

    // 条件还在生效, 所以 chip 留在原地; 表单已空, 所以显的必须是已提交的那份
    await waitFor(() =>
      expect(screen.getByText('发票号码: 25600001').className).toContain('line-through'),
    );
    expect(container.querySelector('.ant-tag-warning')).toBeTruthy();
    expect(container.querySelector('.anticon-undo')).toBeTruthy();
  });

  it('划线 chip 点撤回, 值写回表单, 回到已生效', async () => {
    const { container } = render(
      <QueryBar list={LIST} committed={{ invoiceNo: '25600001' }} onSearch={vi.fn()} />,
    );

    await screen.findByText('发票号码: 25600001');
    fireEvent.click(container.querySelector('.ant-tag-close-icon') as HTMLElement);
    await waitFor(() => expect(container.querySelector('.anticon-undo')).toBeTruthy());
    fireEvent.click(container.querySelector('.ant-tag-close-icon') as HTMLElement);

    await waitFor(() =>
      expect(screen.getByText('发票号码: 25600001').className).not.toContain('line-through'),
    );
    expect(container.querySelector('.ant-tag-processing')).toBeTruthy();
    const input = container.querySelector('#invoiceNo') as HTMLInputElement;

    expect(input.value).toBe('25600001');
  });

  it('从没提交过的 chip 关掉直接消失, 不划线', async () => {
    const { container } = render(<QueryBar list={LIST} committed={{}} onSearch={vi.fn()} />);
    const input = container.querySelector('#invoiceNo') as HTMLInputElement;

    fireEvent.change(input, { target: { value: '新填的' } });
    // 填了没搜, 所以是未提交那个色
    await waitFor(() => expect(container.querySelector('.ant-tag-warning')).toBeTruthy());

    fireEvent.click(container.querySelector('.ant-tag-close-icon') as HTMLElement);

    await waitFor(() => expect(screen.queryByText('发票号码: 新填的')).toBeNull());
  });

  it('一个条件都没填时报出有多少项可用', () => {
    render(<QueryBar list={LIST} committed={{}} onSearch={vi.fn()} />);

    expect(screen.getByText('未设任何条件, 共 4 项可用')).toBeTruthy();
  });

  it('清掉一枚 chip 只改表单, 不发请求: 发请求只有搜索, 重置与回车三条路', async () => {
    const onSearch = vi.fn();
    const { container } = render(
      <QueryBar list={LIST} committed={{ invoiceNo: '25600001' }} onSearch={onSearch} />,
    );

    await screen.findByText('发票号码: 25600001');
    fireEvent.click(container.querySelector('.ant-tag-close-icon') as HTMLElement);

    const input = container.querySelector('#invoiceNo') as HTMLInputElement;

    await waitFor(() => expect(input.value).toBe(''));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('点搜索把当前条件交出去', async () => {
    const onSearch = vi.fn();
    render(<QueryBar list={LIST} committed={{ invoiceNo: '25600001' }} onSearch={onSearch} />);

    fireEvent.click(screen.getByRole('button', { name: /搜索/ }));

    await waitFor(() => expect(onSearch).toHaveBeenCalledWith({ invoiceNo: '25600001' }));
  });

  it('点锁改的是占位方式, 所以状态写在壳上让 CSS 接管', () => {
    const { container } = render(<QueryBar list={LIST} committed={{}} onSearch={vi.fn()} />);

    expect(barOf(container).dataset.locked).toBe('false');

    fireEvent.click(screen.getByTitle('固定展开'));

    expect(barOf(container).dataset.locked).toBe('true');
  });

  it('限高按实际行数算: 四项里有一项占两列, 三列下排成两行', () => {
    const { container } = render(
      <QueryBar list={LIST} committed={{}} columnNum={4} onSearch={vi.fn()} />,
    );

    // 用例环境是 1024px, 落在 md/lg 那档 —— 声明四列也只排得下三列, 保底 8 格
    expect(barOf(container).style.getPropertyValue('--query-bar-rows')).toBe('2');
  });

  it('窄屏接下 RowLayout 的断点: 列数变少行数变多, 行高也随 label 换行变高', () => {
    const { container: wide } = render(
      <QueryBar list={LIST} committed={{}} columnNum={4} onSearch={vi.fn()} />,
    );

    // 视口宽度是用例可以改的环境事实, setup 里每条用例后还原. 断点在挂载时取一次, 所以要改在渲染前
    window.innerWidth = 600;

    const { container: narrow } = render(
      <QueryBar list={LIST} committed={{}} columnNum={4} onSearch={vi.fn()} />,
    );

    // 600px 落在 sm 那档: 半行一格, 于是两列 —— 四项排成三行, 占两列的那项挤不进第二行
    expect(barOf(narrow).style.getPropertyValue('--query-bar-rows')).toBe('3');
    // label 移到控件上方, 一行占的像素随之变高
    expect(rowHeightOf(narrow)).toBeGreaterThan(rowHeightOf(wide));
  });

  it('不传档位就没有行数下拉, 条件区恒为全行', () => {
    render(<QueryBar list={LIST} committed={{}} onSearch={vi.fn()} />);

    expect(screen.queryByTitle('展开几行')).toBeNull();
  });

  it('选了档位就按行收窄, 底栏标出折叠掉几个条件; 点展开回到全行', async () => {
    const { container } = render(
      <QueryBar list={LIST} committed={{}} columnNum={4} rowOptions={[1]} onSearch={vi.fn()} />,
    );

    fireEvent.click(screen.getByTitle('展开几行'));
    fireEvent.click(await screen.findByText('1 行'));

    expect(barOf(container).style.getPropertyValue('--query-bar-rows')).toBe('1');
    // 数的是条件不是行: 读者关心还有几个条件没看见
    expect(screen.getByText(/还有 1 个条件/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /展开/ }));

    expect(barOf(container).style.getPropertyValue('--query-bar-rows')).toBe('2');
    expect(screen.queryByText(/还有/)).toBeNull();
  });
});
