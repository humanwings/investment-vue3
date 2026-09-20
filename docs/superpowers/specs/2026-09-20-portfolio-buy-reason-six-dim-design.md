# 持仓买入原因六维化（对齐买入判定 II）设计

## 背景

持仓明细与已清仓的买入决策字段目前沿用旧版「买入判定 I」结构：单一 `buy_reason`（8 选 1）→ `stock_type`（联动过滤）→ `price_position`/`timing` → `decision_level`（自动计算、锁定）。买入判定 II 已改为 6 个互相独立的维度，持仓侧仍是一因多果的强联动结构，两套口径不一致。

本次将持仓/已清仓的买入原因重新设计为与买入判定 II 完全一致的六维结构：**推荐、因素、走势、知名度、类型、位置**。持仓只记录事实（六个维度选了什么），不计算、不保存判定档位；II 的打分与高位否决逻辑不进入持仓模块。

旧数据通过增量迁移脚本一次性映射到新结构；持仓、已清仓、统计页、筛选器全量同步改造。

## 已确认的关键决策

| 决策点                | 结论                                             |
| --------------------- | ------------------------------------------------ |
| 旧数据处理            | V\*.sql 一次性映射到新结构，不双轨、不清空       |
| 存储结构              | 6 列：4 个新列 + 2 个复用列（见下）              |
| 判定档位              | 不再计算、不再保存；`decision_level` 列删除      |
| 改造范围              | 持仓 + 已清仓 + 统计页 + 筛选器全量同步          |
| 「二线杂毛」归属      | 统一映射为知名度 = 杂毛                          |
| 「就是想买点试试」    | 六维无对应项，降级为只保留类型 + 位置            |
| 暴跌时机（当日/次日） | II 无时机维度，丢弃                              |
| 弹窗控件              | 6 行下拉（推荐多选，其余单选可空）               |
| 列表合并列            | 六维非空 `·` 拼接；筛选器为 推荐 + 类型 两个下拉 |
| 统计口径              | 六维各一张分布饼图；已清仓胜率表按类型分组       |

## 一、数据库迁移（investment-server）

新增增量脚本 `db/migration/V*__portfolio_decision_six_dim.sql`，`portfolio_archive` 与 `portfolio_cleared` 两表同构处理：

| 动作 | 列                                       | 说明                                                                               |
| ---- | ---------------------------------------- | ---------------------------------------------------------------------------------- |
| 新增 | `reco`                                   | text，推荐来源，存中文 label；多选英文逗号拼接（如 `大V推荐,小V推荐`）             |
| 新增 | `factor`                                 | text，因素：热点、潜伏                                                             |
| 新增 | `trend`                                  | text，走势：暴跌、回调                                                             |
| 新增 | `fame`                                   | text，知名度：龙头、二线、杂毛                                                     |
| 复用 | `stock_type`                             | 值域改为：蓝筹、成长、周期、题材                                                   |
| 复用 | `price_position`                         | 值域不变（高位、中位、低位），与 II 位置维度一致                                   |
| 复用 | `big_v`                                  | 大V姓名，不动                                                                      |
| 删除 | `buy_reason`、`timing`、`decision_level` | SQLite 3.35+ `ALTER TABLE ... DROP COLUMN`（sqlite-jdbc 内嵌版本满足，实施时验证） |

迁移 SQL 顺序（两表各一套）：

1. 新增 4 列（`reco`/`factor`/`trend`/`fame`）。
2. 知名度提取（先于类型清洗）：`stock_type='龙头'` → `fame='龙头'`；`stock_type='二线杂毛'` → `fame='杂毛'`。
3. 类型清洗：`stock_type='概念'` → `'题材'`；原 `龙头/二线杂毛` 挪入 `fame` 后将 `stock_type` 置 null；`buy_reason='蓝筹(长期持有)'` 的记录补 `stock_type='蓝筹'`（旧版该原因不填种类）。
4. 原因映射：`buy_reason='大V推荐'` → `reco='大V推荐'`；`'小V推荐'` → `reco='小V推荐'`；`'潜伏(中期)'` → `factor='潜伏'`；`'追热点 / 跟风'` → `factor='热点'`；`'回调抄底'` → `trend='回调'`；`'暴跌抄底'` → `trend='暴跌'`。
5. `就是想买点试试`、其余原因：不做额外处理（类型/位置已被覆盖）。
6. 删除 `buy_reason`、`timing`、`decision_level` 三列。

## 二、前端共享逻辑层（investment-vue3）

- 六维选项唯一来源：`src/views/decision/buyDecisionRules2.js` 的 `DECISION_DIMENSIONS`，持仓模块直接导入复用，不定义第二套；不搬入 codebook。
- `src/codebook.js`：`decisionBuyReasons` 等 8 项旧枚举保留（买入判定 I 页面仍在使用），持仓模块不再引用。
- `src/views/portfolio/decision-fields.js` 重写：删除三步联动与 `recalcLevel`，六维完全独立、互不联动、无级联清空；仅保留「推荐含大V或小V → 显示姓名输入」的逻辑。
- `src/views/portfolio/decision-display.js` 重写：合并列按 II 卡片顺序拼接非空段：推荐 · 因素 · 走势 · 知名度 · 类型 · 位置（如 `大V推荐·回调·蓝筹·中位`；多选推荐段内以顿号连接），全空显示 `-`。

## 三、编辑弹窗（PositionEditDialog + ClearedEditDialog）

500px 弹窗内 6 行下拉，全部可空、互不联动：

| 表单项   | 控件                 | 选项                                               |
| -------- | -------------------- | -------------------------------------------------- |
| 推荐来源 | `el-select` multiple | 大V推荐、小V推荐                                   |
| 因素     | 单选可清空           | 热点、潜伏                                         |
| 走势     | 单选可清空           | 暴跌、回调                                         |
| 知名度   | 单选可清空           | 龙头、二线、杂毛                                   |
| 类型     | 单选可清空           | 蓝筹、成长、周期、题材                             |
| 股价位置 | 单选可清空           | 高位、中位、低位                                   |
| 大V姓名  | 文本框               | 推荐含大V或小V时显示（条件由旧原因改为 reco 非空） |

持股策略/持股计划/当期业绩/备考等其余表单项不变。字段顺序沿用 II 页卡片顺序。保存时六维各自独立传值（空传 null），允许全空保存（兼容老记录直接保存）。

## 四、列表页（LatestPosition + ClearedPosition）

- 「买入判定」合并列改名「买入原因」，内容为六维非空 `·` 拼接。
- 筛选器：删除旧原因下拉与档位筛选，换成 **推荐**（单选下拉，按 `reco` 包含匹配，兼容多选存储）+ **类型** 两个下拉，两页一致。
- 行数据映射中 `buyReason`/`decisionLevel` 等引用全部替换为六维字段。

## 五、统计页（PortfolioStatistics + cleared-analysis.js）

- 持仓页「买入原因」单饼图 → 六维各一张分布饼图（推荐/因素/走势/知名度/类型/位置，空值不计入）。
- 已清仓页同理六张分布图；「按买入原因」分组胜率表 → 按 **类型** 分组（类型单选、样本归属唯一）。
- 推荐分布口径：多选推荐记录按每个选中项各计一次（`大V,小V` 记录在两张图中各 +1 笔）。

## 六、后端（investment-server）

- `portfolio_archive`/`portfolio_cleared` 的 DTO、Mapper、SQL 同步改为 `reco/factor/trend/fame/stockType/pricePosition` 六字段，删除 `buyReason/timing/decisionLevel`。
- 持仓转已清仓时六维字段与 `bigV` 整体复制。
- 接口路径不变，仅请求/响应字段变化。

## 七、不改动范围

- 买入判定 I 页面（`BuyDecision.vue`、`buyDecisionRules.js`）与其 codebook 枚举。
- 买入判定 II 页面（`BuyDecisionII.vue`、`buyDecisionRules2.js`）。

## 八、测试与验收

- 迁移脚本：在测试库验证旧值映射结果，覆盖 龙头/二线杂毛、概念、蓝筹(长期持有)、暴跌时机、多值组合各分支。
- 单元测试：`decision-display`（六维拼接/全空）、`decision-fields`（六维独立、姓名显示条件）、`cleared-analysis`（六维分布、类型胜率分组）。
- 组件测试：两个编辑弹窗（六维选择、推荐多选、姓名条件显示、保存载荷）、两个列表页（筛选、合并列）。
- 回归：`npm run check` 与 `mvnw test` 通过；买入判定 I/II 页面行为不变。
