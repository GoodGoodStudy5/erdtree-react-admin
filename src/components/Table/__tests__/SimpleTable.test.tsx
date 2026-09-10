import type { SimpleColumn } from '../SimpleTable';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimpleTable } from '../SimpleTable';

/** 一条 SKU: 用真实形状, 密排小表的格子基本都是拼出来的 */
interface Row {
  skuCode: string;
  supplier: string;
  ratio: number;
}

const ROWS: Row[] = [
  { skuCode: 'CD000NAN0585', supplier: '', ratio: 1 },
  { skuCode: 'CD000NAN0584', supplier: '安徽菲雷克斯物流装备制造有限公司', ratio: 1 },
];

const SKU_COLUMN: SimpleColumn<Row> = { title: '库存编码', render: (row) => row.skuCode };

/** 两种渲染形态跑同一组断言: 换掉形态而对外行为不变, 是这次改动唯一要证明的事 */
const MODES = [
  { name: '原生', isNative: true },
  { name: 'antd', isNative: false },
];

describe.each(MODES)('SimpleTable 的 $name 形态', ({ isNative }) => {
  it('列没有 dataIndex 也渲染得出: antd 那条路的列筛选按 dataIndex 取键, 取不到会返回空列表', () => {
    render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[
          { title: '库存编码', render: (row) => <b>{row.skuCode}</b> },
          { title: '关系表供应商', render: (row) => row.supplier },
        ]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
      />,
    );

    expect(screen.getByText('CD000NAN0585')).toBeTruthy();
    expect(screen.getByText('安徽菲雷克斯物流装备制造有限公司')).toBeTruthy();
  });

  it('right 的列右对齐', () => {
    render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[{ title: '占比', right: true, render: (row) => `${row.ratio * 100}%` }]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
      />,
    );

    // 从文字回溯到格子: antd 那条路会多渲一行隐藏的测量行, 按 `tbody td` 数会把它算进来
    const cells = screen.getAllByText('100%').map((node) => node.closest('td'));
    expect(cells.length).toBe(2);
    expect(cells.every((cell) => cell?.style.textAlign === 'right')).toBe(true);
  });

  it('render 给不出值时落到全站的空占位符', () => {
    render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[{ title: '报关品名', render: () => undefined }]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
      />,
    );

    expect(screen.getAllByText('-').length).toBe(2);
  });

  it('rowClassName 的返回值出现在行上', () => {
    render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
        rowClassName={(row) => (row.supplier ? 'has-supplier' : 'no-supplier')}
      />,
    );

    expect(screen.getByText('CD000NAN0585').closest('tr')?.className).toContain('no-supplier');
    expect(screen.getByText('CD000NAN0584').closest('tr')?.className).toContain('has-supplier');
  });

  it('onRow 给的 style 出现在行上', () => {
    render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
        onRow={() => ({ style: { backgroundColor: 'rgb(255, 247, 230)' } })}
      />,
    );

    const row = screen.getByText('CD000NAN0585').closest('tr');
    expect(row?.style.backgroundColor).toBe('rgb(255, 247, 230)');
  });

  it('无行时写出 locale.emptyText, 不留一张空表头', () => {
    render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[SKU_COLUMN]}
        rows={[]}
        rowKey={(row) => row.skuCode}
        locale={{ emptyText: '这个组里一张单都没有' }}
      />,
    );

    expect(screen.getByText('这个组里一张单都没有')).toBeTruthy();
  });

  it('showHeader 为假时不渲染表头', () => {
    const { container } = render(
      <SimpleTable<Row>
        isNative={isNative}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
        showHeader={false}
      />,
    );

    expect(container.querySelector('thead')).toBeNull();
  });
});

/** 四个观感开关只对 antd 那条路有意义: 原生形态的观感恒等于「素色 + 行分隔线」 */
describe('SimpleTable 的 antd 形态', () => {
  it('缺省素色, 传 isPlain 为假才回到 antd 的底色', () => {
    const plain = render(
      <SimpleTable<Row>
        isNative={false}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
      />,
    );
    expect(plain.container.querySelector('.simple-table.is-plain')).toBeTruthy();
    plain.unmount();

    const solid = render(
      <SimpleTable<Row>
        isNative={false}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
        isPlain={false}
      />,
    );
    expect(solid.container.querySelector('.is-plain')).toBeNull();
  });

  it('壳里定死的开关调用点压得过: 缺省不开斑马线, 传 isZebra 就开', () => {
    const plain = render(
      <SimpleTable<Row>
        isNative={false}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
      />,
    );
    expect(plain.container.querySelector('.zebra')).toBeNull();
    plain.unmount();

    const zebra = render(
      <SimpleTable<Row>
        isNative={false}
        columns={[SKU_COLUMN]}
        rows={ROWS}
        rowKey={(row) => row.skuCode}
        isZebra
      />,
    );
    expect(zebra.container.querySelector('.zebra')).toBeTruthy();
  });
});
