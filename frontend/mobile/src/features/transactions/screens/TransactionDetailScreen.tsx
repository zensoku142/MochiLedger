// ==================== 账目详情页面 ====================
// 当前页面只显示打开页面时收到的 transactionId（账目编号），尚未请求服务器详情。
// 先保留这条完整传递路径，可尽早发现跳转时忘记提供账目编号的问题。

import type {StaticScreenProps} from '@react-navigation/native';
import {StyleSheet, Text} from 'react-native';

import type {RootStackParamList} from '../../../app/navigation/navigationTypes';
import {theme} from '../../../app/theme';
import {Screen} from '../../../shared/components/Screen';

type TransactionDetailScreenProps = StaticScreenProps<
  RootStackParamList['TransactionDetail']
>;

// route.params 是上一个页面随跳转带来的数据；类型规则已保证这里一定有账目编号。
export function TransactionDetailScreen({
  route,
}: TransactionDetailScreenProps) {
  return (
    <Screen title="账目详情">
      <Text style={styles.identifier}>
        账目 ID：{route.params.transactionId}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identifier: {
    color: theme.colors.textSecondary,
    // 账目编号中的英文和数字使用 Quicksand，前面的中文说明仍由系统中文字体显示。
    fontFamily: theme.fonts.number,
  },
});
