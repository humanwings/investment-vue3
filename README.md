# investment-vue3

`investment-vue3` 是投资分析系统的 Vue 3 前端项目，目标是逐步替代旧版 `investment-front`，并尽量保持后端 `investment-server` 不变。

当前项目已经具备主要业务功能，属于可运行、可联调、可继续演进的状态。

## 技术栈

- Vue 3
- Vite
- Vue Router 4
- Pinia
- Element Plus
- Axios
- Sass

## 当前已覆盖的功能

- 登录页、基础 Layout、Dashboard、404
- 公司估值列表与详情
- 宏观参数、行业参数
- 大 V 推荐榜、推荐详情
- 大 V 管理、推荐权重规则
- 策略列表、策略编辑
- 新数据、历史数据、数据验证、验证结果比较

## 启动方式

安装依赖并启动开发环境：

```bash
npm install
npm run dev
```

默认开发地址：

- `http://localhost:9529`

默认开发代理：

- `/api` -> `http://localhost:8080`

如果后端不是 `8080`，请修改 [vite.config.js](/mnt/d/develop/source/investment-vue3/vite.config.js) 中的代理目标。

## 构建

```bash
npm run build
```

构建产物默认输出到 `dist/`。

## 项目结构

核心目录如下：

```text
investment-vue3/
├─ docs/                项目文档
├─ public/              静态资源
├─ src/
│  ├─ api/              后端接口封装
│  ├─ layout/           后台公共布局
│  ├─ plugins/          插件注册
│  ├─ router/           路由配置
│  ├─ stores/           Pinia 状态管理
│  ├─ styles/           全局样式
│  ├─ utils/            工具函数
│  ├─ views/            业务页面
│  ├─ App.vue           根组件
│  ├─ main.js           应用入口
│  ├─ permission.js     路由守卫
│  └─ codebook.js       业务枚举/选项字典
├─ package.json
└─ vite.config.js
```

## 文档导航

`docs/` 已按主题归类，完整入口见：

[docs/README.md](/mnt/d/develop/source/investment-vue3/docs/README.md)

下面是最常用的两份文档：

### 1. 分步实施方案

[investment-vue3-migration-plan.md](/mnt/d/develop/source/investment-vue3/docs/migration/investment-vue3-migration-plan.md)

这份文档主要回答“这个项目最初准备怎么迁移、为什么这样迁移、分几步做”。

适合在这些场景阅读：

- 想了解 `investment-vue3` 的建设背景
- 想知道它和旧项目 `investment-front`、后端 `investment-server` 的关系
- 想看迁移范围、分阶段目标、验收思路
- 想理解为什么技术栈选了 `Vue 3 + Vite + Pinia + Element Plus`

可以把它理解成“项目规划文档 / 迁移路线图”。

### 2. 技术架构入门说明

[investment-vue3-architecture-intro.md](/mnt/d/develop/source/investment-vue3/docs/architecture/investment-vue3-architecture-intro.md)

这份文档主要回答“这个前端项目现在是怎么组织起来的、初学者应该从哪里看起”。

适合在这些场景阅读：

- 只掌握 Vue 3 基本语法，第一次接触这个仓库
- 想快速理解入口、路由、布局、状态管理、API 分层
- 想知道各目录、共通组件、共通机制分别负责什么
- 想找一条更容易上手的阅读路径

可以把它理解成“项目地图 / 初学者架构导览”。

## 建议阅读顺序

如果你是第一次接触这个仓库，建议按下面顺序看：

1. 先看本 README，了解项目定位和文档入口
2. 再看 [investment-vue3-architecture-intro.md](/mnt/d/develop/source/investment-vue3/docs/architecture/investment-vue3-architecture-intro.md)，建立整体心智模型
3. 如需了解迁移背景和阶段规划，再看 [investment-vue3-migration-plan.md](/mnt/d/develop/source/investment-vue3/docs/migration/investment-vue3-migration-plan.md)
4. 最后进入 `src/` 阅读实际代码

## 当前说明

开发环境当前仍建议直接使用：

```bash
npm run dev
```

如果后续继续演进工程质量，建议补充：

- ESLint
- Prettier
- 基础单元测试或关键页面 smoke test
- CI 构建检查
