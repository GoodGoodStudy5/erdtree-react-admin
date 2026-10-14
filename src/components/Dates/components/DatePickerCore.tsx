import type { Dayjs } from 'dayjs';
import type { InputEvent as ReactInputEvent, ReactNode } from 'react';
import type { AllowEmpty, DateKind, InnerValue, OuterValue } from '../utils/dateManager';
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createDateManager } from '../utils/dateManager';

/** 四个壳对外共有的那几项. 值恒是 string; dayjs 只为兼容老写法, 进门即转 */
export interface DateFieldProps<V> {
  /** 外部持有的值 */
  value?: V | null;
  /** 出门的值, 恒是 string */
  onChange?: (value: OuterValue) => void;
  /** 显示格式, 也是出门格式: 挂载时定死 */
  format?: string | string[];
  /** 按整天出门, 起 00:00:00 止 23:59:59: 缺省关 */
  wholeDay?: boolean;
}

/** 区间两个壳收的值: 两端各自可空 */
export type RangeFieldValue = [
  string | Dayjs | null | undefined,
  string | Dayjs | null | undefined,
];

/** 交给壳去喂 antd 的那几样 */
export interface DatePickerBinding {
  /** 单值形态的值 */
  single: Dayjs | null;
  /** 区间形态的值 */
  range: [Dayjs | null, Dayjs | null] | null;
  /** 给 antd 的 format: 第一个是显示格式, 其余是框里还认的写法 */
  formats: string[];
  /** 接 antd 的 onChange */
  onChange: (value: InnerValue) => void;
}

interface Props extends DateFieldProps<unknown> {
  /** 形态, 挂载时定死 */
  kind: DateKind;
  /** 区间每一端许不许空, 与给 antd 的同一份 */
  allowEmpty?: AllowEmpty;
  /** 壳自己渲染 antd 那一件: 各形态的 props 类型各归各, 这一层只管接线 */
  children: (binding: DatePickerBinding) => ReactNode;
}

/**
 * antd 只在失焦 / 回车时提交, 删光与粘贴等不到那一刻: 删光的框失焦被填回上一份, 粘贴只改面板不出门.
 */
function typedText(event: ReactInputEvent<HTMLDivElement>) {
  const { target, nativeEvent } = event;
  if (!(target instanceof HTMLInputElement)) return;
  const position = Array.from(event.currentTarget.querySelectorAll('input')).indexOf(target);
  if (position !== 0 && position !== 1) return;
  const index: 0 | 1 = position === 0 ? 0 : 1;
  // 逐字打仍等失焦: 半截字不是日期
  const now = target.value === '' || nativeEvent.inputType === 'insertFromPaste';
  return { text: target.value, index, now };
}

/**
 * 四个日期壳共用的接线: 建 manager, 订阅快照, 把 antd 的 onChange 与框里的 input 接给它.
 */
export function DatePickerCore(props: Props) {
  const { kind, value = null, wholeDay = false, allowEmpty = false, onChange, children } = props;
  const format = Array.isArray(props.format) ? props.format[0] : props.format;
  const [mgr] = useState(() => createDateManager({ kind, format, wholeDay }));
  const snap = useSyncExternalStore(mgr.subscribe, mgr.snapshot);
  // 只记打进去的字, 不记框里当下的: 面板随后改的那份仍归 antd 的确定按钮
  const typedEnds = useRef(new Map<0 | 1, string>());

  // layout effect 按声明顺序跑: 出门回调先接上, 下面同步外部值时的回写才送得出去
  useLayoutEffect(() => mgr.listen(onChange), [mgr, onChange]);
  // 外部值在绘制前同步进来, 否则框里会闪一帧旧值
  useLayoutEffect(() => mgr.setOuter(value), [mgr, value]);
  useLayoutEffect(() => mgr.setWholeDay(wholeDay), [mgr, wholeDay]);
  useLayoutEffect(() => mgr.setAllowEmpty(allowEmpty), [mgr, allowEmpty]);

  const { inner, formats } = snap;
  const binding: DatePickerBinding = {
    single: inner && !Array.isArray(inner) ? inner : null,
    range: Array.isArray(inner) && (inner[0] || inner[1]) ? inner : null,
    formats,
    onChange: (next) => mgr.onAntdChange(next),
  };

  return (
    // picker 根节点只透传鼠标事件, 收 input 得在外面包一层
    <div
      // contents: 这层不进排版, 表单里 .ant-picker 的宽度规则照旧
      className="contents"
      onInput={(event) => {
        const typed = typedText(event);
        if (!typed) return;
        // 记下这一端当下的字: 失焦时只认打进去的那份, 面板随后改的不归这里
        typedEnds.current.set(typed.index, typed.text);
        if (typed.now) mgr.commitText(typed.text, typed.index);
      }}
      // antd 的区间要两端都经手过才出门: 只改一端就失焦, 框里换了字, 值却没送出去
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        typedEnds.current.forEach((text, index) => mgr.commitText(text, index));
        typedEnds.current.clear();
      }}
    >
      {children(binding)}
    </div>
  );
}
