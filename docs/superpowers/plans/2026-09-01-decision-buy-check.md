# 买入判定模块实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增与持仓管理同级的“决策判定”模块，并提供一个纯前端的“买入判定”页面。

**Architecture:** 将判定规则抽成无 Vue 依赖的 `buyDecisionRules.js`，`BuyDecision.vue` 只负责交互与展示；路由挂到现有 Layout 下，侧边栏自动出现一级导航。

**Tech Stack:** Vue 3、Vue Router、Element Plus、Vitest、@vue/test-utils。

## Global Constraints

- 不要执行 `git commit`、`git add` 或任何其他 git 写操作。
- 不新增后端接口、数据库表或决策记录持久化。
- 页面不联网、不查行情。
- 判定规则只能写在 `src/views/decision/buyDecisionRules.js`，页面不得维护第二套规则。
- 工作目录是 `D:\develop\source\investment-vue3`。

---

### Task 1: 判定规则模块的失败测试

**Files:**

- Create: `src/views/decision/buyDecisionRules.test.js`

**Interfaces:**

- Produces: 后续实现需要暴露 `getBuyReasonOptions()`、`getStockTypeOptions(reasonKey)`、`getThirdStep(reasonKey)`、`mapScoreToLevel(score)`、`evaluateDecision({ reason, stockType, position })`。

- [ ] **Step 1: 写失败测试**

创建 `src/views/decision/buyDecisionRules.test.js`：

```js
import { describe, expect, it } from 'vitest'

import {
  evaluateDecision,
  getBuyReasonOptions,
  getStockTypeOptions,
  getThirdStep,
  mapScoreToLevel
} from './buyDecisionRules'

describe('buy decision rules', () => {
  it('exposes ordered buy reason options', () => {
    expect(getBuyReasonOptions().map((item) => item.value)).toEqual([
      'blueLong',
      'hotFollow',
      'pullback',
      'ambush',
      'bigV',
      'smallV',
      'tryIt',
      'crash'
    ])
  })

  it('filters stock type options by reason', () => {
    expect(getStockTypeOptions('hotFollow')).toEqual(['龙头', '二线杂毛'])
    expect(getStockTypeOptions('blueLong')).toEqual([])
  })

  it('switches the third step for crash timing', () => {
    expect(getThirdStep('crash')).toEqual({
      label: '时机',
      options: ['当日', '次日及以后']
    })
    expect(getThirdStep('bigV')).toEqual({
      label: '股价位置',
      options: ['高位', '中位', '低位']
    })
  })

  it('maps scores to levels', () => {
    expect(mapScoreToLevel(-2)).toBe('别买')
    expect(mapScoreToLevel(0)).toBe('别买')
    expect(mapScoreToLevel(1)).toBe('观察')
    expect(mapScoreToLevel(2)).toBe('轻仓')
    expect(mapScoreToLevel(4)).toBe('正常')
    expect(mapScoreToLevel(6)).toBe('重仓')
    expect(mapScoreToLevel(8)).toBe('超重仓')
  })

  it('scores normal reasons with position and stock type', () => {
    expect(
      evaluateDecision({ reason: 'bigV', stockType: '成长', position: '低位' })
    ).toMatchObject({ level: '重仓', units: 6 })

    expect(
      evaluateDecision({
        reason: 'smallV',
        stockType: '二线杂毛',
        position: '高位'
      })
    ).toMatchObject({ level: '别买', units: 0 })

    expect(
      evaluateDecision({
        reason: 'blueLong',
        stockType: null,
        position: '中位'
      })
    ).toMatchObject({ level: '轻仓', units: 2 })
  })

  it('blocks unsupported high positions', () => {
    expect(
      evaluateDecision({
        reason: 'pullback',
        stockType: '蓝筹',
        position: '高位'
      }).level
    ).toBe('别买')

    expect(
      evaluateDecision({
        reason: 'hotFollow',
        stockType: '龙头',
        position: '高位'
      }).level
    ).toBe('别买')
  })

  it('uses the crash timing table', () => {
    expect(
      evaluateDecision({ reason: 'crash', stockType: '蓝筹', position: '当日' })
        .level
    ).toBe('别买')

    expect(
      evaluateDecision({
        reason: 'crash',
        stockType: '蓝筹',
        position: '次日及以后'
      }).level
    ).toBe('正常')

    expect(
      evaluateDecision({
        reason: 'crash',
        stockType: '概念',
        position: '次日及以后'
      }).level
    ).toBe('别买')
  })

  it('uses the try-it position table', () => {
    expect(
      evaluateDecision({ reason: 'tryIt', stockType: '蓝筹', position: '高位' })
        .level
    ).toBe('别买')

    expect(
      evaluateDecision({ reason: 'tryIt', stockType: '成长', position: '中位' })
        .level
    ).toBe('观察')

    expect(
      evaluateDecision({ reason: 'tryIt', stockType: '概念', position: '低位' })
        .level
    ).toBe('轻仓')
  })

  it('uses the ambush table', () => {
    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '蓝筹',
        position: '低位'
      }).level
    ).toBe('正常')

    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '概念',
        position: '低位'
      }).level
    ).toBe('轻仓')

    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '蓝筹',
        position: '中位'
      }).level
    ).toBe('轻仓')

    expect(
      evaluateDecision({
        reason: 'ambush',
        stockType: '成长',
        position: '中位'
      }).level
    ).toBe('观察')
  })
})
```

- [ ] **Step 2: 验证测试失败**

Run: `npm test -- src/views/decision/buyDecisionRules.test.js`

Expected: FAIL，因为 `buyDecisionRules` 模块还不存在。

---

### Task 2: 判定规则模块实现

**Files:**

- Create: `src/views/decision/buyDecisionRules.js`

**Interfaces:**

- Consumes: Task 1 定义的测试 API。
- Produces:
  - `getBuyReasonOptions(): Array<{ value: string, label: string }>`
  - `getStockTypeOptions(reasonKey: string): Array<string>`
  - `getThirdStep(reasonKey: string): { label: string, options: Array<string> }`
  - `mapScoreToLevel(score: number): string`
  - `evaluateDecision({ reason: string, stockType: string | null, position: string }): { level: string, units: number, description: string }`

- [ ] **Step 1: 实现规则**

创建 `src/views/decision/buyDecisionRules.js`：

```js
export const BUY_REASONS = {
  blueLong: {
    label: '蓝筹(长期持有)',
    base: 2,
    types: null,
    positions: ['高位', '中位', '低位'],
    noType: true
  },
  hotFollow: {
    label: '追热点 / 跟风',
    base: 0,
    types: ['龙头', '二线杂毛'],
    positions: ['高位', '中位'],
    denyHigh: true
  },
  pullback: {
    label: '回调抄底',
    base: 2,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位'],
    denyHigh: true
  },
  ambush: {
    label: '潜伏(中期)',
    base: 0,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位'],
    special: true
  },
  bigV: {
    label: '大V推荐',
    base: 4,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位']
  },
  smallV: {
    label: '小V推荐',
    base: 2,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位']
  },
  tryIt: {
    label: '就是想买点试试',
    base: -2,
    types: ['蓝筹', '成长', '概念'],
    positions: ['高位', '中位', '低位'],
    special: true
  },
  crash: {
    label: '暴跌抄底',
    base: 0,
    types: ['蓝筹', '成长', '概念'],
    timing: true
  }
}

export const POSITION_SCORE = {
  高位: -2,
  中位: 0,
  低位: 2
}

export const TYPE_SCORE = {
  蓝筹: 2,
  龙头: 2,
  成长: 0,
  概念: -2,
  二线杂毛: -3
}

export const LEVELS = {
  别买: 0,
  观察: 1,
  轻仓: 2,
  正常: 4,
  重仓: 6,
  超重仓: 8
}

const REASON_KEYS = Object.keys(BUY_REASONS)

export function getBuyReasonOptions() {
  return REASON_KEYS.map((value) => ({
    value,
    label: BUY_REASONS[value].label
  }))
}

export function getStockTypeOptions(reasonKey) {
  const reason = BUY_REASONS[reasonKey]
  if (!reason || reason.noType) {
    return []
  }
  return reason.types || []
}

export function getThirdStep(reasonKey) {
  const reason = BUY_REASONS[reasonKey]
  if (!reason) {
    return { label: '股价位置', options: [] }
  }
  if (reason.timing) {
    return { label: '时机', options: ['当日', '次日及以后'] }
  }
  return { label: '股价位置', options: reason.positions || [] }
}

export function mapScoreToLevel(score) {
  if (score <= 0) return '别买'
  if (score === 1) return '观察'
  if (score === 2) return '轻仓'
  if (score <= 4) return '正常'
  if (score <= 6) return '重仓'
  return '超重仓'
}

export function evaluateDecision({ reason, stockType, position }) {
  const reasonConfig = BUY_REASONS[reason]
  if (!reasonConfig) {
    throw new Error(`未知买入原因: ${reason}`)
  }

  if (reasonConfig.timing) {
    if (position === '当日') {
      return buildResult('别买', '暴跌当天先看戏，别急着伸手接。')
    }
    if (stockType === '蓝筹') {
      return buildResult('正常', '暴跌后次日补跌概率下降，蓝筹可分批进入。')
    }
    return buildResult('别买', '暴跌后接成长/概念风险仍高，先别买。')
  }

  if (reason === 'tryIt') {
    if (position === '高位') {
      return buildResult('别买', '高位试水，容易站岗，先别买。')
    }
    if (position === '中位') {
      return buildResult('观察', '中位，买 1 万观察试试。')
    }
    return buildResult('轻仓', '低位，轻仓 2 万试试。')
  }

  if (reason === 'ambush') {
    if (position === '高位') {
      return buildResult('别买', '潜伏在高位，等回调再说。')
    }
    if (position === '低位') {
      if (stockType === '蓝筹') {
        return buildResult('正常', '低位蓝筹适合中期潜伏。')
      }
      return buildResult('轻仓', '低位成长/概念，轻仓潜伏。')
    }
    if (stockType === '蓝筹') {
      return buildResult('轻仓', '中位蓝筹，轻仓试水。')
    }
    return buildResult('观察', '中位成长/概念，先观察。')
  }

  if (reasonConfig.denyHigh && position === '高位') {
    return buildResult(
      '别买',
      reason === 'pullback'
        ? '高位回调最容易接到半空中，不碰。'
        : '热点追在高位，别当接盘侠。'
    )
  }

  const typeScore = reasonConfig.noType ? 0 : (TYPE_SCORE[stockType] ?? 0)
  const score = reasonConfig.base + POSITION_SCORE[position] + typeScore
  const level = mapScoreToLevel(score)

  return buildResult(
    level,
    describeDecision(reason, stockType, position, level)
  )
}

function buildResult(level, description) {
  return {
    level,
    units: LEVELS[level],
    description
  }
}

function describeDecision(reasonKey, stockType, position, level) {
  const reason = BUY_REASONS[reasonKey]
  const typePart = reason.noType ? '' : ` + ${stockType}`
  const prefix = `${reason.label}${typePart} + ${position}`

  if (level === '别买') {
    return `${prefix}：这笔不划算，先不动。`
  }
  return `${prefix}：建议${level}。`
}
```

- [ ] **Step 3: 验证测试通过**

Run: `npm test -- src/views/decision/buyDecisionRules.test.js`

Expected: PASS。

---

### Task 3: 路由与导航注册

**Files:**

- Modify: `src/router/routes.test.js`
- Modify: `src/router/routes.js`

**Interfaces:**

- Consumes: Task 4 将创建的 `@/views/decision/BuyDecision.vue` 路由组件。
- Produces: `/decision/buy-check` 路由，`name = 'BuyDecision'`。

- [ ] **Step 1: 写失败路由测试**

在 `src/router/routes.test.js` 的 `describe('router smoke test', () => { ... })` 内追加：

```js
it('registers the decision buy check page', () => {
  const resolved = router.resolve('/decision/buy-check')

  expect(resolved.name).toBe('BuyDecision')

  const decisionGroup = appRoutes.find((route) => route.path === '/decision')

  expect(decisionGroup?.meta?.title).toBe('决策判定')
  expect(decisionGroup?.children?.[0]?.meta?.title).toBe('买入判定')
})
```

- [ ] **Step 2: 验证测试失败**

Run: `npm test -- src/router/routes.test.js`

Expected: FAIL，`/decision/buy-check` 当前未注册。

- [ ] **Step 3: 注册路由**

修改 `src/router/routes.js` 顶部 import，加入 `MagicStick`：

```js
import {
  Coin,
  Grid,
  MagicStick,
  Setting,
  TrendCharts,
  PieChart
} from '@element-plus/icons-vue'
```

在 `/portfolio` 路由块后面插入：

```js
  {
    path: '/decision',
    component: Layout,
    redirect: '/decision/buy-check',
    meta: {
      title: '决策判定',
      icon: MagicStick
    },
    children: [
      {
        path: 'buy-check',
        name: 'BuyDecision',
        component: () => import('@/views/decision/BuyDecision.vue'),
        meta: {
          title: '买入判定'
        }
      }
    ]
  },
```

- [ ] **Step 4: 验证路由测试通过**

Run: `npm test -- src/router/routes.test.js`

Expected: PASS，但组件文件尚未创建时路由懒加载解析可能仍通过；本任务重点校验路由元数据和名称。

---

### Task 4: 买入判定页面

**Files:**

- Create: `src/views/decision/BuyDecision.test.js`
- Create: `src/views/decision/BuyDecision.vue`

**Interfaces:**

- Consumes: Task 2 的 `getBuyReasonOptions`、`getStockTypeOptions`、`getThirdStep`、`evaluateDecision`。
- Produces: `/decision/buy-check` 页面。

- [ ] **Step 1: 写失败组件测试**

创建 `src/views/decision/BuyDecision.test.js`：

```js
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ElementPlus from 'element-plus'

import BuyDecision from './BuyDecision.vue'

describe('BuyDecision', () => {
  it('shows the scored result after completing three selections', async () => {
    const wrapper = mount(BuyDecision, {
      global: {
        plugins: [ElementPlus]
      }
    })

    await wrapper.find('[data-test="reason-bigV"]').trigger('click')
    await wrapper.find('[data-test="type-成长"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="result-level"]').text()).toBe('重仓')
    expect(wrapper.find('[data-test="result-units"]').text()).toContain('6')
  })

  it('keeps the reason and clears later selections on reset', async () => {
    const wrapper = mount(BuyDecision, {
      global: {
        plugins: [ElementPlus]
      }
    })

    await wrapper.find('[data-test="reason-bigV"]').trigger('click')
    await wrapper.find('[data-test="type-成长"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)

    await wrapper.find('[data-test="reset"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)

    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: 验证组件测试失败**

Run: `npm test -- src/views/decision/BuyDecision.test.js`

Expected: FAIL，因为 `BuyDecision.vue` 还不存在。

- [ ] **Step 3: 实现页面**

创建 `src/views/decision/BuyDecision.vue`：

```vue
<template>
  <div class="decision-page">
    <header class="page-head">
      <h2>买入判定</h2>
      <p>买不买、买多少 · 纯本地判断，不联网不查行情</p>
    </header>

    <el-card class="step-card" shadow="never">
      <template #header>
        <span class="step-title">
          <span class="step-num">1</span>
          买入原因
        </span>
      </template>
      <div class="option-row">
        <el-button
          v-for="option in reasonOptions"
          :key="option.value"
          :type="selectedReason === option.value ? 'primary' : 'default'"
          :data-test="`reason-${option.value}`"
          @click="onReasonSelect(option.value)"
        >
          {{ option.label }}
        </el-button>
      </div>
    </el-card>

    <el-card v-if="stockTypeOptions.length" class="step-card" shadow="never">
      <template #header>
        <span class="step-title">
          <span class="step-num">2</span>
          股票种类
        </span>
      </template>
      <div class="option-row">
        <el-button
          v-for="option in stockTypeOptions"
          :key="option"
          :type="selectedType === option ? 'primary' : 'default'"
          :data-test="`type-${option}`"
          @click="selectedType = option"
        >
          {{ option }}
        </el-button>
      </div>
    </el-card>

    <el-card v-if="thirdStep.options.length" class="step-card" shadow="never">
      <template #header>
        <span class="step-title">
          <span class="step-num">3</span>
          {{ thirdStep.label }}
        </span>
      </template>
      <div class="option-row">
        <el-button
          v-for="option in thirdStep.options"
          :key="option"
          :type="selectedPosition === option ? 'primary' : 'default'"
          :data-test="`position-${option}`"
          @click="selectedPosition = option"
        >
          {{ option }}
        </el-button>
      </div>
    </el-card>

    <el-card v-if="decision" class="result-card" shadow="never">
      <div class="result-body" data-test="decision-result">
        <div class="result-level" :class="resultClass" data-test="result-level">
          {{ decision.level }}
        </div>
        <div class="result-units" data-test="result-units">
          建议投入 约 <b>{{ decision.units }}</b> 万元
        </div>
        <el-progress
          class="result-bar"
          :percentage="resultPercent"
          :show-text="false"
          :stroke-width="10"
        />
        <p class="result-note">{{ decision.description }}</p>
        <div class="result-actions">
          <el-button type="primary" data-test="reset" @click="resetFromReason">
            重新选择
          </el-button>
        </div>
      </div>
    </el-card>

    <el-collapse class="basis-collapse">
      <el-collapse-item title="这套判断的依据（可展开）" name="basis">
        <p>
          大V/小V/回调/追热点/蓝筹长期用打分：分数 = 原因基础分 + 股价位置分 +
          股票种类分。潜伏、暴跌抄底、试试用专门规则。
        </p>
        <table>
          <thead>
            <tr>
              <th>档位</th>
              <th>基本单位（万元）</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>别买</td>
              <td>0</td>
            </tr>
            <tr>
              <td>观察</td>
              <td>1</td>
            </tr>
            <tr>
              <td>轻仓</td>
              <td>2</td>
            </tr>
            <tr>
              <td>正常</td>
              <td>4</td>
            </tr>
            <tr>
              <td>重仓</td>
              <td>6</td>
            </tr>
            <tr>
              <td>超重仓</td>
              <td>8</td>
            </tr>
          </tbody>
        </table>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import {
  evaluateDecision,
  getBuyReasonOptions,
  getStockTypeOptions,
  getThirdStep
} from './buyDecisionRules'

const reasonOptions = getBuyReasonOptions()
const selectedReason = ref(null)
const selectedType = ref(null)
const selectedPosition = ref(null)

const stockTypeOptions = computed(() =>
  getStockTypeOptions(selectedReason.value)
)
const thirdStep = computed(() => getThirdStep(selectedReason.value))
const decision = computed(() => {
  if (!selectedReason.value || !selectedPosition.value) {
    return null
  }
  if (stockTypeOptions.value.length && !selectedType.value) {
    return null
  }

  return evaluateDecision({
    reason: selectedReason.value,
    stockType: selectedType.value,
    position: selectedPosition.value
  })
})

const resultPercent = computed(() =>
  decision.value ? (decision.value.units / 8) * 100 : 0
)

const resultClass = computed(() => {
  const level = decision.value?.level

  return {
    bad: level === '别买',
    warn: level === '观察' || level === '轻仓',
    normal: level === '正常',
    good: level === '重仓' || level === '超重仓'
  }
})

function onReasonSelect(value) {
  selectedReason.value = value
  selectedType.value = null
  selectedPosition.value = null
}

function resetFromReason() {
  selectedType.value = null
  selectedPosition.value = null
}
</script>

<style scoped>
.decision-page {
  max-width: 760px;
  margin: 0 auto;
}

.page-head {
  margin-bottom: 18px;
  text-align: center;
}

.page-head h2 {
  margin: 0;
  font-size: 24px;
}

.page-head p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.step-card {
  margin-bottom: 18px;
}

.step-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.step-num {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.result-card {
  border-top: 3px solid #2563eb;
}

.result-body {
  text-align: center;
}

.result-level {
  font-size: 44px;
  font-weight: 800;
  line-height: 1.1;
}

.result-level.good {
  color: #16a34a;
}

.result-level.warn {
  color: #d97706;
}

.result-level.normal {
  color: #2563eb;
}

.result-level.bad {
  color: #dc2626;
}

.result-units {
  margin-top: 6px;
  color: #6b7280;
}

.result-units b {
  color: #1f2937;
}

.result-bar {
  margin-top: 16px;
}

.result-note {
  margin-top: 12px;
  color: #6b7280;
}

.result-actions {
  margin-top: 18px;
}

.basis-collapse {
  margin-top: 8px;
}

.basis-collapse p {
  color: #6b7280;
}

.basis-collapse table {
  width: 100%;
  margin-top: 10px;
  border-collapse: collapse;
}

.basis-collapse th,
.basis-collapse td {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  text-align: center;
}
</style>
```

- [ ] **Step 4: 验证组件测试通过**

Run: `npm test -- src/views/decision/BuyDecision.test.js`

Expected: PASS。

---

### Task 5: 全量验证

**Files:**

- No new files.

- [ ] **Step 1: 运行完整检查**

Run: `npm run check`

Expected: lint、format check、unit tests 和 build 全部通过。

- [ ] **Step 2: 人工抽查**

启动 `npm run dev` 后确认：

- 侧边栏出现“决策判定”，子项只有“买入判定”。
- 三步选择能输出结果。
- “重新选择”保留买入原因。
- “暴跌抄底”第三步标题为“时机”。

Do not run any git commit, git add, or other git write command.
