# investment-vue3 分步实施方案

## 1. 目标

新建一个 `investment-vue3` 项目，使用 Vue 3 实现当前 `investment-front` 的同等功能，并尽量保持 `investment-server` 不变。

本次迁移的原则：

- 后端接口路径、请求参数、响应结构尽量不改
- 页面功能和业务流程先对齐，再逐步优化代码结构和交互
- 优先迁移高价值页面，保证每一步都可以独立运行和验收
- 新前端与旧前端可并行存在，直到 Vue3 版本稳定后再切换

## 2. 当前系统梳理

### 2.1 现有前端技术栈

`investment-front` 当前为：

- Vue 2
- Vue Router 3
- Vuex 3
- Element UI
- Axios
- SCSS

### 2.2 现有业务模块

根据路由和页面文件，当前主要模块如下：

1. 登录
2. Dashboard
3. Bargain Hunting
4. 数据分析
5. 历史/待处理数据
6. 数据验证、结果比较
7. 策略管理
8. 策略列表、创建、编辑
9. Company Valuation
10. 公司估值列表
11. 公司估值详情
12. 大 V 推荐列表与详情
13. 参数设置
14. 宏观参数
15. 行业参数

### 2.3 现有前后端接口契约

当前前端 API 基本直接对应 `investment-server`，例如：

- 登录：`/user/login`、`/user/info`、`/user/logout`
- 数据分析：`/analyte/*`、`/verification/*`
- 策略：`/strategy/*`
- 公司估值：`/company/*`
- 参数设置：`/settings/macro/*`、`/settings/industry/*`

当前前端还有这些约定：

- 响应格式为统一对象，成功码使用 `code === 20000`
- Token 放在请求头 `X-Token`
- 登录后通过 `/user/info` 获取用户名和头像
- 前端当前使用 `process.env.VUE_APP_BASE_API`

这意味着 Vue3 版可以直接复用原有后端接口设计，只需要在新前端中保持同样的请求封装和错误处理。

## 3. 目标技术方案

建议采用以下技术栈：

- Vue 3
- Vite
- Vue Router 4
- Pinia
- Element Plus
- Axios
- Sass

选择理由：

- `investment-front` 是典型后台管理系统，Element Plus 与现有 Element UI 组件模型最接近，迁移成本最低
- Vite 启动和构建速度更快，适合作为新项目基座
- Pinia 是 Vue3 下更自然的状态管理方案，替代 Vuex

## 4. 与 investment-server 的兼容策略

### 4.1 后端保持不变

默认不改 `investment-server` 的 Controller、Service、Mapper 和数据库结构。

### 4.2 前端兼容适配

新前端需要保留以下行为：

- 登录请求结构不变
- 统一处理 `code !== 20000` 的错误
- 请求头继续携带 `X-Token`
- 保持原有接口 URL 不变
- 保持页面字段命名尽量与后端返回一致，减少转换层复杂度

### 4.3 开发环境联调方式

建议新前端使用 Vite Proxy：

- 浏览器请求 `/api/**`
- Vite 转发到 `http://localhost:8080`
- 转发时去掉 `/api` 前缀

这样可以：

- 避免开发期 CORS 问题
- 保持后端接口无需增加 `/api` 前缀
- 后续部署时也更容易切换网关或反向代理

## 5. 迁移策略

不建议一次性全部重写后再验收。更稳妥的方式是分步推进，每一步都能运行、可回归、可确认。

建议采用“先基础设施，再业务模块”的迁移路线。

## 6. 分步实施计划

### 第 1 步：搭建 Vue3 项目骨架

目标：

- 创建 `investment-vue3`
- 初始化 Vite + Vue3 + Vue Router + Pinia + Element Plus + Axios + Sass
- 建立基础目录结构
- 配置 `.env`、Vite Proxy、ESLint 基础规则

输出物：

- 可启动的新项目
- 空白布局页、登录页、404 页
- 基础请求模块和路由模块

验收标准：

- `npm install` 可成功
- `npm run dev` 可启动
- 可以打开登录页和基础 Layout

### 第 2 步：迁移基础设施层

目标：

- 迁移请求封装
- 迁移登录态持久化
- 迁移权限控制与路由守卫
- 迁移主布局：侧边栏、顶部栏、内容区
- 建立菜单配置驱动

输出物：

- `src/api` 基础层
- `src/stores/user.ts`
- `src/router` 与 `src/layout`
- 通用错误提示、全局 loading 规则

验收标准：

- 登录、获取用户信息、退出登录可用
- Layout 展示正常
- 菜单与页面跳转正常

### 第 3 步：迁移公司估值模块

优先级最高，原因：

- 页面价值高
- 后端接口清晰
- 能快速验证新框架是否能承载复杂表格与详情页

迁移范围：

- 公司估值列表 `companylist`
- 公司详情 `companydetail`
- 相关 API：`/company/all`、`/company/{id}`、`/company/add`、`/company/updateReport`、`/company/updateGrowthRate`、`/company/reValuateAll`、`/company/updatePriceAll`

验收标准：

- 列表查询、展示、排序、过滤正常
- 新增公司、更新财报、更新股价、全部重估可用
- 双击或点击进入详情页正常
- 详情页数据区块完整显示

### 第 4 步：迁移参数设置模块

迁移范围：

- 宏观参数
- 行业参数

验收标准：

- 参数读取、修改、保存正常

### 第 5 步：迁移策略模块

迁移范围：

- 策略列表
- 策略创建/编辑
- 子策略组件 `TacticsItem`

这是复杂度较高的一步，因为页面表单和嵌套结构较多。

验收标准：

- 列表展示、删除、批量删除、比较入口正常
- 策略新增、编辑、保存正常
- 策略相关接口联调通过

### 第 6 步：迁移数据分析模块

迁移范围：

- 新数据列表
- 历史数据列表
- 数据验证
- 验证结果比较

这是业务交互最重的一组页面，建议放在后面处理。

验收标准：

- 列表展示与筛选正常
- 验证流程正常
- 比较页面结果正常

### 第 7 步：联调、回归与切换准备

目标：

- 全量菜单联调
- 样式回归
- 接口错误处理回归
- 浏览器兼容性检查
- 与旧版功能对照核验

验收标准：

- 主要业务路径全部走通
- 未发现阻断级功能缺失
- 可以开始替换旧版前端作为主前端

## 7. 建议目录结构

```text
investment-vue3/
  src/
    api/
    assets/
    components/
    layout/
    router/
    stores/
    styles/
    utils/
    views/
      login/
      dashboard/
      analyte/
      strategy/
      valuation/
      settings/
    App.vue
    main.ts
  .env.development
  .env.production
  vite.config.ts
  package.json
```

## 8. 关键迁移原则

### 8.1 API 层先兼容，不先重构

先把每个旧接口模块原样迁移到 Vue3，名称和入参尽量不动。等功能稳定后，再做 API 命名优化和类型收敛。

### 8.2 页面迁移优先“行为一致”

第一阶段不追求界面大改版，优先保证：

- 菜单一致
- 表单一致
- 表格字段一致
- 页面流程一致

### 8.3 复杂页面分拆为组合式函数和子组件

像 `companylist.vue`、`strategylist.vue`、`strategyedit.vue` 这类 300 到 500 行页面，不建议直接原样粘贴。迁移时拆成：

- 页面容器
- 表格列配置
- 对话框组件
- 表单片段组件
- `useXxxPage` 组合式逻辑

这样后面维护成本会低很多。

## 9. 风险与对策

### 风险 1：Element UI 到 Element Plus 组件细节差异

表现：

- `slot-scope`、`.sync`、事件名、表单校验、表格行为存在差异

对策：

- 基础设施阶段先建立一个最小可运行页面验证组件用法
- 对复杂表格页面逐页迁移，不进行机械替换

### 风险 2：旧页面中存在 Vue2 风格写法

表现：

- `this.$refs`
- 过滤器
- `@keyup.enter.native`
- `slot-scope`
- 全局原型扩展，如 `String.prototype.restfulFormat`

对策：

- Vue3 中统一替换为工具函数和标准写法
- 不继续保留全局原型污染

### 风险 3：部分旧前端接口定义与后端实现不完全一致

我在梳理时已经看到这类迹象，例如旧前端里有少量 `delete`、`patch` 接口不一定在当前后端 controller 中出现。

对策：

- 每迁移一个模块就同步核对后端 controller
- 以当前 `investment-server` 实际接口为准
- 若发现旧功能已失效，再决定是修前端、补后端，还是下线功能

## 10. 推荐实施顺序

建议你按下面顺序让我逐步做，每一步你确认后我再继续：

1. 创建 `investment-vue3` 项目骨架
2. 完成登录、Layout、路由、请求封装
3. 迁移公司估值模块
4. 迁移参数设置模块
5. 迁移策略模块
6. 迁移数据分析模块
7. 做整体联调和收尾

## 11. 我建议的执行方式

建议采用分步实施，而不是一次性全部开工。

原因很直接：

- 当前旧前端页面不少，复杂页较多
- Element UI 到 Element Plus 不是纯语法替换
- 后端虽然基本可复用，但每个模块最好边迁移边联调

如果你同意，我下一步就从“第 1 步：创建 `investment-vue3` 项目骨架”开始，直接落代码。
