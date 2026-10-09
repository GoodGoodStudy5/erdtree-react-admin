import { CSRF_COOKIE, readCookie } from './csrf';

/** 隐藏 form 提交. action 是完整 URL, 业务参数全部进 body */
export interface SubmitHiddenFormOptions {
  action: string;
  method: 'GET' | 'POST';
  body: Record<string, unknown>;
}

function isBlank(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function compact(value: unknown): unknown {
  if (isBlank(value)) return undefined;
  if (Array.isArray(value)) {
    const next = value.map(compact).filter((item) => item !== undefined);
    return next.length === 0 ? undefined : next;
  }
  if (typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const compacted = compact(item);
      if (compacted !== undefined) next[key] = compacted;
    }
    return Object.keys(next).length === 0 ? undefined : next;
  }
  return value;
}

/**
 * GET 与 POST 都把 body 放进 payload 这一格 JSON. 仅 POST 再塞 `_csrf` (Cookie XSRF-TOKEN 原样).
 * 不用 HTMLFormElement.submit(): 部分浏览器不当用户手势, 拦新标签.
 */
export function submitHiddenForm(options: SubmitHiddenFormOptions): void {
  const { action, method, body } = options;
  const compacted = compact(body);
  const payload = JSON.stringify(compacted === undefined ? {} : compacted);

  const form = document.createElement('form');
  form.hidden = true;
  form.method = method;
  form.action = action;
  form.target = '_blank';

  const payloadInput = document.createElement('input');
  payloadInput.type = 'hidden';
  payloadInput.name = 'payload';
  payloadInput.value = payload;
  form.append(payloadInput);

  if (method === 'POST') {
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = '_csrf';
    csrfInput.value = readCookie(CSRF_COOKIE);
    form.append(csrfInput);
  }

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.hidden = true;
  form.append(submit);

  document.body.append(form);
  submit.click();
  form.remove();
}
