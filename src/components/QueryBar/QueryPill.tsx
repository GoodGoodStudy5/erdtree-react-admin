import type { MenuProps } from 'antd';
import { CheckOutlined, DownOutlined, LockFilled, UnlockOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { useState } from 'react';

/** 「全部」这一档的键 */
const ALL = 'all';

interface Props {
  /** 是否固定展开 */
  locked: boolean;
  /** 当前露几行 */
  rows: number | typeof ALL;
  /** 可折叠到的行数档位, 由页面给; 空数组表示不出行数这一半 */
  foldRows: number[];
  /** 全行是几行 */
  totalRows: number;
  /** 切换固定展开 */
  onLockedChange: (next: boolean) => void;
  /** 改露几行 */
  onRowsChange: (next: number | typeof ALL) => void;
  /** 下拉挂在哪. 挂到 body 上鼠标一进下拉就算移出搜索栏, 条件区会当场收起 */
  getPopupContainer: () => HTMLElement;
}

/**
 * 摘要行右侧的胶囊: 左半是锁, 右半是行数.
 *
 * 锁管第一层 (条件区出不出现), 行数管第二层 (露几行), 两者都是状态而非 hover 的派生量.
 * @param props - 组件参数
 */
export function QueryPill(props: Props) {
  const { locked, rows, foldRows, totalRows, onLockedChange, onRowsChange, getPopupContainer } =
    props;
  const [open, setOpen] = useState(false);

  /** 打勾标出当前档 */
  const itemOf = (
    key: number | typeof ALL,
    text: string,
  ): NonNullable<MenuProps['items']>[number] => ({
    key: String(key),
    label: (
      <span className="query-bar-rows-item">
        <span>{text}</span>
        {rows === key && <CheckOutlined />}
      </span>
    ),
  });

  const onSelect: MenuProps['onClick'] = ({ key }) => {
    onRowsChange(key === ALL ? ALL : Number(key));
    setOpen(false);
  };

  return (
    <div className="query-bar-pill">
      <button
        type="button"
        aria-pressed={locked}
        title={locked ? '已固定展开, 点击解除' : '固定展开'}
        className={locked ? 'query-bar-pill-btn is-on' : 'query-bar-pill-btn'}
        onClick={() => onLockedChange(!locked)}
      >
        {locked ? <LockFilled /> : <UnlockOutlined />}
      </button>

      {!!foldRows.length && (
        <>
          <span className="query-bar-pill-divider" />
          <Dropdown
            open={open}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={getPopupContainer}
            menu={{
              onClick: onSelect,
              items: [
                itemOf(ALL, `全部 ${totalRows} 行`),
                ...foldRows.map((one) => itemOf(one, `${one} 行`)),
              ],
            }}
            onOpenChange={setOpen}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              title="展开几行"
              className={open ? 'query-bar-pill-btn is-on' : 'query-bar-pill-btn'}
            >
              <span className="query-bar-pill-rows">{rows === ALL ? '全行' : `${rows} 行`}</span>
              <DownOutlined className="query-bar-pill-caret" />
            </button>
          </Dropdown>
        </>
      )}
    </div>
  );
}
