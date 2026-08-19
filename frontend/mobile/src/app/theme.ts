// ==================== 界面基础样式 ====================
// 颜色、间距和圆角集中在这里命名，调整整体外观时便不必逐页寻找相同数值。
// 当前只收录已经在页面中使用的项目，不提前加入还没有实际用途的样式。

export const theme = {
  colors: {
    // background 是页面底布，surface 是盖在上面的卡片；两者分开才能看出内容层次。
    background: '#F4F4F4',
    surface: '#F6F6F4',
    text: '#1F2423',
    textSecondary: '#6B7270',
    primary: '#426561',
    navigationActive: '#4091F4',
    navigationInactive: '#000000',
    navigationSurface: '#FDFDFD',
    navigationBorder: '#FFFFFF',
    navigationActiveBackground: '#EEEEEE',
    border: '#E3E6E4',
    danger: '#C94747',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 20,
  },
} as const;
