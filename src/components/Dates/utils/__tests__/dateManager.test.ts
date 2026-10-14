import type { DateKind, OuterValue } from '../dateManager';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { createDateManager } from '../dateManager';

/**
 * 建一个 manager 并记下每次出门的值.
 *
 * 先接回调再同步外部值, 与组件里 layout effect 的先后一致: 回写要送得出去.
 * @param kind - 形态
 * @param options - 其余选项
 */
function setup(kind: DateKind, options: { format?: string; wholeDay?: boolean } = {}) {
  const mgr = createDateManager({ kind, ...options });
  const emitted: OuterValue[] = [];
  mgr.listen((next) => emitted.push(next));
  return { mgr, emitted, outer: () => mgr.snapshot().outer };
}

describe('外部值', () => {
  it('规范形同步进来, 不回写', () => {
    const { mgr, emitted, outer } = setup('date');
    mgr.setOuter('2026-10-01');
    expect(outer()).toBe('2026-10-01');
    expect(emitted).toEqual([]);
  });

  it('另两种写法认下, 回写一次规范形', () => {
    for (const raw of ['2026/10/01', '20261001']) {
      const { mgr, emitted } = setup('date');
      mgr.setOuter(raw);
      expect(emitted).toEqual(['2026-10-01']);
    }
  });

  it('认不出来的不收, 留着上一份: 13 月、点号、缺零', () => {
    for (const raw of ['2026-13-01', '2026.10.01', '2026-10-1']) {
      const { mgr, emitted, outer } = setup('date');
      mgr.setOuter('2026-10-01');
      mgr.setOuter(raw);
      expect(outer()).toBe('2026-10-01');
      expect(emitted).toEqual([]);
    }
  });

  it('空值都读作没有, 不回写', () => {
    for (const raw of [undefined, null, '']) {
      const { mgr, emitted, outer } = setup('date');
      mgr.setOuter(raw);
      expect(outer()).toBeNull();
      expect(emitted).toEqual([]);
    }
  });

  it('dayjs 进门转成 string 回写', () => {
    const { mgr, emitted } = setup('date');
    mgr.setOuter(dayjs('2026-10-01'));
    expect(emitted).toEqual(['2026-10-01']);
  });

  it('带时分秒的写法也认, 空格与 T 都收', () => {
    for (const raw of ['2026-10-01 08:00:00', '2026-10-01T08:00:00']) {
      const { mgr, emitted } = setup('date');
      mgr.setOuter(raw);
      expect(emitted).toEqual(['2026-10-01']);
    }
  });

  it('区间空端读作 null, 不回写', () => {
    const { mgr, emitted, outer } = setup('dateRange');
    mgr.setOuter([undefined, '2026-10-07'] as unknown as OuterValue);
    expect(outer()).toEqual([null, '2026-10-07']);
    expect(emitted).toEqual([]);
  });
});

describe('wholeDay', () => {
  it('缺省关: 区间出门到天', () => {
    const { mgr, emitted } = setup('dateRange');
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    expect(emitted).toEqual([]);
  });

  it('开着: 外部只给日, 钉上起止时刻回写一次', () => {
    const { mgr, emitted } = setup('dateRange', { wholeDay: true });
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    expect(emitted).toEqual([['2026-10-01 00:00:00', '2026-10-07 23:59:59']]);
  });

  it('开着: 外部给的已是规范形不回写', () => {
    const { mgr, emitted } = setup('dateRange', { wholeDay: true });
    mgr.setOuter(['2026-10-01 00:00:00', '2026-10-07 23:59:59']);
    expect(emitted).toEqual([]);
  });

  it('只填一端照样钉', () => {
    const { mgr, emitted } = setup('dateRange', { wholeDay: true });
    mgr.setOuter([null, '2026-10-07']);
    expect(emitted).toEqual([[null, '2026-10-07 23:59:59']]);
  });

  it('切换开关: 已有的值重投并出门', () => {
    const { mgr, emitted } = setup('dateRange');
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    mgr.setWholeDay(true);
    mgr.setWholeDay(false);
    expect(emitted).toEqual([
      ['2026-10-01 00:00:00', '2026-10-07 23:59:59'],
      ['2026-10-01', '2026-10-07'],
    ]);
  });

  it('时间系不受影响', () => {
    const { mgr, emitted } = setup('time', { wholeDay: true });
    mgr.setOuter('08:30:00');
    expect(emitted).toEqual([]);
  });
});

describe('框里的字', () => {
  it('单日删光即清空', () => {
    const { mgr, emitted } = setup('date');
    mgr.setOuter('2026-10-01');
    mgr.commitText('', 0);
    expect(emitted).toEqual([null]);
  });

  it('合法粘贴立即出门, 三种写法都收', () => {
    const { mgr, emitted } = setup('date');
    mgr.commitText('2026/10/01', 0);
    mgr.commitText('20261002', 0);
    expect(emitted).toEqual(['2026-10-01', '2026-10-02']);
  });

  it('非法字不收', () => {
    const { mgr, emitted } = setup('date');
    mgr.setOuter('2026-10-01');
    mgr.commitText('2026-13-01', 0);
    mgr.commitText('abc', 0);
    expect(emitted).toEqual([]);
  });

  it('框里只认框的写法, 带时分秒的不收', () => {
    const { mgr, emitted } = setup('date');
    mgr.commitText('2026-10-01 00:00:00', 0);
    expect(emitted).toEqual([]);
  });

  it('区间缺省不许空: 只删光一端不收, 只粘一端也不收', () => {
    const { mgr, emitted, outer } = setup('dateRange');
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    mgr.commitText('', 0);
    expect(outer()).toEqual(['2026-10-01', '2026-10-07']);

    const blank = setup('dateRange');
    blank.mgr.commitText('2026-10-01', 0);
    expect([...emitted, ...blank.emitted]).toEqual([]);
  });

  it('许空的那一端删光即清, 另一端留着', () => {
    const { mgr, emitted } = setup('dateRange');
    mgr.setAllowEmpty([true, false]);
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    mgr.commitText('', 0);
    mgr.commitText('', 1);
    expect(emitted).toEqual([[null, '2026-10-07']]);
  });

  it('两端都许空: 两端都删光就整段没有', () => {
    const { mgr, emitted } = setup('dateRange');
    mgr.setAllowEmpty(true);
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    mgr.commitText('', 0);
    mgr.commitText('', 1);
    expect(emitted).toEqual([[null, '2026-10-07'], null]);
  });

  it('时间写法也有两种', () => {
    const { mgr, emitted } = setup('time');
    mgr.commitText('083000', 0);
    expect(emitted).toEqual(['08:30:00']);
  });
});

describe('antd 的 onChange', () => {
  it('值没变不出门', () => {
    const { mgr, emitted } = setup('date');
    mgr.setOuter('2026-10-01');
    mgr.onAntdChange(dayjs('2026-10-01'));
    expect(emitted).toEqual([]);
  });

  it('选出来的 dayjs 转成 string 出门', () => {
    const { mgr, emitted } = setup('dateRange');
    mgr.onAntdChange([dayjs('2026-10-01'), dayjs('2026-10-07')]);
    expect(emitted).toEqual([['2026-10-01', '2026-10-07']]);
  });

  it('清除图标: 整段没有', () => {
    const { mgr, emitted } = setup('dateRange');
    mgr.setOuter(['2026-10-01', '2026-10-07']);
    mgr.onAntdChange(null);
    expect(emitted).toEqual([null]);
  });
});

describe('显示格式', () => {
  it('调用方给的 format 决定框里与出门的样子, 另两种写法仍能打', () => {
    const { mgr, emitted } = setup('date', { format: 'YYYY/MM/DD' });
    expect(mgr.snapshot().formats[0]).toBe('YYYY/MM/DD');
    mgr.commitText('2026-10-01', 0);
    expect(emitted).toEqual(['2026/10/01']);
  });

  it('缺省: 日期 YYYY-MM-DD, 时间 HH:mm:ss', () => {
    expect(setup('dateRange').mgr.snapshot().formats[0]).toBe('YYYY-MM-DD');
    expect(setup('timeRange').mgr.snapshot().formats[0]).toBe('HH:mm:ss');
  });
});

describe('快照', () => {
  it('没变就是同一份, 变了才换并通知', () => {
    const mgr = createDateManager({ kind: 'date' });
    let notified = 0;
    mgr.subscribe(() => (notified += 1));
    const before = mgr.snapshot();
    mgr.setOuter(null);
    expect(mgr.snapshot()).toBe(before);
    mgr.setOuter('2026-10-01');
    expect(mgr.snapshot()).not.toBe(before);
    expect(notified).toBe(1);
  });
});
