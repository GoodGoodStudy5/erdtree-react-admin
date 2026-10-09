import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitHiddenForm } from '../submitHiddenForm';

const ACTION = 'https://api.test/export';

function fieldsOf(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; path=/; max-age=0';
  vi.restoreAllMocks();
});

describe('submitHiddenForm', () => {
  it('POST 把 body 放进 payload, 并带上 Cookie 里的 _csrf', () => {
    document.cookie = 'XSRF-TOKEN=token-1; path=/';
    const click = vi.spyOn(HTMLButtonElement.prototype, 'click').mockImplementation(function (
      this: HTMLButtonElement,
    ) {
      const form = this.form;
      expect(form).toBeTruthy();
      expect(form?.getAttribute('action')).toBe(ACTION);
      expect(form?.method).toBe('post');
      expect(form?.target).toBe('_blank');
      expect(this.type).toBe('submit');
      expect(form?.isConnected).toBe(true);

      const fields = fieldsOf(form as HTMLFormElement);
      expect(JSON.parse(fields.payload as string)).toEqual({ fileName: '对账.xlsx', count: 2 });
      expect(fields._csrf).toBe('token-1');
    });

    submitHiddenForm({
      action: ACTION,
      method: 'POST',
      body: { fileName: '对账.xlsx', count: 2 },
    });

    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('form')).toBeNull();
  });

  it('GET 也发 payload, 不带 _csrf', () => {
    document.cookie = 'XSRF-TOKEN=token-1; path=/';
    const click = vi.spyOn(HTMLButtonElement.prototype, 'click').mockImplementation(function (
      this: HTMLButtonElement,
    ) {
      const fields = fieldsOf(this.form as HTMLFormElement);
      expect((this.form as HTMLFormElement).method).toBe('get');
      expect(JSON.parse(fields.payload as string)).toEqual({ groupId: 7 });
      expect(fields._csrf).toBeUndefined();
    });

    submitHiddenForm({ action: ACTION, method: 'GET', body: { groupId: 7 } });

    expect(click).toHaveBeenCalledOnce();
  });

  it('POST 没有 Cookie 也塞空的 _csrf', () => {
    const click = vi.spyOn(HTMLButtonElement.prototype, 'click').mockImplementation(function (
      this: HTMLButtonElement,
    ) {
      const fields = fieldsOf(this.form as HTMLFormElement);
      expect(fields._csrf).toBe('');
    });

    submitHiddenForm({ action: ACTION, method: 'POST', body: { a: 1 } });

    expect(click).toHaveBeenCalledOnce();
  });

  it('空值键不进 payload, 0 与 false 留下, 嵌套对象保留', () => {
    const click = vi.spyOn(HTMLButtonElement.prototype, 'click').mockImplementation(function (
      this: HTMLButtonElement,
    ) {
      expect(JSON.parse(fieldsOf(this.form as HTMLFormElement).payload as string)).toEqual({
        zero: 0,
        off: false,
        nested: { keep: 'a' },
      });
    });

    submitHiddenForm({
      action: ACTION,
      method: 'GET',
      body: {
        empty: '',
        none: undefined,
        missing: null,
        list: [],
        zero: 0,
        off: false,
        nested: { keep: 'a', skip: '' },
      },
    });

    expect(click).toHaveBeenCalledOnce();
  });
});
