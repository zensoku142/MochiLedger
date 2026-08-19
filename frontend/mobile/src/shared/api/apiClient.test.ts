// ==================== 服务器请求测试 ====================
// 测试用假的 fetch（发送网络请求的工具）代替真实服务器，因此断网时也能稳定运行。
// 重点保护 JSON 转换、登录令牌、服务器错误和无内容成功响应这四条边界。

import {appConfig} from '../../app/config';
import {ApiError} from './ApiError';
import {apiClient} from './apiClient';

const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();

beforeAll(() => {
  // apiClient 仍调用全局 fetch，但请求不会离开测试进程，也不会依赖尚未开发的后端。
  globalThis.fetch = fetchMock;
});

afterAll(() => {
  // 恢复全局函数，避免该文件影响同一 Jest 进程中的其他测试。
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  fetchMock.mockReset();
});

test('发送 JSON 请求并解析成功响应', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({data: {id: '1024'}}),
  } as Response);

  const result = await apiClient<{data: {id: string}}>('/transactions', {
    method: 'POST',
    body: {amount: '12.50'},
    accessToken: 'test-access-token',
  });

  expect(result).toEqual({data: {id: '1024'}});
  expect(fetchMock).toHaveBeenCalledWith(
    `${appConfig.apiBaseUrl}/transactions`,
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({amount: '12.50'}),
      headers: expect.objectContaining({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-access-token',
      }),
    }),
  );
});

test('把非 2xx Problem Details 转换成 ApiError', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 400,
    text: async () =>
      JSON.stringify({
        title: 'Validation failed',
        detail: '金额格式不正确',
        code: 'VALIDATION_ERROR',
        requestId: 'request-test-1',
      }),
  } as Response);

  const request = apiClient('/transactions');

  await expect(request).rejects.toMatchObject<ApiError>({
    name: 'ApiError',
    message: '金额格式不正确',
    status: 400,
    code: 'VALIDATION_ERROR',
    requestId: 'request-test-1',
  });
});

test('允许 204 成功响应没有 JSON 内容', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    status: 204,
    text: async () => '',
  } as Response);

  await expect(
    apiClient<void>('/transactions/1024', {method: 'DELETE'}),
  ).resolves.toBeUndefined();
});
