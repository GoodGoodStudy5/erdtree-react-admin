/**
 * BaseTable 列的类型测试. 它既是规格也是门禁 —— 改契约先改这里, 再改实现.
 *
 * 负向用例靠 @ts-expect-error 断言: 若某条本该报错却没报, tsc 会以
 * TS2578 "Unused '@ts-expect-error' directive" 失败, 所以本文件通过即代表全部用例成立.
 *
 * 边界: dataIndex **不**受 T 约束 —— antd 转手 rc-table 之后它就是宽字符串, 字段名写错不会报.
 * 泛型换来的是 render 里 record 的推导, 不是列与 record 的双向对齐.
 */
import type { TableColumn } from '#/public';
import { BaseTable } from '../BaseTable';

/** 断言实参可赋给 T. 类型不符则编译期报错 */
declare function expectType<T>(value: T): void;

interface Bill {
  billNo: string;
  amount: number;
}

// ── record 按 dataSource 推导 ────────────────────────────────
// 泛型的全部价值在这里: 调用点不写 record as 也拿得到字段

function record按数据源推导() {
  return (
    <BaseTable
      columns={[
        {
          title: '单号',
          dataIndex: 'billNo',
          render: (_value, record) => {
            expectType<string>(record.billNo);
            expectType<number>(record.amount);
            // @ts-expect-error 数据源上没有的字段要当场报, 不静默取到 undefined
            expectType<unknown>(record.压根不存在);
            return record.billNo;
          },
        },
      ]}
      dataSource={[] as Bill[]}
    />
  );
}

// ── 不带泛型的存量调用点仍合法 ───────────────────────────────
// TableColumn[] 即 TableColumn<object>[], 这次改动不要求任何调用点跟着改

function 存量调用点不受影响() {
  const columns: TableColumn[] = [{ title: '单号', dataIndex: 'billNo' }];

  return <BaseTable columns={columns} dataSource={[{ billNo: 'AP001' }]} />;
}

export { record按数据源推导, 存量调用点不受影响 };
