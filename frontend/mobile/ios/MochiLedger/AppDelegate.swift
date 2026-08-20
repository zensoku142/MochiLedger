// ==================== iOS 应用启动入口 ====================
// AppDelegate（iOS 启动应用时最先通知的对象）负责创建窗口并启动 React Native。

import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  // iOS 完成启动准备后执行一次；工厂会把名为 MochiLedger 的 JavaScript 根组件放进窗口。
  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "MochiLedger",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  // ---------- JavaScript 文件地址 ----------
  // Bridge（连接原生代码和 JavaScript 的通道）统一从 bundleURL 取得本次要执行的代码。
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // 开发包从电脑上的 Metro 读取最新代码，保存文件后无需重新制作安装包。
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    // 正式包没有开发服务器，因此读取已经随安装包一起打包的 main.jsbundle。
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
