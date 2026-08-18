# MochiLedger Frontend

前端按使用场景拆分为两个独立工程：

- `mobile/`：面向用户的 React Native 客户端。
- `admin/`：面向运营和管理人员的 Web 管理后台。

两个工程分别维护依赖和构建配置，不在 `frontend/` 根目录共享运行时配置。
