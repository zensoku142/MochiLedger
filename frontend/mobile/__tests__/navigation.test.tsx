// ==================== 页面跳转测试 ====================
// 测试把真实导航替换成能记录调用的假函数，不启动模拟器也能检查按钮要去哪里。
// 这些场景防止后续修改页面时漏传账目编号，或让表单的返回按钮失效。

import React from 'react';
import {Button, Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import {HomeScreen} from '../src/features/transactions/screens/HomeScreen';
import {TransactionDetailScreen} from '../src/features/transactions/screens/TransactionDetailScreen';
import {TransactionFormScreen} from '../src/features/transactions/screens/TransactionFormScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

// ---------- 导航替身 ----------
// 页面只需要“前往目标页”和“返回”两项能力，其余导航代码仍使用库里的真实实现。
jest.mock('@react-navigation/native', () => {
  const actualNavigation = jest.requireActual('@react-navigation/native');

  return {
    ...actualNavigation,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
  };
});

beforeEach(() => {
  // 每个场景从空调用记录开始，避免上一个按钮点击影响下一个断言。
  mockNavigate.mockReset();
  mockGoBack.mockReset();
});

test('首页可以打开新增表单并为详情页传入账目 ID', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<HomeScreen />);
  });

  const buttons = renderer!.root.findAllByType(Button);

  ReactTestRenderer.act(() => buttons[0].props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith('TransactionForm', {});

  ReactTestRenderer.act(() => buttons[1].props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith('TransactionDetail', {
    transactionId: 'demo-transaction-id',
  });
});

test('表单页可以返回进入前的页面', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  // 空参数代表新增账目；只有编辑旧账时才会额外带上账目编号。
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <TransactionFormScreen route={{params: {}}} />,
    );
  });

  ReactTestRenderer.act(() =>
    renderer!.root.findByType(Button).props.onPress(),
  );
  expect(mockGoBack).toHaveBeenCalledTimes(1);
});

test('详情页展示调用方传入的账目 ID', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <TransactionDetailScreen
        route={{params: {transactionId: 'transaction-1024'}}}
      />,
    );
  });

  const textContent = renderer!.root
    .findAllByType(Text)
    .flatMap(node => node.props.children)
    .join('');

  expect(textContent).toContain('transaction-1024');
});
