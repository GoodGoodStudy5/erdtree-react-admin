import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { BaseTable } from '../BaseTable';
import { $t } from '@/locales';

describe('BaseTable', () => {
  it('没有自定义 render 的列显示原值', () => {
    render(
      <BaseTable
        columns={[{ title: '发票号码', dataIndex: 'invoiceNo', width: 200 }]}
        dataSource={[{ invoiceNo: '25600001' }]}
      />,
    );

    expect(screen.getByText('25600001')).toBeTruthy();
  });

  it('enum 列按码值显示标签', () => {
    // 列定义提成变量: enum 是本工程给 TableColumn 加的字段, 内联字面量会被 antd 的列类型判为多余属性
    const columns: TableColumn[] = [
      {
        title: '票种',
        dataIndex: 'invoiceKind',
        width: 200,
        enum: [
          { label: '增值税专用发票', value: 'SPECIAL' },
          { label: '增值税普通发票', value: 'GENERAL' },
        ],
      },
    ];

    render(<BaseTable columns={columns} dataSource={[{ invoiceKind: 'SPECIAL' }]} />);

    expect(screen.getByText('增值税专用发票')).toBeTruthy();
  });

  it('空值显示占位符', () => {
    render(
      <BaseTable
        columns={[{ title: '开票人', dataIndex: 'drawer', width: 200 }]}
        dataSource={[{ drawer: null }]}
      />,
    );

    expect(screen.getByText('-')).toBeTruthy();
  });

  it('列设置面板的勾选要点确认才作用到表格', () => {
    render(
      <BaseTable
        columns={[
          { title: '发票号码', dataIndex: 'invoiceNo' },
          { title: '开票人', dataIndex: 'drawer' },
        ]}
        dataSource={[{ invoiceNo: '25600001', drawer: '张三' }]}
      />,
    );

    // 按钮文案取自 $t 而非写死中文: 用例环境没设语言, i18n 由 navigator.language 落到英文档
    // 无障碍名里图标名在前 (如 "setting Column filter"), 所以用正则匹配而非全等
    fireEvent.click(screen.getByRole('button', { name: RegExp($t('public.columnFilter')) }));
    fireEvent.click(screen.getByRole('checkbox', { name: '开票人' }));

    // 未确认: 表格照旧显示开票人列
    expect(screen.getByText('张三')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: RegExp($t('public.confirm')) }));

    expect(screen.queryByText('张三')).toBeNull();
  });

  it('取消按钮只在有未确认改动时出现, 点它撤回勾选', () => {
    render(
      <BaseTable
        columns={[
          { title: '发票号码', dataIndex: 'invoiceNo' },
          { title: '开票人', dataIndex: 'drawer' },
        ]}
        dataSource={[{ invoiceNo: '25600001', drawer: '张三' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: RegExp($t('public.columnFilter')) }));
    const cancelName = RegExp($t('public.cancel'));

    // 什么都没动: 不给取消按钮
    expect(screen.queryByRole('button', { name: cancelName })).toBeNull();

    const drawer = screen.getByRole('checkbox', { name: '开票人' }) as HTMLInputElement;
    fireEvent.click(drawer);
    expect(drawer.checked).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: cancelName }));

    expect(drawer.checked).toBe(true);
    expect(screen.queryByRole('button', { name: cancelName })).toBeNull();
  });
});
