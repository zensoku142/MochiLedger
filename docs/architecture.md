# MochiLedger 项目架构设计

> 文档状态：Draft / 可执行基线
>
> 更新日期：2026-08-20
>
> 适用阶段：从工程初始化到个人记账 MVP 上线
>
> 核心目标：先完成稳定、可测试的基础记账闭环，再按真实需求演进

## 1. 文档目的

本文档定义 MochiLedger 的产品边界、系统架构、模块划分、数据模型、接口规范、工程结构、测试策略、部署方式与实施顺序。它既是当前阶段的技术决策基线，也是后续开发、评审和验收的共同依据。

本文档严格区分：

- 当前现状：仓库中已经存在并可验证的内容。
- 目标架构：后续需要逐步实现的内容。
- MVP 范围：第一阶段必须完成的基础功能。
- 延后范围：不阻塞基础闭环，暂不开发的能力。

若后续产品需求与本文档冲突，应先更新对应章节或新增架构决策记录，再修改代码，避免文档与实现长期偏离。

## 2. 当前仓库基线

### 2.1 已存在内容

当前仓库采用同仓库、多独立工程的组织方式：

    MochiLedger/
    ├── frontend/
    │   ├── mobile/       React Native 用户端
    │   └── admin/        管理后台预留目录
    ├── backend/          Java 后端预留目录
    └── README.md

当前可确认的技术基线：

| 工程 | 当前状态 | 已确定技术 |
| --- | --- | --- |
| mobile | 已接入全局 Provider、API Client、三页底部导航和占位页面，核心记账业务尚未实现 | React Native 0.86、React 19、TypeScript、pnpm |
| backend | 仅有 README 和 Java 版本配置 | Java 21、计划使用 Spring Boot 和 MySQL |
| admin | 仅有 README | 计划使用 React、TypeScript、Vite |

### 2.2 尚未实现内容

- 后端应用、数据库迁移和业务接口尚未初始化。
- 移动端已有可运行的应用外壳和导航，但页面仍使用本地占位数据。
- 认证、分类、账目增删改查和真实统计等核心业务尚未在当前代码基线上实现。
- 管理后台尚未初始化，且不属于第一阶段。
- 根目录不共享各子工程运行时依赖，各工程独立构建和发布。

### 2.3 可复用的历史业务方向

仓库历史原型曾覆盖登录、账目增删改查、父子分类、月度列表和分类支出统计。新架构不恢复旧技术实现，但将这些已经探索过的业务能力作为 MVP 范围的重要输入。

## 3. 产品目标与需求假设

### 3.1 产品目标

MochiLedger 第一阶段面向个人用户，提供简单、可靠的日常收支记录能力。用户应能够完成以下闭环：

    注册或登录
        ↓
    获得默认收支分类
        ↓
    新增一笔收入或支出
        ↓
    按月查看、编辑或删除账目
        ↓
    查看月度收支概览和分类分布

### 3.2 当前需求假设

由于当前仓库没有正式产品需求文档，架构先按以下假设执行：

1. 第一阶段是个人记账，不支持家庭或团队协作。
2. 一个用户只有一个默认账目空间，不引入多账本。
3. 第一阶段只支持人民币 CNY，不处理汇率和多币种换算。
4. 采用在线优先模式；无网络时可查看当前页面状态，但不承诺离线新增和自动同步。
5. 账号使用用户名和密码，避免第一阶段依赖短信、邮件或第三方登录服务。
6. 用户数据以服务端 MySQL 为最终事实来源。
7. 客户端同时支持 Android 和 iOS；当前 Windows 开发环境优先验证 Android。
8. 默认时区为 Asia/Shanghai，用户可在个人设置中修改时区。
9. 分类最多两级，满足一级分类和子分类的现有业务方向。
10. 金额最多保留两位小数，必须大于 0。

上述假设不要求提前支持未来能力；当真实需求变化时，通过数据迁移和接口版本演进处理。

## 4. 范围规划

### 4.1 MVP 必须完成

#### 用户与认证

- 用户名、密码注册。
- 用户名、密码登录。
- Access Token 自动刷新。
- 退出登录并撤销 Refresh Token。
- 获取和修改当前用户昵称、时区。
- App 重启后安全恢复登录状态。

#### 分类

- 新用户自动获得默认收入、支出分类。
- 查询当前用户分类。
- 新增一级分类或子分类。
- 修改分类名称、图标、颜色和排序值。
- 停用不再使用的分类。
- 新增或编辑账目时只允许选择有效分类。

#### 账目

- 新增收入或支出。
- 必填金额、类型、分类、发生时间。
- 可选备注。
- 按月份分页查询。
- 按收支类型、分类筛选。
- 查看详情。
- 编辑。
- 删除。
- 列表按发生时间倒序，同一时间按 ID 倒序。

#### 统计

- 指定月份的总收入、总支出、结余、记账次数。
- 指定月份按分类汇总金额与占比。
- 空数据状态。
- 统计结果与账目增删改保持一致。

#### 基础质量

- 统一接口错误结构。
- 数据库版本迁移。
- 核心业务自动化测试。
- 开发、测试、生产环境配置隔离。
- 健康检查、请求日志和基础指标。
- Android 主路径构建与人工冒烟验证。

### 4.2 MVP 明确延后

以下能力有价值，但不得阻塞第一阶段闭环：

- 多账本、共享账本、家庭成员和权限协作。
- 现金、银行卡、信用卡等资金账户及账户余额。
- 账户间转账。
- 多币种和汇率。
- 月度预算、预算提醒。
- 周期账单、自动记账。
- 图片、小票、发票等附件。
- 标签、商户、地点。
- CSV、Excel、第三方账单导入导出。
- 完整离线写入、冲突合并和多端实时同步。
- 短信、邮箱验证码和第三方登录。
- 找回密码；在没有可信验证渠道前不提供不安全的重置流程。
- 消息推送。
- 管理后台。
- 微服务、Redis、消息队列、搜索引擎和数据仓库。
- AI 自动分类或消费建议。

## 5. 架构原则

### 5.1 基础功能优先

所有设计先服务于认证、分类、账目和统计闭环。没有当前需求支撑的通用框架、扩展点或基础设施不进入 MVP。

### 5.2 模块化单体优先

后端采用一个 Spring Boot 应用和一个 MySQL 数据库。代码按业务模块隔离，但在同一进程、同一事务边界内运行。

该方案的直接收益：

- 部署单元少，开发和排障成本低。
- 账目写入与统计读取可以直接共享一致的数据。
- 无需处理分布式事务、消息最终一致性和跨服务调用失败。
- 未来若某个模块确有独立伸缩需求，清晰的模块边界仍可支持拆分。

### 5.3 服务端是事实来源

用户、分类、账目和统计结果均以服务端数据库为准。移动端缓存用于提升体验，不形成第二套需要双向合并的业务数据库。

### 5.4 金融数据准确优先

- Java 使用 BigDecimal。
- MySQL 使用 DECIMAL(19, 2)。
- JSON 中金额使用字符串传输。
- 禁止使用 JavaScript Number 直接承担金额精确计算。
- 统计在数据库或 Java BigDecimal 中完成。

### 5.5 契约先行

移动端和后端通过明确的 HTTP API、字段语义、错误码和 OpenAPI 文档协作。接口版本放在 URL 中，MVP 使用 /api/app/v1。

### 5.6 最小依赖

优先使用现有框架和标准库。新增依赖必须直接降低当前开发复杂度或提升关键数据安全性。

### 5.7 默认安全

认证信息安全存储、密码不可逆哈希、用户数据强制隔离、日志脱敏、生产环境只允许 TLS。

## 6. 总体架构

### 6.1 逻辑视图

    ┌────────────────────────────┐
    │ React Native Mobile App    │
    │                            │
    │ Screen / Feature           │
    │ Query Cache / Auth Context │
    │ Typed API Client           │
    └─────────────┬──────────────┘
                  │ HTTPS + JSON
                  │ /api/app/v1
    ┌─────────────▼──────────────┐
    │ Spring Boot Modular Monolith│
    │                             │
    │ Auth / User / Category      │
    │ Transaction / Statistics    │
    │ Common Web & Security       │
    └─────────────┬───────────────┘
                  │ JPA + JDBC
    ┌─────────────▼──────────────┐
    │ MySQL                      │
    │ Flyway Schema Migration    │
    └────────────────────────────┘

管理后台后续也只通过 /api/admin/v1 访问后端，不直接连接数据库。MVP 不初始化管理后台。

### 6.2 运行时组件

| 组件 | 职责 | MVP 实例数 |
| --- | --- | --- |
| Mobile App | 用户交互、本地会话、服务端数据缓存 | 每台用户设备一个 |
| Reverse Proxy / Ingress | TLS、请求大小限制、基础限流 | 1 |
| Spring Boot API | 认证和全部业务逻辑 | 1 |
| MySQL | 持久化业务数据 | 1 主库 |
| Backup Job | 定期数据库备份与恢复校验 | 1 |

MVP 不引入 Redis、消息队列、独立统计服务或对象存储。

## 7. 目标仓库结构

各子工程保持独立依赖和构建配置：

    MochiLedger/
    ├── docs/
    │   ├── architecture.md
    │   └── api/                         后续导出的 OpenAPI 文档
    ├── frontend/
    │   ├── mobile/
    │   │   ├── android/
    │   │   ├── ios/
    │   │   ├── src/
    │   │   │   ├── app/
    │   │   │   ├── features/
    │   │   │   └── shared/
    │   │   ├── __tests__/
    │   │   └── package.json
    │   └── admin/
    │       └── README.md
    ├── backend/
    │   ├── .mvn/
    │   ├── src/
    │   │   ├── main/
    │   │   │   ├── java/com/mochiledger/
    │   │   │   └── resources/
    │   │   │       ├── db/migration/
    │   │   │       └── application.yml
    │   │   └── test/
    │   ├── mvnw
    │   ├── mvnw.cmd
    │   └── pom.xml
    ├── ops/
    │   └── compose/
    │       └── compose.yml
    ├── .gitignore
    └── README.md

说明：

- 不在根目录创建共享 Node.js 依赖。
- backend 使用 Maven Wrapper，避免依赖开发机全局 Maven 版本。
- ops 只保存本地联调和部署必要配置，不在 MVP 建设通用平台。
- docs/api 在接口稳定后保存从后端导出的 OpenAPI 产物。

## 8. 业务域和模块边界

### 8.1 模块划分

| 模块 | 主要职责 | 依赖关系 |
| --- | --- | --- |
| auth | 注册、登录、令牌签发、刷新、撤销 | user |
| user | 用户资料、状态、时区 | 无业务模块依赖 |
| category | 默认分类初始化、分类维护、分类规则 | user |
| transaction | 账目增删改查、金额和分类校验 | user、category |
| statistics | 月度汇总、分类汇总 | transaction 的只读数据 |
| common | 错误响应、请求 ID、时间、分页、安全基础设施 | 不包含具体业务规则 |

### 8.2 依赖约束

允许的依赖方向：

    controller → service → repository
                      ↓
                    domain

模块间调用优先通过对方 service 暴露的窄接口完成。不得从 transaction 直接修改 category 表，也不得让 controller 直接访问 repository。

statistics 是只读模块，可使用专门的聚合查询直接读取账目表，但不得修改账目。

common 只承载已经出现重复的横切能力，不放置万能工具类或业务 DTO。

### 8.3 后端包结构

采用按业务能力组织、模块内简单分层：

    com.mochiledger
    ├── MochiLedgerApplication.java
    ├── auth/
    │   ├── controller/
    │   ├── service/
    │   ├── repository/
    │   ├── domain/
    │   └── dto/
    ├── user/
    ├── category/
    ├── transaction/
    ├── statistics/
    └── common/
        ├── error/
        ├── security/
        ├── web/
        └── config/

不额外引入复杂的通用领域框架。DTO 使用 Java record，实体使用普通类，映射逻辑保持显式。

## 9. 核心业务规则

### 9.1 用户

- username 全局唯一，去除首尾空格并转为小写后保存；登录时使用相同的标准化规则。
- username 长度 4 至 32，只允许字母、数字、下划线和短横线。
- password 长度 8 至 72；服务端只保存 BCrypt 哈希。
- nickname 长度 1 至 32。
- timezone 必须是有效 IANA 时区，默认 Asia/Shanghai。
- 用户状态为 ACTIVE 或 DISABLED。

### 9.2 分类

- 分类归属于单个用户，不存在跨用户共享分类。
- 类型只能是 INCOME 或 EXPENSE。
- 一级分类 parent_id 为空，子分类 parent_id 指向同一用户、同一类型的一级分类。
- 最多两级，不允许子分类继续拥有子分类。
- 名称长度 1 至 32。
- icon 在 MVP 中保存 emoji 或短文本，长度不超过 32。
- color 使用固定格式的十六进制颜色，例如 #4A6572。
- 停用分类后，历史账目仍保留并可正常显示。
- 停用分类不能再用于新增账目。
- 停用一级分类时，在同一事务中同时停用其有效子分类，避免出现不可达的有效子分类。
- 已被账目引用的分类不能物理删除。
- 分类创建后不允许修改 type 和 parent_id；移动分类或改变收支类型应通过新建分类完成，避免破坏历史账目语义。
- 默认分类按用户复制，避免所有用户被一份全局可变数据耦合。

建议的默认支出分类：餐饮、交通、购物、居住、医疗、学习、娱乐、其他。

建议的默认收入分类：工资、奖金、理财、礼金、其他。

### 9.3 账目

- type 只能是 INCOME 或 EXPENSE。
- amount 必须大于 0，最多两位小数，不由服务端静默舍入。
- category 必须属于当前用户。
- category.type 必须与 transaction.type 一致。
- 新增或修改时分类必须有效。
- occurred_at 接受带时区的 ISO 8601 时间，服务端统一换算为 UTC 保存。
- note 可空，最大 255 字符。
- 新增请求必须带 clientRequestId；同一用户下唯一，用于防止网络重试重复记账。
- 读取、修改、删除时必须同时使用 transactionId 和当前 userId 查询。
- 无权访问其他用户资源时统一返回 404，避免泄露资源是否存在。
- 删除账目采用物理删除；MVP 没有审计或找回站，不制造隐含的回收站语义。

### 9.4 统计

- 月度边界按用户时区计算，数据库查询使用 UTC 半开区间 from <= occurred_at < to。
- 总收入、总支出和结余使用 BigDecimal。
- 结余等于总收入减总支出。
- 记账次数包含收入和支出。
- 分类占比基于同类型总额计算，总额为 0 时占比为 0。
- 修改或删除账目后不使用异步缓存，下一次统计查询直接反映最新数据库数据。

## 10. 数据架构

### 10.1 实体关系

    users 1 ────── N refresh_tokens
      │
      ├────────── N categories
      │              │
      │              └── 0..1 parent category
      │
      └────────── N transactions N ────── 1 categories

### 10.2 users

| 字段 | 类型 | 约束与说明 |
| --- | --- | --- |
| id | BIGINT | 主键，服务端生成 |
| username | VARCHAR(32) | 非空，唯一 |
| password_hash | VARCHAR(100) | 非空，不返回客户端 |
| nickname | VARCHAR(32) | 非空 |
| timezone | VARCHAR(64) | 非空，默认 Asia/Shanghai |
| status | VARCHAR(16) | ACTIVE 或 DISABLED |
| created_at | DATETIME(3) | UTC |
| updated_at | DATETIME(3) | UTC |

索引：

- UNIQUE(username)

### 10.3 refresh_tokens

| 字段 | 类型 | 约束与说明 |
| --- | --- | --- |
| id | BIGINT | 主键 |
| user_id | BIGINT | users 外键 |
| token_hash | CHAR(64) | SHA-256 哈希，唯一 |
| expires_at | DATETIME(3) | UTC |
| revoked_at | DATETIME(3) | 可空 |
| created_at | DATETIME(3) | UTC |

只保存 Refresh Token 哈希，不保存原始令牌。刷新成功后轮换令牌，旧令牌立即撤销。

索引：

- UNIQUE(token_hash)
- INDEX(user_id, revoked_at, expires_at)

### 10.4 categories

| 字段 | 类型 | 约束与说明 |
| --- | --- | --- |
| id | BIGINT | 主键 |
| user_id | BIGINT | users 外键 |
| parent_id | BIGINT | 可空，自关联 |
| type | VARCHAR(16) | INCOME 或 EXPENSE |
| name | VARCHAR(32) | 非空 |
| icon | VARCHAR(32) | 非空 |
| color | CHAR(7) | 非空 |
| sort_order | INT | 非空，默认 0 |
| active | BOOLEAN | 非空，默认 true |
| preset | BOOLEAN | 是否由系统初始化 |
| created_at | DATETIME(3) | UTC |
| updated_at | DATETIME(3) | UTC |

索引：

- INDEX(user_id, type, active, sort_order)
- INDEX(parent_id)

同一父级下的重名校验由 category service 在事务中执行。MySQL 组合唯一索引对 NULL 的处理容易导致一级分类重复，MVP 不依赖含 parent_id 的简单唯一索引表达该规则。

### 10.5 transactions

| 字段 | 类型 | 约束与说明 |
| --- | --- | --- |
| id | BIGINT | 主键 |
| user_id | BIGINT | users 外键 |
| category_id | BIGINT | categories 外键 |
| type | VARCHAR(16) | INCOME 或 EXPENSE |
| amount | DECIMAL(19, 2) | 非空且大于 0 |
| occurred_at | DATETIME(3) | UTC |
| note | VARCHAR(255) | 可空 |
| client_request_id | CHAR(36) | 客户端生成 UUID |
| created_at | DATETIME(3) | UTC |
| updated_at | DATETIME(3) | UTC |

索引：

- UNIQUE(user_id, client_request_id)
- INDEX(user_id, occurred_at DESC, id DESC)
- INDEX(user_id, type, occurred_at)
- INDEX(user_id, category_id, occurred_at)

type 在账目表中保留，虽然分类表也有 type。这样可以明确记录本身的业务类型并简化高频统计；服务层必须保证两者一致。

### 10.6 ID 的接口表示

数据库使用 BIGINT，API 中所有 ID 使用字符串，例如 "1024"。原因是 JavaScript Number 无法精确表示全部 64 位整数。

### 10.7 数据库约束和迁移

- 所有结构变更通过 Flyway migration 提交。
- 已在任何共享环境执行的 migration 不得修改，只能新增下一版本。
- JPA 的 schema 自动更新在所有环境禁用。
- 测试使用 MySQL 兼容实例，不使用 H2 代替关键持久化测试。
- 外键用于保证基本引用完整性，业务所有权和分类层级由 service 校验。
- 数据库连接和会话时区固定为 UTC。

建议首批迁移：

    V1__create_users_and_refresh_tokens.sql
    V2__create_categories.sql
    V3__create_transactions.sql

默认分类由注册用例在同一事务中创建，不通过全局共享分类表实现。

## 11. HTTP API 设计

### 11.1 通用规范

- 基础路径：/api/app/v1
- 数据格式：application/json; charset=utf-8
- 认证：Authorization: Bearer ACCESS_TOKEN
- 时间：带时区的 ISO 8601 字符串
- 日期月份：YYYY-MM
- ID：字符串
- 金额：十进制字符串，例如 "12.50"
- 分页：page 从 0 开始，size 默认 20，最大 100
- 列表排序：服务端定义，不接受任意字段排序
- 删除成功：204 No Content
- 请求 ID：服务端接受或生成 X-Request-Id，并在响应中返回

### 11.2 成功响应

单对象响应：

    {
      "data": {
        "id": "1024"
      }
    }

分页响应：

    {
      "data": {
        "items": [],
        "page": 0,
        "size": 20,
        "totalElements": 0,
        "totalPages": 0
      }
    }

### 11.3 错误响应

使用 application/problem+json，结构遵循 Problem Details，并增加稳定业务码：

    {
      "type": "https://mochiledger.app/problems/validation-error",
      "title": "Validation failed",
      "status": 400,
      "detail": "One or more fields are invalid.",
      "instance": "/api/app/v1/transactions",
      "code": "VALIDATION_ERROR",
      "requestId": "01J...",
      "fieldErrors": [
        {
          "field": "amount",
          "message": "must have at most 2 decimal places"
        }
      ]
    }

稳定错误码至少包括：

| HTTP | code | 场景 |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | 字段格式错误 |
| 400 | BUSINESS_RULE_VIOLATION | 业务规则不满足 |
| 401 | AUTH_INVALID_CREDENTIALS | 用户名或密码错误 |
| 401 | AUTH_TOKEN_INVALID | Token 无效 |
| 401 | AUTH_TOKEN_EXPIRED | Token 过期 |
| 403 | USER_DISABLED | 用户被停用 |
| 404 | RESOURCE_NOT_FOUND | 资源不存在或不属于当前用户 |
| 409 | USERNAME_ALREADY_EXISTS | 用户名重复 |
| 409 | IDEMPOTENCY_CONFLICT | clientRequestId 已用于不同内容 |
| 409 | CATEGORY_NAME_CONFLICT | 同级分类重名 |
| 500 | INTERNAL_ERROR | 未预期服务端错误 |

客户端只根据 HTTP 状态和 code 分支，不解析 message 文本。

### 11.4 认证接口

| 方法 | 路径 | 认证 | 说明 |
| --- | --- | --- | --- |
| POST | /auth/register | 否 | 注册并初始化默认分类 |
| POST | /auth/login | 否 | 登录 |
| POST | /auth/refresh | 否 | 轮换 Refresh Token |
| POST | /auth/logout | 是 | 撤销当前 Refresh Token |

注册请求：

    {
      "username": "mochi_user",
      "password": "example-password",
      "nickname": "Mochi"
    }

登录或注册成功：

    {
      "data": {
        "accessToken": "access-token",
        "accessTokenExpiresIn": 900,
        "refreshToken": "refresh-token",
        "user": {
          "id": "1",
          "username": "mochi_user",
          "nickname": "Mochi",
          "timezone": "Asia/Shanghai"
        }
      }
    }

### 11.5 用户接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /users/me | 获取当前用户 |
| PATCH | /users/me | 修改 nickname 或 timezone |

### 11.6 分类接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /categories | 查询分类树，可按 type 筛选 |
| POST | /categories | 创建分类 |
| PATCH | /categories/{id} | 修改名称、图标、颜色或排序值 |
| DELETE | /categories/{id} | 停用分类 |

查询参数：

- type：INCOME 或 EXPENSE，可选。
- includeInactive：默认 false。

创建分类：

    {
      "parentId": null,
      "type": "EXPENSE",
      "name": "餐饮",
      "icon": "🍜",
      "color": "#4A6572",
      "sortOrder": 10
    }

分类响应以树形结构返回一级分类及 children，移动端无需重复组装。

### 11.7 账目接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /transactions | 分页查询账目 |
| POST | /transactions | 新增账目 |
| GET | /transactions/{id} | 获取详情 |
| PATCH | /transactions/{id} | 编辑 |
| DELETE | /transactions/{id} | 删除 |

列表参数：

- from：必填，带时区的起始时间。
- to：必填，带时区的结束时间，使用半开区间。
- type：可选。
- categoryId：可选。
- page：默认 0。
- size：默认 20，最大 100。

列表查询最大跨度为 366 天，避免误操作造成无限范围扫描。

新增请求：

    {
      "clientRequestId": "2d7fbf2d-491b-4dd7-98d2-418546b78d3a",
      "type": "EXPENSE",
      "categoryId": "12",
      "amount": "28.50",
      "occurredAt": "2026-08-18T19:30:00+08:00",
      "note": "晚餐"
    }

账目响应：

    {
      "data": {
        "id": "1001",
        "type": "EXPENSE",
        "amount": "28.50",
        "occurredAt": "2026-08-18T19:30:00+08:00",
        "note": "晚餐",
        "category": {
          "id": "12",
          "name": "餐饮",
          "icon": "🍜",
          "color": "#4A6572",
          "active": true
        },
        "createdAt": "2026-08-18T11:30:02Z",
        "updatedAt": "2026-08-18T11:30:02Z"
      }
    }

服务端按当前用户时区返回 occurredAt，createdAt 和 updatedAt 使用 UTC。

### 11.8 统计接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /statistics/monthly-summary?month=2026-08 | 月度收支概览 |
| GET | /statistics/category-breakdown?month=2026-08&type=EXPENSE | 分类分布 |

月度概览：

    {
      "data": {
        "month": "2026-08",
        "income": "8000.00",
        "expense": "2350.50",
        "balance": "5649.50",
        "transactionCount": 42
      }
    }

分类分布：

    {
      "data": {
        "month": "2026-08",
        "type": "EXPENSE",
        "total": "2350.50",
        "items": [
          {
            "categoryId": "12",
            "categoryName": "餐饮",
            "categoryIcon": "🍜",
            "amount": "820.50",
            "ratio": "0.3491",
            "transactionCount": 16
          }
        ]
      }
    }

### 11.9 OpenAPI

- 后端通过与当前 Spring Boot 版本兼容的 springdoc 生成 OpenAPI。
- 本地暴露 Swagger UI 便于联调。
- 生产环境默认关闭 Swagger UI，只保留受控的 API 文档产物。
- CI 导出 OpenAPI JSON 并检查非预期变更。
- MVP 移动端类型可手工维护，但字段命名和可空性必须以 OpenAPI 为准。
- 当接口规模明显增长后再评估自动生成 TypeScript 客户端，不提前引入生成链路。

## 12. 后端详细设计

### 12.1 技术选择

| 类别 | 选择 |
| --- | --- |
| Java | Temurin Java 21 |
| 构建 | Maven Wrapper |
| Web | Spring Boot Web |
| 校验 | Jakarta Bean Validation |
| 安全 | Spring Security |
| 持久化 | Spring Data JPA |
| 数据库 | MySQL |
| 迁移 | Flyway |
| API 文档 | springdoc OpenAPI |
| 健康与指标 | Spring Boot Actuator |
| 测试 | JUnit、Spring Boot Test、Testcontainers MySQL |

Spring Boot 与插件的精确版本在初始化后端时选择官方支持 Java 21 的稳定组合，并统一由 Maven dependency management 固定。本文档不在代码尚未初始化时写死易过期的版本号。

### 12.2 请求处理流程

    HTTP Request
        ↓
    RequestIdFilter
        ↓
    SecurityFilterChain
        ↓
    Controller：解析和基础校验
        ↓
    Service：鉴权后的业务规则和事务
        ↓
    Repository：参数化持久化查询
        ↓
    DTO Mapping
        ↓
    HTTP Response

controller 不返回 JPA entity，避免懒加载、内部字段泄漏和接口被数据库结构绑死。

### 12.3 事务边界

- 注册用户与初始化默认分类在同一个数据库事务中完成。
- 新增、修改、删除账目各自为一个事务。
- 分类停用为一个事务。
- 查询使用只读事务。
- 统计使用只读查询，不持久化冗余汇总表。
- 外部网络调用不得放入数据库事务；MVP 当前无外部业务调用。

### 12.4 幂等处理

新增账目由 clientRequestId 保证幂等：

1. 客户端在用户点击保存时生成 UUID，并在本次保存的所有重试中复用。
2. 服务端先按 userId 和 clientRequestId 查询。
3. 若已存在且核心请求内容一致，返回已有账目。
4. 若已存在但内容不同，返回 409 IDEMPOTENCY_CONFLICT。
5. 唯一索引处理并发请求的最终竞争。

此逻辑必须有说明原因的代码注释，因为它是防止重复记账的保护逻辑。

### 12.5 查询策略

- 首页账目列表始终限制时间范围并分页。
- 所有业务查询必须包含 user_id。
- 详情查询使用 findByIdAndUserId。
- 分类树一次性查询当前用户分类后在内存中按 parent_id 组装；个人分类数量很小，无需递归 SQL。
- 统计使用数据库 SUM、COUNT、GROUP BY，不把整月明细拉入 Java 后再聚合。
- MVP 不增加统计缓存；先以正确性和实时性为准。

### 12.6 异常处理

统一 GlobalExceptionHandler 处理：

- Bean Validation 错误。
- JSON 格式错误。
- 业务异常。
- 认证和授权错误。
- 唯一约束冲突。
- 未预期异常。

未预期异常只向客户端返回通用信息，完整堆栈进入服务端日志并关联 requestId。

## 13. 移动端详细设计

### 13.1 技术基线

保持当前 React Native CLI、React、TypeScript 和 pnpm 基线。MVP 建议只增加直接需要的依赖：

| 能力 | 建议 |
| --- | --- |
| 导航 | React Navigation native stack 和 bottom tabs |
| 服务端状态 | TanStack Query |
| 安全存储 | react-native-keychain |
| 测试 | React Native Testing Library |

MVP 暂不增加全局状态框架、表单框架、图表框架和 UI 组件库：

- 认证会话使用 React Context 和 reducer。
- 服务端数据使用 TanStack Query。
- 页面临时状态使用 useState 或 useReducer。
- 金额表单保持小而明确，使用功能级校验函数。
- 分类统计先用文本、进度条和原生 View 呈现，验证需求后再选图表库。

### 13.2 目录结构

    src/
    ├── app/
    │   ├── AppProviders.tsx
    │   ├── navigation/
    │   │   ├── RootNavigator.tsx
    │   │   ├── AuthNavigator.tsx
    │   │   └── MainTabNavigator.tsx
    │   ├── queryClient.ts
    │   ├── theme.ts
    │   └── config.ts
    ├── features/
    │   ├── auth/
    │   │   ├── api/
    │   │   ├── components/
    │   │   ├── screens/
    │   │   ├── AuthProvider.tsx
    │   │   └── types.ts
    │   ├── categories/
    │   ├── transactions/
    │   ├── statistics/
    │   └── profile/
    └── shared/
        ├── api/
        │   ├── apiClient.ts
        │   ├── ApiError.ts
        │   └── tokenRefresh.ts
        ├── components/
        ├── hooks/
        ├── storage/
        ├── types/
        └── utils/

只有跨两个以上功能并且语义稳定的代码才提升到 shared。功能专用组件留在对应 feature。

### 13.3 导航结构

    RootNavigator
    ├── SplashScreen
    ├── AuthNavigator
    │   ├── LoginScreen
    │   └── RegisterScreen
    └── MainTabNavigator
        ├── HomeStack
        │   ├── HomeScreen
        │   ├── TransactionDetailScreen
        │   └── TransactionFormScreen
        ├── StatisticsStack
        │   └── StatisticsScreen
        └── ProfileStack
            ├── ProfileScreen
            └── CategoryManagementScreen

启动时先读取安全存储中的 Refresh Token：

- 没有令牌：进入 AuthNavigator。
- 有令牌：调用 refresh，成功后进入主界面。
- refresh 失败且确定为 401：清空令牌并进入登录页。
- 网络失败：显示可重试错误，不把网络故障误判为登录失效。

该分支涉及生命周期和认证竞态，实现时必须添加简短注释说明原因。

### 13.4 状态管理

| 状态类型 | 存放位置 | 示例 |
| --- | --- | --- |
| 认证会话 | AuthProvider | user、accessToken、认证状态 |
| Refresh Token | Keychain / Keystore | 仅安全存储 |
| 服务端数据 | TanStack Query | 分类、账目、统计 |
| 页面输入 | 页面局部 state | 金额、备注、选择日期 |
| 导航状态 | React Navigation | 当前页面和参数 |

Access Token 只保存在内存。Refresh Token 保存到系统 Keychain 或 Android Keystore，不写入 AsyncStorage，不输出到日志。

### 13.5 API Client

apiClient 负责：

- 拼接 base URL。
- 序列化 JSON。
- 添加 Access Token 和 X-Request-Id。
- 解析 data 和 Problem Details。
- 将服务端错误转换为 ApiError。
- 遇到 Access Token 过期时只发起一次 refresh。
- refresh 成功后重放等待中的请求。
- refresh 明确失败后统一退出登录。

并发请求同时收到 401 时必须共享同一个 refresh Promise，避免刷新令牌被轮换多次造成会话失效。该逻辑需要单元测试和竞态说明注释。

### 13.6 Query Key

Query Key 必须由功能模块集中定义：

    categoriesKeys.all
    categoriesKeys.list(type)
    transactionsKeys.list(filters)
    transactionsKeys.detail(id)
    statisticsKeys.summary(month)
    statisticsKeys.breakdown(month, type)

新增、编辑、删除账目成功后：

- 使受影响月份的账目列表失效。
- 使受影响月份的 summary 和 breakdown 失效。
- 若编辑跨月份，旧月份和新月份都失效。

不要在多个页面散落手写 Query Key 字符串。

### 13.7 金额处理

- 表单金额保留字符串。
- 只允许数字和一个小数点。
- 最多两位小数。
- 提交前标准化为固定两位字符串。
- 展示使用明确的金额格式化函数。
- 统计展示不先转换成 JavaScript Number 再累计。

进度条所需比例可以使用服务端 ratio 转为 Number，因为比例不是账务金额。

### 13.8 用户体验底线

- 保存按钮请求期间禁用，避免重复点击。
- 保存失败保留用户输入。
- 删除需要二次确认。
- 列表、统计、分类均提供加载、空数据、错误和重试状态。
- 表单错误定位到具体字段。
- 切换月份时保留清晰的当前月份反馈。
- 触摸目标建议不小于 44 × 44。
- 文本颜色满足基本对比度要求。
- 重要操作不只用颜色表达结果。

### 13.9 在线优先边界

MVP 不支持离线新增账目。无网络时：

- 已在内存缓存中的列表可以继续显示。
- 写操作明确提示网络不可用并保留表单。
- 恢复网络后由用户重试。
- 不创建本地待同步队列，避免在没有冲突策略时产生不一致。

## 14. 管理后台规划

管理后台在 MVP 完成前保持预留状态，不初始化依赖。后续只有出现明确运营需求时才建设，例如：

- 用户状态管理。
- 系统默认分类模板管理。
- 运行指标和异常查询。

约束：

- 管理端使用独立的 /api/admin/v1。
- 管理员身份与普通用户身份隔离。
- 所有高风险操作记录审计日志。
- 管理后台不直连数据库。
- 不复用移动端 Refresh Token。

## 15. 认证与安全

### 15.1 Token 方案

- Access Token：签名 JWT，有效期建议 15 分钟。
- Refresh Token：高熵随机字符串，有效期建议 30 天。
- Refresh Token 只以 SHA-256 哈希保存。
- 每次刷新都轮换 Refresh Token。
- 退出登录撤销当前 Refresh Token。
- Access Token 过期后最多存在短时不可立即撤销窗口，这是 MVP 接受的权衡。

### 15.2 密码

- 使用 Spring Security BCryptPasswordEncoder。
- 不记录原始密码。
- 登录失败统一返回相同提示，避免用户名枚举。
- 生产入口对注册、登录、刷新接口设置限流。
- 日志禁止出现 password、accessToken、refreshToken 和 Authorization。

### 15.3 用户数据隔离

每个用户资源查询都必须包含 user_id 条件。禁止先按资源 ID 查询，再仅在 controller 中判断归属。

repository 集成测试至少验证：

- 用户 A 无法读取用户 B 的账目。
- 用户 A 无法修改或删除用户 B 的账目。
- 用户 A 无法使用用户 B 的分类创建账目。
- 无权访问时不泄露资源存在性。

### 15.4 基础 Web 安全

- 生产环境只接受 HTTPS。
- 限制 JSON 请求体大小。
- 对字段执行白名单校验。
- 数据访问使用 JPA 参数化查询。
- 管理端上线前配置严格 CORS；原生 App 不依赖浏览器 CORS。
- JWT 签名密钥、数据库密码只从环境变量或密钥管理系统注入。
- 生产错误响应不暴露堆栈、SQL 和内部类名。

## 16. 配置与环境

### 16.1 环境划分

| 环境 | 用途 | 数据 |
| --- | --- | --- |
| local | 单人本地开发 | 本地 MySQL 容器 |
| test | 自动化测试 | Testcontainers 临时 MySQL |
| staging | 联调和发布前验证 | 独立非生产数据 |
| production | 正式服务 | 生产数据 |

### 16.2 后端配置

application.yml 只保存非敏感默认值，环境差异通过 profile 和环境变量覆盖。

关键环境变量：

    DB_URL
    DB_USERNAME
    DB_PASSWORD
    JWT_SIGNING_KEY
    ACCESS_TOKEN_TTL
    REFRESH_TOKEN_TTL
    ALLOWED_ORIGINS

仓库提供 .env.example，但不提交真实 .env。

### 16.3 移动端配置

- local、staging、production 使用不同 API Base URL。
- Android 模拟器访问宿主机时使用平台适用地址，不在业务代码硬编码。
- 构建环境配置集中在 src/app/config.ts。
- 生产构建不得指向 local 或 staging API。

## 17. 部署架构

### 17.1 本地开发

本地 compose 只负责必要基础设施：

    Developer
      ├── React Native Metro / Android Emulator
      ├── Spring Boot API
      └── Docker Compose MySQL

Spring Boot 可直接从 IDE 或 Maven 运行，便于调试；MySQL 使用固定主版本和持久化 volume。

### 17.2 MVP 生产部署

    Internet
        ↓
    TLS Reverse Proxy
        ↓
    Spring Boot Container
        ↓
    MySQL
        ↓
    Encrypted Backup

初期单实例足够。只有监控表明容量不足或可用性目标提升时，才扩展为多实例并补充无状态部署要求。

### 17.3 发布流程

1. CI 完成静态检查和自动化测试。
2. 构建不可变后端镜像。
3. 在 staging 执行 Flyway migration。
4. 部署 staging 并完成冒烟测试。
5. 备份生产数据库。
6. 执行生产迁移和应用发布。
7. 检查健康、错误率和关键接口。
8. 异常时回滚应用；数据库迁移优先采用向前修复，避免危险的自动降级脚本。

### 17.4 备份

- 每日自动备份。
- 保留策略根据上线后的数据规模确定，初始建议至少保留 7 个日备份和 4 个周备份。
- 备份应加密并与主数据库故障域隔离。
- 每月至少执行一次恢复演练。
- 未验证可恢复性的备份不视为有效备份。

## 18. 可观测性

### 18.1 日志

后端使用结构化日志，至少包含：

- timestamp
- level
- requestId
- method
- path
- status
- durationMs
- userId，认证成功后记录内部 ID
- errorCode

不记录密码、Token、完整请求体和敏感个人信息。

### 18.2 健康检查

通过 Actuator 提供：

- liveness：进程是否存活。
- readiness：应用是否可接收请求，包含数据库连接状态。

健康端点不暴露环境变量、Bean、配置详情等敏感信息。

### 18.3 指标

MVP 关注：

- HTTP 请求量、延迟、4xx 和 5xx 比例。
- 登录和刷新失败次数。
- 数据库连接池使用率。
- 慢查询。
- JVM 内存、GC、线程和 CPU。
- 新增账目成功与失败次数。

初期无需建设复杂追踪系统；requestId 足以支持单体链路排查。

## 19. 测试策略

### 19.1 后端

#### 单元测试

- 金额校验。
- 分类层级和类型校验。
- 月份到 UTC 查询区间转换。
- 结余和占比计算。
- Refresh Token 轮换。
- 幂等新增账目。

#### Repository 集成测试

使用 Testcontainers MySQL 验证：

- Flyway 可从空库完整执行。
- 账目分页排序。
- 月度时间边界。
- 分类聚合统计。
- user_id 隔离。
- client_request_id 唯一约束。

#### Controller 测试

- 请求字段校验。
- HTTP 状态码。
- Problem Details 结构。
- 未认证、Token 过期。
- ID 和金额字符串序列化。

#### 核心流程集成测试

至少覆盖：

    注册
      → 默认分类存在
      → 新增支出
      → 月度列表可见
      → 月度统计更新
      → 修改金额
      → 统计同步变化
      → 删除账目
      → 统计恢复

### 19.2 移动端

#### 单元测试

- 金额输入和格式化。
- 日期月份边界。
- ApiError 解析。
- Query Key 生成。
- Token refresh 单飞逻辑。

#### 组件和页面测试

- 登录成功与失败。
- 账目表单校验。
- 保存期间按钮禁用。
- 列表加载、空、错误和成功状态。
- 删除确认。
- 统计空状态和数据状态。

#### 人工冒烟

每个可发布构建至少验证：

- 首次安装。
- 注册、退出、重新登录。
- App 重启恢复会话。
- 新增、编辑、删除收入和支出。
- 月份切换。
- 分类管理。
- 统计变化。
- 无网络失败和恢复重试。

iOS 需要在具备 macOS 和 Xcode 的环境中完成构建验证；Windows 本地无法代替这一验证。

### 19.3 测试优先级

| 优先级 | 必须自动化的内容 |
| --- | --- |
| P0 | 金额、用户隔离、认证、账目 CRUD、月度统计 |
| P1 | 分类管理、Token 并发刷新、分页边界 |
| P2 | 视觉回归、端到端设备自动化 |

## 20. CI 质量门禁

### 20.1 Mobile Pipeline

在 frontend/mobile 执行：

    pnpm install --frozen-lockfile
    pnpm lint
    pnpm exec tsc --noEmit
    pnpm test --runInBand

条件允许时增加 Android debug 构建。iOS 构建放在 macOS Runner。

### 20.2 Backend Pipeline

在 backend 执行：

    ./mvnw verify

verify 应包含：

- 编译。
- 单元测试。
- Testcontainers 集成测试。
- Flyway 从空库迁移验证。
- OpenAPI 导出或契约变更检查。

### 20.3 合并要求

- 所有必需检查通过。
- 不提交密钥和本地环境文件。
- 数据库结构变更包含新 migration。
- 接口变更同步更新 OpenAPI 与本文档相关章节。
- 用户可见行为变更包含对应测试或明确的人工验证记录。

## 21. 分阶段实施计划

### Phase 0：工程基础

目标：移动端和后端都能稳定构建，为业务开发建立最小基础。

后端：

- 初始化 Spring Boot、Java 21、Maven Wrapper。
- 接入 Web、Validation、Security、JPA、Flyway、MySQL、Actuator。
- 建立 local 配置和 Testcontainers。
- 建立统一错误结构和 requestId。
- 建立 users、refresh_tokens、categories、transactions migration。

移动端：

- 移除模板页面。
- 建立 src/app、features、shared 目录。
- 接入导航、TanStack Query、安全存储。
- 建立 API 环境配置和基础 apiClient。
- 保留可运行的最小页面和测试。

验收：

- 后端可启动并通过 readiness。
- migration 可在空 MySQL 执行。
- Android App 可启动并切换基础导航。
- 两端 lint、类型检查和测试可运行。

### Phase 1：认证与默认分类

目标：完成用户进入系统和恢复会话。

- 注册、登录、刷新、退出接口。
- 默认分类初始化。
- 当前用户接口。
- 移动端登录、注册、启动恢复会话。
- Keychain / Keystore 安全存储。
- 认证和用户隔离测试。

验收：

- 新用户注册后能看到默认分类。
- App 重启后可恢复登录。
- Refresh Token 轮换有效。
- 用户无法访问其他用户数据。

### Phase 2：记账闭环

目标：用户能完整管理收入和支出。

- 分类查询、创建、修改、停用。
- 账目新增、详情、分页列表、编辑、删除。
- 首页按月展示并按日期分组。
- 账目表单和分类管理页面。
- 新增幂等和关键错误状态。

验收：

- 收入、支出都能新增。
- 金额、分类、时间和备注正确保存。
- 编辑后列表立即更新。
- 删除需确认且删除后不再出现。
- 重复提交不会生成重复账目。
- 停用分类不影响历史账目显示。

### Phase 3：统计闭环

目标：统计与账目实时一致。

- 月度概览接口和页面。
- 收入、支出分类分布接口和页面。
- 月份切换。
- 账目变更后的缓存失效。
- 空数据和错误状态。

验收：

- 收入、支出、结余、次数计算正确。
- 分类金额总和等于对应类型总额。
- 增删改账目后统计能刷新到正确值。
- 时区月末边界测试通过。

### Phase 4：发布准备

目标：形成可部署、可观察、可恢复的 MVP。

- 完善 CI。
- staging 部署。
- TLS、限流、密钥注入。
- 日志、健康、指标。
- 数据库备份和恢复演练。
- Android 主路径回归。
- iOS 在 macOS 环境构建和回归。
- 隐私政策、应用权限和发布配置核对。

验收：

- staging 完整冒烟通过。
- 所有 P0 自动化测试通过。
- 生产配置不包含开发地址和默认密钥。
- 数据库备份成功且完成一次恢复验证。

## 22. MVP 完成定义

同时满足以下条件，才认为基础功能完成：

### 功能

- [ ] 用户可以注册、登录、退出和恢复会话。
- [ ] 新用户具有可用的默认分类。
- [ ] 用户可以管理一级分类和子分类。
- [ ] 用户可以新增收入和支出。
- [ ] 用户可以按月查看、筛选、编辑和删除账目。
- [ ] 用户可以查看月度收支、结余、次数和分类分布。
- [ ] 空数据、网络失败和校验失败都有清晰反馈。

### 正确性

- [ ] 金额全链路使用精确十进制。
- [ ] 月份边界按用户时区计算正确。
- [ ] 所有资源查询都包含用户隔离条件。
- [ ] 重试新增不会产生重复账目。
- [ ] 账目变更后列表和统计保持一致。

### 工程质量

- [ ] 后端数据库由 Flyway 管理。
- [ ] 两端均有可重复执行的构建和测试命令。
- [ ] P0 测试全部通过。
- [ ] API 契约有 OpenAPI 文档。
- [ ] 无密钥进入仓库。
- [ ] 关键保护逻辑具有说明原因的注释。

### 运行保障

- [ ] staging 环境可用。
- [ ] 健康检查和基础日志可用。
- [ ] 数据库已配置备份。
- [ ] 至少一次恢复演练成功。
- [ ] Android 和 iOS 主要路径均有验证记录。

## 23. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 需求尚未正式确认 | 返工 | 先锁定个人记账最小闭环，延后高级功能 |
| 金额误用浮点数 | 财务数据错误 | API 字符串、Java BigDecimal、MySQL DECIMAL、专项测试 |
| 时区导致跨月统计错误 | 列表和统计不一致 | UTC 存储、用户时区、半开区间、月末测试 |
| 并发刷新 Token | 用户随机掉线 | refresh 单飞、令牌轮换测试 |
| 网络重试重复记账 | 重复数据 | clientRequestId 和数据库唯一索引 |
| 分类停用破坏历史账目 | 历史数据无法展示 | 停用代替物理删除 |
| 过早建设后台或微服务 | 延迟 MVP | 明确延后范围和阶段门禁 |
| Windows 无法完整验证 iOS | iOS 构建问题延迟暴露 | macOS CI 或发布前专用验证环境 |
| MySQL 方言与测试库不一致 | 上线后查询失败 | Testcontainers 使用真实 MySQL |
| 没有账号找回渠道 | 用户忘记密码后无法恢复 | MVP 明示限制，绑定可信邮箱或手机号后再实现 |

## 24. 关键架构决策记录

### ADR-001：后端采用模块化单体

- 状态：Accepted
- 决策：单 Spring Boot 应用、单 MySQL 数据库，代码按业务模块隔离。
- 原因：当前功能和团队规模不需要分布式系统，单体能更快完成闭环并保持事务一致性。
- 重新评估条件：出现明确的独立伸缩、部署隔离或团队所有权边界。

### ADR-002：MVP 采用在线优先

- 状态：Accepted
- 决策：服务端为事实来源，不实现离线写入队列。
- 原因：完整离线同步需要冲突检测、重放、幂等和状态可视化，会显著扩大第一阶段范围。
- 重新评估条件：用户调研证明无网记账是核心使用场景。

### ADR-003：金额使用字符串、BigDecimal 和 DECIMAL

- 状态：Accepted
- 决策：JSON 字符串、Java BigDecimal、MySQL DECIMAL(19, 2)。
- 原因：避免二进制浮点误差。
- 影响：客户端展示和输入不得直接依赖 Number 累计金额。

### ADR-004：分类停用而非删除历史引用

- 状态：Accepted
- 决策：被历史账目引用的分类只停用。
- 原因：保证历史账目完整，同时阻止新账目继续使用。

### ADR-005：统计实时查询，不预计算

- 状态：Accepted
- 决策：MVP 直接对账目表聚合。
- 原因：个人账目数据量有限，实时查询最简单且一致。
- 重新评估条件：基于真实慢查询和容量指标确认需要优化。

### ADR-006：管理后台延后

- 状态：Accepted
- 决策：移动端记账闭环和后端基础接口稳定前不初始化 admin 工程。
- 原因：当前没有必须通过后台才能完成的 MVP 用例。

## 25. 开发执行顺序

严格按依赖关系推进，避免移动端长期使用临时接口：

1. 后端工程、MySQL、Flyway、错误结构、健康检查。
2. 认证数据表和认证 API。
3. 移动端导航、API Client、安全会话。
4. 分类 API 和默认分类。
5. 移动端分类选择与管理。
6. 账目 CRUD API。
7. 移动端首页、表单、详情。
8. 统计 API。
9. 移动端统计页面。
10. CI、staging、备份和发布验证。

每一项完成后都应具备最小可验证结果，不同时铺开预算、后台、离线同步等延后功能。

## 26. 文档维护规则

- 实现与本文档不一致时，以已经确认的产品需求为最高依据，并同步更新文档。
- 新增数据库表、公开 API、跨模块依赖或基础设施时，应补充本文件或独立 ADR。
- 小型实现细节不必都写入架构文档，避免文档变成代码复述。
- 每个 Phase 结束时核对范围、接口、数据模型和完成定义。
- 文档中的“目标结构”表示规划，不代表对应文件已经存在。
