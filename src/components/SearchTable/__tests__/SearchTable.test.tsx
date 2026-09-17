import type { QueryFetcher, QueryStore } from '../store/queryStore';
import type { BaseSearchList } from '#/form';
import { render, waitFor } from '@testing-library/react';
import { Activity, createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SearchTable } from '../SearchTable';

interface Row {
  id: string;
}

const LIST: BaseSearchList[] = [{ label: '单号', name: 'no', component: 'Input' }];
const COLUMNS: TableColumn<Row>[] = [{ title: '单号', dataIndex: 'id' }];

describe('SearchTable', () => {
  /**
   * keepalive 切页走的就是这条路: `Activity` 藏起页面时跑 effect 的 cleanup, 而组件的 state
   * 保留 —— 于是「在 cleanup 里销毁 store」会留下一个再也复活不了的空壳。
   */
  it('被 Activity 藏过再回来, store 照样接指令', async () => {
    const fetchPage = vi.fn(async () => ({ items: [], total: 0 })) as unknown as QueryFetcher<Row>;
    const ref = createRef<QueryStore<Row>>();
    const view = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <SearchTable ref={ref} manual searchList={LIST} columns={COLUMNS} fetchPage={fetchPage} />
      </Activity>
    );

    const { rerender } = render(view('visible'));

    rerender(view('hidden'));
    rerender(view('visible'));
    ref.current?.reload();

    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(1));
  });
});
