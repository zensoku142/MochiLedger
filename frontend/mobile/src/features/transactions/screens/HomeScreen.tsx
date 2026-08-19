// ==================== 账本首页 ====================
// 当前流水只放在应用运行时的内存中，用来检查列表滚动和底部渐变效果，不会保存到账本。
// 两个按钮分别验证新增表单和详情页的跳转，接入真实数据时仍要保留对应入口能力。

import {useNavigation} from '@react-navigation/native';
import type {ListRenderItem} from 'react-native';
import {Button, FlatList, StyleSheet, Text, View} from 'react-native';

import {theme} from '../../../app/theme';
import {Screen} from '../../../shared/components/Screen';

// ---------- 演示流水 ----------
// amount 的单位是元，正数表示收入，负数表示支出；这些数值不能用于真实账目计算。
type DemoTransactionTemplate = {
  title: string;
  category: string;
  amount: number;
};

// FlatList（只绘制屏幕附近内容的列表）需要稳定 id，才能在滚动时认出每一行。
type DemoTransaction = DemoTransactionTemplate & {
  id: string;
  date: string;
  time: string;
};

// 收入和支出交错出现，便于同时检查两种金额颜色经过底部渐变区时是否看得清。
const transactionTemplates: DemoTransactionTemplate[] = [
  {title: '早餐', category: '餐饮', amount: -16.5},
  {title: '地铁通勤', category: '交通', amount: -4},
  {title: '午餐', category: '餐饮', amount: -28},
  {title: '日用品', category: '购物', amount: -45.8},
  {title: '项目奖金', category: '收入', amount: 800},
  {title: '咖啡', category: '餐饮', amount: -22},
  {title: '手机话费', category: '通讯', amount: -50},
  {title: '周末电影', category: '娱乐', amount: -39.9},
  {title: '工资', category: '收入', amount: 6800},
  {title: '水果', category: '餐饮', amount: -36.6},
  {title: '健身月卡', category: '健康', amount: -199},
  {title: '房租', category: '居住', amount: -2200},
];

// 每行至少 68 个屏幕单位，确保标题、时间和金额经过渐变区域时仍容易辨认。
const DEMO_ROW_MIN_HEIGHT = 68;

// 36 行能覆盖多个屏幕；日期和金额略作变化，避免列表看起来像同一条记录被复制。
const demoTransactions: DemoTransaction[] = Array.from(
  {length: 36},
  (_, index) => {
    const template = transactionTemplates[index % transactionTemplates.length];
    const day = 18 - Math.floor(index / 4);
    const hour = 12 - (index % 6);
    const minute = (index * 7) % 60;
    const amountVariation = template.amount > 0 ? index * 5 : -(index % 5);

    return {
      ...template,
      id: `demo-transaction-${index}`,
      amount: template.amount + amountVariation,
      date: `8月${day}日`,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    };
  },
);

// ---------- 单行显示 ----------
// 正数加“+”并使用收入色，负数加“-”并使用支出色；这里只负责显示，不做收支合计。
const renderTransaction: ListRenderItem<DemoTransaction> = ({item}) => {
  const isIncome = item.amount > 0;
  const amountPrefix = isIncome ? '+' : '-';
  const amountText = `${amountPrefix}¥${Math.abs(item.amount).toFixed(2)}`;

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle}>{item.title}</Text>
        <Text style={styles.transactionMeta}>
          {item.date} · {item.time} · {item.category}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          isIncome ? styles.incomeAmount : styles.expenseAmount,
        ]}>
        {amountText}
      </Text>
    </View>
  );
};

// ---------- 页面操作 ----------
// 用户点击按钮后只发出页面跳转，账目参数是否完整会在运行前由类型检查发现。
export function HomeScreen() {
  const navigation = useNavigation();

  return (
    <Screen title="账本滚动测试" extendUnderBottomBar>
      <View style={styles.actions}>
        <Button
          title="记一笔"
          color={theme.colors.primary}
          onPress={() => navigation.navigate('TransactionForm', {})}
        />
        <Button
          title="查看示例详情"
          color={theme.colors.primary}
          onPress={() =>
            navigation.navigate('TransactionDetail', {
              transactionId: 'demo-transaction-id',
            })
          }
        />
      </View>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={demoTransactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  list: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  listContent: {
    gap: theme.spacing.sm,
  },
  transactionRow: {
    minHeight: DEMO_ROW_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },
  transactionDetails: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  transactionTitle: {
    color: theme.colors.text,
    fontSize: theme.spacing.lg,
    fontWeight: '600',
  },
  transactionMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.spacing.md,
  },
  transactionAmount: {
    fontSize: theme.spacing.lg,
    fontWeight: '600',
  },
  incomeAmount: {
    color: theme.colors.primary,
  },
  expenseAmount: {
    color: theme.colors.danger,
  },
});
