// ==================== 服务端数据缓存 ====================
// QueryClient（替页面保管服务器数据的小仓库）在整个应用中只创建一次。
// 所有页面共享下面的等待和重试规则，避免同一份数据被各自重复请求。

import {QueryClient} from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据在 30 秒内被视为新鲜，短时间返回页面时不会立即重复请求。
      staleTime: 30_000,
      // 查询失败只额外尝试一次，既能容忍偶发错误，也不会长时间阻塞错误提示。
      retry: 1,
      // 手机应用没有网页的“窗口重新获得焦点”事件，因此不能依赖这项网页刷新机制。
      refetchOnWindowFocus: false,
    },
    mutations: {
      // 新增或编辑账目会改变服务器数据，失败后不自动重试，以免网络抖动生成重复账目。
      retry: false,
    },
  },
});
