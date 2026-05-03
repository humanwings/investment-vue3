# investment-vue3 基础工程质量工具链说明

## 1. 这份文档是做什么的

这份文档解释本次为 `investment-vue3` 增加的“基础工程质量工具链”。

这里的“工具链”可以理解为：一组在开发阶段帮助团队自动检查代码质量、统一代码风格、验证关键功能、避免把坏代码合进主分支的工具。

这次补充的内容包括：

- ESLint
- Prettier
- 基础单元测试 / smoke test / 关键组件测试
- CI 构建检查
- API mock 基础设施
- 本地提交前质量拦截

---

## 2. 为什么需要这些工具

如果一个前端项目只有“能跑起来”，但没有自动检查，后续通常会出现这些问题：

- 不同人写代码风格不一致，代码越来越难读
- 一些低级错误直到运行时才暴露
- 改了一个页面，结果把另一个页面或路由搞坏了
- 本地能跑，提交到仓库后却构建失败
- 新成员接手时，不知道项目的基本质量标准是什么

工程质量工具链的作用，就是把这些问题尽量前置，在“提交前”或“合并前”就发现。

---

## 3. 这次增加的工具分别是什么

## 3.1 ESLint 是什么

ESLint 是 JavaScript / Vue 项目的静态代码检查工具。

它不会运行你的业务功能，而是直接扫描源码，检查：

- 是否有明显不合理的写法
- 是否有潜在错误
- 是否违反团队约定
- Vue 组件写法是否规范

可以把它理解为“代码语法和规范巡检器”。

### 为什么需要 ESLint

因为很多问题不需要等浏览器运行后才发现，例如：

- 变量定义了但没用
- 某些 API 用法不合适
- Vue 组件写法不规范
- 调试代码遗留在正式代码里

ESLint 的价值是：尽量在开发阶段、甚至保存代码后就发现这些问题。

### 本项目怎么配置的

配置文件是 [eslint.config.js](/mnt/d/develop/source/investment-vue3/eslint.config.js)。

当前配置做了这些事：

- 使用 `@eslint/js` 的基础推荐规则
- 使用 `eslint-plugin-vue` 的 `flat/recommended` 规则集
- 让 ESLint 同时认识浏览器环境和 Node.js 环境
- 忽略 `dist`、`coverage`、`node_modules`
- 把 `no-console` 设为 `warn`，但允许 `console.warn` 和 `console.error`
- 把 `no-debugger` 设为 `warn`
- 把 `no-unused-vars` 设为 `warn`
- 关闭 `vue/multi-word-component-names`
- 关闭 `vue/require-default-prop`
- 最后接入 `eslint-config-prettier`，避免和 Prettier 规则打架

### 为什么保留了两条兼容性规则

#### `vue/multi-word-component-names`

Vue 官方常建议组件使用多单词命名，避免和原生 HTML 标签冲突。

但这个项目已经存在很多历史页面文件名，例如 `rank.vue`、`detail.vue` 这类单词组件名。如果强行打开，会导致大量历史代码先报错，工具链就很难落地。

所以这次先关闭，目的是让工具链先建立起来。

#### `vue/require-default-prop`

这条规则常用于要求非必填 prop 必须声明默认值。

对于大型后台页面，这条规则有价值，但在当前项目里很多组件主要是页面级组件，不一定需要把每个可选 prop 都写成完整的组件库风格。

所以这里暂时关闭，避免刚引入工具链就产生大量与当前重构目标无关的机械修改。

### 这次解决了什么关键 ESLint 问题

之前评估里提到 `vue/no-mutating-props` 对前端重构风险很大，因为它会让 Vue 组件的数据流变得难以追踪。

这次已经把这个问题真正处理掉了：

- [src/views/strategy/TacticsItem.vue](/mnt/d/develop/source/investment-vue3/src/views/strategy/TacticsItem.vue) 不再直接修改 `item` prop
- 现在改成通过 `emit('update:item', patch)` 通知父组件更新
- 父组件 [src/views/strategy/strategyedit.vue](/mnt/d/develop/source/investment-vue3/src/views/strategy/strategyedit.vue) 负责接收更新并 `Object.assign` 到本地行数据

这意味着：

- 子组件不再偷偷改父组件传入的数据
- 数据流更清楚
- ESLint 可以继续把 `vue/no-mutating-props` 当成有效保护规则使用

---

## 3.2 Prettier 是什么

Prettier 是代码格式化工具。

它关注的不是“业务对不对”，而是“代码长得整不整齐”。

例如它会统一：

- 是否加分号
- 单引号还是双引号
- 逗号风格
- 换行和缩进
- 长表达式如何拆行

可以把它理解为“自动排版工具”。

### 为什么需要 Prettier

因为“格式问题”非常消耗团队沟通成本，但又没有业务价值。

如果没有统一格式化工具，团队会反复讨论这些低价值问题：

- 这里该不该加分号
- 这里为什么换行方式不一样
- 这个对象末尾要不要逗号

Prettier 的作用是把这些选择自动化，减少争论，让大家把注意力放在业务逻辑上。

### 本项目怎么配置的

配置文件是 [.prettierrc.json](/mnt/d/develop/source/investment-vue3/.prettierrc.json)。

当前规则很简单：

- `"semi": false`
- `"singleQuote": true`
- `"trailingComma": "none"`

也就是：

- 不加分号
- 优先单引号
- 不保留尾随逗号

忽略文件配置在 [.prettierignore](/mnt/d/develop/source/investment-vue3/.prettierignore)。

当前忽略了：

- `dist`
- `coverage`
- `node_modules`
- `docs/migration/archive`

其中 `docs/migration/archive` 被忽略，是因为它是备份文档目录，不应该因为历史备份文件格式不同而影响工程检查结果。

### 这次补上的本地格式与协作约束

除了 Prettier，这次还新增了 [.editorconfig](/mnt/d/develop/source/investment-vue3/.editorconfig)。

它的作用是让不同编辑器在最基础的文本规则上保持一致，例如：

- 使用 UTF-8
- 使用 LF 换行
- 使用 2 个空格缩进
- 文件末尾保留换行

这对 Windows / WSL / Linux 混合环境尤其重要。

---

## 3.3 Vitest 和 smoke test 是什么

### Vitest 是什么

Vitest 是 Vite 生态下常见的测试框架，可以理解为“给前端项目跑自动化测试的工具”。

它负责：

- 执行测试文件
- 输出测试通过 / 失败结果
- 提供断言能力
- 提供测试生命周期和测试组织方式

### smoke test 是什么

smoke test 可以翻译成“冒烟测试”。

它不是很深的测试，不追求覆盖所有业务细节，而是验证：

- 最关键的入口是否还能正常工作
- 基本页面 / 路由是否还能正确加载
- 某个基础函数是否还返回正确结果

它的目的不是“证明功能完整正确”，而是“尽快发现项目是否已经坏了”。

### 为什么这次先加基础测试，而不是很复杂的测试

因为当前项目之前没有测试基础设施。

如果一上来就要求完整页面测试、复杂交互测试、接口 Mock、覆盖率门槛，成本会很高，团队也不容易接受。

所以这次采用“最低但有价值”的方案：

- 先把测试框架接进来
- 先覆盖关键基础能力
- 让 CI 有测试这一步

这样后续要继续补测试时，就不是从零开始了。

### 本项目怎么配置的

测试相关配置放在 [vite.config.js](/mnt/d/develop/source/investment-vue3/vite.config.js) 的 `test` 段：

```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: './src/test/setup.js'
}
```

这三项的意思是：

- `environment: 'jsdom'`
  - 用浏览器模拟环境执行测试
  - 因为 Vue 组件和路由很多时候依赖 DOM 环境
- `globals: true`
  - 允许测试里直接使用 `describe`、`it`、`expect`
  - 不需要每次都手动挂全局
- `setupFiles`
  - 在每次测试前先执行统一初始化文件

初始化文件是 [src/test/setup.js](/mnt/d/develop/source/investment-vue3/src/test/setup.js)。

这里做了最基础的 stub 配置：

- `router-link`
- `router-view`
- `transition`

这样测试在遇到这些 Vue 内置 / 常见组件时，不会因为渲染细节干扰测试目标。

### 这次新增了哪些测试

#### 1. 路由 smoke test

文件是 [src/router/routes.test.js](/mnt/d/develop/source/investment-vue3/src/router/routes.test.js)。

它检查了几个关键路由：

- `/login`
- `/dashboard`
- `/companyvaluation/valuation/company`
- `/404`

测试内容包括：

- 路由名称是否解析正确
- 对应组件是否存在
- 异步页面组件是否真的能被加载

这类测试的价值是：如果有人误改路由定义、文件路径、动态导入逻辑，测试会很快失败。

#### 2. 页面标题工具函数测试

文件是 [src/utils/get-page-title.test.js](/mnt/d/develop/source/investment-vue3/src/utils/get-page-title.test.js)。

它验证了 [src/utils/get-page-title.js](/mnt/d/develop/source/investment-vue3/src/utils/get-page-title.js) 的两个基本行为：

- 不传页面标题时，返回默认标题
- 传入页面标题时，正确拼接应用标题

这类测试虽然简单，但它说明测试链路已经接通，而且测试不只可以测页面，也可以测普通工具函数。

#### 3. API 层测试

文件是 [src/api/company.test.js](/mnt/d/develop/source/investment-vue3/src/api/company.test.js)。

这组测试验证：

- `getCompanyList` 是否发到正确地址
- `getCompany` 是否按 RESTful 路径请求详情
- `addCompany`、`deleteCompany`、`updatePrice`、`updateReport`、`updateGrowthRate` 等写操作是否打到正确接口，并发送正确参数

它的价值是：即使后续重构页面，只要 API 调用方式被误改，测试会立刻失败。

#### 4. 关键页面组件测试

文件包括：

- [src/views/valuation/companylist.test.js](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.test.js)
- [src/views/valuation/companydetail.test.js](/mnt/d/develop/source/investment-vue3/src/views/valuation/companydetail.test.js)

这些测试覆盖了前端重构最敏感的两个页面：

- `companylist.vue`
- `companydetail.vue`

当前测试验证了这些关键行为：

- 列表页初始化时能正确加载后端数据
- 列表页的详情跳转逻辑正确
- 列表页删除公司后，本地列表和总数会正确更新
- 详情页能正确加载并整理后端返回的数据
- 详情页返回列表按钮的跳转逻辑正确

这类测试的价值非常直接：后续如果大改页面结构，只要行为保持不变，测试就能继续通过；如果行为变坏，测试会第一时间提示。

### 这次增加的 API mock 基础设施是什么

评估报告里提到“没有 API mock 层，会导致组件测试无法隔离后端”，这对前端重构成功率影响很大。

这次已经补上基础设施：

- [src/test/mocks/http.js](/mnt/d/develop/source/investment-vue3/src/test/mocks/http.js)
  - 基于 `axios-mock-adapter`
  - 直接接管项目真实的 axios 请求实例
- [src/test/fixtures/company.js](/mnt/d/develop/source/investment-vue3/src/test/fixtures/company.js)
  - 提供列表页和详情页的测试样例数据
- [src/test/stubs/element-plus.js](/mnt/d/develop/source/investment-vue3/src/test/stubs/element-plus.js)
  - 提供轻量的 Element Plus 组件桩，避免测试被 UI 框架内部细节干扰

它的核心意义是：

- 测试时不需要真的连后端
- 组件测试结果更稳定
- 可以更专注验证前端页面行为，而不是网络环境

---

## 3.4 CI 构建检查是什么

CI 是 Continuous Integration，也就是“持续集成”。

可以把它理解为：只要有人提交代码或发起合并请求，仓库就会在服务器上自动跑一组检查。

### 为什么需要 CI

因为“我本地没问题”不等于“仓库里就没问题”。

CI 的价值是：

- 用统一环境做检查
- 防止坏代码直接进入主分支
- 让检查过程标准化，而不是靠人工记忆

### 本项目怎么配置的

配置文件是 [.github/workflows/ci.yml](/mnt/d/develop/source/investment-vue3/.github/workflows/ci.yml)。

触发条件：

- 推送到 `main`
- 推送到 `master`
- 发起 `pull_request`

CI 执行步骤：

1. `actions/checkout@v4`
   - 拉取仓库代码
2. `actions/setup-node@v4`
   - 安装 Node.js 22
   - 启用 npm 缓存
3. `npm ci`
   - 按 `package-lock.json` 精确安装依赖
4. `npm run lint`
   - 代码规范检查
5. `npm run format:check`
   - 格式检查
6. `npm run test`
   - 运行自动化测试
7. `npm run build`
   - 验证生产构建是否成功
8. `npm audit --audit-level=high`
   - 检查高危依赖漏洞

这是一条非常典型的前端项目基础质量流水线。

### 还需要手工完成的一步

虽然 CI 工作流已经写进仓库，但“CI 必须通过才能合并”这件事，还需要在 GitHub 仓库设置里开启分支保护规则。

也就是说，代码层面我们已经把自动检查准备好了，但是否把它变成真正的强制门禁，还需要仓库管理员在 GitHub 页面上配置：

- 保护 `main` 或 `master`
- 要求状态检查通过后才能合并
- 把 `CI` 工作流设为必需检查

---

## 4. 这次具体修改和新增了什么文件

## 4.1 新增文件

### 工具配置文件

- [eslint.config.js](/mnt/d/develop/source/investment-vue3/eslint.config.js)
- [.prettierrc.json](/mnt/d/develop/source/investment-vue3/.prettierrc.json)
- [.prettierignore](/mnt/d/develop/source/investment-vue3/.prettierignore)
- [.editorconfig](/mnt/d/develop/source/investment-vue3/.editorconfig)
- [jsconfig.json](/mnt/d/develop/source/investment-vue3/jsconfig.json)
- [.github/workflows/ci.yml](/mnt/d/develop/source/investment-vue3/.github/workflows/ci.yml)
- [.husky/pre-commit](/mnt/d/develop/source/investment-vue3/.husky/pre-commit)

### 测试相关文件

- [src/test/setup.js](/mnt/d/develop/source/investment-vue3/src/test/setup.js)
- [src/test/mocks/http.js](/mnt/d/develop/source/investment-vue3/src/test/mocks/http.js)
- [src/test/fixtures/company.js](/mnt/d/develop/source/investment-vue3/src/test/fixtures/company.js)
- [src/test/stubs/element-plus.js](/mnt/d/develop/source/investment-vue3/src/test/stubs/element-plus.js)
- [src/api/company.test.js](/mnt/d/develop/source/investment-vue3/src/api/company.test.js)
- [src/router/routes.test.js](/mnt/d/develop/source/investment-vue3/src/router/routes.test.js)
- [src/utils/get-page-title.test.js](/mnt/d/develop/source/investment-vue3/src/utils/get-page-title.test.js)
- [src/views/valuation/companylist.test.js](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.test.js)
- [src/views/valuation/companydetail.test.js](/mnt/d/develop/source/investment-vue3/src/views/valuation/companydetail.test.js)

### 说明文档

- [docs/quality/investment-vue3-engineering-quality-toolchain.md](/mnt/d/develop/source/investment-vue3/docs/quality/investment-vue3-engineering-quality-toolchain.md)

## 4.2 修改文件

### 1. `package.json`

在 [package.json](/mnt/d/develop/source/investment-vue3/package.json) 里增加了：

- 新的 npm scripts
- 新的开发依赖
- `lint-staged` 配置

新增脚本：

```json
"prepare": "husky",
"lint": "eslint .",
"format": "prettier . --write",
"format:check": "prettier . --check",
"test": "vitest run",
"check": "npm run lint && npm run format:check && npm run test && npm run build"
```

新增开发依赖的作用如下：

- `eslint`
  - ESLint 主程序
- `@eslint/js`
  - ESLint 官方 JavaScript 基础规则
- `eslint-plugin-vue`
  - Vue 规则扩展
- `vue-eslint-parser`
  - 让 ESLint 能解析 `.vue` 文件
- `eslint-config-prettier`
  - 关闭和 Prettier 冲突的格式规则
- `prettier`
  - 代码格式化工具
- `vitest`
  - 测试运行器
- `@vue/test-utils`
  - Vue 组件测试辅助工具
- `axios-mock-adapter`
  - 为测试提供接口 mock 能力
- `jsdom`
  - 模拟浏览器环境
- `globals`
  - 提供常见全局变量集合
- `husky`
  - Git hook 管理工具
- `lint-staged`
  - 只对暂存区文件执行检查和格式化

### 2. `vite.config.js`

在 [vite.config.js](/mnt/d/develop/source/investment-vue3/vite.config.js) 中增加了 `test` 配置，让 Vitest 能和当前 Vite 项目一起工作。

### 3. 一批现有源码文件

本次运行了 `npm run format`，因此有不少现有文件被 Prettier 自动格式化。

这些文件大多是“排版变化”，不是业务逻辑变化。

例如：

- `src/views/**`
- `src/layout/**`
- `src/utils/**`
- `src/styles/index.scss`
- `index.html`

### 4. `package-lock.json`

因为新增了开发依赖，所以 [package-lock.json](/mnt/d/develop/source/investment-vue3/package-lock.json) 也发生了更新。

这是正常现象，表示依赖锁文件和 `package.json` 保持一致。

### 5. 关键业务组件和测试目标文件

为了真正降低重构风险，这次还修改或补充了这些关键文件：

- [src/views/strategy/TacticsItem.vue](/mnt/d/develop/source/investment-vue3/src/views/strategy/TacticsItem.vue)
  - 修复子组件直接修改 prop 的问题
- [src/views/strategy/strategyedit.vue](/mnt/d/develop/source/investment-vue3/src/views/strategy/strategyedit.vue)
  - 接收子组件更新事件，统一在父组件更新本地数据
- [src/views/valuation/companylist.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.vue)
  - 作为关键重构页面的测试对象
- [src/views/valuation/companydetail.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companydetail.vue)
  - 作为关键重构页面的测试对象

---

## 5. 平时怎么用这些工具

## 5.1 安装依赖

首次拉取项目后，先安装依赖：

```bash
npm install
```

如果是在 CI 或希望严格按锁文件安装，可以使用：

```bash
npm ci
```

## 5.2 本地开发常用命令

启动开发环境：

```bash
npm run dev
```

检查代码规范：

```bash
npm run lint
```

自动格式化代码：

```bash
npm run format
```

只检查格式，不改文件：

```bash
npm run format:check
```

运行测试：

```bash
npm run test
```

安装 Git hook：

```bash
npm run prepare
```

一口气执行完整检查：

```bash
npm run check
```

这个 `check` 很适合作为“提交前自检命令”。

### 5.3 提交前自动拦截是怎么工作的

这次还增加了 `Husky + lint-staged`。

作用是：当你执行 `git commit` 时，只检查当前已经 `git add` 的文件，而不是全仓库都跑一遍。

当前 pre-commit hook 在 [.husky/pre-commit](/mnt/d/develop/source/investment-vue3/.husky/pre-commit)：

```sh
npx lint-staged
```

`lint-staged` 配置写在 [package.json](/mnt/d/develop/source/investment-vue3/package.json)。

它会做这些事：

- 对 `*.js`、`*.vue` 先执行 `eslint --fix`
- 再执行 `prettier --write`
- 对 `json / md / scss / html / yml / yaml` 执行 `prettier --write`

这能把很多低级问题拦在本地提交前，而不是等 CI 再报错。

---

## 6. 推荐的日常使用方式

对于普通开发者，建议这样使用：

1. 开发功能时使用 `npm run dev`
2. 提交前先运行 `npm run format`
3. 再运行 `npm run check`
4. 确认都通过后再提交

这样你在本地发现的问题，通常就不会再在 CI 里重复踩一次。

---

## 7. 这次改动带来的结果

这次改动完成后，项目具备了最基础的质量门禁能力。

具体结果是：

- 代码风格有了统一标准
- 可以自动检查基础代码问题
- 已经具备自动化测试运行能力
- 已经有了最基础的关键路由 smoke test
- 已经有了 API 层测试
- 已经有了 `companylist` 和 `companydetail` 关键页面测试
- 已经有了 API mock 基础设施
- 已经有了本地 pre-commit 质量拦截
- 仓库已经具备 CI 自动校验能力
- CI 已包含依赖安全审计
- 提交代码时可以用统一命令自检

换句话说，项目从“只有构建能力”，升级成了“有基本质量防线的前端工程”。

---

## 8. 本次验证结果

本地已经验证通过的命令包括：

```bash
npm run lint
npm run format:check
npm run test
npm run build
npm audit --audit-level=high
```

这说明：

- ESLint 配置可运行
- Prettier 配置可运行
- 测试框架可运行
- 当前代码可以正常生产构建
- 当前依赖没有高危漏洞告警

---

## 9. 需要知道的限制和后续改进方向

虽然这次已经补齐了“基础工具链”，但它还不是终点。

目前仍有这些现实情况：

- 测试数量仍然不算多，虽然已经覆盖 API、关键路由和两个关键页面
- 还没有覆盖更复杂的交互分支
- 还没有 e2e 端到端测试
- 仍有少量 ESLint 规则为了兼容历史代码暂时关闭
- GitHub 分支保护仍需在仓库设置页面手工开启

后续可以继续往下做：

### 方向 1：补更多测试

优先可以补这些页面或模块：

- 登录页
- 公司列表页
- 公司详情页
- 策略编辑页

### 方向 2：增加覆盖率统计

可以让测试不只是“跑了”，还知道“覆盖了多少代码”。

### 方向 3：增加 PR 门禁要求

例如要求 CI 必须通过才能合并。

### 方向 4：逐步收紧 ESLint 规则

例如未来可以重构 `TacticsItem.vue` 后，再重新打开 `vue/no-mutating-props`。

---

## 10. 一句话总结

这次改动不是为了增加业务功能，而是为了给 `investment-vue3` 建立最基础的工程质量底座：

- 用 ESLint 查代码问题
- 用 Prettier 统一格式
- 用 Vitest 跑基础测试
- 用 GitHub Actions 做 CI 自动校验

这样后续开发就不再完全依赖人工检查，而是有了自动化质量防线。
