import type { ChangeEvent, ClipboardEvent, CSSProperties, KeyboardEvent } from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { LoadButton } from '@south/components';
import { strUtils } from '@south/utils';
import { Input } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { itemsOf, settledOf, textOf } from './valueText';
import './index.less';

/** 面板底边至少离视口底这么远 (px): 盖住整屏时人就看不出自己筛的是哪张表了 */
const PANEL_BOTTOM_GAP = 100;

/** 多值文本框的参数 */
export interface MultiTextInputProps {
  /** 当前的多个值 */
  value?: string[];
  /** 占位符 */
  placeholder?: string;
  /** 可清空 */
  allowClear?: boolean;
  /** 值变了 */
  onChange?: (value: string[]) => void;
  /** 回车. 结算完尾巴才调, 于是搜索栏拿去提交时收到的是完整的那份 */
  onPressEnter?: (e: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * 多值文本框: 粘贴一段文本当场切成多个条件, 而框里始终是纯文本.
 *
 * 不渲染成标签是与多选下拉的分界 —— 标签会把一格撑成几行高, 而条件区只有那么高.
 * 认下的代价: 粘进来的排版不保留, 删掉一条后框里的文本是重拼的.
 * @param props - 组件参数
 */
export function MultiTextInput(props: MultiTextInputProps) {
  const { value, placeholder, allowClear = true, onChange, onPressEnter } = props;
  const [text, setText] = useState(() => textOf(value));
  const [isOpen, setIsOpen] = useState(false);
  const [room, setRoom] = useState<number>();
  const wrapRef = useRef<HTMLDivElement>(null);
  // 自己最后交出去的那份. 外部值回来时靠它认出「这是我刚说的」还是「别人改的」.
  // 记成状态而不是 ref: 下面那道比对发生在渲染期, 而 ref 在渲染期读不得
  const [emitted, setEmitted] = useState<string[]>(value ?? []);

  const items = useMemo(() => itemsOf(text), [text]);

  /**
   * 外部值变了才改写框里的文本.
   *
   * 逐字比对而不是认引用: 每次渲染都是新数组. 少了这道比对, 自己交出去的值绕一圈回来会把用户
   * 正打着的那半截尾巴冲掉 —— 尾巴按定义还没进值.
   */
  if (textOf(value) !== textOf(emitted)) {
    setEmitted(value ?? []);
    setText(textOf(value));
  }

  /**
   * 交出新的一份值. 与上次交出去的逐字相同就不交 —— 打字时每敲一下都喊一次, 页面会跟着重筛.
   * @param next - 这次的值
   */
  const emit = (next: string[]) => {
    if (textOf(next) === textOf(emitted)) return;

    setEmitted(next);
    onChange?.(next);
  };

  /** 展开面板, 顺手量一次它还剩多少地方可长. 只量这一次: 展开期间滚页面会让这个数偏大, 不至于越界 */
  const open = () => {
    const rect = wrapRef.current?.getBoundingClientRect();

    setRoom(rect && window.innerHeight - rect.bottom - PANEL_BOTTOM_GAP);
    setIsOpen(true);
  };

  /**
   * 把没跟分隔符的那截尾巴也算进去.
   *
   * 点搜索按钮走的也是失焦这条路 —— 按下去先失焦, 再轮到按钮的 click, 于是提交读到的是结算后的值.
   */
  const settle = () => {
    const all = itemsOf(text);

    setText(textOf(all));
    emit(all);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    emit(settledOf(e.target.value));
  };

  /** 自己接管插入: 切分后的文本与用户粘的那串并不一样, 且要插在光标处 —— 粘之前多半刚打完上一个号 */
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const el = e.currentTarget;
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? start;
    const merged = `${text.slice(0, start)}${e.clipboardData.getData('text')}${text.slice(end)}`;
    const all = strUtils.strSplitForValues(merged);

    setText(textOf(all));
    emit(all);
    open();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    settle();
    onPressEnter?.(e);
  };

  /**
   * 删掉一条. 按下标删而不是按值删 —— 重复的值原样留着, 按值删会一次删掉两条.
   * @param index - 第几条
   */
  const remove = (index: number) => {
    const rest = items.filter((_, one) => one !== index);

    setText(textOf(rest));
    emit(rest);
  };

  return (
    <div ref={wrapRef} className="multi-text-input">
      <Input
        value={text}
        placeholder={placeholder}
        allowClear={allowClear}
        suffix={
          items.length ? <span className="multi-text-input-count">{items.length}</span> : null
        }
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onFocus={open}
        onBlur={() => {
          settle();
          setIsOpen(false);
        }}
      />
      {isOpen && items.length > 0 && (
        <div
          className="multi-text-input-panel"
          style={{ '--multi-text-input-room': room && `${room}px` } as CSSProperties}
          // 点面板不该让框失焦: 失焦会先收起面板, 那一下点击就落空了
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="multi-text-input-head">共 {items.length} 个</div>
          <ul className="multi-text-input-list">
            {items.map((item, index) => (
              // 重复的值合法, 所以 key 只能带上位置
              <li key={`${index}-${item}`} className="multi-text-input-item">
                <span className="multi-text-input-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="multi-text-input-item-text">{item}</span>
                <LoadButton
                  aria-label={`删除 ${item}`}
                  icon={<CloseOutlined />}
                  onClick={() => remove(index)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
