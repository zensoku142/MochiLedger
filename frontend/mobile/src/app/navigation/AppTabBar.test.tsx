// ==================== 底部导航测试 ====================
// 测试用假的导航状态代替手机模拟器，验证胶囊不只外观正确，也能按约定切换页面。
// 重点防止三种旧问题再次出现：点击后页面仍有延迟、底色滑出边界、重复打开当前页面。

import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import React from 'react';
import {Animated} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

import {
  AppTabBar,
  calculateDragPosition,
  getNearestTabIndex,
} from './AppTabBar';

const mockEmit = jest.fn(() => ({defaultPrevented: false}));
const mockNavigate = jest.fn();
let finishAnimation: ((result: {finished: boolean}) => void) | undefined;

// ---------- 测试导航数据 ----------
// BottomTabBarProps 包含很多由导航库在运行时生成的内部字段。
// 当前组件只读取 state、descriptors 和 navigation，因此测试只准备这条行为路径所需的数据，
// 再通过 unknown 转换成库类型；生产代码仍由真实 Bottom Tabs 提供完整对象。
function createTabBarProps(): BottomTabBarProps {
  return {
    state: {
      type: 'tab',
      key: 'main-tabs',
      index: 0,
      routeNames: ['Home', 'Statistics', 'Profile'],
      routes: [
        {key: 'home-key', name: 'Home'},
        {key: 'statistics-key', name: 'Statistics'},
        {key: 'profile-key', name: 'Profile'},
      ],
      history: [{type: 'route', key: 'home-key'}],
      stale: false,
      preloadedRouteKeys: [],
    },
    descriptors: {
      'home-key': {options: {title: '账本'}},
      'statistics-key': {options: {title: '统计'}},
      'profile-key': {options: {title: '资产'}},
    },
    navigation: {
      emit: mockEmit,
      navigate: mockNavigate,
    },
    insets: {top: 0, right: 0, bottom: 0, left: 0},
  } as unknown as BottomTabBarProps;
}

beforeEach(() => {
  mockEmit.mockClear();
  mockEmit.mockReturnValue({defaultPrevented: false});
  mockNavigate.mockClear();
  finishAnimation = undefined;

  // 测试主动决定动画何时结束，才能证明页面立即切换，动画结束后也不会重复导航。
  jest.spyOn(Animated, 'parallel').mockImplementation(
    () =>
      ({
        start: (callback?: (result: {finished: boolean}) => void) => {
          finishAnimation = callback;
        },
        stop: jest.fn(),
        reset: jest.fn(),
      } as unknown as Animated.CompositeAnimation),
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('激活未选中的 Tab 会立即切换路由并继续吸附动画', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<AppTabBar {...createTabBarProps()} />);
  });

  ReactTestRenderer.act(() => {
    renderer!.root.findByProps({accessibilityLabel: '统计'}).props.onPress();
  });

  expect(mockEmit).toHaveBeenCalledWith({
    type: 'tabPress',
    target: 'statistics-key',
    canPreventDefault: true,
  });
  expect(mockNavigate).toHaveBeenCalledWith('Statistics', undefined);

  // 动画结束只更新指示器位置，不能再次打开同一个页面。
  ReactTestRenderer.act(() => {
    finishAnimation?.({finished: true});
  });

  expect(mockNavigate).toHaveBeenCalledTimes(1);
});

test('激活已选中的 Tab 不会重复导航', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<AppTabBar {...createTabBarProps()} />);
  });

  ReactTestRenderer.act(() => {
    renderer!.root.findByProps({accessibilityLabel: '账本'}).props.onPress();
  });

  expect(mockEmit).toHaveBeenCalledTimes(1);
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('监听方阻止 tabPress 时吸附回当前页且不导航', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  mockEmit.mockReturnValue({defaultPrevented: true});

  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<AppTabBar {...createTabBarProps()} />);
  });

  ReactTestRenderer.act(() => {
    renderer!.root.findByProps({accessibilityLabel: '统计'}).props.onPress();
    finishAnimation?.({finished: true});
  });

  expect(mockNavigate).not.toHaveBeenCalled();
});

test('拖动位置连续跟手并被限制在三个 Tab 内', () => {
  // 每格宽 100 时向右拖 150，指示器应位于第 1.5 格，而不是提前跳到整数格。
  expect(calculateDragPosition(0, 150, 100, 3)).toBe(1.5);

  // 手指超出左右边界后仍停在 0～2，避免选中胶囊滑出白色容器。
  expect(calculateDragPosition(0, -80, 100, 3)).toBe(0);
  expect(calculateDragPosition(1, 500, 100, 3)).toBe(2);
});

test('释放时吸附到最近的 Tab', () => {
  expect(getNearestTabIndex(0.49, 3)).toBe(0);
  expect(getNearestTabIndex(0.5, 3)).toBe(1);
  expect(getNearestTabIndex(1.6, 3)).toBe(2);
});
