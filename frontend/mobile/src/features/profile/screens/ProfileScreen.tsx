// ==================== 我的页面 ====================
// 底部导航切到“我的”时显示这个占位页面，目前没有登录、用户资料或设置逻辑。

import {Screen} from '../../../shared/components/Screen';

// 独立组件让个人中心以后仍留在自己的目录，不会堆进应用入口或导航配置。
export function ProfileScreen() {
  return <Screen title="我的" />;
}
