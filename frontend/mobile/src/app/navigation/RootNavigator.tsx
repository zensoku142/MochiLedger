// ==================== 根页面导航 ====================
// Stack（像叠纸一样保存页面先后顺序的导航）负责主页面、记账表单和账目详情的切换。
// 主标签页放在最底层；表单从当前页面上方弹出，详情页则按普通前进和返回方式打开。

import {createStaticNavigation} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {TransactionDetailScreen} from '../../features/transactions/screens/TransactionDetailScreen';
import {TransactionFormScreen} from '../../features/transactions/screens/TransactionFormScreen';
import {theme} from '../theme';
import {MainTabNavigator} from './MainTabNavigator';
import type {RootStackParamList} from './navigationTypes';

// ---------- 页面清单 ----------
// Native Stack 会调用手机系统的原生页面动画；参数类型同时保证详情页一定收到目标账目编号。
const RootStack = createNativeStackNavigator<RootStackParamList>({
  initialRouteName: 'MainTabs',
  screenOptions: {
    contentStyle: {backgroundColor: theme.colors.background},
    headerStyle: {backgroundColor: theme.colors.surface},
    headerTintColor: theme.colors.text,
    statusBarStyle: 'dark',
  },
  screens: {
    MainTabs: {
      screen: MainTabNavigator,
      options: {headerShown: false},
    },
    TransactionForm: {
      screen: TransactionFormScreen,
      options: {
        presentation: 'modal',
        title: '记一笔',
      },
    },
    TransactionDetail: {
      screen: TransactionDetailScreen,
      options: {title: '账目详情'},
    },
  },
});

// ---------- 导航类型连接 ----------
// 这段声明把上面的页面清单交给 useNavigation，漏传账目编号时会在编译阶段直接提示。
type RootStackType = typeof RootStack;
declare module '@react-navigation/native' {
  interface RootNavigator extends RootStackType {}
}

const Navigation = createStaticNavigation(RootStack);

// AppProviders 会显示这个入口，Navigation 会自行记住访问顺序并处理系统返回操作。
export function RootNavigator() {
  return <Navigation />;
}
