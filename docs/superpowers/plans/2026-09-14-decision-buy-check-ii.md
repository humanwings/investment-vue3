# 买入判定 II 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保留现有「买入判定」的前提下，新增纯前端的「买入判定 II」页面：6 个互相独立、均可留空的判定维度（推荐可多选叠加），总分映射沿用旧版档位，含高位否决规则。

**Architecture:** 规则引擎为无 Vue 依赖的纯 JS 模块 `buyDecisionRules2.js`，直接 import 旧版 `buyDecisionRules.js` 的 `LEVELS` 与 `mapScoreToLevel`（不修改旧文件），保证档位映射永远一致。页面 `BuyDecisionII.vue` 用 Element Plus 复刻旧版布局：6 张维度卡片 + 档位对照 + 判定结果。不碰后端、codebook、持仓模块。

**Tech Stack:** Vue 3 + Element Plus + Vitest + @vue/test-utils

**参考 spec:** `docs/superpowers/specs/2026-09-14-decision-buy-check-ii-design.md`

## Global Constraints

- 遵循 AGENTS.md：**不做任何 git 操作**（所有任务不含 commit 步骤），直接在 main 分支修改。
- 仅允许修改 `src/router/routes.js`、`src/router/routes.test.js`；禁止改动 `BuyDecision.vue`、`buyDecisionRules.js`、`codebook.js`、持仓模块（`buyDecisionRules.js` 仅被 import）。
- Prettier 配置（`.prettierrc.json`）：`semi: false`、`singleQuote: true`、`trailingComma: 'none'`、默认 printWidth 80。所有新代码必须无分号、单引号。
- 因子分数表（verbatim）：大V推荐 +4、小V推荐 +2、热点 0、潜伏 0、暴跌 0、回调 +2、龙头 +2、二线 -1、杂毛 -3、蓝筹 +2、成长 0、周期 0、题材 -2、高位 -2、中位 0、低位 +2。
- 档位映射（复用旧版 `mapScoreToLevel`）：≤0 别买、1 观察、2 轻仓、3-4 正常、5-6 重仓、≥7 超重仓；units 0/1/2/4/6/8 万元。
- 否决规则（优先于打分）：勾选「位置=高位」且勾选「因素=热点」或「走势=回调」→ 直接别买，固定文案「高位追热点/抢回调，接盘风险大，不碰。」，结果中 `score` 为 `null`。
- 全部维度为空 → `evaluateDecision2` 返回 `null`；任选 ≥1 项即判定。
- 所有交互元素预埋 `data-test` 属性，命名沿用旧版风格。

---

### Task 1: 规则引擎 buyDecisionRules2.js

**Files:**

- Create: `src/views/decision/buyDecisionRules2.js`
- Test: `src/views/decision/buyDecisionRules2.test.js`

**Interfaces:**

- Consumes: `mapScoreToLevel`、`LEVELS`（from `./buyDecisionRules`，已存在，只读）
- Produces:
  - `DECISION_DIMENSIONS`: 数组，元素 `{ key: 'recommends'|'factor'|'trend'|'fame'|'type'|'position', label: string, multiple: boolean, options: string[] }`
  - `createEmptySelection()`: 返回 `{ recommends: [], factor: '', trend: '', fame: '', type: '', position: '' }`
  - `evaluateDecision2(selection)`: 入参同 `createEmptySelection()` 形状（允许部分字段缺失）；全空返回 `null`；否则返回 `{ level: string, units: number, score: number|null, description: string }`

- [ ] **Step 1: 写失败测试**

创建 `src/views/decision/buyDecisionRules2.test.js`：

```js
import { describe, expect, it } from 'vitest'

import {
  DECISION_DIMENSIONS,
  createEmptySelection,
  evaluateDecision2
} from './buyDecisionRules2'

describe('buy decision rules 2', () => {
  it('exposes six independent dimensions', () => {
    expect(DECISION_DIMENSIONS.map((dimension) => dimension.label)).toEqual([
      '推荐',
      '因素',
      '走势',
      '知名度',
      '类型',
      '位置'
    ])

    const multiDimensions = DECISION_DIMENSIONS.filter(
      (dimension) => dimension.multiple
    )

    expect(multiDimensions).toHaveLength(1)
    expect(multiDimensions[0].key).toBe('recommends')
    expect(multiDimensions[0].options).toEqual(['大V推荐', '小V推荐'])
  })

  it('returns null when nothing is selected', () => {
    expect(evaluateDecision2(createEmptySelection())).toBeNull()
    expect(evaluateDecision2({})).toBeNull()
  })

  it('judges from a single factor', () => {
    expect(
      evaluateDecision2({ ...createEmptySelection(), position: '低位' })
    ).toMatchObject({ level: '轻仓', units: 2, score: 2 })

    expect(
      evaluateDecision2({ ...createEmptySelection(), factor: '热点' })
    ).toMatchObject({ level: '别买', units: 0, score: 0 })
  })

  it('stacks both recommendations', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      recommends: ['大V推荐', '小V推荐'],
      type: '蓝筹',
      position: '低位'
    })

    expect(result).toMatchObject({ level: '超重仓', units: 8, score: 10 })
    expect(result.description).toBe(
      '大V推荐、小V推荐 + 蓝筹 + 低位：建议超重仓。'
    )
  })

  it('scores cycle the same as growth', () => {
    const growth = evaluateDecision2({
      ...createEmptySelection(),
      type: '成长',
      position: '低位'
    })
    const cycle = evaluateDecision2({
      ...createEmptySelection(),
      type: '周期',
      position: '低位'
    })

    expect(cycle.score).toBe(growth.score)
    expect(cycle.score).toBe(2)
    expect(cycle.level).toBe('轻仓')
  })

  it('denies high position with hot factor or pullback trend', () => {
    const hot = evaluateDecision2({
      ...createEmptySelection(),
      recommends: ['大V推荐'],
      factor: '热点',
      type: '蓝筹',
      position: '高位'
    })

    expect(hot).toMatchObject({ level: '别买', units: 0, score: null })
    expect(hot.description).toBe('高位追热点/抢回调，接盘风险大，不碰。')

    expect(
      evaluateDecision2({
        ...createEmptySelection(),
        trend: '回调',
        position: '高位'
      })
    ).toMatchObject({ level: '别买', units: 0, score: null })

    expect(
      evaluateDecision2({
        ...createEmptySelection(),
        factor: '热点',
        trend: '回调',
        position: '高位'
      })
    ).toMatchObject({ level: '别买', units: 0, score: null })
  })

  it('does not veto when high position is not selected', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      factor: '热点',
      trend: '回调'
    })

    expect(result.score).toBe(2)
    expect(result.level).toBe('轻仓')
  })

  it('covers score boundaries', () => {
    const select = (patch) =>
      evaluateDecision2({
        ...createEmptySelection(),
        ...patch
      })

    expect(select({ type: '成长' }).level).toBe('别买')
    expect(
      select({ recommends: ['大V推荐'], fame: '二线', position: '高位' }).level
    ).toBe('观察')
    expect(select({ position: '低位' }).level).toBe('轻仓')
    expect(select({ recommends: ['大V推荐'] }).level).toBe('正常')
    expect(select({ recommends: ['大V推荐'], position: '低位' }).level).toBe(
      '重仓'
    )
    expect(
      select({ recommends: ['大V推荐'], fame: '龙头', position: '低位' }).level
    ).toBe('超重仓')
  })

  it('covers score 7 boundary', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      recommends: ['大V推荐'],
      fame: '二线',
      type: '蓝筹',
      position: '低位'
    })

    expect(result.score).toBe(7)
    expect(result.level).toBe('超重仓')
  })

  it('uses the fixed no-buy description when score says so', () => {
    const result = evaluateDecision2({
      ...createEmptySelection(),
      factor: '热点'
    })

    expect(result.description).toBe('热点：这笔不划算，先不动。')
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run（workdir: `D:\develop\source\investment-vue3`）: `npx vitest run src/views/decision/buyDecisionRules2.test.js`
Expected: FAIL（模块 `./buyDecisionRules2` 不存在）

- [ ] **Step 3: 最小实现**

创建 `src/views/decision/buyDecisionRules2.js`：

```js
import { LEVELS, mapScoreToLevel } from './buyDecisionRules'

export const DECISION_DIMENSIONS = [
  {
    key: 'recommends',
    label: '推荐',
    multiple: true,
    options: ['大V推荐', '小V推荐']
  },
  {
    key: 'factor',
    label: '因素',
    multiple: false,
    options: ['热点', '潜伏']
  },
  {
    key: 'trend',
    label: '走势',
    multiple: false,
    options: ['暴跌', '回调']
  },
  {
    key: 'fame',
    label: '知名度',
    multiple: false,
    options: ['龙头', '二线', '杂毛']
  },
  {
    key: 'type',
    label: '类型',
    multiple: false,
    options: ['蓝筹', '成长', '周期', '题材']
  },
  {
    key: 'position',
    label: '位置',
    multiple: false,
    options: ['高位', '中位', '低位']
  }
]

const RECOMMEND_SCORE = {
  大V推荐: 4,
  小V推荐: 2
}

const SINGLE_SCORES = {
  factor: { 热点: 0, 潜伏: 0 },
  trend: { 暴跌: 0, 回调: 2 },
  fame: { 龙头: 2, 二线: -1, 杂毛: -3 },
  type: { 蓝筹: 2, 成长: 0, 周期: 0, 题材: -2 },
  position: { 高位: -2, 中位: 0, 低位: 2 }
}

const VETO_DESCRIPTION = '高位追热点/抢回调，接盘风险大，不碰。'

export function createEmptySelection() {
  const selection = { recommends: [] }

  for (const { key, multiple } of DECISION_DIMENSIONS) {
    if (!multiple) {
      selection[key] = ''
    }
  }

  return selection
}

function hasSelection(selection) {
  return DECISION_DIMENSIONS.some(({ key, multiple }) =>
    multiple ? selection[key].length > 0 : Boolean(selection[key])
  )
}

function computeScore(selection) {
  let score = selection.recommends.reduce(
    (sum, value) => sum + (RECOMMEND_SCORE[value] ?? 0),
    0
  )

  for (const [key, scoreMap] of Object.entries(SINGLE_SCORES)) {
    score += scoreMap[selection[key]] ?? 0
  }

  return score
}

function isHighPositionVeto(selection) {
  return (
    selection.position === '高位' &&
    (selection.factor === '热点' || selection.trend === '回调')
  )
}

function describeSelection(selection) {
  return DECISION_DIMENSIONS.flatMap(({ key, multiple }) => {
    if (multiple) {
      return selection[key].length ? [selection[key].join('、')] : []
    }

    return selection[key] ? [selection[key]] : []
  }).join(' + ')
}

export function evaluateDecision2(selection) {
  const normalized = { ...createEmptySelection(), ...selection }

  if (!hasSelection(normalized)) {
    return null
  }

  if (isHighPositionVeto(normalized)) {
    return {
      level: '别买',
      units: LEVELS.别买,
      score: null,
      description: VETO_DESCRIPTION
    }
  }

  const score = computeScore(normalized)
  const level = mapScoreToLevel(score)
  const prefix = describeSelection(normalized)

  return {
    level,
    units: LEVELS[level],
    score,
    description:
      level === '别买'
        ? `${prefix}：这笔不划算，先不动。`
        : `${prefix}：建议${level}。`
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

Run（workdir: `D:\develop\source\investment-vue3`）: `npx vitest run src/views/decision/buyDecisionRules2.test.js`
Expected: PASS（全部用例绿色）

---

### Task 2: 页面组件 BuyDecisionII.vue

**Files:**

- Create: `src/views/decision/BuyDecisionII.vue`
- Test: `src/views/decision/BuyDecisionII.test.js`

**Interfaces:**

- Consumes: Task 1 的 `DECISION_DIMENSIONS`、`createEmptySelection`、`evaluateDecision2`；旧版 `buyDecisionRules.js` 的 `LEVELS`（只读 import）
- Produces: 路由组件默认导出 `BuyDecisionII`；模板 `data-test`：`recommends-大V推荐`、`recommends-小V推荐`、`factor-热点`、`factor-潜伏`、`trend-暴跌`、`trend-回调`、`fame-龙头`、`fame-二线`、`fame-杂毛`、`type-蓝筹`、`type-成长`、`type-周期`、`type-题材`、`position-高位`、`position-中位`、`position-低位`、`decision-result`、`result-tier`、`result-level`、`result-units`、`result-score`、`result-note`、`tier-row-别买`…`tier-row-超重仓`、`clear-all`、`result-placeholder`

- [ ] **Step 1: 写失败测试**

创建 `src/views/decision/BuyDecisionII.test.js`：

```js
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ElementPlus from 'element-plus'

import BuyDecisionII from './BuyDecisionII.vue'

function mountPage() {
  return mount(BuyDecisionII, {
    global: {
      plugins: [ElementPlus]
    }
  })
}

describe('BuyDecisionII', () => {
  it('shows the placeholder when nothing is selected', () => {
    const wrapper = mountPage()

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="result-placeholder"]').exists()).toBe(true)
  })

  it('stacks both recommendations and shows the scored result', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="recommends-大V推荐"]').trigger('click')
    await wrapper.find('[data-test="recommends-小V推荐"]').trigger('click')
    await wrapper.find('[data-test="type-蓝筹"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="result-level"]').text()).toBe('超重仓')
    expect(wrapper.find('[data-test="result-units"]').text()).toContain('8')
    expect(wrapper.find('[data-test="result-score"]').text()).toContain('10')
    expect(wrapper.find('[data-test="result-tier"]').text()).toBe('第 6 / 6 档')
    expect(wrapper.find('[data-test="tier-row-超重仓"]').classes()).toContain(
      'active'
    )
  })

  it('toggles a single-select dimension back to empty', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="result-level"]').text()).toBe('轻仓')

    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
  })

  it('vetoes hot factor at high position regardless of positives', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="recommends-大V推荐"]').trigger('click')
    await wrapper.find('[data-test="type-蓝筹"]').trigger('click')
    await wrapper.find('[data-test="factor-热点"]').trigger('click')
    await wrapper.find('[data-test="position-高位"]').trigger('click')

    expect(wrapper.find('[data-test="result-level"]').text()).toBe('别买')
    expect(wrapper.find('[data-test="result-units"]').text()).toContain('0')
    expect(wrapper.find('[data-test="result-score"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="result-note"]').text()).toContain('不碰')
  })

  it('clears all selections', async () => {
    const wrapper = mountPage()

    await wrapper.find('[data-test="recommends-大V推荐"]').trigger('click')
    await wrapper.find('[data-test="position-低位"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(true)

    await wrapper.find('[data-test="clear-all"]').trigger('click')

    expect(wrapper.find('[data-test="decision-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="result-placeholder"]').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: 运行测试确认失败**

Run（workdir: `D:\develop\source\investment-vue3`）: `npx vitest run src/views/decision/BuyDecisionII.test.js`
Expected: FAIL（`./BuyDecisionII.vue` 不存在）

- [ ] **Step 3: 实现页面**

创建 `src/views/decision/BuyDecisionII.vue`：

```vue
<template>
  <div class="decision-page">
    <header class="page-head">
      <h2>买入判定 II</h2>
      <p>六维独立打分 · 全部可留空 · 纯本地判断，不联网不查行情</p>
    </header>

    <div class="selection-grid">
      <el-card
        v-for="dimension in dimensions"
        :key="dimension.key"
        class="step-card"
        shadow="never"
      >
        <template #header>
          <span class="step-title">{{ dimension.label }}</span>
        </template>
        <div class="option-row">
          <el-button
            v-for="option in dimension.options"
            :key="option"
            :type="isSelected(dimension, option) ? 'primary' : 'default'"
            :data-test="`${dimension.key}-${option}`"
            @click="onSelect(dimension, option)"
          >
            {{ option }}
          </el-button>
        </div>
      </el-card>
    </div>

    <div class="summary-grid">
      <el-card class="tier-card" shadow="never">
        <template #header>
          <span class="step-title">档位对照</span>
        </template>
        <table class="tier-table">
          <thead>
            <tr>
              <th>档位</th>
              <th>基本单位（万元）</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(level, index) in levelOrder"
              :key="level"
              :class="{ active: decision?.level === level }"
              :data-test="`tier-row-${level}`"
            >
              <td>
                <span class="tier-index">{{ index + 1 }}</span>
                {{ level }}
                <span v-if="decision?.level === level" class="tier-current">
                  当前
                </span>
              </td>
              <td>{{ LEVELS[level] }}</td>
            </tr>
          </tbody>
        </table>
      </el-card>

      <el-card class="result-card" shadow="never">
        <template #header>
          <span class="step-title">判定结果</span>
        </template>
        <div v-if="decision" class="result-body" data-test="decision-result">
          <div class="result-tier" data-test="result-tier">
            第 {{ resultTier }} / {{ levelOrder.length }} 档
          </div>
          <div
            class="result-level"
            :class="resultClass"
            data-test="result-level"
          >
            {{ decision.level }}
          </div>
          <div class="result-units" data-test="result-units">
            建议投入 约 <b>{{ decision.units }}</b> 万元
          </div>
          <div
            v-if="decision.score !== null"
            class="result-score"
            data-test="result-score"
          >
            总分 <b>{{ decision.score }}</b>
          </div>
          <el-progress
            class="result-bar"
            :percentage="resultPercent"
            :show-text="false"
            :stroke-width="10"
          />
          <p class="result-note" data-test="result-note">
            {{ decision.description }}
          </p>
          <div class="result-actions">
            <el-button type="primary" data-test="clear-all" @click="clearAll">
              清空全部
            </el-button>
          </div>
        </div>
        <div v-else class="result-placeholder" data-test="result-placeholder">
          请至少选择一项，勾选后立即显示判定结果
        </div>
      </el-card>
    </div>

    <el-collapse class="basis-collapse">
      <el-collapse-item title="这套判断的依据（可展开）" name="basis">
        <p>
          六个维度互相独立、均可留空，任选 1 项即判定。总分 =
          所选因子分数之和：推荐 大V +4 / 小V +2；因素 热点 0 / 潜伏 0；走势
          暴跌 0 / 回调 +2；知名度 龙头 +2 / 二线 -1 / 杂毛 -3；类型 蓝筹 +2 /
          成长 0 / 周期 0 / 题材 -2；位置 高位 -2 / 中位 0 / 低位
          +2。总分沿用买入判定 I
          的档位映射。否决规则：勾选「高位」且勾选「热点」或「回调」时，直接判别买。
        </p>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'

import { LEVELS } from './buyDecisionRules'
import {
  DECISION_DIMENSIONS,
  createEmptySelection,
  evaluateDecision2
} from './buyDecisionRules2'

const dimensions = DECISION_DIMENSIONS
const levelOrder = Object.keys(LEVELS)
const selection = reactive(createEmptySelection())

const decision = computed(() => evaluateDecision2(selection))

const resultTier = computed(() => {
  if (!decision.value) {
    return 0
  }

  return levelOrder.indexOf(decision.value.level) + 1
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

function isSelected(dimension, option) {
  return dimension.multiple
    ? selection[dimension.key].includes(option)
    : selection[dimension.key] === option
}

function onSelect(dimension, option) {
  if (dimension.multiple) {
    const list = selection[dimension.key]
    const index = list.indexOf(option)

    if (index >= 0) {
      list.splice(index, 1)
    } else {
      list.push(option)
    }

    return
  }

  selection[dimension.key] = selection[dimension.key] === option ? '' : option
}

function clearAll() {
  Object.assign(selection, createEmptySelection())
}
</script>

<style scoped>
.decision-page {
  max-width: 980px;
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

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.step-card {
  height: 100%;
}

.step-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 1fr);
  align-items: stretch;
  gap: 16px;
  margin-bottom: 12px;
}

.tier-card,
.result-card {
  height: 100%;
}

.tier-table {
  width: 100%;
  border-collapse: collapse;
}

.tier-table th,
.tier-table td {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.tier-table th {
  background: #f8fafc;
  font-weight: 600;
}

.tier-table tr.active td {
  background: #eff6ff;
  border-color: #93c5fd;
}

.tier-index {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-right: 6px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #4b5563;
  font-size: 12px;
}

.tier-table tr.active .tier-index {
  background: #2563eb;
  color: #fff;
}

.tier-current {
  margin-left: 6px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 600;
}

.result-card {
  border-top: 3px solid #2563eb;
}

.result-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  text-align: center;
}

.result-placeholder {
  display: grid;
  min-height: 250px;
  place-items: center;
  color: #9ca3af;
}

.result-tier {
  color: #6b7280;
  font-size: 14px;
}

.result-level {
  margin-top: 4px;
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

.result-score {
  margin-top: 6px;
  color: #6b7280;
}

.result-score b {
  color: #1f2937;
}

.result-bar {
  margin-top: 16px;
  width: 100%;
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

@media (max-width: 860px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
```

- [ ] **Step 4: 运行测试确认通过**

Run（workdir: `D:\develop\source\investment-vue3`）: `npx vitest run src/views/decision/BuyDecisionII.test.js`
Expected: PASS（5 个用例全绿）

---

### Task 3: 路由注册与菜单

**Files:**

- Modify: `src/router/routes.js:92-101`（`/decision` 的 `children` 数组末尾追加）
- Modify: `src/router/routes.test.js:78-88`（在其后追加新测试）

**Interfaces:**

- Consumes: Task 2 的 `src/views/decision/BuyDecisionII.vue` 默认导出
- Produces: 路由 `/decision/buy-check-ii`，name `BuyDecisionII`，meta.title `买入判定 II`，位于「决策判定」菜单组 children[1]

- [ ] **Step 1: 写失败测试**

在 `src/router/routes.test.js` 的 `it('registers the decision buy check page', ...)` 之后追加：

```js
it('registers the decision buy check II page', () => {
  const resolved = router.resolve('/decision/buy-check-ii')

  expect(resolved.name).toBe('BuyDecisionII')

  const decisionGroup = appRoutes.find((route) => route.path === '/decision')

  expect(decisionGroup?.children?.[1]?.meta?.title).toBe('买入判定 II')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run（workdir: `D:\develop\source\investment-vue3`）: `npx vitest run src/router/routes.test.js`
Expected: FAIL（`/decision/buy-check-ii` resolve 出的 name 为 undefined）

- [ ] **Step 3: 修改 routes.js**

在 `src/router/routes.js` 的 `/decision` 分组 `children` 数组中、现有 `buy-check` 子路由之后追加：

```js
      {
        path: 'buy-check-ii',
        name: 'BuyDecisionII',
        component: () => import('@/views/decision/BuyDecisionII.vue'),
        meta: {
          title: '买入判定 II'
        }
      }
```

注意：给原有 `buy-check` 子路由对象的结尾 `}` 补上逗号。

- [ ] **Step 4: 运行测试确认通过**

Run（workdir: `D:\develop\source\investment-vue3`）: `npx vitest run src/router/routes.test.js`
Expected: PASS（含原有全部用例）

---

### Task 4: 全量校验

**Files:** 无新增/修改（校验任务）

**Interfaces:**

- Consumes: Task 1-3 全部产出
- Produces: `npm run check` 全绿（eslint + prettier + vitest + build）

- [ ] **Step 1: 运行完整检查**

Run（workdir: `D:\develop\source\investment-vue3`）: `npm run check`
Expected: eslint、prettier format:check、vitest 全部用例、vite build 全部通过。若有格式问题，运行 `npx prettier src/views/decision --write` 与 `npx prettier src/router --write` 后重跑。

- [ ] **Step 2: 人工验收清单（对照 spec）**

- 侧边栏「决策判定」下出现「买入判定」「买入判定 II」两项
- `/decision/buy-check` 旧页面行为不变（勾选原因→种类→位置出结果）
- 新页面 6 维度任意勾选/取消，全空显示占位，任选 1 项出结果
- 大V+小V 叠加、周期按成长计分、高位否决、清空全部均可用
- 不做 git 提交（遵循 AGENTS.md）
