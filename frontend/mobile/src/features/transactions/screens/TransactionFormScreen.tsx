// ==================== 记账表单页面 ====================
// RootNavigator 会把本页作为 modal（盖在当前页面上方的临时窗口）打开。
// 有 transactionId（账目编号）代表编辑旧账，没有编号则代表新增；当前还不会保存数据。

import {useNavigation, type StaticScreenProps} from '@react-navigation/native';
import {Button} from 'react-native';

import type {RootStackParamList} from '../../../app/navigation/navigationTypes';
import {theme} from '../../../app/theme';
import {Screen} from '../../../shared/components/Screen';

type TransactionFormScreenProps = StaticScreenProps<
  RootStackParamList['TransactionForm']
>;

// route.params 来自打开本页的一方；标题会按是否带有账目编号自动切换。
// goBack 会关闭这层表单，并让用户回到打开表单前所在的标签页。
export function TransactionFormScreen({route}: TransactionFormScreenProps) {
  const navigation = useNavigation();
  const isEditing = route.params.transactionId !== undefined;

  return (
    <Screen title={isEditing ? '编辑账目' : '记一笔'}>
      <Button
        title="返回"
        color={theme.colors.primary}
        onPress={() => navigation.goBack()}
      />
    </Screen>
  );
}
