import type { InternalAxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { creteRequest, RequestError } from '@south/request';

const { messageError } = vi.hoisted(() => ({
  messageError: vi.fn(),
}));

vi.mock('@south/message', () => ({
  message: { error: messageError },
}));

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const TRACE = '31e72eee17d04c8cbaa1c0f0e2fcd12e';

function api() {
  return creteRequest('http://example.test', 'token');
}

function respond(
  client: ReturnType<typeof creteRequest>,
  reply: { status: number; data: unknown; headers?: Record<string, string> },
) {
  let last: InternalAxiosRequestConfig | undefined;
  client.instance.defaults.adapter = async (config) => {
    last = config;
    return {
      data: reply.data,
      status: reply.status,
      statusText: reply.status === 200 ? 'OK' : 'Error',
      headers: reply.headers ?? {},
      config,
    };
  };
  return () => last;
}

describe('request.blob 与拦截器', () => {
  beforeEach(() => {
    messageError.mockClear();
  });

  it('xlsx 的 blob 返回字节、另存名与追踪号', async () => {
    const client = api();
    const blob = new Blob(['xlsx'], { type: XLSX });
    const last = respond(client, {
      status: 200,
      data: blob,
      headers: {
        'content-type': XLSX,
        'content-disposition': "attachment; filename*=UTF-8''%E5%AF%B9%E8%B4%A6.xlsx",
        'x-trace-id': TRACE,
      },
    });

    const downloaded = await client.blob('/export/by-group', {
      method: 'GET',
      params: { payload: '{"groupId":7}' },
    });

    expect(last()?.responseType).toBe('blob');
    expect(last()?.method).toBe('get');
    expect(downloaded.blob).toBe(blob);
    expect(downloaded.fileName).toBe('对账.xlsx');
    expect(downloaded.traceId).toBe(TRACE);
    expect(messageError).not.toHaveBeenCalled();
  });

  it('HTTP 200 的 JSON blob 弹后端那句话并抛 RequestError', async () => {
    const client = api();
    respond(client, {
      status: 200,
      data: new Blob(
        [JSON.stringify({ code: -1, message: '本次导出 10 行, 超过表格格式的上限' })],
        { type: 'application/json' },
      ),
      headers: { 'content-type': 'application/json', 'x-trace-id': TRACE },
    });

    await expect(client.blob('/export/by-group')).rejects.toBeInstanceOf(RequestError);
    expect(messageError).toHaveBeenCalledOnce();
    expect(messageError).toHaveBeenCalledWith(
      expect.objectContaining({ content: '本次导出 10 行, 超过表格格式的上限' }),
    );
  });

  it('HTTP 500 的 JSON blob 同样弹后端那句话', async () => {
    const client = api();
    respond(client, {
      status: 500,
      data: new Blob([JSON.stringify({ code: 500, message: '库挂了' })], {
        type: 'application/json',
      }),
      headers: { 'content-type': 'application/json', 'x-trace-id': TRACE },
    });

    await expect(client.blob('/x')).rejects.toMatchObject({
      name: 'RequestError',
      message: '库挂了',
    });
    expect(messageError).toHaveBeenCalledWith(expect.objectContaining({ content: '库挂了' }));
  });

  it('普通 JSON 接口仍剥信封', async () => {
    const client = api();
    respond(client, { status: 200, data: { code: 200, data: { id: 1 } } });

    await expect(client.get('/x')).resolves.toEqual({ id: 1 });
    expect(messageError).not.toHaveBeenCalled();
  });

  it('发出后超时弹请求超时, 不盖成服务器错误', async () => {
    const client = api();
    const axios = await import('axios');
    const timeout = new axios.AxiosError('timeout of 180000ms exceeded', 'ECONNABORTED');
    client.instance.defaults.adapter = async () => {
      throw timeout;
    };

    await expect(client.get('/x')).rejects.toBeInstanceOf(RequestError);
    expect(messageError).toHaveBeenCalledWith(expect.objectContaining({ content: '请求超时！' }));
  });
});
