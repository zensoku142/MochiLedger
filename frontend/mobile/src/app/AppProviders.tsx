// ==================== 全局公共能力 ====================
// Provider（把公共能力交给所有子页面的外壳）会在应用启动时从外到内依次生效。
// 页面放在安全区和请求缓存外壳里面，才能安全避开刘海并共享同一份服务端数据缓存。

import {QueryClientProvider} from '@tanstack/react-query';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {RootNavigator} from './navigation/RootNavigator';
import {queryClient} from './queryClient';

// ---------- 应用树装配 ----------
// RootNavigator（管理页面切换的总导航器）放在最里面，因而能使用外层准备好的两项能力。
export function AppProviders() {
  // SafeAreaProvider（安全区域提供者）会读取刘海、状态栏和底部手势条占用的范围。
  // 它把这些尺寸交给里面的 SafeAreaView 等组件，本身不会直接给页面添加空白。
  // QueryClientProvider（服务端数据管家提供者）让所有页面共用 queryClient 中的缓存和请求规则。
  // 它本身不会发送请求；页面使用 useQuery 或 useMutation 时，才会通过这位管家处理数据。
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
