// ==================== 服务器请求入口 ====================
// 所有 JSON（按固定文字格式传递的数据）请求都从这里发出，页面不用重复拼地址和解析错误。
// 当前只支持附带登录令牌，不负责保存令牌、刷新登录状态或自动重发请求。

import {appConfig} from '../../app/config';
import {ApiError, type ApiProblemDetails} from './ApiError';

// ---------- 请求选项 ----------
// body 接收普通业务数据并在发送前统一转成 JSON；headers 保存额外请求说明。
export type ApiRequestOptions = Omit<RequestInit, 'body' | 'headers'> & {
  body?: unknown;
  headers?: Record<string, string>;
  accessToken?: string;
};

// ---------- 地址拼接 ----------
// 基础地址和功能路径交界处只保留一个斜杠，不能误删 http:// 或 https:// 中必需的两个斜杠。
function createRequestUrl(path: string) {
  const baseUrl = appConfig.apiBaseUrl.endsWith('/')
    ? appConfig.apiBaseUrl.slice(0, -1)
    : appConfig.apiBaseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

// 只有普通对象才能当作服务器错误详情，数组、空值和文字都按未知格式处理。
function asProblemDetails(value: unknown): ApiProblemDetails | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  return value as ApiProblemDetails;
}

// ---------- 响应读取 ----------
// 先读成文字才能同时兼容普通 JSON 和 204（请求成功但没有返回内容）。
// 成功响应若不是合法 JSON，会转换成统一错误；失败响应仍保留服务器给出的 HTTP 状态码。
async function parseResponseBody(response: Response): Promise<unknown> {
  const responseText = await response.text();

  if (responseText.length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    if (response.ok) {
      throw new ApiError(response.status, {
        detail: '服务器返回了无法解析的 JSON 数据。',
      });
    }

    // 错误响应即使不是 JSON 也必须在外层转换成 ApiError，不能把 SyntaxError 泄漏给页面。
    return undefined;
  }
}

// ---------- 请求发送 ----------
// 网络中断时根本收不到服务器响应，因此保留 fetch 原始错误，供页面区分断网与业务失败。
export async function apiClient<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const {accessToken, body, headers: customHeaders, ...requestOptions} =
    options;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...customHeaders,
  };

  if (body !== undefined) {
    // 此客户端只发送 JSON；固定 Content-Type 可防止调用方传入对象却被后端当成普通文本。
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken !== undefined) {
    // 这里只负责按标准格式附加令牌；令牌保存和刷新要等认证模块开发时实现。
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(createRequestUrl(path), {
    ...requestOptions,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(response.status, asProblemDetails(responseBody));
  }

  // TResponse 由对应 feature/api 根据后端契约声明；204 请求应显式使用 void 作为类型参数。
  return responseBody as TResponse;
}
