import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DATE_FORMAT, TIME_PICKER_FORMAT } from '@/utils';

// 严格解析靠这个插件. antd 的 picker 加载时也会装, 但不能指望它先到 —— 用例里没有 antd
dayjs.extend(customParseFormat);

/** 形态: 两根轴的乘积, 日 / 时 × 单值 / 区间 */
export type DateKind = 'date' | 'dateRange' | 'time' | 'timeRange';

/** 对外的值, 恒是 string. 区间两端各自可空, 空端是 null 不是现在 */
export type OuterValue = string | [string | null, string | null] | null;

/** 喂给 antd 的值 */
export type InnerValue = Dayjs | [Dayjs | null, Dayjs | null] | null;

/** 区间每一端许不许空, 与 antd RangePicker 的 allowEmpty 同形 */
export type AllowEmpty = boolean | [boolean, boolean];

/** 出门回调 */
export type DateManagerListener = (outer: OuterValue) => void;

/** 创建时定死的配置 */
export interface DateManagerOptions {
  /** 形态 */
  kind: DateKind;
  /** 显示格式, 也是出门格式. 缺省日期 YYYY-MM-DD, 时间 HH:mm:ss */
  format?: string;
  /** 按整天出门: 起 00:00:00, 止 23:59:59; 只对日期系起作用. 缺省关 */
  wholeDay?: boolean;
}

/** 给组件读的快照. 值没变就是同一份 */
export interface DateManagerSnapshot {
  /** 真值 */
  outer: OuterValue;
  /** 喂给 antd 的投影 */
  inner: InnerValue;
  /** 框里认的写法, 第一个是显示格式 */
  formats: string[];
}

/** dateManager 实例. 真值是 outer (string), inner (dayjs) 是它的投影, 只喂给 antd */
export interface DateManager {
  /** 当前快照 */
  snapshot: () => DateManagerSnapshot;
  /** 订阅快照变化, 返回退订 */
  subscribe: (listener: () => void) => () => void;
  /** 接上出门回调, 再接会覆盖上一份; 返回撤掉 */
  listen: (callback?: DateManagerListener) => () => void;
  /** 换整天口径: 已有的值按新口径重投并出门 */
  setWholeDay: (next: boolean) => void;
  /** 换每一端许不许空; 只影响框里的删光与粘贴, 不出门 */
  setAllowEmpty: (next: AllowEmpty) => void;
  /** 外部值同步进来, 不出门; 外部给的不是规范形才回写一次, 认不出来的不收 */
  setOuter: (next: unknown) => void;
  /** 接 antd 的 onChange */
  onAntdChange: (value: InnerValue) => void;
  /** 框里的字当下写进来: 空串清那一端, 合法日期立即出门, 非法字不收 */
  commitText: (text: string, index: 0 | 1) => void;
}

/** 显示格式之外, 框里还认的写法 */
const TYPED_FORMATS: Record<'date' | 'time', string[]> = {
  date: [DATE_FORMAT, 'YYYY/MM/DD', 'YYYYMMDD'],
  time: [TIME_PICKER_FORMAT, 'HHmmss'],
};

function isRange(kind: DateKind) {
  return kind === 'dateRange' || kind === 'timeRange';
}

/** 外部值与框里的字判空同一口径: null / undefined / 空串都读作没有 */
function isBlank(value: unknown) {
  return (value ?? '') === '';
}

function strictParse(raw: string, formats: string[]) {
  for (const format of formats) {
    const parsed = dayjs(raw, format, true);
    if (parsed.isValid()) return parsed;
  }
  return null;
}

function fillEnd(inner: InnerValue, index: 0 | 1, value: Dayjs | null): InnerValue {
  const ends: [Dayjs | null, Dayjs | null] = Array.isArray(inner)
    ? [inner[0], inner[1]]
    : [null, null];
  ends[index] = value;
  return ends;
}

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * kind 与 format 创建时定死, 要换就重建.
 * @param options - 配置
 */
export function createDateManager(options: DateManagerOptions): DateManager {
  const { kind } = options;
  const grain = kind === 'date' || kind === 'dateRange' ? 'date' : 'time';
  const display = options.format ?? (grain === 'date' ? DATE_FORMAT : TIME_PICKER_FORMAT);
  const formats = [...new Set([display, ...TYPED_FORMATS[grain]])];
  // 外部回填多认带时分秒的写法: 含组件自己 wholeDay 出门的那种, 否则回传的那份认不出来
  const backfillFormats =
    grain === 'date'
      ? [...formats, `${display} HH:mm:ss`, `${DATE_FORMAT} HH:mm:ss`, `${DATE_FORMAT}[T]HH:mm:ss`]
      : formats;
  let wholeDay = options.wholeDay ?? false;
  let empties: [boolean, boolean] = [false, false];
  let onChange: DateManagerListener | undefined;
  const listeners = new Set<() => void>();

  const parseEnd = (value: unknown) => {
    if (dayjs.isDayjs(value)) return value.isValid() ? value : null;
    return isBlank(value) ? null : strictParse(String(value).trim(), backfillFormats);
  };
  const outerEnd = (value: Dayjs | null, at: 0 | 1) => {
    if (!value) return null;
    const shown = value.format(display);
    if (!wholeDay || grain !== 'date') return shown;
    return `${shown} ${at === 1 ? '23:59:59' : '00:00:00'}`;
  };
  const toOuter = (inner: InnerValue): OuterValue => {
    if (!Array.isArray(inner)) return outerEnd(inner, 0);
    if (!inner[0] && !inner[1]) return null;
    return [outerEnd(inner[0], 0), outerEnd(inner[1], 1)];
  };
  const toInner = (outer: OuterValue): InnerValue => {
    if (!isRange(kind)) return parseEnd(outer);
    const ends = Array.isArray(outer) ? outer : [null, null];
    return [parseEnd(ends[0]), parseEnd(ends[1])];
  };

  /** 外部值解析成 inner; 认不出来的返回 undefined, 与「解析成空」分开 */
  const parseIncoming = (next: unknown): { inner: InnerValue } | undefined => {
    if (isBlank(next)) return { inner: isRange(kind) ? [null, null] : null };
    if (!isRange(kind)) {
      const parsed = Array.isArray(next) ? null : parseEnd(next);
      return parsed ? { inner: parsed } : undefined;
    }
    if (!Array.isArray(next)) return undefined;
    const ends: [Dayjs | null, Dayjs | null] = [parseEnd(next[0]), parseEnd(next[1])];
    if ((!isBlank(next[0]) && !ends[0]) || (!isBlank(next[1]) && !ends[1])) return undefined;
    return { inner: ends };
  };

  let outer: OuterValue = null;
  let snap: DateManagerSnapshot = { outer, inner: toInner(outer), formats };

  const refresh = () => {
    snap = { outer, inner: toInner(outer), formats };
    listeners.forEach((listener) => listener());
  };
  const emit = () => {
    refresh();
    onChange?.(outer);
  };

  return {
    snapshot: () => snap,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    listen: (callback) => {
      onChange = callback;
      return () => {
        if (onChange === callback) onChange = undefined;
      };
    },
    setWholeDay: (next) => {
      if (next === wholeDay) return;
      wholeDay = next;
      const reprojected = toOuter(toInner(outer));
      if (same(reprojected, outer)) return;
      outer = reprojected;
      emit();
    },
    setAllowEmpty: (next) => {
      empties = Array.isArray(next) ? [next[0], next[1]] : [next, next];
    },
    setOuter: (next) => {
      const parsed = parseIncoming(next);
      // 外部给的认不出来: 不收, 框里留着上一份
      if (!parsed) return;
      const normalized = toOuter(parsed.inner);
      // 回写让外部持有的与出门的是同一份; 外部给的已是规范形时不回写, 否则受控来回打转
      const canonical = same(normalized, isBlank(next) ? null : next);
      if (same(normalized, outer)) {
        if (!canonical) onChange?.(outer);
        return;
      }
      outer = normalized;
      if (canonical) refresh();
      else emit();
    },
    onAntdChange: (value) => {
      const next = toOuter(value);
      if (same(next, outer)) return;
      outer = next;
      emit();
    },
    commitText: (text, index) => {
      const raw = text.trim();
      // 框里的字只认框的写法, 与 antd 打字同一口径; 带时分秒的写法只给外部回填
      const parsed = raw === '' ? null : strictParse(raw, formats);
      // 非法字不收: 失焦由 antd 恢复上一份
      if (raw !== '' && !parsed) return;
      const nextInner = isRange(kind) ? fillEnd(toInner(outer), index, parsed) : parsed;
      // 区间里空着的端, 那一端许空才出门; 不许则不收, 失焦由 antd 填回上一份. 与 antd 提交时逐端校验同一口径
      if (Array.isArray(nextInner) && nextInner.some((end, at) => !end && !empties[at])) return;
      const next = toOuter(nextInner);
      if (same(next, outer)) return;
      outer = next;
      emit();
    },
  };
}
