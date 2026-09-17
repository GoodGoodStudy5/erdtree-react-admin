import type { BaseFormData, BaseSearchList } from '#/form';
import type { FormInstance } from 'antd';
import { UndoOutlined } from '@ant-design/icons';
import { Form, Tag, Tooltip } from 'antd';
import { chipPartsOf } from './chipText';
import { isBlank, isBlankEqual } from './formValue';

/**
 * 一枚 chip 的三态.
 *
 * `removed` 是「已提交过, 但用户刚把它清掉且还没搜」—— 表单里已经没有它了, 而它仍在生效.
 * 不给它一枚 chip 的话, 用户清掉之后屏幕上什么都不剩, 而条件还在筛着数据.
 */
type ChipState = 'applied' | 'pending' | 'removed';

interface Props {
  /** 搜索项定义 */
  list: BaseSearchList[];
  /** 表单实例 */
  form: FormInstance;
  /** 已提交的查询条件 */
  committed: BaseFormData;
  /** 撤回一项的移除: 把已提交的那份值写回表单 */
  onRestore: (name: string) => void;
}

/**
 * 摘要行上的只读 chips: 与已提交条件有关的各一枚, 从没填过的收成一枚计数.
 *
 * 单独成组件是因为它订阅了全表单的值 —— 每次击键都要重渲染的只有这里, 条件区里的十几个控件不动.
 * chip 只显示与整项清除, 不承载输入控件: 控件全仓只渲染一套 (在条件区里), 否则同一个 name 会被
 * antd Form 渲染两次.
 *
 * 两个色: 已生效沿用 processing, 未提交的改动 (含已移除) 用 warning —— 与列设置面板里「勾了没点
 * 确认」是同一个语义同一个色, 用户只学一遍. 第三态靠划线与撤回图标区分, 不引入第三个色.
 * @param props - 组件参数
 */
export function QueryChips(props: Props) {
  const { list, form, committed, onRestore } = props;
  // 只订阅不取值: 值仍从 form 读, 免得字段名的解析口径与 antd 分家
  Form.useWatch([], form);

  const chips = list
    .map((item) => {
      const name = String(item.name);
      const draft = form.getFieldValue(item.name);
      const applied = committed[name];
      // 表单里空了但条件还在生效 —— 判据是「已提交值里有没有这一项」, 不是「chip 现在有没有值」.
      // 从没提交过的项被清掉时因此直接消失, 不划线
      const state: ChipState = isBlank(draft)
        ? 'removed'
        : isBlankEqual(draft, applied)
          ? 'applied'
          : 'pending';
      // 划线的那枚显已提交的那份值 —— 被划掉的正是它, 表单值这会儿是空的
      const parts = chipPartsOf(item, state === 'removed' ? applied : draft);

      return { item, name, state, parts };
    })
    .filter((one) => one.parts !== null);

  // 已移除的项自己有一枚划线 chip, 再进计数就是同一项数两遍
  const restCount = list.length - chips.length;

  return (
    <>
      {chips.map(({ item, name, state, parts }) => (
        <Tag
          key={name}
          closable
          color={state === 'applied' ? 'processing' : 'warning'}
          closeIcon={state === 'removed' ? <UndoOutlined /> : undefined}
          className="query-bar-chip"
          onClose={(e) => {
            // 拦掉 Tag 自己的隐藏: chip 的去留只看值, 由它自己藏起来会与值脱节.
            // 两个动作都只改表单不发请求 —— 发请求只有搜索, 重置与回车三条路
            e.preventDefault();
            if (state === 'removed') onRestore(name);
            else form.setFieldValue(item.name, undefined);
          }}
        >
          {/* 全量值挂在 hover 上: 截断之后「是哪几个」只剩这一条路, 条件区要先把浮层唤出来 */}
          <Tooltip
            title={parts?.items.map((one) => (
              <div key={one}>{one}</div>
            ))}
          >
            <span
              className={
                state === 'removed' ? 'query-bar-chip-body is-removed' : 'query-bar-chip-body'
              }
            >
              <span>{item.label}: </span>
              {/* 只有这一段会被省略号截: 字段名与计数在它两侧, 各自不参与截断 */}
              <span className="query-bar-chip-values">{parts?.items.join(', ')}</span>
              {!!parts?.isMulti && (
                <span className="query-bar-chip-count">{parts.items.length} 项</span>
              )}
            </span>
          </Tooltip>
        </Tag>
      ))}

      {!chips.length && <Tag className="query-bar-chip">未设任何条件, 共 {list.length} 项可用</Tag>}
      {!!chips.length && !!restCount && <Tag className="query-bar-chip">另 {restCount} 项未填</Tag>}
    </>
  );
}
