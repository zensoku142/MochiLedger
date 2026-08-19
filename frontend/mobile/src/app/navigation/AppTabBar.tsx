// ==================== 可拖动底部导航 ====================
// 这个组件把默认底部导航换成悬浮圆角胶囊，用户既能点击，也能左右拖动选择页面。
// MainTabNavigator 仍保存真实页面和返回历史，这里只负责外观、触摸过程和切换时机。
// absolute（覆盖在内容上方的位置方式）让列表能继续铺到导航栏后面，不会被挤短。

import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Image,
  type ImageSourcePropType,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {theme} from '../theme';
import type {MainTabParamList} from './navigationTypes';

// ---------- 图片与尺寸 ----------
// 三张 WebP 是底部入口的图片，不再用外形可能不同的图标字体替代。
// 映射键与路由类型绑定；后续新增或删除 Tab 时，TypeScript 会要求同步维护资源。
const tabIcons: Record<keyof MainTabParamList, ImageSourcePropType> = {
  Home: require('./assets/tab-home.webp'),
  Statistics: require('./assets/tab-statistics.webp'),
  Profile: require('./assets/tab-mine.webp'),
};

// 全宽蒙版是 4×256 的透明 PNG：顶部完全透明，底部最多覆盖约 95%，不会变成实心底色。
// 因此列表滑到最底部时仍能透出约 5% 内容，同时比上一版更朦胧，不需要重新启用会产生马赛克的实时模糊。
// 参考图主要通过浅色透明层降低底部内容的对比度，并没有明显的粗颗粒模糊。
// Android 原生渐进模糊会先缩小画面再放大，文字边缘容易出现马赛克，因此这里只使用原尺寸透明度渐变。
const tabBarMask: ImageSourcePropType = require('./assets/tab-bottom-mask.png');

// 最新 1272×345 参考图归一化到 390×106 后，胶囊约高 58，图标框约 26×20，文字约 10。
// 各 WebP 使用 contain 保留自身比例，因此账本窄、柱状图宽、层叠图接近正方形。
const TAB_BAR_HEIGHT = 58;
const TAB_ICON_WIDTH = 26;
const TAB_ICON_HEIGHT = 20;
const TAB_LABEL_SIZE = 10;

// 蒙版需要比 Tab 本身向上多覆盖约 96 dp，才能在列表卡片进入胶囊前就开始渐隐。
// 该空间只扩大绝对定位根层，不参与页面布局，因此不会把 Tab 或内容向上推。
const BOTTOM_MASK_TOP_EXTENSION = 96;

// 胶囊自身保留 4 dp 内边距；选中底色每侧再内收 2 dp，匹配参考图的细小白色间隔。
const CAPSULE_CONTENT_PADDING = theme.spacing.xs;
const INDICATOR_HORIZONTAL_INSET = theme.spacing.xs / 2;

// 手指移动超过 4 dp 且主要方向为横向时才接管手势，避免轻微抖动把普通点击误判成拖动。
const DRAG_ACTIVATION_DISTANCE = theme.spacing.xs;

// 弹簧参数让释放后的指示器快速吸附又不会僵硬；动画结束回调才会真正提交路由。
const INDICATOR_SPRING_CONFIG = {
  damping: 22,
  stiffness: 260,
  mass: 0.8,
} as const;

// 正常选中底色约高 48 dp；放大到 1.18 后约为 57 dp，会比 56 dp 导航胶囊上下各探出一点。
// 外层没有 overflow:hidden，因此溢出部分可见，同时幅度仍不足以遮挡相邻 Tab 的文字。
const INDICATOR_ACTIVE_SCALE = 1.18;

// ---------- 位置换算 ----------
// 把任意小数限制在最小值和最大值之间，防止手指滑出胶囊后选中底色也跑到外面。
function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

// 把本次横向位移换算成“第几个 Tab”的连续位置。
// 例如从首页（0）向右移动半格会得到 0.5；宽度尚未测量时保持原位，避免除以 0。
export function calculateDragPosition(
  startPosition: number,
  dragDistance: number,
  segmentWidth: number,
  tabCount: number,
) {
  if (segmentWidth <= 0 || tabCount <= 0) {
    return startPosition;
  }

  return clamp(
    startPosition + dragDistance / segmentWidth,
    0,
    tabCount - 1,
  );
}

// 松手时选择距离指示器最近的整数格，并再次限制边界以保护异常输入。
export function getNearestTabIndex(position: number, tabCount: number) {
  if (tabCount <= 0) {
    return 0;
  }

  return Math.round(clamp(position, 0, tabCount - 1));
}

// route.name 由 MainTabNavigator 的固定 screens 配置生成，不会出现任意字符串。
// 单独保留这个判断，是为了在未来配置意外不一致时安全跳过未知项，而不是渲染错误图标。
function isKnownTab(routeName: string): routeName is keyof MainTabParamList {
  return routeName in tabIcons;
}

// 优先使用导航配置给出的中文 title；缺失时才退回稳定路由名，避免标签显示为空。
function getTabLabel(
  title: string | undefined,
  routeName: keyof MainTabParamList,
) {
  return title ?? routeName;
}

// ==================== 触摸与页面切换 ====================
// 每次真实选中页面变化时，React Navigation 都会把最新状态重新传入这个组件。
// 点击和拖动最终都进入同一条“发出 tabPress → 吸附 → 动画完成后导航”的流程，
// 所以手指仍按住或胶囊仍在移动时，页面不会提前切换。
export function AppTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  // React Navigation 会提供当前手机的安全区；bottomInset 是底部系统手势条占用的高度。
  const bottomInset = insets.bottom;

  // onLayout 会写入胶囊真实宽度；旋转屏幕或窗口尺寸变化后会自动重新计算每一格。
  const [capsuleWidth, setCapsuleWidth] = useState(0);

  // previewIndex 像“手指当前指到哪里”的临时记号，只改变颜色，不代表页面已经切换。
  const [previewIndex, setPreviewIndex] = useState(state.index);

  // Animated.Value（动画中的数字）用 0、1、2 代表三个入口，0.5 就是在前两个入口中间。
  const indicatorPosition = useRef(new Animated.Value(state.index)).current;

  // scale 从 1 放大到 1.18，再在吸附时回到 1，形成参考 GIF 中越过栏高的按下反馈。
  const indicatorScale = useRef(new Animated.Value(1)).current;

  // ref（不会引起页面重画的小记事本）保存手指每一帧的位置，避免拖动时不停重画整条导航栏。
  const visualPositionRef = useRef(state.index);
  const dragStartPositionRef = useRef(state.index);
  const isDraggingRef = useRef(false);
  const indicatorAnimationRef = useRef<Animated.CompositeAnimation | null>(
    null,
  );
  const indicatorScaleAnimationRef =
    useRef<Animated.CompositeAnimation | null>(null);
  const hasDraggedRef = useRef(false);
  const isVerticalGestureRef = useRef(false);

  // measureInWindow 会保存胶囊相对屏幕的左边界，供普通点击把 pageX 精确换算成三格。
  const capsuleRef = useRef<View | null>(null);
  const capsulePageXRef = useRef(0);

  const tabCount = state.routes.length;
  const segmentWidth =
    capsuleWidth > CAPSULE_CONTENT_PADDING * 2 && tabCount > 0
      ? (capsuleWidth - CAPSULE_CONTENT_PADDING * 2) / tabCount
      : 0;
  const indicatorWidth = Math.max(
    segmentWidth - INDICATOR_HORIZONTAL_INSET * 2,
    0,
  );

  // ---------- 吸附动画 ----------
  // 新动画开始前先停掉旧动画，再同时完成“滑到目标格”和“缩回正常大小”。
  // 两项都完整结束后才切换页面，用户快速改选时就不会误开上一次选择的页面。
  const animateIndicatorTo = useCallback(
    (targetIndex: number, handleFinished?: () => void) => {
      indicatorAnimationRef.current?.stop();
      indicatorScaleAnimationRef.current?.stop();
      setPreviewIndex(targetIndex);

      const animation = Animated.parallel([
        Animated.spring(indicatorPosition, {
          toValue: targetIndex,
          useNativeDriver: true,
          ...INDICATOR_SPRING_CONFIG,
        }),
        Animated.spring(indicatorScale, {
          toValue: 1,
          useNativeDriver: true,
          ...INDICATOR_SPRING_CONFIG,
        }),
      ]);

      indicatorAnimationRef.current = animation;
      animation.start(({finished}) => {
        if (indicatorAnimationRef.current === animation) {
          indicatorAnimationRef.current = null;
        }

        if (finished) {
          visualPositionRef.current = targetIndex;
          handleFinished?.();
        }
      });
    },
    [indicatorPosition, indicatorScale],
  );

  // 按住时放大选中胶囊；拖动期间保持该比例，直到释放吸附动画统一缩回。
  const enlargeIndicator = useCallback(() => {
    indicatorScaleAnimationRef.current?.stop();

    const animation = Animated.spring(indicatorScale, {
      toValue: INDICATOR_ACTIVE_SCALE,
      useNativeDriver: true,
      ...INDICATOR_SPRING_CONFIG,
    });

    indicatorScaleAnimationRef.current = animation;
    animation.start(({finished}) => {
      if (finished && indicatorScaleAnimationRef.current === animation) {
        indicatorScaleAnimationRef.current = null;
      }
    });
  }, [indicatorScale]);

  // ---------- 提交选择 ----------
  // 点击或松手后先询问导航监听方是否允许切换，再让底色吸附到最终位置。
  // 目标不同、切换未被阻止并且动画没有中断时，才真正显示新页面。
  const settleToTab = useCallback(
    (requestedIndex: number) => {
      const targetIndex = getNearestTabIndex(requestedIndex, tabCount);
      const targetRoute = state.routes[targetIndex];

      if (targetRoute === undefined) {
        isDraggingRef.current = false;
        animateIndicatorTo(state.index);
        return;
      }

      const event = navigation.emit({
        type: 'tabPress',
        target: targetRoute.key,
        canPreventDefault: true,
      });
      const shouldNavigate =
        targetIndex !== state.index && !event.defaultPrevented;
      const finalIndex = shouldNavigate ? targetIndex : state.index;

      isDraggingRef.current = false;
      animateIndicatorTo(finalIndex, () => {
        if (shouldNavigate) {
          navigation.navigate(targetRoute.name, targetRoute.params);
        }
      });
    },
    [
      animateIndicatorTo,
      navigation,
      state.index,
      state.routes,
      tabCount,
    ],
  );

  // 手势被系统取消时不改页面，指示器回到导航器当前确认的 Tab。
  const cancelDrag = useCallback(() => {
    isDraggingRef.current = false;
    animateIndicatorTo(state.index);
  }, [animateIndicatorTo, state.index]);

  // ---------- 手指轨迹 ----------
  // PanResponder（统一接收按下、移动和松手的工具）从按下开始掌管整条胶囊。
  // 这样手指跨过多个按钮时轨迹也不会断；没有形成拖动时，再用松手坐标判断点了哪一格。
  // 子 Pressable 仍保留 onPress，方便屏幕阅读器等无障碍工具直接激活入口。
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderGrant: () => {
          isDraggingRef.current = true;
          hasDraggedRef.current = false;
          isVerticalGestureRef.current = false;
          indicatorAnimationRef.current?.stop();
          enlargeIndicator();

          // 如果用户在吸附动画尚未结束时再次按住，从屏幕上的当前位置继续，不会跳回旧格。
          indicatorPosition.stopAnimation(currentPosition => {
            visualPositionRef.current = currentPosition;
            dragStartPositionRef.current = currentPosition;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const horizontalDistance = Math.abs(gestureState.dx);
          const verticalDistance = Math.abs(gestureState.dy);

          if (
            !hasDraggedRef.current &&
            verticalDistance > DRAG_ACTIVATION_DISTANCE &&
            verticalDistance > horizontalDistance
          ) {
            isVerticalGestureRef.current = true;
            return;
          }

          if (
            isVerticalGestureRef.current ||
            horizontalDistance <= DRAG_ACTIVATION_DISTANCE
          ) {
            return;
          }

          hasDraggedRef.current = true;
          const nextPosition = calculateDragPosition(
            dragStartPositionRef.current,
            gestureState.dx,
            segmentWidth,
            tabCount,
          );
          const nextPreviewIndex = getNearestTabIndex(nextPosition, tabCount);

          visualPositionRef.current = nextPosition;
          indicatorPosition.setValue(nextPosition);
          setPreviewIndex(currentIndex =>
            currentIndex === nextPreviewIndex
              ? currentIndex
              : nextPreviewIndex,
          );
        },
        onPanResponderRelease: (event, gestureState) => {
          if (isVerticalGestureRef.current) {
            cancelDrag();
            return;
          }

          if (hasDraggedRef.current) {
            settleToTab(
              getNearestTabIndex(visualPositionRef.current, tabCount),
            );
            return;
          }

          // 某些 Android 版本松手时会错误地给出横坐标 0。
          // 因此依次尝试最后位置、按下起点和原始事件，三个都不可用时才回到当前格中央。
          const releasePageX =
            gestureState.moveX > 0
              ? gestureState.moveX
              : gestureState.x0 > 0
                ? gestureState.x0
                : event.nativeEvent.pageX;
          const releaseLocationX = releasePageX > 0
            ? releasePageX - capsulePageXRef.current
            : CAPSULE_CONTENT_PADDING +
              (state.index + 0.5) * segmentWidth;
          const tapPosition =
            segmentWidth > 0
              ? (releaseLocationX - CAPSULE_CONTENT_PADDING) / segmentWidth -
                0.5
              : state.index;

          settleToTab(getNearestTabIndex(tapPosition, tabCount));
        },
        onPanResponderTerminate: cancelDrag,
        // 一旦横向选择开始就不把响应权交回子按钮，否则长拖动会在中途被 Pressable 取消。
        // 系统强制终止时仍会进入 onPanResponderTerminate，并安全回到当前已确认页面。
        onPanResponderTerminationRequest: () => false,
      }),
    [
      cancelDrag,
      enlargeIndicator,
      indicatorPosition,
      segmentWidth,
      settleToTab,
      state.index,
      tabCount,
    ],
  );

  // ---------- 外部页面变化 ----------
  // 外部链接或系统返回也可能改变当前页面；没有拖动时才同步底色，拖动中不能抢走手指控制权。
  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    if (visualPositionRef.current === state.index) {
      setPreviewIndex(state.index);
      return;
    }

    animateIndicatorTo(state.index);
  }, [animateIndicatorTo, state.index]);

  // 组件卸载时停止动画，防止已离开的导航树收到完成回调并触发过期跳转。
  useEffect(
    () => () => {
      indicatorAnimationRef.current?.stop();
      indicatorScaleAnimationRef.current?.stop();
    },
    [],
  );

  // ---------- 尺寸测量 ----------
  // 手机旋转或窗口改变后重新记录胶囊宽度；不足半个像素的误差不会触发多余重画。
  const handleCapsuleLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setCapsuleWidth(currentWidth =>
      Math.abs(currentWidth - nextWidth) < 0.5 ? currentWidth : nextWidth,
    );

    // measureInWindow 返回相对屏幕的 x，普通点击据此能在任何屏宽和安全区下正确分到三格。
    capsuleRef.current?.measureInWindow(windowX => {
      capsulePageXRef.current = windowX;
    });
  }, []);

  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={styles.safeArea}
      edges={['right', 'bottom', 'left']}>
      <View pointerEvents="box-none" style={styles.barArea}>
        <Image
          resizeMode="stretch"
          source={tabBarMask}
          style={[
            styles.maskImage,
            {
              top: -BOTTOM_MASK_TOP_EXTENSION,
              bottom: -bottomInset,
            },
          ]}
        />
        <View
          {...panResponder.panHandlers}
          onLayout={handleCapsuleLayout}
          ref={capsuleRef}
          style={styles.capsule}
          testID="main-tab-drag-surface">
          {indicatorWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.activeIndicatorTrack,
                {
                  left:
                    CAPSULE_CONTENT_PADDING + INDICATOR_HORIZONTAL_INSET,
                  width: indicatorWidth,
                  transform: [
                    {
                      translateX: Animated.multiply(
                        indicatorPosition,
                        segmentWidth,
                      ),
                    },
                  ],
                },
              ]}
              testID="tab-selection-indicator">
              <Animated.View
                style={[
                  styles.activeIndicator,
                  {transform: [{scale: indicatorScale}]},
                ]}
              />
            </Animated.View>
          )}
          {state.routes.map((route, index) => {
            const routeName = route.name;

            if (!isKnownTab(routeName)) {
              return null;
            }

            const isFocused = previewIndex === index;
            const options = descriptors[route.key].options;
            const label = getTabLabel(options.title, routeName);
            const foregroundColor = isFocused
              ? theme.colors.navigationActive
              : theme.colors.navigationInactive;

            const handleLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                accessibilityState={isFocused ? {selected: true} : {}}
                onLongPress={handleLongPress}
                onPress={() => settleToTab(index)}
                style={styles.pressable}
                testID={options.tabBarButtonTestID}>
                {({pressed}) => (
                  <View
                    style={[
                      styles.tab,
                      pressed && styles.pressedTab,
                    ]}>
                    <Image
                      resizeMode="contain"
                      source={tabIcons[routeName]}
                      style={[
                        styles.tabIcon,
                        {tintColor: foregroundColor},
                      ]}
                    />
                    <Text style={[styles.label, {color: foregroundColor}]}>
                      {label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ==================== 底部导航样式 ====================
const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    // RNSScreen 在 Android 使用独立原生绘制层，蒙版必须高于它才能真正盖住列表内容。
    // 这里只提升透明根层的绘制顺序，不再执行会扩散亮色像素的实时模糊，因此不会产生此前的白色眩光。
    elevation: 10,
    paddingTop: BOTTOM_MASK_TOP_EXTENSION,
    backgroundColor: 'transparent',
  },
  barArea: {
    // Android 会把 RNSScreen 作为独立原生层绘制；蒙版放进这个已提升的容器后才会盖住列表。
    zIndex: 11,
    elevation: 11,
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  maskImage: {
    position: 'absolute',
    right: 0,
    left: 0,
    // Android Fabric 会保留这张 4 px 资源的固有宽度；必须显式铺满，否则蒙版只剩屏幕左侧一条细线。
    width: '100%',
    // 胶囊位于同一容器内并在图片之后渲染，因此它保持清晰，蒙版只处理下面的列表内容。
    zIndex: 0,
  },
  capsule: {
    position: 'relative',
    width: '70%',
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    padding: theme.spacing.xs,
    backgroundColor: theme.colors.navigationSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.navigationBorder,
    borderRadius: theme.radius.lg + theme.spacing.sm,
    shadowColor: theme.colors.text,
    shadowOffset: {width: 0, height: theme.spacing.xs},
    shadowOpacity: 0.06,
    shadowRadius: theme.spacing.sm,
    elevation: 2,
  },
  pressable: {
    flex: 1,
    zIndex: 1,
  },
  activeIndicatorTrack: {
    position: 'absolute',
    top: CAPSULE_CONTENT_PADDING,
    bottom: CAPSULE_CONTENT_PADDING,
  },
  activeIndicator: {
    flex: 1,
    backgroundColor: theme.colors.navigationActiveBackground,
    borderRadius: theme.radius.lg + theme.spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginHorizontal: theme.spacing.sm,
  },
  tabIcon: {
    width: TAB_ICON_WIDTH,
    height: TAB_ICON_HEIGHT,
  },
  pressedTab: {
    opacity: 0.7,
  },
  label: {
    fontSize: TAB_LABEL_SIZE,
    fontWeight: '500',
    lineHeight: theme.spacing.md,
  },
});
