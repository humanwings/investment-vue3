# investment-vue3 技术架构入门说明

这份文档面向“只掌握 Vue 3 基本语法”的初学者。目标不是讲完所有细节，而是帮你先建立一个能读懂项目的整体地图。

## 1. 先用一个生活类比理解这个项目

可以把 `investment-vue3` 想成一座“投资分析后台办公楼”：

- `main.js` 是大楼总入口，负责把水电煤都接上。
- `router/` 是楼层导览图，决定访问哪个 URL 时该去哪个页面。
- `layout/` 是大楼公共区域，包含侧边栏、顶部栏、面包屑、内容区。
- `views/` 是每个具体办公室，也就是每个业务页面。
- `api/` 是前台电话总机，负责和后端接口沟通。
- `stores/` 是公共储物柜，保存登录信息、侧边栏状态等共享状态。
- `utils/` 是常用工具箱，放格式化、鉴权、请求封装等通用函数。
- `styles/` 是统一装修规范，定义全局视觉风格。

如果你第一次读这种后台项目，最重要的是先理解：

1. 页面切换靠路由，不是手工 `if/else` 切组件。
2. 数据大多来自后端接口，不是写死在页面里。
3. 很多页面长得像，是因为它们共享同一套布局、样式和请求方式。

## 2. 一张总图：应用是怎么跑起来的

```text
浏览器访问 URL
    |
    v
src/main.js
    |
    +-- 挂载 Pinia
    +-- 挂载 Vue Router
    +-- 挂载 Element Plus
    +-- 加载 permission.js 和全局样式
    |
    v
src/App.vue
    |
    v
<router-view />
    |
    v
router/routes.js 决定当前显示哪个页面
    |
    +-- 登录页: views/login
    +-- 主布局: layout/index.vue
             |
             +-- AppSidebar
             +-- AppTopbar
             +-- PageContainer
                        |
                        v
                    具体业务 views/*
```

这也是你读代码的推荐顺序：

1. `src/main.js`
2. `src/App.vue`
3. `src/router/routes.js`
4. `src/layout/`
5. `src/views/某个页面.vue`
6. 这个页面用到的 `src/api/*.js`

## 3. 基本框架：这套项目的核心技术栈

从 [package.json](/mnt/d/develop/source/investment-vue3/package.json) 可以看到，这个项目的主框架是：

- `Vue 3`：前端页面框架，页面组件都是 `.vue` 单文件组件。
- `Vite`：开发服务器和打包工具，替代传统的 webpack 脚手架体验。
- `Vue Router 4`：负责页面跳转和路由嵌套。
- `Pinia`：Vue 3 官方推荐的状态管理方案。
- `Element Plus`：后台管理系统常见的 UI 组件库。
- `Axios`：发送 HTTP 请求。
- `js-cookie`：把 token、侧边栏状态等保存在浏览器 Cookie。
- `Sass`：写更方便的样式。

### 为什么是 Vite，而不是 Vue CLI

`vite.config.js` 说明这项目是 Vite 工程。你可以把 Vite 理解成：

- 开发阶段启动更快
- 配置更轻
- 更适合 Vue 3 新项目

在 [vite.config.js](/mnt/d/develop/source/investment-vue3/vite.config.js) 里还做了几件很关键的事：

- 配置别名 `@ -> src`
- 开发端口固定为 `9529`
- 代理 `/api -> http://localhost:8080`
- 构建时按依赖拆包，比如 Vue、Axios、Element Plus 分开打包

这意味着你在代码里看到：

```js
import router from '@/router'
```

其实就是：

```js
import router from './src/router'
```

## 4. 各种 lib 在项目里的职责

这一节只讲“它在这个仓库里到底干什么”。

### 4.1 Vue 3

项目页面基本都使用 `script setup` 写法，例如：

- [src/views/login/index.vue](/mnt/d/develop/source/investment-vue3/src/views/login/index.vue)
- [src/views/dashboard/index.vue](/mnt/d/develop/source/investment-vue3/src/views/dashboard/index.vue)
- [src/views/valuation/companylist.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.vue)

你会频繁看到：

- `ref()`：定义基础响应式数据
- `reactive()`：定义对象型响应式数据
- `computed()`：根据已有状态派生数据
- `defineProps()`：子组件接收父组件参数

### 4.2 Vue Router

路由入口在 [src/router/index.js](/mnt/d/develop/source/investment-vue3/src/router/index.js)，真正的路由表在 [src/router/routes.js](/mnt/d/develop/source/investment-vue3/src/router/routes.js)。

这个项目的路由有几个特点：

- 登录页单独放在 `/login`
- 主业务页都挂在 `Layout` 下面
- 路由是多层嵌套的
- 菜单标题、图标、隐藏状态都写在 `meta` 中

例如：

- `/companyvaluation/valuation/company` 对应公司估值列表
- `/companyvaluation/valuation/company/:id` 对应公司详情
- `/barginhunting/strategy/strategylist` 对应策略列表

这里的 `meta` 很重要：

- `title`：页面标题、面包屑、菜单文案都会用到
- `icon`：侧边栏图标
- `hidden`：是否在菜单中隐藏
- `activeMenu`：详情页激活哪个菜单

所以这项目的菜单不是单独写一份，而是“从路由配置推导出来”。

### 4.3 Pinia

Pinia 入口很简单，在 [src/stores/index.js](/mnt/d/develop/source/investment-vue3/src/stores/index.js)。

当前最重要的两个 store：

- [src/stores/user.js](/mnt/d/develop/source/investment-vue3/src/stores/user.js)
- [src/stores/app.js](/mnt/d/develop/source/investment-vue3/src/stores/app.js)

它们分别负责：

- `user store`
  - 保存 token、用户名、头像
  - 登录、拉取用户信息、退出登录
- `app store`
  - 保存侧边栏展开/折叠状态
  - 保存是否移动端
  - 控制移动端抽屉菜单开关

对初学者来说，Pinia 可以先这样理解：

- `views/` 是具体页面
- `stores/` 是跨页面共享的数据和动作

如果一个状态只在当前页面用，一般放页面内。
如果多个页面或公共布局都要用，一般放 store。

### 4.4 Element Plus

Element Plus 的注册在 [src/plugins/element-plus.js](/mnt/d/develop/source/investment-vue3/src/plugins/element-plus.js)。

这个项目不是“整库全量注册”，而是手工挑选组件注册，比如：

- `ElForm`
- `ElInput`
- `ElTable`
- `ElDialog`
- `ElPagination`
- `ElSelect`
- `ElTabs`
- `ElTag`

同时也单独引入了对应的 CSS。

这样做的好处是：

- 更清楚项目用了哪些组件
- 构建产物相对可控
- 方便后续拆包优化

### 4.5 Axios

Axios 的统一封装在 [src/utils/request.js](/mnt/d/develop/source/investment-vue3/src/utils/request.js)。

这是非常值得初学者重点看的文件，因为它决定了“全项目怎么请求后端”。

它做了三件事：

1. 创建统一请求实例
2. 在请求拦截器里自动带上 `X-Token`
3. 在响应拦截器里统一处理后端返回码和错误提示

这意味着页面里不需要每次都手工判断登录态、弹错误消息，很多共通逻辑都集中在这里了。

### 4.6 js-cookie

Cookie 工具主要在两个地方用到：

- [src/utils/auth.js](/mnt/d/develop/source/investment-vue3/src/utils/auth.js)
  - 保存登录 token
- [src/stores/app.js](/mnt/d/develop/source/investment-vue3/src/stores/app.js)
  - 保存侧边栏开关状态

你可以把它理解成“浏览器本地的小型持久化存储”。

### 4.7 Sass

全局样式入口在 [src/styles/index.scss](/mnt/d/develop/source/investment-vue3/src/styles/index.scss)。

这里定义了很多全局设计变量，比如：

- 颜色变量
- 圆角变量
- 卡片间距
- 按钮样式
- 列表页/卡片页的通用布局

这说明项目虽然页面很多，但视觉语言是统一管理的。

## 5. 目录构成：每个目录应该怎么理解

项目核心目录如下：

```text
investment-vue3/
├─ public/              静态资源
├─ docs/                项目文档
├─ src/
│  ├─ api/              所有后端接口封装
│  ├─ layout/           后台公共布局
│  ├─ plugins/          插件注册
│  ├─ router/           路由
│  ├─ stores/           Pinia 状态管理
│  ├─ styles/           全局样式
│  ├─ utils/            工具函数
│  ├─ views/            所有业务页面
│  ├─ App.vue           根组件
│  ├─ main.js           应用入口
│  ├─ permission.js     路由守卫
│  └─ codebook.js       业务枚举/选项字典
├─ package.json
└─ vite.config.js
```

### 5.1 `src/api/`

这是“接口层”，每个文件一般对应一块业务域：

- `company.js`：公司估值相关接口
- `strategy.js`：策略相关接口
- `analyte.js`：数据分析相关接口
- `verification.js`：验证结果相关接口
- `user.js`：登录、用户信息、退出登录

优点是页面不用直接写 axios，而是调用语义化函数，例如：

```js
await getCompanyList()
await updatePrice(companyId)
await createStrategy(data)
```

这种分层方式很适合初学者学习，因为职责清晰：

- `view` 负责页面交互
- `api` 负责请求后端

### 5.2 `src/layout/`

这是整个后台系统的“公共壳子”。

关键文件：

- [src/layout/index.vue](/mnt/d/develop/source/investment-vue3/src/layout/index.vue)
- [src/layout/components/AppSidebar.vue](/mnt/d/develop/source/investment-vue3/src/layout/components/AppSidebar.vue)
- [src/layout/components/AppTopbar.vue](/mnt/d/develop/source/investment-vue3/src/layout/components/AppTopbar.vue)
- [src/layout/components/AppBreadcrumb.vue](/mnt/d/develop/source/investment-vue3/src/layout/components/AppBreadcrumb.vue)
- [src/layout/components/PageContainer.vue](/mnt/d/develop/source/investment-vue3/src/layout/components/PageContainer.vue)

只要某个页面在路由里挂到 `Layout` 下面，它就会自动拥有：

- 左侧导航栏
- 顶部栏
- 面包屑
- 内容容器

### 5.3 `src/router/`

路由层负责：

- URL 和页面组件的映射
- 页面嵌套结构
- 菜单元数据
- 重定向
- 404 页面处理

这项目里“菜单结构”和“路由结构”几乎是一体的，这种方式在后台项目里很常见。

### 5.4 `src/stores/`

这里现在文件不多，但作用非常核心。

- `user.js`：登录态
- `app.js`：UI 状态
- `index.js`：创建 Pinia

数量少，说明当前项目状态管理还比较克制，没有过度抽象。

### 5.5 `src/utils/`

这里放通用工具：

- `request.js`：axios 封装
- `auth.js`：token 读写
- `get-page-title.js`：设置浏览器标题
- `index.js`：数字格式化、RESTful 路径替换等通用函数

例如 `restfulFormat('/company/{id}', { id })` 这种写法，就是为了减少字符串拼接错误。

### 5.6 `src/views/`

这里是页面主体，按业务模块分目录：

- `dashboard/`：首页概览
- `login/`：登录页
- `valuation/`：公司估值、宏观参数、行业参数
- `settings/`：系统参数相关页面
- `strategy/`：策略列表、策略编辑
- `analyte/`：新数据、历史数据、验证
- `error/`：404 页面
- `placeholder/`：嵌套路由中的占位页

### 5.7 `src/codebook.js`

这是一个很容易被忽略、但业务价值很高的文件。

它维护了很多“业务字典”：

- 策略分类和子分类
- 比较符选项
- 买入卖出规则选项
- 上市状态
- 推荐原因

这类文件本质上是“前端版业务枚举中心”。

## 6. 共通组件：哪些东西是全项目复用的

严格来说，这个项目当前“全局复用组件”数量不算很多，最核心的复用在 `layout/components`。

### 6.1 `AppSidebar`

作用：

- 根据 `router/routes.js` 生成左侧菜单
- 根据当前路由高亮当前菜单
- 支持桌面端折叠、移动端抽屉

初学者要特别注意：

- 菜单项并不是写死的
- 它是从 `appRoutes` 过滤、拼接出来的

这说明改菜单，很多时候不是改组件，而是改路由配置。

### 6.2 `AppTopbar`

作用：

- 显示顶部导航区
- 显示用户信息
- 提供退出登录入口
- 控制移动端/桌面端导航开关

它会读取 `userStore` 和 `appStore`，是典型的“公共组件读取全局状态”的例子。

### 6.3 `AppBreadcrumb`

作用：

- 根据 `route.matched` 自动生成面包屑

也就是说，面包屑同样是从路由信息推导出来的，不需要每个页面单独维护。

### 6.4 `PageContainer`

作用很简单：

- 作为业务页面的内容承载区
- 内部继续放一个 `<router-view />`

虽然简单，但它体现了路由嵌套的常见写法。

### 6.5 页面级复用组件：`TacticsItem`

[src/views/strategy/TacticsItem.vue](/mnt/d/develop/source/investment-vue3/src/views/strategy/TacticsItem.vue) 不是全站通用组件，但它是“业务复用组件”的典型代表。

它的作用是：

- 根据策略类型，动态渲染不同的输入控件
- 把复杂策略编辑逻辑从主页面 `strategyedit.vue` 中拆出来

这个组件很值得学习，因为它展示了：

- `props` 的使用
- `computed` 条件渲染
- 业务字典 `codebook.js` 的结合使用

## 7. 页面层是怎么组织的

这个项目里的页面，大致可以分成 4 类。

### 7.1 登录页

代表文件：

- [src/views/login/index.vue](/mnt/d/develop/source/investment-vue3/src/views/login/index.vue)

特征：

- 表单输入
- 表单校验
- 调用 `userStore.loginAction`
- 登录成功后跳转

这是“表单 + store + 路由跳转”的最基础组合。

### 7.2 看板页 / 首页

代表文件：

- [src/views/dashboard/index.vue](/mnt/d/develop/source/investment-vue3/src/views/dashboard/index.vue)

特征：

- 通过多个 API 聚合数据
- 用卡片形式做概览展示
- 用 `Promise.allSettled()` 并行请求多个接口

它适合初学者学习“一个页面如何同时拉多个数据源”。

### 7.3 列表页

代表文件：

- [src/views/valuation/companylist.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.vue)
- `analyte/waitlist.vue`
- `analyte/donelist.vue`
- `strategy/strategylist.vue`

它们通常具有这些共性：

- 页面头部
- 表格展示
- 加载态 `v-loading`
- 弹窗新增/编辑
- 行内操作按钮
- 调用 API 后刷新局部数据或整个列表

这类页面是后台管理项目的主力页面。

### 7.4 详情页 / 编辑页

代表文件：

- `valuation/companydetail.vue`
- [src/views/strategy/strategyedit.vue](/mnt/d/develop/source/investment-vue3/src/views/strategy/strategyedit.vue)

特点：

- 通过路由参数获取当前对象 ID
- 拉取详情数据
- 允许修改后提交
- 常配合 `activeMenu` 保持菜单高亮

## 8. 几条非常关键的“共通机制”

这部分最值得初学者反复看。

### 8.1 登录鉴权机制

登录相关链路如下：

```text
登录页输入用户名密码
    |
    v
userStore.loginAction()
    |
    v
api/user.js -> /user/login
    |
    v
token 写入 Cookie
    |
    v
permission.js 路由守卫检查 token
    |
    +-- 有 token: 允许继续，并拉取用户信息
    +-- 没 token: 跳转 /login
```

对应关键文件：

- [src/views/login/index.vue](/mnt/d/develop/source/investment-vue3/src/views/login/index.vue)
- [src/stores/user.js](/mnt/d/develop/source/investment-vue3/src/stores/user.js)
- [src/utils/auth.js](/mnt/d/develop/source/investment-vue3/src/utils/auth.js)
- [src/permission.js](/mnt/d/develop/source/investment-vue3/src/permission.js)

### 8.2 路由驱动菜单机制

```text
routes.js 写 meta.title / icon / hidden
    |
    v
AppSidebar 读取 appRoutes
    |
    v
自动生成菜单
    |
    v
当前 route 决定高亮项
```

这意味着：

- 增加页面时，通常先改路由
- 菜单是否显示，也主要看路由配置

### 8.3 统一请求机制

```text
页面组件
    |
    v
api/*.js
    |
    v
utils/request.js
    |
    +-- 自动带 token
    +-- 统一处理错误
    +-- 返回 response.data
    |
    v
后端接口
```

这是一种非常典型、也非常推荐的后台项目结构。

### 8.4 全局样式机制

项目没有把样式完全散落在每个页面，而是在 `styles/index.scss` 里先定义公共卡片、标题、按钮、表格容器的风格。

好处是：

- 新页面更容易保持统一
- 页面作者不必每次从零开始写布局

## 9. 一个真实代码路径示例：从“打开公司估值页”看全链路

假设你打开“公司估值”页面，背后大致会发生这些事：

1. 浏览器访问 `/companyvaluation/valuation/company`
2. Vue Router 在 `routes.js` 中匹配到 `CompanyList`
3. 因为该路由挂在 `Layout` 下面，所以先显示公共布局
4. `PageContainer` 中的 `<router-view />` 渲染 `views/valuation/companylist.vue`
5. 页面初始化时调用 `getCompanyList()`
6. `getCompanyList()` 实际来自 `api/company.js`
7. `api/company.js` 底层使用 `utils/request.js`
8. `request.js` 自动附带 token，并统一处理返回码
9. 成功后数据回到页面，渲染到 `el-table`

如果你能看懂这条链路，其实已经能读懂这个项目的大多数页面了。

## 10. 初学者最值得先看的文件

如果你时间有限，我建议按下面顺序读：

1. [src/main.js](/mnt/d/develop/source/investment-vue3/src/main.js)
2. [src/router/routes.js](/mnt/d/develop/source/investment-vue3/src/router/routes.js)
3. [src/layout/index.vue](/mnt/d/develop/source/investment-vue3/src/layout/index.vue)
4. [src/layout/components/AppSidebar.vue](/mnt/d/develop/source/investment-vue3/src/layout/components/AppSidebar.vue)
5. [src/permission.js](/mnt/d/develop/source/investment-vue3/src/permission.js)
6. [src/utils/request.js](/mnt/d/develop/source/investment-vue3/src/utils/request.js)
7. [src/stores/user.js](/mnt/d/develop/source/investment-vue3/src/stores/user.js)
8. [src/views/login/index.vue](/mnt/d/develop/source/investment-vue3/src/views/login/index.vue)
9. [src/views/dashboard/index.vue](/mnt/d/develop/source/investment-vue3/src/views/dashboard/index.vue)
10. [src/views/valuation/companylist.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.vue)

读完这 10 个文件，你对整个项目的理解会快很多。

## 11. 这个项目值得特别介绍的点

### 11.1 它是“业务后台”思路，不是“展示官网”思路

所以你会看到：

- 路由层次很多
- 表格很多
- 表单很多
- 接口调用很多
- 视觉重点在信息密度和效率，而不是营销展示

### 11.2 路由、菜单、面包屑三者是联动的

这是很多初学者第一次看后台项目时最不习惯的地方。

在这里：

- 路由不只是“切页面”
- 还是菜单配置源
- 也是面包屑配置源

### 11.3 业务字典集中在 `codebook.js`

很多项目会把这些枚举分散在多个页面里，这个项目把策略相关选项集中收拢了，维护性更好。

### 11.4 页面样式已经形成了固定模板

比如很多页面会复用这些视觉结构：

- `page-shell`
- `page-card`
- `page-header`
- `table-card`
- `table-shell`
- `actions`
- `row-actions`

这是一种很典型的“后台页面模板化”思路。

## 12. 初学者常见误区

### 误区 1：以为菜单是写死在侧边栏里的

不是。这个项目里菜单主要来自路由配置。

### 误区 2：以为页面直接发 axios

也不是。推荐先通过 `api/*.js` 封装，再让页面调用。

### 误区 3：以为所有共享数据都必须进 Pinia

当前项目并没有这么做。很多只在单页内使用的数据，仍然直接放在页面组件中。

这其实是好事，说明没有过度设计。

### 误区 4：看到 `placeholder/section.vue` 以为它没用

它虽然只有一个 `<router-view />`，但在嵌套路由里非常有用，相当于中间层容器。

## 13. 你可以怎么继续学习这个项目

推荐按下面节奏上手：

1. 先跑起来项目，感受页面和菜单结构。
2. 打开 `routes.js`，对照页面实际跳转路径。
3. 选一个简单页面，例如登录页或 Dashboard，看它怎么取数据。
4. 再看一个列表页，例如公司估值页，看表格和接口调用。
5. 最后看策略编辑页，理解业务字典、子组件拆分和复杂表单。

## 14. 一句话总结

`investment-vue3` 是一个典型的 Vue 3 投资分析后台项目，核心架构是：

`Vite + Vue 3 + Vue Router + Pinia + Element Plus + Axios`

它的设计重点不是炫技，而是把“登录鉴权、路由菜单、公共布局、接口请求、业务页面”这几层分清楚。对初学者来说，最重要的不是一下子看完所有页面，而是先理解这五层如何串起来。
