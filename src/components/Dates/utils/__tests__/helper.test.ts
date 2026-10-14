import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { dayjsRang2StringRang, stringRang2DayjsRang } from '../helper';

describe('区间两端可空', () => {
  it('空端不转成现在', () => {
    const onlyTo = stringRang2DayjsRang([undefined, '2024-06-30']);
    expect(onlyTo?.[0]).toBeNull();
    expect(onlyTo?.[1]?.format('YYYY-MM-DD')).toBe('2024-06-30');

    const onlyFrom = stringRang2DayjsRang(['2024-01-01', null]);
    expect(onlyFrom?.[0]?.format('YYYY-MM-DD')).toBe('2024-01-01');
    expect(onlyFrom?.[1]).toBeNull();

    expect(stringRang2DayjsRang([null, null])).toEqual([null, null]);
  });

  it('空端写成 undefined, 两端都空则整段没有', () => {
    expect(dayjsRang2StringRang([null, dayjs('2024-06-30')])).toEqual([undefined, '2024-06-30']);
    expect(dayjsRang2StringRang([dayjs('2024-01-01'), null])).toEqual(['2024-01-01', undefined]);
    expect(dayjsRang2StringRang([null, null])).toBeUndefined();
  });
});
