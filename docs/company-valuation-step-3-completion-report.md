# 公司估值升级改造第 3 步完成报告

## 1. 本步目标

第 3 步目标是完成“重组 Vue3 路由、骨架页与可见的轻量改进”的最小可验收版本：

- 调整 `Company Valuation` 菜单结构，使其与目标产品结构一致
- 公司详情路由升级为“公司总览”入口
- 新增利润贴现一览和 DCF 一览骨架页
- 前端 API 从单一 `company.js` 拆出 command/query/model 工作台模块
- 公司列表交付轻量可见改进
- 用前端质量工具链验证改造结果

参考设计文档：

- [company-valuation-ui-refactor-step-plan.md](/mnt/d/develop/source/investment-server/docs/company-valuation-ui-refactor-step-plan.md)
- [company-valuation-extension-design.md](/mnt/d/develop/source/investment-server/docs/company-valuation-extension-design.md)

## 2. 实际完成内容

前端路由与菜单调整：

- `Company Valuation` 菜单调整为：
  - `公司列表`
  - `利润贴现一览`
  - `DCF一览`
  - `大V推荐排行`
- 参数设置菜单文案调整为：
  - `宏观参数`
  - `行业参数`
  - `推荐作者`
  - `推荐规则`
- 公司详情隐藏路由标题调整为 `公司总览`
- 新增路由：
  - `/companyvaluation/valuation/profit-discount`
  - `/companyvaluation/valuation/dcf`

对应文件：

- [investment-vue3/src/router/routes.js](/mnt/d/develop/source/investment-vue3/src/router/routes.js)

新增页面骨架：

- 新增利润贴现一览骨架页：
  - [investment-vue3/src/views/valuation/profitdiscount.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/profitdiscount.vue)
- 新增 DCF 一览骨架页：
  - [investment-vue3/src/views/valuation/dcfvaluation.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/dcfvaluation.vue)
- 公司详情页重组为公司总览 tab 骨架：
  - `总览`
  - `利润贴现`
  - `DCF`
  - `财务评价`
  - `大V推荐`

对应文件：

- [investment-vue3/src/views/valuation/companydetail.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companydetail.vue)

前端 API 拆分：

- 新增公司写操作 API：
  - [investment-vue3/src/api/company-command.js](/mnt/d/develop/source/investment-vue3/src/api/company-command.js)
- 新增估值查询 API：
  - [investment-vue3/src/api/valuation-query.js](/mnt/d/develop/source/investment-vue3/src/api/valuation-query.js)
- 新增利润贴现 API：
  - [investment-vue3/src/api/profit-valuation.js](/mnt/d/develop/source/investment-vue3/src/api/profit-valuation.js)
- 新增 DCF API：
  - [investment-vue3/src/api/dcf-valuation.js](/mnt/d/develop/source/investment-vue3/src/api/dcf-valuation.js)
- 保留 [investment-vue3/src/api/company.js](/mnt/d/develop/source/investment-vue3/src/api/company.js) 兼容导出，避免旧页面和测试一次性改动过大

新增公共展示组件：

- [IndustryFilter.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/components/IndustryFilter.vue)
- [ValuationMetric.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/components/ValuationMetric.vue)
- [AssumptionStrip.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/components/AssumptionStrip.vue)

公司列表轻量改进：

- 页面标题由 `公司估值` 调整为 `公司列表`
- 增加行业筛选
- 文案调整为公司池摘要入口
- `估值` 列明确为 `利润贴现估值`
- `FCF估值` 降级为 `FCF参考值`
- 操作入口文案由 `详情` 调整为 `总览`

对应文件：

- [investment-vue3/src/views/valuation/companylist.vue](/mnt/d/develop/source/investment-vue3/src/views/valuation/companylist.vue)

## 3. 测试与验证

新增或更新的测试覆盖：

- 更新路由 smoke test，覆盖新增公司总览、利润贴现一览、DCF 一览、大V推荐排行路由
- 更新 company API test，覆盖拆分后的 valuation query、profit valuation、DCF valuation API
- 更新公司列表测试，覆盖行业筛选与新标题
- 更新公司总览测试，覆盖 tab 默认状态和利润贴现假设摘要
- 更新 Element Plus 测试桩，补充 `ElSelect`、`ElOption`、`ElTabs`、`ElTabPane`

执行命令：

```bash
cd /mnt/d/develop/source/investment-vue3
npm run lint
npm run test
npm run build
```

执行结果：

- `npm run lint` 通过
- `npm run test` 通过，5 个测试文件、21 个测试全部通过
- `npm run build` 通过

本次变更文件格式检查：

```bash
cd /mnt/d/develop/source/investment-vue3
npx prettier --check src/api/company.js src/api/company-command.js src/api/company.test.js src/api/dcf-valuation.js src/api/profit-valuation.js src/api/valuation-query.js src/router/routes.js src/router/routes.test.js src/test/stubs/element-plus.js src/views/valuation/companydetail.test.js src/views/valuation/companydetail.vue src/views/valuation/companylist.test.js src/views/valuation/companylist.vue src/views/valuation/components/AssumptionStrip.vue src/views/valuation/components/IndustryFilter.vue src/views/valuation/components/ValuationMetric.vue src/views/valuation/dcfvaluation.vue src/views/valuation/profitdiscount.vue
```

执行结果：

- 本次新增和修改文件均通过 Prettier 格式检查

完整前端门禁命令：

```bash
cd /mnt/d/develop/source/investment-vue3
npm run check
```

执行结果：

- `npm run check` 未完整通过
- 已通过其中的 `npm run lint`
- 停在 `npm run format:check`
- 原因是仓库中存在 39 个历史文件未按当前 Prettier 规则格式化，失败文件不包含本次新增和修改的文件
- 因 `format:check` 失败，`npm run check` 后续的 `test` 和 `build` 没有继续执行；这两项已单独执行并通过

本地可运行验证：

- 前端开发服务已启动：
  - `http://127.0.0.1:9529/`

## 4. 当前遗留与边界

本步只做前端信息架构和页面骨架，不新增后端接口、不修改数据库。

利润贴现一览和 DCF 一览当前是骨架页，尚未接入真实查询接口和调参命令。利润贴现一览将在第 6 步接入 v1 数据与单公司调参；DCF 将在第 9 步以后接入模型、存储结构和查询接口。

公司总览 tab 当前复用既有 `/company/{id}` 返回数据，保留现有详情展示能力，同时为后续 `CompanyOverviewQuery` 聚合返回结构预留页面边界。

`company.js` 当前仍保留兼容导出，避免一次性影响 dashboard 和旧测试导入；后续旧接口退场阶段再统一清理。

全量 `npm run format:check` 当前受历史格式问题阻断。本步只格式化本次触碰文件，未扩大到全仓库格式化，避免引入大量无关变更。

## 5. 验收结论

第 3 步已完成最小可验收目标：

- 前端导航结构已与目标产品结构一致
- 已新增利润贴现一览和 DCF 一览骨架页
- 公司详情已升级为公司总览 tab 骨架
- 公司列表已交付行业筛选和估值文案轻量优化
- 前端 API 已按 command/query/model 工作台方向拆分，并保留兼容导出
- `lint`、`test`、`build` 均已通过
- 本次变更文件已通过 Prettier 格式检查
