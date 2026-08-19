// ==================== 页面参数规则 ====================
// TypeScript（运行前检查数据形状的工具）会按这里的规则检查每一次页面跳转。
// 这里只说明页面需要哪些数据，不负责显示页面或执行跳转。

// ---------- 根页面参数 ----------
export type RootStackParamList = {
  MainTabs: undefined;
  TransactionForm: {
    // 新增账目没有 ID（账目编号）；编辑已有账目时才带上要修改的编号。
    transactionId?: string;
  };
  TransactionDetail: {
    // 详情页没有 ID 就不知道该查哪一笔账，因此这里不允许省略。
    transactionId: string;
  };
};

// ---------- 底部标签参数 ----------
// 三个主页面目前不接收额外数据，切换标签只会改变当前显示的页面。
export type MainTabParamList = {
  Home: undefined;
  Statistics: undefined;
  Profile: undefined;
};
