// ==================== 服务器错误格式 ====================
// apiClient 会把服务器返回的失败统一装进 ApiError，页面不必分别猜测各种响应格式。
// 页面判断业务情况时应使用稳定的 code，detail 只是可能随文案调整的提示文字。

// ---------- 字段错误 ----------
// field 指出哪个输入框有问题，message 是准备显示在该输入框旁的说明。
export type ApiFieldError = {
  field: string;
  message: string;
};

// ---------- 完整错误详情 ----------
// HTTP（应用与服务器传递消息的规则）失败内容可能不完整，所以每个附加字段都允许缺省。
export type ApiProblemDetails = {
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  requestId?: string;
  fieldErrors?: ApiFieldError[];
};

// ---------- 页面可识别的错误 ----------
// status 保存 HTTP 状态码；即使服务器没返回 JSON，页面仍会得到统一的错误对象和通用提示。
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly fieldErrors?: ApiFieldError[];

  constructor(status: number, problem?: ApiProblemDetails) {
    const message =
      problem?.detail ?? problem?.title ?? `请求失败（HTTP ${status}）`;

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem?.code;
    this.requestId = problem?.requestId;
    this.fieldErrors = problem?.fieldErrors;
  }
}
