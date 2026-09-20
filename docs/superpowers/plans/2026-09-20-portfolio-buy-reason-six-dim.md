# 持仓买入原因六维化（对齐买入判定 II）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将持仓/已清仓的买入决策字段从旧版「8 项原因三步联动」改造为与买入判定 II 一致的六维独立结构（推荐/因素/走势/知名度/类型/位置），不保存判定档位，旧数据一次性 SQL 迁移，前后端与统计页全量同步。

**Architecture:** SQLite 两表（`portfolio_archive`/`portfolio_cleared`）新增 `reco/factor/trend/fame` 四列、复用 `stock_type`/`price_position`、删除 `buy_reason/timing/decision_level`；后端 DTO/Mapper/Service 同步六字段并输出六张分布饼图；前端共用 `DecisionSixFields` 弹窗组件 + 六维合并列展示 + 双筛选 + 六维统计饼图。

**Tech Stack:** Spring Boot 3.1.3 + Java 17 + MyBatis + SQLite（sqlite-jdbc 3.36.0.3）；Vue 3 + Element Plus + Vitest；Python 3.11（仅用于迁移验证，内置 sqlite3 模块）。

**Spec:** `docs/superpowers/specs/2026-09-20-portfolio-buy-reason-six-dim-design.md`

## Global Constraints

- **禁止任何 git 操作**（AGENTS.md 约定）：不 commit、不建分支、不建 worktree。所有任务以测试通过为完成标志，没有 commit 步骤。
- 后端仓库：`D:\develop\source\investment-server`（下称 `$SRV`）；前端仓库：`D:\develop\source\investment-vue3`（下称 `$WEB`）。
- 后端测试命令：`mvnw.cmd test`（在 `$SRV` 下）。Checkstyle 在 `verify` 阶段执行，`test` 阶段不跑。
- 前端检查：`npm run check`（eslint + prettier + vitest + build）；单测定向运行：`npx vitest run <path>`。
- 六维选项唯一来源：`$WEB/src/views/decision/buyDecisionRules2.js` 的 `DECISION_DIMENSIONS`。持仓模块不得定义第二套选项/分数。
- 六维与字段名映射（DB 列 ↔ 前端 form 字段 ↔ DTO 字段）：
  | II 维度 key | 表单项 | form/DTO 字段 | DB 列 | 选项（来自 DECISION_DIMENSIONS） |
  | --- | --- | --- | --- | --- |
  | recommends | 推荐来源 | `reco`（数组，存库时 `,` 拼接） | `reco` | 大V推荐、小V推荐（多选） |
  | factor | 因素 | `factor` | `factor` | 热点、潜伏 |
  | trend | 走势 | `trend` | `trend` | 暴跌、回调 |
  | fame | 知名度 | `fame` | `fame` | 龙头、二线、杂毛 |
  | type | 类型 | `stockType` | `stock_type` | 蓝筹、成长、周期、题材 |
  | position | 股价位置 | `pricePosition` | `price_position` | 高位、中位、低位 |
- `reco` 列存中文 label、英文逗号分隔多选（如 `大V推荐,小V推荐`）；其余五列存单个中文 label 或 null。
- 不保存判定档位；后端删除 `BUY_REASONS/TIMINGS/DECISION_LEVELS` 枚举校验。
- 迁移脚本：`$SRV/db/migration/V23__portfolio_decision_six_dim.sql`（当前最大版本号 V22）。**无 Flyway，需手动应用**；必须先在副本库验证再动真库 `D:/develop/sqliteDB/investment.db`；应用前确认后端已停；应用前备份真库文件。
- 不改动：买入判定 I/II 页面、`codebook.js`、`db/schema/`、`create_portfolio.sql`。

---

### Task 1: 迁移脚本 V23 与副本库验证

**Files:**

- Create: `$SRV/db/migration/V23__portfolio_decision_six_dim.sql`

**Interfaces:**

- Produces: 六列结构（`reco/factor/trend/fame/stock_type/price_position`），后续所有任务依赖。

- [ ] **Step 1: 写迁移脚本**

```sql
-- V23: 持仓买入原因对齐买入判定 II 六维结构。
-- 新增 reco/factor/trend/fame；stock_type 值域改为 蓝筹/成长/周期/题材；
-- 删除 buy_reason/timing/decision_level（不再保存判定档位，II 无时机维度）。

-- ===== portfolio_archive =====
alter table portfolio_archive add column reco text;
alter table portfolio_archive add column factor text;
alter table portfolio_archive add column trend text;
alter table portfolio_archive add column fame text;

-- 知名度提取（先于类型清洗，依赖旧值 龙头/二线杂毛）
update portfolio_archive set fame = '龙头' where stock_type = '龙头';
update portfolio_archive set fame = '杂毛' where stock_type = '二线杂毛';
update portfolio_archive set stock_type = null where stock_type in ('龙头', '二线杂毛');

-- 类型清洗
update portfolio_archive set stock_type = '题材' where stock_type = '概念';
update portfolio_archive set stock_type = '蓝筹' where buy_reason = '蓝筹(长期持有)' and stock_type is null;

-- 原因映射
update portfolio_archive set reco = '大V推荐' where buy_reason = '大V推荐';
update portfolio_archive set reco = '小V推荐' where buy_reason = '小V推荐';
update portfolio_archive set factor = '潜伏' where buy_reason = '潜伏(中期)';
update portfolio_archive set factor = '热点' where buy_reason = '追热点 / 跟风';
update portfolio_archive set trend = '回调' where buy_reason = '回调抄底';
update portfolio_archive set trend = '暴跌' where buy_reason = '暴跌抄底';

alter table portfolio_archive drop column buy_reason;
alter table portfolio_archive drop column timing;
alter table portfolio_archive drop column decision_level;

-- ===== portfolio_cleared（同构） =====
alter table portfolio_cleared add column reco text;
alter table portfolio_cleared add column factor text;
alter table portfolio_cleared add column trend text;
alter table portfolio_cleared add column fame text;

update portfolio_cleared set fame = '龙头' where stock_type = '龙头';
update portfolio_cleared set fame = '杂毛' where stock_type = '二线杂毛';
update portfolio_cleared set stock_type = null where stock_type in ('龙头', '二线杂毛');

update portfolio_cleared set stock_type = '题材' where stock_type = '概念';
update portfolio_cleared set stock_type = '蓝筹' where buy_reason = '蓝筹(长期持有)' and stock_type is null;

update portfolio_cleared set reco = '大V推荐' where buy_reason = '大V推荐';
update portfolio_cleared set reco = '小V推荐' where buy_reason = '小V推荐';
update portfolio_cleared set factor = '潜伏' where buy_reason = '潜伏(中期)';
update portfolio_cleared set factor = '热点' where buy_reason = '追热点 / 跟风';
update portfolio_cleared set trend = '回调' where buy_reason = '回调抄底';
update portfolio_cleared set trend = '暴跌' where buy_reason = '暴跌抄底';

alter table portfolio_cleared drop column buy_reason;
alter table portfolio_cleared drop column timing;
alter table portfolio_cleared drop column decision_level;
```

- [ ] **Step 2: 在副本库上验证**

写脚本 `C:\Users\wujian\AppData\Local\Temp\opencode\verify_v23.py`：

```python
import shutil, sqlite3, pathlib, sys

src = pathlib.Path(r"D:\develop\sqliteDB\investment.db")
tmp = pathlib.Path(r"C:\Users\wujian\AppData\Local\Temp\opencode\investment-verify.db")
if tmp.exists():
    tmp.unlink()
shutil.copy(src, tmp)

sql = pathlib.Path(
    r"D:\develop\source\investment-server\db\migration\V23__portfolio_decision_six_dim.sql"
).read_text(encoding="utf-8")

con = sqlite3.connect(tmp)
con.executescript(sql)

for table in ("portfolio_archive", "portfolio_cleared"):
    cols = [r[1] for r in con.execute(f"pragma table_info({table})")]
    assert "reco" in cols and "factor" in cols and "trend" in cols and "fame" in cols
    assert "buy_reason" not in cols and "timing" not in cols and "decision_level" not in cols
    print(table, "columns OK")

print("--- archive sample ---")
for row in con.execute(
    "select stock_code, reco, factor, trend, fame, stock_type, price_position from portfolio_archive"
):
    print(row)
print("--- cleared sample ---")
for row in con.execute(
    "select stock_code, reco, factor, trend, fame, stock_type, price_position from portfolio_cleared"
):
    print(row)
con.close()
tmp.unlink()
print("VERIFY OK")
```

Run: `python C:\Users\wujian\AppData\Local\Temp\opencode\verify_v23.py`
Expected: 输出 `columns OK` × 2、旧值映射样例（概念→题材、二线杂毛→fame=杂毛且 stock_type 空、蓝筹(长期持有)→stock_type=蓝筹、暴跌/回调→trend、大V/小V→reco）、最后 `VERIFY OK`。人工核对样例与映射表一致。

- [ ] **Step 3: 应用到真库**

1. 确认后端进程已停止（无 `java ... InvestmentApplication` 进程）。
2. 备份：`Copy-Item D:\develop\sqliteDB\investment.db D:\develop\sqliteDB\investment.db.bak-V22`
3. 用 python 对真库执行同一 SQL（把 verify 脚本中的 `shutil.copy` 段去掉，`sqlite3.connect` 直接指向真库后 `executescript(sql)`，并保留同样的 pragma 断言）。
   Run: 同 Step 2 脚本（真库版）。Expected: `VERIFY OK`。

---

### Task 2: 后端实体与 Mapper XML 六字段化

**Files:**

- Modify: `$SRV/src/main/java/com/humanwings/investment/portfolio/entity/PortfolioArchive.java`
- Modify: `$SRV/src/main/java/com/humanwings/investment/portfolio/entity/PortfolioCleared.java`
- Modify: `$SRV/src/main/java/com/humanwings/investment/portfolio/entity/PortfolioSaveItem.java`
- Modify: `$SRV/src/main/java/com/humanwings/investment/portfolio/entity/PortfolioPositionView.java`
- Modify: `$SRV/src/main/resources/mapper/portfolio-archive-mapper.xml`
- Modify: `$SRV/src/main/resources/mapper/portfolio-cleared-mapper.xml`

**Interfaces:**

- Produces: 四个实体字段 `reco/factor/trend/fame`（String，`reco` 为逗号拼接多值），删除 `buyReason/timing/decisionLevel`；Mapper 列同步。

- [ ] **Step 1: 改四个实体**

对 `PortfolioArchive`、`PortfolioCleared`、`PortfolioSaveItem`、`PortfolioPositionView` 统一执行：删除字段 `buyReason`、`timing`、`decisionLevel` 及其 getter/setter；新增字段与访问器（风格沿用现有一行式）：

```java
    private String reco;
    private String factor;
    private String trend;
    private String fame;
```

```java
    public String getReco() { return reco; }
    public void setReco(String reco) { this.reco = reco; }
    public String getFactor() { return factor; }
    public void setFactor(String factor) { this.factor = factor; }
    public String getTrend() { return trend; }
    public void setTrend(String trend) { this.trend = trend; }
    public String getFame() { return fame; }
    public void setFame(String fame) { this.fame = fame; }
```

- [ ] **Step 2: 改 portfolio-archive-mapper.xml**

insert：

```xml
        insert into portfolio_archive (stock_code, market, big_v,
            reco, factor, trend, fame, stock_type, price_position,
            hold_strategy, hold_plan, remark, earnings_note, created_at, updated_at)
        values (#{stockCode}, #{market}, #{bigV},
            #{reco}, #{factor}, #{trend}, #{fame}, #{stockType}, #{pricePosition},
            #{holdStrategy}, #{holdPlan}, #{remark}, #{earningsNote}, #{createdAt}, #{updatedAt})
```

update：

```xml
        update portfolio_archive set
            big_v = #{bigV},
            reco = #{reco}, factor = #{factor}, trend = #{trend}, fame = #{fame},
            stock_type = #{stockType}, price_position = #{pricePosition},
            hold_strategy = #{holdStrategy},
            hold_plan = #{holdPlan}, remark = #{remark}, earnings_note = #{earningsNote},
            updated_at = #{updatedAt}
        where archive_id = #{archiveId}
```

`findByCode`/`findCodes` 两个 select 的列清单中，把
`a.timing as timing, a.decision_level as decisionLevel,` 与 `a.big_v as bigV, a.buy_reason as buyReason,`
替换为：

```xml
               a.big_v as bigV, a.reco as reco, a.factor as factor,
               a.trend as trend, a.fame as fame,
```

- [ ] **Step 3: 改 portfolio-cleared-mapper.xml**

insert 列清单：`big_v, buy_reason, stock_type, price_position, timing, decision_level,` → `big_v, reco, factor, trend, fame, stock_type, price_position,`；values 行同理 `#{bigV}, #{reco}, #{factor}, #{trend}, #{fame}, #{stockType}, #{pricePosition},`。

`updateClearedFields`：

```xml
        update portfolio_cleared set
            big_v = #{bigV},
            reco = #{reco},
            factor = #{factor},
            trend = #{trend},
            fame = #{fame},
            stock_type = #{stockType},
            price_position = #{pricePosition},
            clear_reason = #{clearReason},
            clear_reason_remark = #{clearReasonRemark},
            realized_pl = #{realizedPl},
            hold_days = #{holdDays},
            cleared_remark = #{clearedRemark}
        where cleared_id = #{clearedId}
```

`findAllOrderByClearedDateDesc` select 中把
`c.buy_reason as buyReason, c.stock_type as stockType, c.price_position as pricePosition,`
与 `c.timing as timing, c.decision_level as decisionLevel,`
替换为：

```xml
               c.reco as reco, c.factor as factor, c.trend as trend, c.fame as fame,
               c.stock_type as stockType, c.price_position as pricePosition,
```

- [ ] **Step 4: 编译验证**

Run: `mvnw.cmd -q compile`（workdir `$SRV`）
Expected: 实体改完后此时 `PortfolioServiceImpl` 仍引用旧字段会**编译失败**——属预期，Task 3 修复；但 mapper XML 属资源不参与编译。本步只确认实体/XML 语法无误（若因 Service 报错则记录错误清单留给 Task 3）。

---

### Task 3: 后端 Service 六维逻辑 + 统计六饼 + 测试更新

**Files:**

- Modify: `$SRV/src/main/java/com/humanwings/investment/portfolio/entity/PortfolioStats.java`
- Modify: `$SRV/src/main/java/com/humanwings/investment/portfolio/service/impl/PortfolioServiceImpl.java`
- Test: `$SRV/src/test/java/com/humanwings/investment/portfolio/service/impl/PortfolioServiceImplTest.java`

**Interfaces:**

- Consumes: Task 2 的实体六字段。
- Produces: `PortfolioStats` 新增 `recoPie/factorPie/trendPie/famePie/positionPie`（删除 `buyReasonPie`）；`applyArchiveFields`/`updateCleared` 的六维校验；清仓转移复制六字段。

- [ ] **Step 1: 改 PortfolioStats**

字段区删除 `buyReasonPie` 及其 getter/setter，新增（含访问器，风格不变）：

```java
    private List<PieSlice> recoPie;
    private List<PieSlice> factorPie;
    private List<PieSlice> trendPie;
    private List<PieSlice> famePie;
    private List<PieSlice> positionPie;
```

- [ ] **Step 2: 改 PortfolioServiceImpl**

  2.1 枚举常量替换（原 `BUY_REASONS/STOCK_TYPES/PRICE_POSITIONS/TIMINGS/DECISION_LEVELS` 五个常量删除）：

```java
    private static final Set<String> RECOMMENDS = Set.of("大V推荐", "小V推荐");
    private static final Set<String> FACTORS = Set.of("热点", "潜伏");
    private static final Set<String> TRENDS = Set.of("暴跌", "回调");
    private static final Set<String> FAMES = Set.of("龙头", "二线", "杂毛");
    private static final Set<String> STOCK_TYPES = Set.of("蓝筹", "成长", "周期", "题材");
    private static final Set<String> PRICE_POSITIONS = Set.of("高位", "中位", "低位");
```

2.2 新增多值校验（放在 `requireEnumIfPresent` 旁）：

```java
    private void requireRecoIfPresent(String reco) {
        if (reco == null || reco.isBlank()) {
            return;
        }
        for (String part : reco.split(",")) {
            requireEnum(part.trim(), RECOMMENDS, "推荐来源");
        }
    }
```

2.3 `applyArchiveFields` 整体替换为：

```java
    private void applyArchiveFields(PortfolioArchive existing, PortfolioArchive req) {
        requireRecoIfPresent(req.getReco());
        requireEnumIfPresent(req.getStockType(), STOCK_TYPES, "股票种类");
        requireEnumIfPresent(req.getFactor(), FACTORS, "因素");
        requireEnumIfPresent(req.getTrend(), TRENDS, "走势");
        requireEnumIfPresent(req.getFame(), FAMES, "知名度");
        requireEnumIfPresent(req.getPricePosition(), PRICE_POSITIONS, "股价位置");
        existing.setBigV(
                req.getReco() == null || req.getReco().isBlank() ? null : req.getBigV());
        existing.setReco(req.getReco());
        existing.setFactor(req.getFactor());
        existing.setTrend(req.getTrend());
        existing.setFame(req.getFame());
        existing.setStockType(req.getStockType());
        existing.setPricePosition(req.getPricePosition());
        existing.setHoldStrategy(req.getHoldStrategy());
        existing.setHoldPlan(req.getHoldPlan());
        existing.setRemark(req.getRemark());
        existing.setEarningsNote(req.getEarningsNote());
        if (req.getStockName() != null && !req.getStockName().isBlank()) {
            existing.setStockName(req.getStockName());
        }
        existing.setUpdatedAt(now.get());
        archiveMapper.update(existing);
    }
```

2.4 `saveAll` 中 `req.setXxx(...)` 块：删除 `setBuyReason/setTiming/setDecisionLevel` 三行，`setStockType/setPricePosition` 保留，新增：

```java
            req.setReco(item.getReco());
            req.setFactor(item.getFactor());
            req.setTrend(item.getTrend());
            req.setFame(item.getFame());
```

2.5 `confirmImport` 清仓转移块（`if (a != null) { ... }` 内）替换为：

```java
                if (a != null) {
                    cl.setReco(a.getReco());
                    cl.setFactor(a.getFactor());
                    cl.setTrend(a.getTrend());
                    cl.setFame(a.getFame());
                    cl.setStockType(a.getStockType());
                    cl.setPricePosition(a.getPricePosition());
                    cl.setBigV(a.getBigV());
                    cl.setHoldStrategy(a.getHoldStrategy());
                    cl.setHoldPlan(a.getHoldPlan());
                    cl.setArchiveRemark(a.getRemark());
                }
```

2.6 `upsertArchive` 已存在分支的字段保留块：删除 `a.setTiming/setDecisionLevel/setBuyReason` 三行，`setStockType/setPricePosition` 保留，新增：

```java
            a.setReco(existing.getReco());
            a.setFactor(existing.getFactor());
            a.setTrend(existing.getTrend());
            a.setFame(existing.getFame());
```

2.7 `toView` 的 `if (a != null)` 块：删除 `setTiming/setDecisionLevel/setBuyReason`，`setStockType/setPricePosition/setBigV` 保留，新增：

```java
            v.setReco(a.getReco());
            v.setFactor(a.getFactor());
            v.setTrend(a.getTrend());
            v.setFame(a.getFame());
```

2.8 `updateCleared` 整体替换为：

```java
    @Override
    @Transactional
    public void updateCleared(int clearedId, PortfolioCleared cleared) {
        requireEnumIfPresent(cleared.getClearReason(), CLEAR_REASONS, "清仓原因");
        requireRecoIfPresent(cleared.getReco());
        requireEnumIfPresent(cleared.getStockType(), STOCK_TYPES, "股票种类");
        requireEnumIfPresent(cleared.getFactor(), FACTORS, "因素");
        requireEnumIfPresent(cleared.getTrend(), TRENDS, "走势");
        requireEnumIfPresent(cleared.getFame(), FAMES, "知名度");
        requireEnumIfPresent(cleared.getPricePosition(), PRICE_POSITIONS, "股价位置");
        cleared.setBigV(
                cleared.getReco() == null || cleared.getReco().isBlank()
                        ? null
                        : cleared.getBigV());
        cleared.setClearedId(clearedId);
        clearedMapper.updateClearedFields(cleared);
    }
```

2.9 `stats()` 末尾饼图块替换为：

```java
        result.setIndustryPie(groupBy(rows, p -> p.getIndustryL1(), s));
        result.setRecoPie(groupByReco(rows, archives, s));
        result.setFactorPie(groupBy(rows, p -> archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getFactor(), s));
        result.setTrendPie(groupBy(rows, p -> archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getTrend(), s));
        result.setFamePie(groupBy(rows, p -> archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getFame(), s));
        result.setStockTypePie(groupBy(rows, p -> archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getStockType(), s));
        result.setPositionPie(groupBy(rows, p -> archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getPricePosition(), s));
        result.setHoldStrategyPie(groupBy(rows, p -> archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getHoldStrategy(), s));
        return result;
```

并新增 `groupByReco`（放在 `groupBy` 之后；多选推荐每个选中项各计一次）：

```java
    private List<PortfolioStats.PieSlice> groupByReco(List<PortfolioPosition> rows,
                                                      Map<String, PortfolioArchive> archives,
                                                      String scope) {
        Map<String, double[]> acc = new LinkedHashMap<>();
        for (PortfolioPosition p : rows) {
            String reco = archives.getOrDefault(p.getStockCode(), EMPTY_ARCHIVE).getReco();
            if (reco == null || reco.isBlank()) {
                continue;
            }
            for (String part : reco.split(",")) {
                String k = part.trim();
                if (k.isEmpty()) {
                    continue;
                }
                double[] v = acc.computeIfAbsent(k, x -> new double[]{0, 0});
                v[0] += nz(mvOf(p, scope));
                v[1] += 1;
            }
        }
        List<PortfolioStats.PieSlice> list = new ArrayList<>();
        acc.forEach((k, v) -> list.add(new PortfolioStats.PieSlice(k, round(v[0]), (int) v[1])));
        return list;
    }
```

- [ ] **Step 3: 更新测试（PortfolioServiceImplTest）**

逐个替换以下测试（其余测试不动）：

3.1 `saveAllPersistsDecisionFields` →

```java
    @Test
    void saveAllPersistsDecisionFields() {
        PortfolioArchive existing = new PortfolioArchive();
        existing.setArchiveId(1);
        existing.setStockCode(CODE);
        when(archiveMapper.findByCode(CODE)).thenReturn(existing);

        PortfolioSaveItem item = new PortfolioSaveItem();
        item.setStockCode(CODE);
        item.setReco("大V推荐,小V推荐");
        item.setFactor("热点");
        item.setTrend("回调");
        item.setFame("龙头");
        item.setStockType("蓝筹");
        item.setPricePosition("高位");
        service.saveAll(List.of(item));

        ArgumentCaptor<PortfolioArchive> captor = ArgumentCaptor.forClass(PortfolioArchive.class);
        verify(archiveMapper).update(captor.capture());
        assertThat(captor.getValue().getReco()).isEqualTo("大V推荐,小V推荐");
        assertThat(captor.getValue().getFactor()).isEqualTo("热点");
        assertThat(captor.getValue().getTrend()).isEqualTo("回调");
        assertThat(captor.getValue().getFame()).isEqualTo("龙头");
        assertThat(captor.getValue().getStockType()).isEqualTo("蓝筹");
        assertThat(captor.getValue().getPricePosition()).isEqualTo("高位");
    }
```

3.2 `saveAllRejectsInvalidDecisionLevel` → `saveAllRejectsInvalidDimensionValue`：

```java
    @Test
    void saveAllRejectsInvalidDimensionValue() {
        PortfolioArchive existing = new PortfolioArchive();
        existing.setArchiveId(1);
        existing.setStockCode(CODE);
        when(archiveMapper.findByCode(CODE)).thenReturn(existing);

        PortfolioSaveItem item = new PortfolioSaveItem();
        item.setStockCode(CODE);
        item.setFame("网红");
        assertThatThrownBy(() -> service.saveAll(List.of(item)))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("非法知名度");

        PortfolioSaveItem badReco = new PortfolioSaveItem();
        badReco.setStockCode(CODE);
        badReco.setReco("大V推荐,野鸡V");
        assertThatThrownBy(() -> service.saveAll(List.of(badReco)))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("非法推荐来源");
    }
```

3.3 `confirmImportCopiesDecisionSnapshotToCleared` 中 archive 数据与断言替换：

```java
        archive.setBigV("老V");
        archive.setReco("大V推荐");
        archive.setFactor("热点");
        archive.setFame("龙头");
        archive.setStockType("蓝筹");
        archive.setPricePosition("低位");
```

断言：

```java
        assertThat(captor.getValue().getReco()).isEqualTo("大V推荐");
        assertThat(captor.getValue().getFactor()).isEqualTo("热点");
        assertThat(captor.getValue().getFame()).isEqualTo("龙头");
        assertThat(captor.getValue().getStockType()).isEqualTo("蓝筹");
        assertThat(captor.getValue().getPricePosition()).isEqualTo("低位");
        assertThat(captor.getValue().getBigV()).isEqualTo("老V");
```

（删除原 `getDecisionLevel` 断言。）

3.4 `updateClearedPersistsDecisionFieldsAndAllowsBlank` →

```java
    @Test
    void updateClearedPersistsDecisionFieldsAndAllowsBlank() {
        PortfolioCleared cleared = new PortfolioCleared();
        cleared.setClearReason("止盈");
        cleared.setReco("小V推荐");
        cleared.setBigV("老V");
        cleared.setFactor("潜伏");
        cleared.setTrend("暴跌");
        cleared.setFame("二线");
        cleared.setStockType("成长");
        cleared.setPricePosition("中位");
        service.updateCleared(5, cleared);

        ArgumentCaptor<PortfolioCleared> captor = ArgumentCaptor.forClass(PortfolioCleared.class);
        verify(clearedMapper).updateClearedFields(captor.capture());
        assertThat(captor.getValue().getReco()).isEqualTo("小V推荐");
        assertThat(captor.getValue().getBigV()).isEqualTo("老V");
        assertThat(captor.getValue().getFame()).isEqualTo("二线");

        PortfolioCleared blank = new PortfolioCleared();
        blank.setClearReason("");
        service.updateCleared(6, blank);
        verify(clearedMapper, times(2)).updateClearedFields(captor.capture());
        assertThat(captor.getValue().getClearReason()).isEmpty();

        PortfolioCleared bad = new PortfolioCleared();
        bad.setClearReason("止盈");
        bad.setTrend("阴跌");
        assertThatThrownBy(() -> service.updateCleared(7, bad))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("非法走势");
    }
```

3.5 `saveAllKeepsBigVOnlyForBigVReasons` → `saveAllKeepsBigVOnlyWhenRecoPresent`：

```java
    @Test
    void saveAllKeepsBigVOnlyWhenRecoPresent() {
        PortfolioArchive existing = new PortfolioArchive();
        existing.setArchiveId(1);
        existing.setStockCode(CODE);
        existing.setBigV("旧V");
        when(archiveMapper.findByCode(CODE)).thenReturn(existing);

        PortfolioSaveItem keep = new PortfolioSaveItem();
        keep.setStockCode(CODE);
        keep.setReco("大V推荐");
        keep.setBigV("老V");
        service.saveAll(List.of(keep));
        ArgumentCaptor<PortfolioArchive> captor = ArgumentCaptor.forClass(PortfolioArchive.class);
        verify(archiveMapper).update(captor.capture());
        assertThat(captor.getValue().getBigV()).isEqualTo("老V");

        PortfolioSaveItem drop = new PortfolioSaveItem();
        drop.setStockCode(CODE);
        drop.setTrend("回调");
        service.saveAll(List.of(drop));
        verify(archiveMapper, times(2)).update(captor.capture());
        assertThat(captor.getValue().getBigV()).isNull();
    }
```

3.6 新增 `statsReturnsRecoPieCountingEachSelectedOnce`（放在 `statsReturnsStockTypePie` 后）：

```java
    @Test
    void statsReturnsRecoPieCountingEachSelectedOnce() {
        PortfolioSnapshot snap = new PortfolioSnapshot();
        snap.setStatsDate(NEW_DATE);
        snap.setTotalCash(0.0);
        when(snapshotMapper.findAllOrderByDateDesc()).thenReturn(new ArrayList<>(List.of(snap)));
        PortfolioPosition p1 = new PortfolioPosition();
        p1.setStockCode(CODE);
        p1.setTotalMv(100.0);
        when(positionMapper.findByStatsDate(NEW_DATE)).thenReturn(List.of(p1));
        PortfolioArchive archive = new PortfolioArchive();
        archive.setStockCode(CODE);
        archive.setReco("大V推荐,小V推荐");
        when(archiveMapper.findCodes(anyList())).thenReturn(List.of(archive));

        PortfolioStats stats = service.stats("all", null, null, NEW_DATE);

        assertThat(stats.getRecoPie())
                .extracting(PortfolioStats.PieSlice::getName)
                .containsExactly("大V推荐", "小V推荐");
        assertThat(stats.getRecoPie())
                .extracting(PortfolioStats.PieSlice::getCount)
                .containsExactly(1, 1);
    }
```

- [ ] **Step 4: 跑测试**

Run: `mvnw.cmd test`（workdir `$SRV`）
Expected: BUILD SUCCESS，全部通过（含更新后的 6 个测试）。

---

### Task 4: 前端共享逻辑层重写（decision-display / decision-fields）

**Files:**

- Modify: `$WEB/src/views/portfolio/decision-display.js`（整体替换）
- Modify: `$WEB/src/views/portfolio/decision-display.test.js`（整体替换）
- Modify: `$WEB/src/views/portfolio/decision-fields.js`（整体替换）
- Modify: `$WEB/src/views/portfolio/decision-fields.test.js`（整体替换）

**Interfaces:**

- Produces: `decisionText(row)`（六维非空 `·` 拼接）；`useDecisionFields(form)` 返回 `{ showBigV }`（consumed by Task 5 组件）。

- [ ] **Step 1: 写失败测试（decision-display.test.js）**

```js
import { describe, expect, it } from 'vitest'

import { decisionText } from './decision-display'

describe('decisionText', () => {
  it('joins non-empty dims in II card order with ·', () => {
    expect(
      decisionText({
        reco: '大V推荐',
        factor: '热点',
        trend: '回调',
        fame: '龙头',
        stockType: '蓝筹',
        pricePosition: '高位'
      })
    ).toBe('大V推荐·热点·回调·龙头·蓝筹·高位')
  })

  it('renders multi reco with 、 inside its segment', () => {
    expect(decisionText({ reco: '大V推荐,小V推荐', trend: '暴跌' })).toBe(
      '大V推荐、小V推荐·暴跌'
    )
  })

  it('skips empty dims and returns dash when empty', () => {
    expect(decisionText({ stockType: '蓝筹', pricePosition: '低位' })).toBe(
      '蓝筹·低位'
    )
    expect(decisionText({})).toBe('-')
    expect(decisionText(null)).toBe('-')
  })
})
```

- [ ] **Step 2: 重写 decision-display.js**

```js
/**
 * "买入原因"合并列展示：推荐-因素-走势-知名度-类型-位置（买入判定 II 六维）。
 * 多选推荐（逗号存储）在段内以顿号连接；非空段以 · 连接，全空显示 -。
 */
const DIM_FIELDS = [
  { key: 'reco', multi: true },
  { key: 'factor' },
  { key: 'trend' },
  { key: 'fame' },
  { key: 'stockType' },
  { key: 'pricePosition' }
]

export function decisionText(row) {
  if (!row) return '-'
  const parts = DIM_FIELDS.map(({ key, multi }) => {
    const v = row[key]
    if (!v) return ''
    return multi ? String(v).split(',').join('、') : v
  }).filter(Boolean)
  return parts.join('·') || '-'
}
```

- [ ] **Step 3: 写失败测试（decision-fields.test.js）**

```js
import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'

import { useDecisionFields } from './decision-fields'

describe('useDecisionFields', () => {
  it('shows bigV input only when reco contains a recommendation', () => {
    const form = reactive({ reco: [] })
    const d = useDecisionFields(form)
    expect(d.showBigV.value).toBe(false)

    form.reco = ['大V推荐']
    expect(d.showBigV.value).toBe(true)

    form.reco = ['小V推荐']
    expect(d.showBigV.value).toBe(true)

    form.reco = []
    expect(d.showBigV.value).toBe(false)
  })

  it('accepts comma-joined reco string as well', () => {
    const form = reactive({ reco: '大V推荐' })
    const d = useDecisionFields(form)
    expect(d.showBigV.value).toBe(true)
  })
})
```

- [ ] **Step 4: 重写 decision-fields.js**

```js
import { computed } from 'vue'

/**
 * 买入原因六维共享逻辑（持仓/已清仓编辑弹窗共用）。
 * 六维互相独立、互不联动；推荐含大V推荐/小V推荐时显示姓名输入。
 * form 须为 reactive 对象，含 reco/factor/trend/fame/stockType/pricePosition。
 */
export function useDecisionFields(form) {
  const showBigV = computed(() => {
    const reco = Array.isArray(form.reco)
      ? form.reco
      : String(form.reco || '').split(',')
    return reco.includes('大V推荐') || reco.includes('小V推荐')
  })

  return { showBigV }
}
```

- [ ] **Step 5: 运行测试**

Run: `npx vitest run src/views/portfolio/decision-display.test.js src/views/portfolio/decision-fields.test.js`（workdir `$WEB`）
Expected: 全部 PASS。

---

### Task 5: 共享弹窗组件 DecisionSixFields

**Files:**

- Create: `$WEB/src/views/portfolio/components/DecisionSixFields.vue`
- Create: `$WEB/src/views/portfolio/components/DecisionSixFields.test.js`

**Interfaces:**

- Consumes: `DECISION_DIMENSIONS`（`$WEB/src/views/decision/buyDecisionRules2.js`）、`useDecisionFields`（Task 4）。
- Produces: `<DecisionSixFields :form="form" />`，直接读写 `form` 的 `reco(数组)/factor/trend/fame/stockType/pricePosition/bigV`，供 Task 6/7 两个弹窗复用。

- [ ] **Step 1: 写失败测试**

```js
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ElementPlus from 'element-plus'
import { reactive } from 'vue'

import DecisionSixFields from './DecisionSixFields.vue'

describe('DecisionSixFields', () => {
  function mountWith(form) {
    return mount(DecisionSixFields, {
      props: { form },
      global: { plugins: [ElementPlus] }
    })
  }

  it('renders six dimension inputs in II card order', () => {
    const wrapper = mountWith(
      reactive({
        reco: [],
        factor: '',
        trend: '',
        fame: '',
        stockType: '',
        pricePosition: '',
        bigV: ''
      })
    )
    const labels = wrapper.findAll('.el-form-item__label').map((n) => n.text())
    expect(labels).toEqual([
      '推荐来源',
      '因素',
      '走势',
      '知名度',
      '类型',
      '股价位置'
    ])
  })

  it('hides bigV input when reco empty and shows it when reco set', async () => {
    const form = reactive({
      reco: [],
      factor: '',
      trend: '',
      fame: '',
      stockType: '',
      pricePosition: '',
      bigV: ''
    })
    const wrapper = mountWith(form)
    expect(wrapper.text()).not.toContain('大V姓名')

    form.reco = ['小V推荐']
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('大V姓名')
  })
})
```

- [ ] **Step 2: 实现组件**

```vue
<template>
  <el-form-item label="推荐来源">
    <el-select v-model="form.reco" multiple clearable style="width: 100%">
      <el-option v-for="o in recoOptions" :key="o" :label="o" :value="o" />
    </el-select>
  </el-form-item>
  <el-form-item v-for="d in singleFields" :key="d.field" :label="d.label">
    <el-select v-model="form[d.field]" clearable style="width: 100%">
      <el-option v-for="o in d.options" :key="o" :label="o" :value="o" />
    </el-select>
  </el-form-item>
  <el-form-item v-if="showBigV" label="大V姓名">
    <el-input v-model="form.bigV" placeholder="大V/小V推荐时填写" />
  </el-form-item>
</template>

<script setup>
import { DECISION_DIMENSIONS } from '@/views/decision/buyDecisionRules2'
import { useDecisionFields } from '../decision-fields'

const props = defineProps({
  form: { type: Object, required: true }
})

const form = props.form

function dim(key) {
  return DECISION_DIMENSIONS.find((d) => d.key === key)
}

const recoOptions = dim('recommends').options
const singleFields = [
  {
    field: 'factor',
    label: dim('factor').label,
    options: dim('factor').options
  },
  { field: 'trend', label: dim('trend').label, options: dim('trend').options },
  { field: 'fame', label: dim('fame').label, options: dim('fame').options },
  {
    field: 'stockType',
    label: dim('type').label,
    options: dim('type').options
  },
  {
    field: 'pricePosition',
    label: '股价位置',
    options: dim('position').options
  }
]

const { showBigV } = useDecisionFields(form)
</script>
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/views/portfolio/components/DecisionSixFields.test.js`（workdir `$WEB`）
Expected: PASS。

---

### Task 6: 持仓编辑弹窗 PositionEditDialog 六维化

**Files:**

- Modify: `$WEB/src/views/portfolio/components/PositionEditDialog.vue`（整体替换）
- Modify: `$WEB/src/views/portfolio/components/PositionEditDialog.test.js`（整体替换）

**Interfaces:**

- Consumes: `DecisionSixFields`（Task 5）、`updatePortfolioArchive`（不变）。
- Produces: 保存载荷六字段 `reco(逗号拼接或 null)/factor/trend/fame/stockType/pricePosition/bigV + 原有其余字段`。

- [ ] **Step 1: 写失败测试**

```js
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

import { updatePortfolioArchive } from '@/api/portfolio'
import PositionEditDialog from './PositionEditDialog.vue'

vi.mock('@/api/portfolio', () => ({
  updatePortfolioArchive: vi.fn(() => Promise.resolve({}))
}))

describe('PositionEditDialog', () => {
  const row = {
    stockCode: '00700.HK',
    stockName: '腾讯控股',
    reco: '大V推荐',
    factor: '热点',
    trend: '',
    fame: '龙头',
    stockType: '蓝筹',
    pricePosition: '高位',
    bigV: '老V',
    holdStrategy: '长期持有',
    holdPlan: '逢低加仓',
    earningsNote: '中报 ROE 15%',
    archiveRemark: '核心资产'
  }

  beforeEach(() => {
    vi.mocked(updatePortfolioArchive).mockClear()
  })

  async function openMount() {
    const wrapper = mount(PositionEditDialog, {
      props: { visible: true, row },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()
    return wrapper
  }

  it('splits stored reco into multi select and joins on save', async () => {
    const wrapper = await openMount()
    expect(wrapper.vm.form.reco).toEqual(['大V推荐'])
    expect(wrapper.vm.showBigV).toBe(true)

    wrapper.vm.form.reco = ['大V推荐', '小V推荐']
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenCalledWith('00700.HK', {
      reco: '大V推荐,小V推荐',
      factor: '热点',
      trend: null,
      fame: '龙头',
      stockType: '蓝筹',
      pricePosition: '高位',
      bigV: '老V',
      holdStrategy: '长期持有',
      holdPlan: '逢低加仓',
      remark: '核心资产',
      earningsNote: '中报 ROE 15%'
    })
  })

  it('sends null for all six dims when empty', async () => {
    const wrapper = await openMount()
    wrapper.vm.form.reco = []
    wrapper.vm.form.factor = ''
    wrapper.vm.form.fame = ''
    wrapper.vm.form.stockType = ''
    wrapper.vm.form.pricePosition = ''
    wrapper.vm.form.holdPlan = ''
    wrapper.vm.form.archiveRemark = ''
    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioArchive).toHaveBeenCalledWith('00700.HK', {
      reco: null,
      factor: null,
      trend: null,
      fame: null,
      stockType: null,
      pricePosition: null,
      bigV: null,
      holdStrategy: '长期持有',
      holdPlan: '',
      remark: '',
      earningsNote: '中报 ROE 15%'
    })
  })

  it('keeps dims independent when one changes', async () => {
    const wrapper = await openMount()
    wrapper.vm.form.trend = '回调'
    expect(wrapper.vm.form.stockType).toBe('蓝筹')
    expect(wrapper.vm.form.pricePosition).toBe('高位')
    expect(wrapper.vm.form.reco).toEqual(['大V推荐'])
  })
})
```

- [ ] **Step 2: 重写弹窗**

```vue
<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑档案 ${form.stockName || form.stockCode || ''}`"
    width="500px"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form label-width="90px">
      <DecisionSixFields :form="form" />
      <el-form-item label="持股策略">
        <el-select v-model="form.holdStrategy" clearable style="width: 100%">
          <el-option
            v-for="s in holdStrategies"
            :key="s"
            :label="s"
            :value="s"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="持股计划">
        <el-input v-model="form.holdPlan" />
      </el-form-item>
      <el-form-item label="当期业绩">
        <el-input v-model="form.earningsNote" type="textarea" :rows="2" />
      </el-form-item>
      <el-form-item label="备考">
        <el-input v-model="form.archiveRemark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        data-test="confirm"
        @click="confirm"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updatePortfolioArchive } from '@/api/portfolio'
import { useDecisionFields } from '../decision-fields'
import DecisionSixFields from './DecisionSixFields.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const holdStrategies = ['非卖品', '长期持有', '中期持有', '可卖品', '跟随大V']

const form = reactive({
  stockCode: '',
  stockName: '',
  reco: [],
  factor: '',
  trend: '',
  fame: '',
  stockType: '',
  pricePosition: '',
  bigV: '',
  holdStrategy: '',
  holdPlan: '',
  earningsNote: '',
  archiveRemark: ''
})
const saving = ref(false)

const { showBigV } = useDecisionFields(form)

watch(
  () => [props.visible, props.row],
  ([visible, row]) => {
    if (!visible || !row) return
    Object.assign(form, {
      stockCode: row.stockCode || '',
      stockName: row.stockName || '',
      reco: row.reco ? String(row.reco).split(',') : [],
      factor: row.factor || '',
      trend: row.trend || '',
      fame: row.fame || '',
      stockType: row.stockType || '',
      pricePosition: row.pricePosition || '',
      bigV: row.bigV || '',
      holdStrategy: row.holdStrategy || '',
      holdPlan: row.holdPlan || '',
      earningsNote: row.earningsNote || '',
      archiveRemark: row.archiveRemark || ''
    })
  },
  { immediate: true }
)

async function confirm() {
  saving.value = true
  try {
    await updatePortfolioArchive(form.stockCode, {
      reco: form.reco.length ? form.reco.join(',') : null,
      factor: form.factor || null,
      trend: form.trend || null,
      fame: form.fame || null,
      stockType: form.stockType || null,
      pricePosition: form.pricePosition || null,
      bigV: showBigV.value ? form.bigV || null : null,
      holdStrategy: form.holdStrategy || null,
      holdPlan: form.holdPlan,
      remark: form.archiveRemark,
      earningsNote: form.earningsNote || null
    })
    ElMessage.success('保存成功')
    emit('saved')
    emit('update:visible', false)
  } catch {
    // interceptor 已提示
  } finally {
    saving.value = false
  }
}

defineExpose({ form, showBigV })
</script>
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/views/portfolio/components/PositionEditDialog.test.js`（workdir `$WEB`）
Expected: PASS。

---

### Task 7: 已清仓编辑弹窗 ClearedEditDialog 六维化

**Files:**

- Modify: `$WEB/src/views/portfolio/components/ClearedEditDialog.vue`（整体替换）
- Modify: `$WEB/src/views/portfolio/components/ClearedEditDialog.test.js`（整体替换）

**Interfaces:**

- Consumes: `DecisionSixFields`（Task 5）、`updatePortfolioCleared`（不变）。
- Produces: 与 Task 6 同构的六字段载荷 + 清仓字段。

- [ ] **Step 1: 写失败测试**

```js
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ElementPlus from 'element-plus'

import { updatePortfolioCleared } from '@/api/portfolio'
import ClearedEditDialog from './ClearedEditDialog.vue'

vi.mock('@/api/portfolio', () => ({
  updatePortfolioCleared: vi.fn(() => Promise.resolve({}))
}))

describe('ClearedEditDialog', () => {
  const row = {
    clearedId: 9,
    stockCode: '600745.SH',
    stockName: '闻泰科技',
    reco: '小V推荐',
    factor: '潜伏',
    trend: '',
    fame: '二线',
    stockType: '成长',
    pricePosition: '中位',
    bigV: '老V',
    clearReason: '止盈',
    clearReasonRemark: '达到目标价',
    realizedPl: 6740,
    holdDays: 24,
    clearedRemark: '按计划离场'
  }

  beforeEach(() => {
    vi.mocked(updatePortfolioCleared).mockClear()
  })

  it('submits six-dim payload plus cleared fields', async () => {
    const wrapper = mount(ClearedEditDialog, {
      props: { visible: true, row },
      global: { plugins: [ElementPlus] }
    })
    await flushPromises()

    await wrapper.find('[data-test="confirm"]').trigger('click')
    await flushPromises()

    expect(updatePortfolioCleared).toHaveBeenCalledWith(9, {
      reco: '小V推荐',
      factor: '潜伏',
      trend: null,
      fame: '二线',
      stockType: '成长',
      pricePosition: '中位',
      bigV: '老V',
      clearReason: '止盈',
      clearReasonRemark: '达到目标价',
      realizedPl: 6740,
      holdDays: 24,
      clearedRemark: '按计划离场'
    })
  })
})
```

- [ ] **Step 2: 重写弹窗（保留清仓专属字段）**

```vue
<template>
  <el-dialog
    :model-value="visible"
    :title="`编辑清仓 ${row?.stockName || row?.stockCode || ''}`"
    width="500px"
    @update:model-value="(v) => emit('update:visible', v)"
  >
    <el-form label-width="90px">
      <DecisionSixFields :form="form" />
      <el-form-item label="清仓原因">
        <el-select v-model="form.clearReason" clearable style="width: 100%">
          <el-option v-for="r in clearReasons" :key="r" :label="r" :value="r" />
        </el-select>
      </el-form-item>
      <el-form-item label="清仓原因备注">
        <el-input v-model="form.clearReasonRemark" />
      </el-form-item>
      <el-form-item label="实现盈亏">
        <el-input-number
          v-model="form.realizedPl"
          :precision="2"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="持股天数">
        <el-input-number
          v-model="form.holdDays"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="清仓备注">
        <el-input v-model="form.clearedRemark" type="textarea" :rows="2" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        data-test="confirm"
        @click="confirm"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { updatePortfolioCleared } from '@/api/portfolio'
import { useDecisionFields } from '../decision-fields'
import DecisionSixFields from './DecisionSixFields.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  row: { type: Object, default: null }
})
const emit = defineEmits(['update:visible', 'saved'])

const clearReasons = [
  '止损',
  '止盈',
  '消息利空',
  '财报不佳',
  '跟随大V',
  '信心不足',
  '其他'
]

const form = reactive({
  clearedId: null,
  reco: [],
  factor: '',
  trend: '',
  fame: '',
  stockType: '',
  pricePosition: '',
  bigV: '',
  clearReason: '',
  clearReasonRemark: '',
  realizedPl: null,
  holdDays: null,
  clearedRemark: ''
})
const saving = ref(false)

watch(
  () => [props.visible, props.row],
  ([visible, row]) => {
    if (!visible || !row) return
    Object.assign(form, {
      clearedId: row.clearedId ?? null,
      reco: row.reco ? String(row.reco).split(',') : [],
      factor: row.factor || '',
      trend: row.trend || '',
      fame: row.fame || '',
      stockType: row.stockType || '',
      pricePosition: row.pricePosition || '',
      bigV: row.bigV || '',
      clearReason: row.clearReason || '',
      clearReasonRemark: row.clearReasonRemark || '',
      realizedPl: row.realizedPl ?? null,
      holdDays: row.holdDays ?? null,
      clearedRemark: row.clearedRemark || ''
    })
  },
  { immediate: true }
)

const { showBigV } = useDecisionFields(form)

async function confirm() {
  saving.value = true
  try {
    await updatePortfolioCleared(form.clearedId, {
      reco: form.reco.length ? form.reco.join(',') : null,
      factor: form.factor || null,
      trend: form.trend || null,
      fame: form.fame || null,
      stockType: form.stockType || null,
      pricePosition: form.pricePosition || null,
      bigV: showBigV.value ? form.bigV || null : null,
      clearReason: form.clearReason || null,
      clearReasonRemark: form.clearReasonRemark,
      realizedPl: form.realizedPl,
      holdDays: form.holdDays,
      clearedRemark: form.clearedRemark
    })
    ElMessage.success('保存成功')
    emit('saved')
    emit('update:visible', false)
  } catch {
    // interceptor 已提示
  } finally {
    saving.value = false
  }
}

defineExpose({ form })
</script>
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/views/portfolio/components/ClearedEditDialog.test.js`（workdir `$WEB`）
Expected: PASS。

---

### Task 8: 列表页六维合并列与双筛选（LatestPosition + ClearedPosition）

**Files:**

- Modify: `$WEB/src/views/portfolio/LatestPosition.vue`
- Modify: `$WEB/src/views/portfolio/ClearedPosition.vue`

**Interfaces:**

- Consumes: `decisionText`（Task 4，六维拼接）；后端返回行数据的 `reco/factor/trend/fame/stockType/pricePosition/bigV`（Task 2/3）。

- [ ] **Step 1: LatestPosition.vue 改造**

1a. 合并列（template，约 63-73 行）：`label="买入判定"` → `label="买入原因"`，filters/filter-method 换名：

```html
<el-table-column
  label="买入原因"
  min-width="170"
  :filters="decisionFilterOpts"
  :filter-method="filterDecision"
></el-table-column>
```

1b. script 导入（顶部）：

```js
import { DECISION_DIMENSIONS } from '@/views/decision/buyDecisionRules2'
```

1c. 筛选逻辑替换（原 `decisionFilterOpts`/`filterDecision`，约 290-301 行）：

```js
const recoOptions = DECISION_DIMENSIONS.find(
  (d) => d.key === 'recommends'
).options
const typeOptions = DECISION_DIMENSIONS.find((d) => d.key === 'type').options
const decisionFilterOpts = computed(() => [
  ...recoOptions.map((v) => ({ text: `推荐：${v}`, value: `reco:${v}` })),
  ...typeOptions.map((v) => ({ text: `类型：${v}`, value: `type:${v}` }))
])
function filterDecision(value, row) {
  const idx = value.indexOf(':')
  const kind = value.slice(0, idx)
  const v = value.slice(idx + 1)
  if (kind === 'reco')
    return String(row.reco || '')
      .split(',')
      .includes(v)
  return row.stockType === v
}
```

1d. `load()` 行映射（约 330-342 行）把决策字段块替换为：

```js
      reco: p.reco || '',
      factor: p.factor || '',
      trend: p.trend || '',
      fame: p.fame || '',
      stockType: p.stockType || '',
      pricePosition: p.pricePosition || '',
```

（删除 `buyReason/timing/decisionLevel` 三行；`bigV/holdStrategy/holdPlan/archiveRemark/earningsNote` 不动。）

- [ ] **Step 2: ClearedPosition.vue 改造**

2a. 合并列（约 23-30 行）：`label="买入判定"` → `label="买入原因"`。
2b. script 导入 `DECISION_DIMENSIONS`，筛选逻辑与 Step 1c 完全相同（替换原 `decisionFilterOpts`/`filterDecision`，约 86-97 行）。
2c. `load()` 行映射（约 110-122 行）决策字段块与 Step 1d 完全相同。

- [ ] **Step 3: 验证**

Run: `npx vitest run src/views/portfolio` && `npx prettier --check src/views/portfolio`（workdir `$WEB`）
Expected: 既有单测全 PASS（这两个页面无专属测试文件）；prettier 无格式问题。人工起 `npm run dev` 打开持仓页/已清仓页，确认合并列显示如 `大V推荐·回调·蓝筹·中位`、筛选下拉含"推荐：/类型："两组选项。

---

### Task 9: 已清仓统计分析六维化（cleared-analysis.js）

**Files:**

- Modify: `$WEB/src/views/portfolio/cleared-analysis.js`（整体替换）
- Modify: `$WEB/src/views/portfolio/cleared-analysis.test.js`（整体替换）

**Interfaces:**

- Produces: `summarizeCleared` 返回值新增 `recoPie/factorPie/trendPie/famePie/stockTypePie/positionPie`，删除 `buyReasonPie/byBuyReason`；`byStockType` 保留（即"按类型"胜率表）。

- [ ] **Step 1: 写失败测试**

替换测试数据 rows（六维字段）与断言。完整新测试文件：

```js
import { describe, expect, it } from 'vitest'

import { summarizeCleared } from './cleared-analysis'

describe('summarizeCleared', () => {
  const rows = [
    {
      stockCode: '000725.SZ',
      clearedDate: '2026-09-05',
      clearReason: '信心不足',
      reco: '',
      factor: '',
      trend: '',
      fame: '',
      stockType: '',
      pricePosition: '',
      realizedPl: null,
      holdDays: 14
    },
    {
      stockCode: '600745.SH',
      clearedDate: '2026-08-29',
      clearReason: '止盈',
      reco: '小V推荐',
      factor: '潜伏',
      trend: '',
      fame: '二线',
      stockType: '成长',
      pricePosition: '中位',
      realizedPl: 6740.0,
      holdDays: 24
    },
    {
      stockCode: '01024.HK',
      clearedDate: '2026-08-22',
      clearReason: '止损',
      reco: '',
      factor: '',
      trend: '',
      fame: '',
      stockType: '蓝筹',
      pricePosition: '低位',
      realizedPl: -9672.0,
      holdDays: 34
    },
    {
      stockCode: '601101.SH',
      clearedDate: '2026-08-22',
      clearReason: '止盈',
      reco: '大V推荐,小V推荐',
      factor: '',
      trend: '',
      fame: '',
      stockType: '蓝筹',
      pricePosition: '低位',
      realizedPl: 1881.0,
      holdDays: 10
    }
  ]

  it('counts rows and sums non-null realized P&L', () => {
    const s = summarizeCleared(rows, null)
    expect(s.count).toBe(4)
    expect(s.realizedTotal).toBeCloseTo(6740 - 9672 + 1881)
  })

  it('computes win rate over rows with realized P&L only', () => {
    const s = summarizeCleared(rows, null)
    expect(s.decided).toBe(3)
    expect(s.winRate).toBeCloseTo(2 / 3)
  })

  it('groups clear reason and six-dim pies by row count', () => {
    const s = summarizeCleared(rows, null)
    expect(s.reasonPie).toEqual([
      { name: '止盈', count: 2 },
      { name: '信心不足', count: 1 },
      { name: '止损', count: 1 }
    ])
    expect(s.recoPie).toEqual([
      { name: '小V推荐', count: 2 },
      { name: '大V推荐', count: 1 }
    ])
    expect(s.factorPie).toEqual([{ name: '潜伏', count: 1 }])
    expect(s.trendPie).toEqual([])
    expect(s.famePie).toEqual([{ name: '二线', count: 1 }])
    expect(s.stockTypePie).toEqual([
      { name: '蓝筹', count: 2 },
      { name: '成长', count: 1 }
    ])
    expect(s.positionPie).toEqual([
      { name: '低位', count: 2 },
      { name: '中位', count: 1 }
    ])
  })

  it('aggregates realized P&L by cleared date ascending, skipping unfilled rows', () => {
    const s = summarizeCleared(rows, null)
    expect(s.plByDate).toEqual([
      { date: '2026-08-22', pl: -9672 + 1881 },
      { date: '2026-08-29', pl: 6740 }
    ])
  })

  it('filters rows by date range', () => {
    const s = summarizeCleared(rows, ['2026-08-22', '2026-08-29'])
    expect(s.count).toBe(3)
    expect(s.realizedTotal).toBeCloseTo(6740 - 9672 + 1881)
  })

  it('handles empty rows', () => {
    const s = summarizeCleared([], null)
    expect(s.count).toBe(0)
    expect(s.realizedTotal).toBe(0)
    expect(s.winRate).toBeNull()
    expect(s.avgHoldDays).toBeNull()
    expect(s.reasonPie).toEqual([])
    expect(s.recoPie).toEqual([])
    expect(s.stockTypePie).toEqual([])
    expect(s.plByDate).toEqual([])
  })

  it('breaks down win rate and avg pl by dimension, skipping unfilled P&L', () => {
    const s = summarizeCleared(rows, null)
    expect(s.byReason).toEqual([
      {
        name: '止盈',
        count: 2,
        decided: 2,
        wins: 2,
        winRate: 1,
        avgPl: (6740 + 1881) / 2,
        totalPl: 8621
      },
      {
        name: '信心不足',
        count: 1,
        decided: 0,
        wins: 0,
        winRate: null,
        avgPl: null,
        totalPl: 0
      },
      {
        name: '止损',
        count: 1,
        decided: 1,
        wins: 0,
        winRate: 0,
        avgPl: -9672,
        totalPl: -9672
      }
    ])
    // 按类型（原"按股票种类"）胜率表
    expect(s.byStockType).toEqual([
      {
        name: '成长',
        count: 1,
        decided: 1,
        wins: 1,
        winRate: 1,
        avgPl: 6740,
        totalPl: 6740
      },
      {
        name: '蓝筹',
        count: 2,
        decided: 2,
        wins: 1,
        winRate: 0.5,
        avgPl: (1881 - 9672) / 2,
        totalPl: -7791
      }
    ])
    expect(s.byBuyReason).toBeUndefined()
  })

  it('groups by hold days buckets sorted by bucket order', () => {
    const s = summarizeCleared(rows, null)
    const names = s.byHoldDays.map((b) => b.name)
    expect(names).toEqual(['≤10天', '11~30天', '31~90天', '90天以上'])
    const short = s.byHoldDays.find((b) => b.name === '≤10天')
    expect(short.count).toBe(1)
    expect(short.avgPl).toBe(1881)
  })

  it('breakdowns sort by totalPl desc', () => {
    const s = summarizeCleared(rows, null)
    const totals = s.byReason.map((r) => r.totalPl)
    expect(totals).toEqual([...totals].sort((a, b) => b - a))
  })
})
```

- [ ] **Step 2: 重写 cleared-analysis.js**

在原文件基础上做以下修改（其余原样保留）：

1. 头部注释：`原因/买入原因分布` → `各维度分布`。
2. 循环内把 `buyReasonAcc` 相关替换为六维统计（多选推荐拆分计数）：

```js
const reasonAcc = new Map()
const recoAcc = new Map()
const factorAcc = new Map()
const trendAcc = new Map()
const fameAcc = new Map()
const stockTypeAcc = new Map()
const positionAcc = new Map()
const plAcc = new Map()
```

循环体内，替换原 `const buyReason = r.buyReason ...` 三行为：

```js
countDim(recoAcc, r.reco)
countDim(factorAcc, r.factor)
countDim(trendAcc, r.trend)
countDim(fameAcc, r.fame)
countDim(stockTypeAcc, r.stockType)
countDim(positionAcc, r.pricePosition)
```

3. 返回值：`buyReasonPie` → 七个 pie（reasonPie 保留）：

```js
    reasonPie: pie(reasonAcc),
    recoPie: pie(recoAcc),
    factorPie: pie(factorAcc),
    trendPie: pie(trendAcc),
    famePie: pie(fameAcc),
    stockTypePie: pie(stockTypeAcc),
    positionPie: pie(positionAcc),
```

`byBuyReason` 删除，`byStockType`/`byReason`/`byHoldDays` 保留。

4. 新增辅助函数（`pie` 定义旁）：

```js
function countDim(acc, value) {
  const v = String(value || '')
  if (!v) return
  for (const part of v.split(',')) {
    if (part) acc.set(part, (acc.get(part) || 0) + 1)
  }
}
```

- [ ] **Step 3: 运行测试**

Run: `npx vitest run src/views/portfolio/cleared-analysis.test.js`（workdir `$WEB`）
Expected: PASS。

---

### Task 10: 统计页六维饼图（PortfolioStatistics.vue）

**Files:**

- Modify: `$WEB/src/views/portfolio/PortfolioStatistics.vue`

**Interfaces:**

- Consumes: 后端 `stats` 返回的 `recoPie/factorPie/trendPie/famePie/stockTypePie/positionPie`（Task 3）；`summarizeCleared` 新返回值（Task 8）。

- [ ] **Step 1: 持仓饼图区改造（template pie-grid，约 44-61 行）**

删除"买入原因"chart-box（`chart-buyReason`），插入六个（放在一级行业之后、持股策略之前；"股票种类"标题改"类型"）：

```html
<div class="chart-box">
  <div class="chart-title">推荐来源</div>
  <div id="chart-reco" class="chart"></div>
</div>
<div class="chart-box">
  <div class="chart-title">因素</div>
  <div id="chart-factor" class="chart"></div>
</div>
<div class="chart-box">
  <div class="chart-title">走势</div>
  <div id="chart-trend" class="chart"></div>
</div>
<div class="chart-box">
  <div class="chart-title">知名度</div>
  <div id="chart-fame" class="chart"></div>
</div>
<div class="chart-box">
  <div class="chart-title">类型</div>
  <div id="chart-stockType" class="chart"></div>
</div>
<div class="chart-box">
  <div class="chart-title">股价位置</div>
  <div id="chart-position" class="chart"></div>
</div>
```

- [ ] **Step 2: 已清仓饼图区改造（cleared-grid，约 95-108 行）**

"买入原因分布"chart 替换为六个（id 前缀 `chart-cleared`；"实现盈亏（按清仓日期）"保留在最后）：

```html
<div>
  <div class="chart-subtitle">推荐来源分布</div>
  <div id="chart-clearedReco" class="chart"></div>
</div>
<div>
  <div class="chart-subtitle">因素分布</div>
  <div id="chart-clearedFactor" class="chart"></div>
</div>
<div>
  <div class="chart-subtitle">走势分布</div>
  <div id="chart-clearedTrend" class="chart"></div>
</div>
<div>
  <div class="chart-subtitle">知名度分布</div>
  <div id="chart-clearedFame" class="chart"></div>
</div>
<div>
  <div class="chart-subtitle">类型分布</div>
  <div id="chart-clearedStockType" class="chart"></div>
</div>
<div>
  <div class="chart-subtitle">股价位置分布</div>
  <div id="chart-clearedPosition" class="chart"></div>
</div>
```

- [ ] **Step 3: 维度表区改造（dim-grid，约 110-121 行）**

删除"按买入原因"表；"按股票种类"标题改"按类型"：

```html
<div class="dim-grid">
  <dimension-table title="按清仓原因" :rows="clearedSummary.byReason" />
  <dimension-table title="按类型" :rows="clearedSummary.byStockType" />
  <dimension-table title="按持股天数" :rows="clearedSummary.byHoldDays" />
</div>
```

- [ ] **Step 4: script 同步（initCharts/renderStats/renderCleared）**

`initCharts` 的 ids 数组替换为：

```js
const ids = [
  'chart-line',
  'chart-industry',
  'chart-reco',
  'chart-factor',
  'chart-trend',
  'chart-fame',
  'chart-stockType',
  'chart-position',
  'chart-holdStrategy',
  'chart-clearedReason',
  'chart-clearedReco',
  'chart-clearedFactor',
  'chart-clearedTrend',
  'chart-clearedFame',
  'chart-clearedStockType',
  'chart-clearedPosition',
  'chart-clearedPl'
]
```

`renderStats` 尾部四个 renderPie 替换为：

```js
renderPie('chart-industry', s.industryPie, '行业')
renderPie('chart-reco', s.recoPie, '推荐来源')
renderPie('chart-factor', s.factorPie, '因素')
renderPie('chart-trend', s.trendPie, '走势')
renderPie('chart-fame', s.famePie, '知名度')
renderPie('chart-stockType', s.stockTypePie, '类型')
renderPie('chart-position', s.positionPie, '股价位置')
renderPie('chart-holdStrategy', s.holdStrategyPie, '持股策略')
```

`renderCleared` 前两行替换为：

```js
renderPie('chart-clearedReason', s.reasonPie, '清仓原因', 'count')
renderPie('chart-clearedReco', s.recoPie, '推荐来源', 'count')
renderPie('chart-clearedFactor', s.factorPie, '因素', 'count')
renderPie('chart-clearedTrend', s.trendPie, '走势', 'count')
renderPie('chart-clearedFame', s.famePie, '知名度', 'count')
renderPie('chart-clearedStockType', s.stockTypePie, '类型', 'count')
renderPie('chart-clearedPosition', s.positionPie, '股价位置', 'count')
```

- [ ] **Step 4: 验证**

Run: `npx vitest run src/views/portfolio` && `npm run check`（workdir `$WEB`）
Expected: 单测 PASS；check 全绿（lint/prettier/build）。

---

### Task 11: 全量回归

- [ ] **Step 1: 后端全量**

Run: `mvnw.cmd test`（workdir `$SRV`）
Expected: BUILD SUCCESS。

- [ ] **Step 2: 前端全量**

Run: `npm run check`（workdir `$WEB`）
Expected: eslint/prettier/vitest/build 全通过。

- [ ] **Step 3: 人工联调验收**

1. 启动后端 `mvnw.cmd spring-boot:run`、前端 `npm run dev`。
2. 持仓明细：合并列六维展示、推荐+类型筛选可用；编辑弹窗六维独立可选可清空、推荐多选、选推荐出现大V姓名框、保存成功后刷新数据正确。
3. 已清仓页同上；统计页 8+7 张饼图渲染、"按类型"胜率表有数。
4. 买入判定 I / II 页面回归无变化。

---

## Self-Review 记录

- **Spec 覆盖**：迁移映射（Task 1）、六列存储（Task 2）、后端校验/转清仓/六饼（Task 3）、共享逻辑层（Task 4）、弹窗（Task 5-7）、列表+筛选（Task 8）、统计六饼+类型胜率（Task 9/10）、回归验收（Task 11）——spec 八节全覆盖。
- **占位符**：无 TBD/TODO；所有代码步骤给出完整代码。
- **类型一致性**：字段名 `reco/factor/trend/fame/stockType/pricePosition` 在 Task 2/3/5-10 间一致；`reco` 前端为数组、传输/存储为逗号字符串，转换点固定在弹窗（split/join）与后端 `groupByReco`/`countDim`。
- **偏差说明**：弹窗控件与姓名显示逻辑由"两弹窗各自实现"收敛为共享组件 `DecisionSixFields.vue`（DRY，行为与 spec 表格一致）；列表筛选的两个下拉落在"买入原因"合并列的同一筛选面板中，以"推荐：/类型："前缀区分（el-table 每列仅支持一组 filters）。
