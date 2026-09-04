import type { BaseFormData, BaseSearchList } from '#/form';
import type { FormInstance } from 'antd';
import type { RowLayoutColumnNum } from '@south/components';
import type { CSSProperties } from 'react';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { columnCountAt, RowLayout, useEvent } from '@south/components';
import { Button, Form, Grid, theme } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QueryChips } from './QueryChips';
import { QueryField } from './QueryField';
import { syncKeys } from './formValue';
import { QueryPill } from './QueryPill';
import { countBeyond, planRows } from './rowPlan';
import './index.less';

/**
 * 栅格的行距. 显式给而不吃 RowLayout 的默认值: 露几行是按像素限高的, 行距与限高必须同源,
 * 各拿各的一份就会在 RowLayout 改默认值那天悄悄切错位置.
 */
const ROW_GUTTER = 16;

interface Props {
  /** 搜索项定义, 声明顺序就是排布顺序 */
  list: BaseSearchList[];
  /** 已提交的查询条件. 变了会按项同步进表单, 见 syncKeys */
  committed: BaseFormData;
  /**
   * 表单实例. 不给就自己造一个.
   *
   * `SearchTable` 会把它接过去, 好让 ref 的 `getDraft` 读得到实时值 —— draft 只住在这个实例里.
   * 留缺省是为了让搜索栏能单独用, 用例也不必为它包一层组件.
   */
  form?: FormInstance;
  /** 取数中 */
  isLoading?: boolean;
  /** 一行几列, 透传 RowLayout; 断点不给配 */
  columnNum?: RowLayoutColumnNum;
  /** 行数档位; 不传则没有行数下拉, 条件区恒为全行 */
  rowOptions?: number[];
  /** 摘要行吸在标签栏底下. 锁定后自动退出, 见下方 data-sticky */
  isSticky?: boolean;
  /** 点搜索 */
  onSearch: (values: BaseFormData) => void;
}

/**
 * 两层收放的搜索栏: 平时只有一条只读摘要, 鼠标进来才出条件区.
 *
 * 第一层 (条件区出不出现) 归 `:hover` / `:focus-within` 与锁, 第二层 (露几行) 归行数档位与展开按钮,
 * 两层都由 class 与 CSS 变量驱动 —— JS 只在点锁, 选档位, 点展开时各写一次状态, 不测高度也不重渲染字段.
 *
 * 未锁定时条件区是浮层, 盖住表格顶部而表格不动; 锁定后改回正常占位, 表格被推下去 —— 长期展开就该
 * 让表格让位, 而不是一直被挡.
 *
 * 认下的代价: hover 对触屏无效 (那里只剩点锁一条路); 限高按像素算, 行高一变 (校验报错文字出现,
 * label 折行) 露出的行数就不准; 摘要只读, 改一个已填条件要先进条件区.
 * @param props - 组件参数
 */
export function QueryBar(props: Props) {
  const { list, committed, isLoading, columnNum = 4, rowOptions, isSticky, onSearch } = props;
  const [ownForm] = Form.useForm();
  const form = props.form ?? ownForm;
  const { token } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const barRef = useRef<HTMLDivElement>(null);
  const [locked, setLocked] = useState(false);
  const [rows, setRows] = useState<number | 'all'>('all');
  // 上一次同步用的已提交条件. 逐项比它才知道这次哪几项真的变了
  const syncedRef = useRef<BaseFormData>({});

  // 断点决定一行几列, 列数决定十几项占几行 —— 换断点与换列数时各算一次, 不在每帧
  const columnCount = columnCountAt(columnNum, screens);
  const plan = useMemo(
    () =>
      planRows(
        list.map((item) => item.colSize ?? 1),
        columnCount,
      ),
    [list, columnCount],
  );
  // 窄屏 label 移到控件上方. 判 === false 而不是取反: 首帧还没订阅上断点, 那时按桌面算
  const stacked = screens.md === false;
  const visibleRows = rows === 'all' ? plan.total : Math.min(rows, plan.total);
  const foldedCount = countBeyond(plan, visibleRows);
  // 档位由页面给, 不由组件按断点推: 推出来的档位数随屏宽变, 同一个页面在两台机器上下拉长度不同.
  // 比总行数还大的档位与「全部」重合, 去掉
  const options = useMemo(
    () =>
      [...new Set(rowOptions ?? [])]
        .filter((one) => one > 0 && one < plan.total)
        .sort((a, b) => a - b),
    [rowOptions, plan.total],
  );

  /**
   * 一行的像素高度 = 控件高 + 行距, 窄屏再加 label 自己那一行.
   *
   * 露 N 行的限高取 N 倍它, 正好落在第 N + 1 行的顶端; 「全部」那一档因此多出一个行距的余量,
   * 那是余量不是虚高, 展开照样是滑开的.
   */
  const rowHeight =
    token.controlHeight +
    ROW_GUTTER +
    (stacked ? Math.round(token.fontSize * token.lineHeight) + token.paddingXS : 0);

  /**
   * 已提交条件写回表单.
   *
   * 两个触发点共用它: 下面那个 effect (哪几项要写由 `syncKeys` 算), 与摘要上撤回一枚已移除的 chip
   * (指名写那一项). 一处实现两处调, 归一与回环防护才不会只在一处对.
   *
   * 身份恒定是为了能进 effect 的依赖数组而不每帧重跑.
   * @param next - 这一次的已提交条件
   * @param names - 指名要写的项. 不给则由 `syncKeys` 算
   */
  const syncToForm = useEvent((next: BaseFormData, names?: string[]) => {
    const changed = names ?? syncKeys(syncedRef.current, next, (name) => form.getFieldValue(name));

    syncedRef.current = next;
    if (!changed.length) return;
    form.setFieldsValue(Object.fromEntries(changed.map((name) => [name, next[name]])));
  });

  useEffect(() => {
    syncToForm(committed);
  }, [committed, syncToForm]);

  /** 提交: 交出表单原值. 转换是出口层的事, 由 SearchTable 在条件出门时做一次 */
  const onFinish = (values: BaseFormData) => {
    onSearch(values);
  };

  /** 重置: 清空并立刻按空条件重查 */
  const onReset = () => {
    form.resetFields();
    form.submit();
  };

  /**
   * 吸哪条边.
   *
   * 吸的只是摘要行那一条, 锁不锁都吸 —— 锁定改变的是条件区在不在文档流里, 不改变「滚动时要看得见
   * 已选条件」这件事. 锁定后条件区渲染成本元素的兄弟而不是后代, 它才不会把摘要行撑高一起钉住.
   */
  const stickyEdge = isSticky ? 'top' : undefined;

  /**
   * 条件区. 两种在场方式共用一份: 未锁定时是本元素内的浮层, 锁定后是它外面的常驻块.
   */
  const panel = (
    <div className={`query-bar-panel ${locked ? 'is-locked' : ''}`}>
      {/* 限高只压在栅格上: 压在浮层根节点上会把下面的底栏一起切掉 */}
      <div className="query-bar-grid">
        <RowLayout columnNum={columnNum} gutter={[ROW_GUTTER, ROW_GUTTER]}>
          {list.map((item) => (
            <QueryField
              key={String(item.name)}
              item={item}
              form={form}
              colProps={{ colSize: item.colSize }}
            />
          ))}
        </RowLayout>
      </div>

      {!!foldedCount && (
        <div className="query-bar-foot">
          <Button type="link" onClick={() => setRows('all')}>
            展开 (还有 {foldedCount} 个条件)
          </Button>
        </div>
      )}
    </div>
  );

  return (
    // 状态与变量挂在这一层: 它不生成盒子 (见 index.less), 摘要行与锁定后的条件区都从这里取值
    <Form
      form={form}
      data-locked={locked}
      className="query-bar-form"
      style={
        {
          '--query-bar-rows': visibleRows,
          '--query-bar-row-h': `${rowHeight}px`,
          '--query-bar-shadow': token.boxShadowSecondary,
          '--query-bar-split': token.colorSplit,
          '--query-bar-hover-bg': token.colorFillTertiary,
          '--query-bar-active-fg': token.colorPrimary,
          '--query-bar-active-bg': token.colorPrimaryBg,
        } as CSSProperties
      }
      autoComplete="off"
      layout={stacked ? 'vertical' : 'horizontal'}
      labelCol={stacked ? undefined : { flex: '0 0 var(--query-bar-label-w)' }}
      wrapperCol={stacked ? undefined : { flex: '1 1 0' }}
      onFinish={onFinish}
    >
      <div
        ref={barRef}
        data-sticky={stickyEdge}
        className={`query-bar ${locked ? 'is-locked' : ''}`}
      >
        <div className="query-bar-summary">
          <QueryChips
            list={list}
            form={form}
            committed={committed}
            onRestore={(name) => syncToForm(committed, [name])}
          />

          <span className="query-bar-spacer" />

          <QueryPill
            locked={locked}
            rows={rows}
            options={options}
            totalRows={plan.total}
            getPopupContainer={() => barRef.current as HTMLElement}
            onLockedChange={setLocked}
            onRowsChange={setRows}
          />

          <Button type="primary" htmlType="submit" loading={isLoading} icon={<SearchOutlined />}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            重置
          </Button>
        </div>

        {!locked && panel}
      </div>

      {locked && panel}
    </Form>
  );
}
