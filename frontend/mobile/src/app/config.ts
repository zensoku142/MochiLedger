// ==================== 运行环境地址 ====================
// API（应用与服务器沟通的入口）地址只在这里选择，页面不能各自写一份主机名。
// Android 模拟器用 10.0.2.2 访问开发电脑，iOS 模拟器则可直接使用 localhost。

import {Platform} from 'react-native';

// 开发地址只在 __DEV__（React Native 的开发构建标记）为 true 时使用。
// 生产构建固定使用 HTTPS 地址，避免正式包误连本机明文接口。
const developmentHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const developmentApiBaseUrl = `http://${developmentHost}:8080/api/app/v1`;
const productionApiBaseUrl = 'https://api.mochiledger.app/api/app/v1';

// __DEV__ 是开发工具自动提供的开关；开发包连接本机，正式包只能连接 HTTPS 正式地址。
export const appConfig = {
  apiBaseUrl: __DEV__ ? developmentApiBaseUrl : productionApiBaseUrl,
} as const;
