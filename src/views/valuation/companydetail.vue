<template>
  <section v-loading="loading" class="page-shell company-overview">
    <div class="page-header">
      <div>
        <el-button
          text
          @click="router.push(parentRoute)"
          >返回上一级</el-button
        >
        <div class="eyebrow">Company Overview</div>
        <h2>{{ overview.name || '公司总览' }}</h2>
      </div>
      <div class="header-actions">
        <el-button type="danger" @click="confirmDeleteCompany">
          <el-icon><Delete /></el-icon>
          <span>删除本公司</span>
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="overview-tabs">
      <el-tab-pane label="总览" name="overview">
        <div class="overview-grid">
          <div class="page-card">
            <div class="section-head">
              <h3>核心摘要</h3>
            </div>
            <div class="metric-grid">
              <ValuationMetric
                label="现价"
                :value="safeRound(overview.price)"
              />
              <ValuationMetric
                label="利润贴现估值"
                :value="safeRound(overview.profitValuation)"
              />
              <ValuationMetric
                label="价值偏离"
                :value="formatPercent(overview.profitDeviation)"
              />
              <ValuationMetric label="综合评分" :value="overview.totalScore" />
              <ValuationMetric
                label="财务评分"
                :value="overview.financialScore"
              />
            </div>
          </div>

          <div class="page-card overview-focus">
            <div class="section-head">
              <h3>当前结论</h3>
            </div>
            <el-tag :type="conclusionType(overview.conclusion)">
              {{ overview.conclusion || '待补数据' }}
            </el-tag>
            <ul class="highlight-list">
              <li v-for="item in overview.highlights || []" :key="item">
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="page-card nav-grid">
            <button
              v-for="item in researchNavItems"
              :key="item.name"
              type="button"
              class="nav-card"
              @click="activeTab = item.name"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.summary }}</span>
            </button>
          </div>

          <div class="page-card">
            <div class="section-head">
              <h3>基本信息</h3>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="证券代码">{{
                overview.stockCode
              }}</el-descriptions-item>
              <el-descriptions-item label="交易所">{{
                overview.exchange
              }}</el-descriptions-item>
              <el-descriptions-item label="报表类型">{{
                overview.fsTableType
              }}</el-descriptions-item>
              <el-descriptions-item label="IPO 时间">{{
                overview.ipoDate
              }}</el-descriptions-item>
              <el-descriptions-item label="省份">{{
                overview.province
              }}</el-descriptions-item>
              <el-descriptions-item label="实控人">{{
                overview.actualControllerTypes
              }}</el-descriptions-item>
              <el-descriptions-item label="一级行业">{{
                overview.firstIndustry
              }}</el-descriptions-item>
              <el-descriptions-item label="二级行业">{{
                overview.secondIndustry
              }}</el-descriptions-item>
              <el-descriptions-item label="三级行业">{{
                overview.thirdIndustry
              }}</el-descriptions-item>
              <el-descriptions-item :span="3" label="主营业务">{{
                overview.mainBusiness
              }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="利润贴现" name="profit">
        <div class="page-card">
          <div class="section-head">
            <div class="section-head-row">
              <h3>利润贴现模型</h3>
              <el-button text type="primary" @click="helpDialogVisible = true">
                <el-icon><QuestionFilled /></el-icon>
                <span>模型说明</span>
              </el-button>
            </div>
          </div>

          <div v-if="profitDetail" class="profit-calculation">
            <section class="calc-summary">
              <div class="summary-result-row">
                <div class="summary-result-item">
                  <span class="summary-result-label">利润贴现估值</span>
                  <strong>{{ safeRound(profitDetail.finalValuation) || '-' }}</strong>
                </div>
                <div class="summary-result-item">
                  <span class="summary-result-label">偏离率</span>
                  <strong
                    :class="{
                      'deviation-positive': profitDetail.deviation > 0,
                      'deviation-negative': profitDetail.deviation < 0
                    }"
                  >
                    {{ formatPercent(profitDetail.deviation) || '-' }}
                  </strong>
                </div>
              </div>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">净资产估值</td>
                  <td class="calc-value">{{ safeRound(profitDetail.netAssetValuation) || '-' }}</td>
                  <td class="calc-label">高增长期估值</td>
                  <td class="calc-value">{{ safeRound(profitDetail.highGrowthValuation) || '-' }}</td>
                  <td class="calc-label">稳定期估值</td>
                  <td class="calc-value">{{ safeRound(profitDetail.perpetualValuation) || '-' }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
              <br>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">折现率</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.discountRate) || '-' }}</td>
                  <td class="calc-label">市场风险系数</td>
                  <td class="calc-value">{{ profitDetail.marketRisk?.toFixed(2) || '-' }}</td>
                  <td class="calc-label">行业风险系数</td>
                  <td class="calc-value">{{ profitDetail.industryRisk?.toFixed(2) || '-' }}</td>
                  <td class="calc-label">采用增长率</td>
                  <td class="calc-value">
                    <el-tag :type="profitDetail.manualOverride ? 'warning' : 'info'" size="small">
                      {{ formatRatePoint(profitDetail.appliedGrowthRate) }}
                    </el-tag>
                  </td>
                </tr>
                <tr>
                  <td class="calc-label">净资产折价率</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.netAssetDiscount) || '-' }}</td>
                  <td class="calc-label">预期分红率</td>
                  <td class="calc-value" colspan="5">{{ formatPercent(profitDetail.dividendRatePrediction) || '-' }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <div class="calc-step-head">
                <h4>Step 1 — 增长率推算</h4>
                <el-button text type="primary" @click="growthHelpVisible = true">
                  <el-icon><QuestionFilled /></el-icon>
                  <span>增长率推算说明</span>
                </el-button>
              </div>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">营收累积增速</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.revenueGrowthRateTotal) || '-' }}</td>
                  <td class="calc-label">营收当期增速</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.revenueGrowthRateCurrent) || '-' }}</td>
                  <td class="calc-label">营收增速预测</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.revenueGrowthRatePrediction) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">扣非利润累积增速</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.profitGrowthRateTotal) || '-' }}</td>
                  <td class="calc-label">扣非利润当期增速</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.profitGrowthRateCurrent) || '-' }}</td>
                  <td class="calc-label">利润增速预测</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.profitGrowthRatePrediction) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">系统增长率</td>
                  <td class="calc-value"><strong>{{ formatRatePoint(profitDetail.systemGrowthRatePrediction) || '-' }}</strong></td>
                  <td class="calc-label">手动增长率</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': profitDetail.manualOverride }">
                      {{ profitDetail.manualGrowthRate != null ? formatRatePoint(profitDetail.manualGrowthRate) : '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-label">采用增长率</td>
                  <td class="calc-value">
                    <el-tag :type="profitDetail.manualOverride ? 'warning' : 'info'" size="small">
                      {{ formatRatePoint(profitDetail.appliedGrowthRate) }}
                    </el-tag>
                    <span class="tag-caption">{{ profitDetail.manualOverride ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <div class="calc-step-head">
                <h4>Step 2 — 分红率推算</h4>
                <el-button text type="primary" @click="dividendHelpVisible = true">
                  <el-icon><QuestionFilled /></el-icon>
                  <span>分红率推算说明</span>
                </el-button>
              </div>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">分红年数</td>
                  <td class="calc-value">{{ profitDetail.dividendYears ?? '-' }}</td>
                  <td class="calc-label">持续分红</td>
                  <td class="calc-value">{{ profitDetail.dividendIsSure ? '是' : '否' }}</td>
                  <td class="calc-label">上年度分红率</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.lastDividendRate) || '-' }}</td>
                  <td class="calc-label">分红稳定性</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.dividendStability) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">预期分红率</td>
                  <td class="calc-value" colspan="7"><strong>{{ formatPercent(profitDetail.dividendRatePrediction) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <h4>Step 3 — 净资产估值</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">每股净资产</td>
                  <td class="calc-value">{{ safeRound(profitDetail.netAssetValuePer) || '-' }}</td>
                  <td class="calc-label">净资产折价率</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.netAssetDiscount) || '-' }}</td>
                  <td class="calc-label">净资产估值</td>
                  <td class="calc-value"><strong>{{ safeRound(profitDetail.netAssetValuation) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                净资产估值 = 每股净资产 × 净资产折价率 = {{ safeRound(profitDetail.netAssetValuePer) }} × {{ formatPercent(profitDetail.netAssetDiscount) }} = <strong>{{ safeRound(profitDetail.netAssetValuation) }}</strong>
              </p>
            </section>

            <section class="calc-step">
              <h4>Step 4 — 高增长期估值</h4>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">采用增长率</td>
                  <td class="calc-value">{{ formatRatePoint(profitDetail.appliedGrowthRate) }}</td>
                  <td class="calc-label">高增长年数</td>
                  <td class="calc-value">{{ profitDetail.growthYears }}</td>
                  <td class="calc-label">折现率（WACC）</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.discountRate) }}</td>
                  <td class="calc-label">每股扣非净利润</td>
                  <td class="calc-value">{{ safeRound(profitDetail.deductedNetProfitPer) }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
              <div class="sub-section">
                <h5>逐年折现系数</h5>
                <div class="table-shell">
                  <el-table :data="profitDetailYearlyRows" size="small">
                    <el-table-column prop="year" label="年度" width="80" />
                    <el-table-column label="增长因子 (1+g)^n">
                      <template #default="{ row }">
                        {{ row.growthFactor }}
                      </template>
                    </el-table-column>
                    <el-table-column label="折现因子 (1+r)^n">
                      <template #default="{ row }">
                        {{ row.discountFactor }}
                      </template>
                    </el-table-column>
                    <el-table-column label="折现系数">
                      <template #default="{ row }">
                        <strong>{{ row.coefficient }}</strong>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <p class="calc-formula">
                  折现系数合计 = <strong>{{ profitDetail.highGrowthDiscountCoefficientSum?.toFixed(4) }}</strong>
                </p>
              </div>
              <table class="calc-table section-block" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">折现系数合计</td>
                  <td class="calc-value">{{ profitDetail.highGrowthDiscountCoefficientSum?.toFixed(4) }}</td>
                  <td class="calc-label">留存折算系数</td>
                  <td class="calc-value">{{ profitDetail.retentionCoefficient?.toFixed(4) }}</td>
                  <td class="calc-label">高增长期估值</td>
                  <td class="calc-value"><strong>{{ safeRound(profitDetail.highGrowthValuation) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                留存折算系数 = 分红率 + (1 - 分红率) × 净资产折价率 = {{ formatPercent(profitDetail.dividendRatePrediction) }} + (1 - {{ formatPercent(profitDetail.dividendRatePrediction) }}) × {{ formatPercent(profitDetail.netAssetDiscount) }} = {{ profitDetail.retentionCoefficient?.toFixed(4) }}
              </p>
              <p class="calc-formula">
                高增长期估值 = 每股扣非净利润 × 折现系数合计 × 留存折算系数 = {{ safeRound(profitDetail.deductedNetProfitPer) }} × {{ profitDetail.highGrowthDiscountCoefficientSum?.toFixed(4) }} × {{ profitDetail.retentionCoefficient?.toFixed(4) }} = <strong>{{ safeRound(profitDetail.highGrowthValuation) }}</strong>
              </p>
            </section>

            <section class="calc-step">
              <h4>Step 5 — 稳定期估值</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">永续增长率</td>
                  <td class="calc-value">{{ formatPercent(profitDetail.perpetualGrowthRate) || '-' }}</td>
                  <td class="calc-label">折现系数合计</td>
                  <td class="calc-value">{{ profitDetail.perpetualDiscountCoefficientSum?.toFixed(4) }}</td>
                  <td class="calc-label">稳定期估值</td>
                  <td class="calc-value"><strong>{{ safeRound(profitDetail.perpetualValuation) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                稳定期估值 = 每股扣非净利润 × 稳定期折现系数合计 × 留存折算系数 = {{ safeRound(profitDetail.deductedNetProfitPer) }} × {{ profitDetail.perpetualDiscountCoefficientSum?.toFixed(4) }} × {{ profitDetail.retentionCoefficient?.toFixed(4) }} = <strong>{{ safeRound(profitDetail.perpetualValuation) }}</strong>
              </p>
            </section>

            <section class="calc-step">
              <h4>Step 6 — 风险调整</h4>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">市场风险系数</td>
                  <td class="calc-value">{{ profitDetail.marketRisk?.toFixed(2) || '-' }}</td>
                  <td class="calc-label">行业风险系数</td>
                  <td class="calc-value">{{ profitDetail.industryRisk?.toFixed(2) || '-' }}</td>
                  <td class="calc-label">三段合计</td>
                  <td class="calc-value">{{ safeRound(profitDetail.netAssetValuation + profitDetail.highGrowthValuation + profitDetail.perpetualValuation) || '-' }}</td>
                  <td class="calc-label">最终估值</td>
                  <td class="calc-value"><strong class="final-value">{{ safeRound(profitDetail.finalValuation) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                风险调整前合计 = 净资产估值 + 高增长期估值 + 稳定期估值 = {{ safeRound(profitDetail.netAssetValuation) }} + {{ safeRound(profitDetail.highGrowthValuation) }} + {{ safeRound(profitDetail.perpetualValuation) }} = {{ safeRound(profitDetail.netAssetValuation + profitDetail.highGrowthValuation + profitDetail.perpetualValuation) }}
              </p>
              <p class="calc-formula">
                最终估值 = 三段合计 × 市场风险系数 × 行业风险系数 = {{ safeRound(profitDetail.netAssetValuation + profitDetail.highGrowthValuation + profitDetail.perpetualValuation) }} × {{ profitDetail.marketRisk?.toFixed(2) }} × {{ profitDetail.industryRisk?.toFixed(2) }} = <strong>{{ safeRound(profitDetail.finalValuation) }}</strong>
              </p>
            </section>

            <section class="calc-step calc-conclusion">
              <h4>Step 7 — 估值结论</h4>
              <div class="conclusion-row">
                <div class="conclusion-item">
                  <span class="conclusion-label">当前价格</span>
                  <strong>{{ safeRound(profitDetail.currentPrice) || '-' }}</strong>
                </div>
                <div class="conclusion-item">
                  <span class="conclusion-label">利润贴现估值</span>
                  <strong>{{ safeRound(profitDetail.finalValuation) || '-' }}</strong>
                </div>
                <div class="conclusion-item">
                  <span class="conclusion-label">偏离率</span>
                  <strong
                    :class="{
                      'deviation-positive': profitDetail.deviation > 0,
                      'deviation-negative': profitDetail.deviation < 0
                    }"
                  >
                    {{ formatPercent(profitDetail.deviation) || '-' }}
                  </strong>
                </div>
              </div>
              <p class="calc-formula">
                偏离率 = 利润贴现估值 ÷ 当前价格 - 1 = {{ safeRound(profitDetail.finalValuation) }} ÷ {{ safeRound(profitDetail.currentPrice) }} - 1 = <strong>{{ formatPercent(profitDetail.deviation) }}</strong>
              </p>
              <div
                v-if="profitDetail.storedValuation != null && Math.abs(profitDetail.finalValuation - profitDetail.storedValuation) > 0.01"
                class="stored-note"
              >
                <span>DB 中已存储的估值为 <strong>{{ safeRound(profitDetail.storedValuation) }}</strong>，与本次重算结果略有差异，可能因为上次存储后财务数据或参数发生了变化。</span>
              </div>
            </section>
          </div>

          <div v-else class="placeholder-panel">
            <p>加载计算明细中...</p>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="DCF v1" name="dcf-v1">
        <div class="page-card">
          <div class="section-head">
            <div class="section-head-row">
              <h3>DCF v1 模型</h3>
              <el-button text type="primary" @click="dcfV1HelpVisible = true">
                <el-icon><QuestionFilled /></el-icon>
                <span>模型说明</span>
              </el-button>
            </div>
          </div>

          <div class="profit-calculation">
            <section class="calc-summary">
              <div class="summary-result-row">
                <div class="summary-result-item">
                  <span class="summary-result-label">DCF v1 每股估值</span>
                  <strong>{{ safeRound(dcfValuationV1.perShareValue) || '-' }}</strong>
                </div>
                <div class="summary-result-item">
                  <span class="summary-result-label">偏离率</span>
                  <strong
                    :class="{
                      'deviation-positive': dcfValuationV1.deviation > 0,
                      'deviation-negative': dcfValuationV1.deviation < 0
                    }"
                  >
                    {{ formatPercent(dcfValuationV1.deviation) || '-' }}
                  </strong>
                </div>
              </div>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">预测期现值</td>
                  <td class="calc-value">{{ safeRound(dcfV1ForecastPV) || '-' }}</td>
                  <td class="calc-label">终值现值</td>
                  <td class="calc-value">{{ safeRound(dcfV1TerminalPV) || '-' }}</td>
                  <td class="calc-label">终值占比</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.terminalValueRatio) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">企业价值</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.enterpriseValue) || '-' }}</td>
                  <td class="calc-label">净债务</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.netDebt) || '-' }}</td>
                  <td class="calc-label">股权价值</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.equityValue) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">与利润贴现差异</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.profitDcfGap) || '-' }}</td>
                  <td class="calc-label">覆盖状态</td>
                  <td class="calc-value" colspan="3">
                    <el-tag
                      :type="hasDcfManualOverride(dcfValuationV1) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ hasDcfManualOverride(dcfValuationV1) ? '人工覆盖' : '系统默认' }}
                    </el-tag>
                  </td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <div class="calc-step-head">
                <h4>Step 1 — 关键参数假设</h4>
              </div>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label"></td>
                  <td class="calc-label">系统预测</td>
                  <td class="calc-label">手动设置</td>
                  <td class="calc-label">采用值</td>
                </tr>
                <tr>
                  <td class="calc-label">营收增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.revenueGrowthRatePrediction) || '-' }}</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': hasValue(dcfValuationV1.revenueGrowthRateManual) }">
                      {{ formatPercent(dcfValuationV1.revenueGrowthRateManual) || '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-value">
                    <el-tag
                      :type="hasValue(dcfValuationV1.revenueGrowthRateManual) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ formatPercent(dcfValuationV1.revenueGrowthRateApplied) || '-' }}
                    </el-tag>
                    <span class="tag-caption">{{ hasValue(dcfValuationV1.revenueGrowthRateManual) ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="calc-label">折现率 (WACC)</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.discountRatePrediction) || '-' }}</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': hasValue(dcfValuationV1.discountRateManual) }">
                      {{ formatPercent(dcfValuationV1.discountRateManual) || '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-value">
                    <el-tag
                      :type="hasValue(dcfValuationV1.discountRateManual) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ formatPercent(dcfValuationV1.discountRateApplied) || '-' }}
                    </el-tag>
                    <span class="tag-caption">{{ hasValue(dcfValuationV1.discountRateManual) ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="calc-label">永续增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.terminalGrowthRatePrediction) || '-' }}</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': hasValue(dcfValuationV1.terminalGrowthRateManual) }">
                      {{ formatPercent(dcfValuationV1.terminalGrowthRateManual) || '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-value">
                    <el-tag
                      :type="hasValue(dcfValuationV1.terminalGrowthRateManual) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ formatPercent(dcfValuationV1.terminalGrowthRateApplied) || '-' }}
                    </el-tag>
                    <span class="tag-caption">{{ hasValue(dcfValuationV1.terminalGrowthRateManual) ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>`r`n              </tbody>`r`n              </table>
              <table class="calc-table section-block" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">模型版本</td>
                  <td class="calc-value">{{ dcfValuationV1.modelVersion || '-' }}</td>
                  <td class="calc-label">场景</td>
                  <td class="calc-value">{{ dcfValuationV1.scenarioKey || '-' }}</td>
                  <td class="calc-label">公式版本</td>
                  <td class="calc-value">{{ dcfValuationV1.formulaVersion || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">现金流口径</td>
                  <td class="calc-value">{{ dcfValuationV1.cashFlowBasis || '-' }}</td>
                  <td class="calc-label">参数来源</td>
                  <td class="calc-value">{{ dcfValuationV1.defaultParameterSource || '-' }}</td>
                  <td class="calc-label">更新时间</td>
                  <td class="calc-value">{{ dcfValuationV1.updatedAt || '-' }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <h4>Step 2 — 自由现金流预测</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">基准自由现金流</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.baseFreeCashFlow) || '-' }}</td>
                  <td class="calc-label">采用增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.revenueGrowthRateApplied) || '-' }}</td>
                  <td class="calc-label">折现率 (WACC)</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.discountRateApplied) || '-' }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
              <div v-if="dcfV1YearlyRows.length" class="sub-section">
                <h5>逐年折现明细</h5>
                <div class="table-shell">
                  <el-table :data="dcfV1YearlyRows" size="small">
                    <el-table-column prop="year" label="年度" width="80" />
                    <el-table-column label="FCFF">
                      <template #default="{ row }">
                        {{ safeRound(row.freeCashFlow) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="折现因子">
                      <template #default="{ row }">
                        {{ row.discountFactor != null ? row.discountFactor.toFixed(4) : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="现值">
                      <template #default="{ row }">
                        <strong>{{ safeRound(row.presentValue) || '-' }}</strong>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <p class="calc-formula">
                  预测期现值合计 = <strong>{{ safeRound(dcfV1ForecastPV) || '-' }}</strong>
                </p>
              </div>
              <div v-else class="placeholder-panel section-block">
                <p>暂无逐年预测明细，可前往 DCF 一览页面刷新数据。</p>
              </div>
            </section>

            <section class="calc-step">
              <h4>Step 3 — 终值计算</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">永续增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.terminalGrowthRateApplied) || '-' }}</td>
                  <td class="calc-label">折现率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV1.discountRateApplied) || '-' }}</td>
                  <td class="calc-label">终值现值</td>
                  <td class="calc-value"><strong>{{ safeRound(dcfV1TerminalPV) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                终值现值 = 终值 ÷ (1 + WACC)^n &nbsp; | &nbsp; 终值占比 = {{ formatPercent(dcfValuationV1.terminalValueRatio) || '-' }}
              </p>
            </section>

            <section class="calc-step">
              <h4>Step 4 — 估值汇总</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">预测期现值</td>
                  <td class="calc-value">{{ safeRound(dcfV1ForecastPV) || '-' }}</td>
                  <td class="calc-label">终值现值</td>
                  <td class="calc-value">{{ safeRound(dcfV1TerminalPV) || '-' }}</td>
                  <td class="calc-label">企业价值</td>
                  <td class="calc-value"><strong>{{ safeRound(dcfValuationV1.enterpriseValue) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                企业价值 = 预测期现值 + 终值现值 = {{ safeRound(dcfV1ForecastPV) || '?' }} + {{ safeRound(dcfV1TerminalPV) || '?' }} = <strong>{{ safeRound(dcfValuationV1.enterpriseValue) || '-' }}</strong>
              </p>
              <table class="calc-table section-block" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">企业价值</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.enterpriseValue) || '-' }}</td>
                  <td class="calc-label">净债务</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV1.netDebt) || '-' }}</td>
                  <td class="calc-label">股权价值</td>
                  <td class="calc-value"><strong>{{ safeRound(dcfValuationV1.equityValue) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                股权价值 = 企业价值 − 净债务 = {{ safeRound(dcfValuationV1.enterpriseValue) || '?' }} − {{ safeRound(dcfValuationV1.netDebt) || '?' }} = <strong>{{ safeRound(dcfValuationV1.equityValue) || '-' }}</strong>
              </p>
            </section>

            <section class="calc-step calc-conclusion">
              <h4>Step 5 — 估值结论</h4>
              <div class="conclusion-row">
                <div class="conclusion-item">
                  <span class="conclusion-label">当前价格</span>
                  <strong>{{ safeRound(overview.price) || '-' }}</strong>
                </div>
                <div class="conclusion-item">
                  <span class="conclusion-label">DCF v1 每股估值</span>
                  <strong>{{ safeRound(dcfValuationV1.perShareValue) || '-' }}</strong>
                </div>
                <div class="conclusion-item">
                  <span class="conclusion-label">偏离率</span>
                  <strong
                    :class="{
                      'deviation-positive': dcfValuationV1.deviation > 0,
                      'deviation-negative': dcfValuationV1.deviation < 0
                    }"
                  >
                    {{ formatPercent(dcfValuationV1.deviation) || '-' }}
                  </strong>
                </div>
              </div>
              <p class="calc-formula">
                偏离率 = DCF v1 每股估值 ÷ 当前价格 − 1 = {{ safeRound(dcfValuationV1.perShareValue) || '?' }} ÷ {{ safeRound(overview.price) || '?' }} − 1 = <strong>{{ formatPercent(dcfValuationV1.deviation) || '-' }}</strong>
              </p>
            </section>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="DCF v2" name="dcf-v2">
        <div class="page-card">
          <div class="section-head">
            <div class="section-head-row">
              <h3>DCF v2 模型</h3>
              <el-button text type="primary" @click="dcfV2HelpVisible = true">
                <el-icon><QuestionFilled /></el-icon>
                <span>模型说明</span>
              </el-button>
            </div>
          </div>

          <div class="profit-calculation">
            <section class="calc-summary">
              <div class="summary-result-row">
                <div class="summary-result-item">
                  <span class="summary-result-label">DCF v2 每股估值</span>
                  <strong>{{ safeRound(dcfValuationV2.perShareValue) || '-' }}</strong>
                </div>
                <div class="summary-result-item">
                  <span class="summary-result-label">偏离率</span>
                  <strong
                    :class="{
                      'deviation-positive': dcfValuationV2.deviation > 0,
                      'deviation-negative': dcfValuationV2.deviation < 0
                    }"
                  >
                    {{ formatPercent(dcfValuationV2.deviation) || '-' }}
                  </strong>
                </div>
              </div>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">预测期现值</td>
                  <td class="calc-value">{{ safeRound(dcfV2ForecastPV) || '-' }}</td>
                  <td class="calc-label">终值现值</td>
                  <td class="calc-value">{{ safeRound(dcfV2TerminalPV) || '-' }}</td>
                  <td class="calc-label">终值占比</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.terminalValueRatio) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">企业价值</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.enterpriseValue) || '-' }}</td>
                  <td class="calc-label">净债务</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.netDebt) || '-' }}</td>
                  <td class="calc-label">股权价值</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.equityValue) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">与利润贴现差异</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.profitDcfGap) || '-' }}</td>
                  <td class="calc-label">敏感性区间</td>
                  <td class="calc-value" colspan="3">{{ formatSensitivityRange(dcfValuationV2) }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <div class="calc-step-head">
                <h4>Step 1 — 关键参数假设</h4>
              </div>
              <table class="calc-table" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label"></td>
                  <td class="calc-label">系统预测</td>
                  <td class="calc-label">手动设置</td>
                  <td class="calc-label">采用值</td>
                </tr>
                <tr>
                  <td class="calc-label">营收增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.revenueGrowthRatePrediction) || '-' }}</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': hasValue(dcfValuationV2.revenueGrowthRateManual) }">
                      {{ formatPercent(dcfValuationV2.revenueGrowthRateManual) || '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-value">
                    <el-tag
                      :type="hasValue(dcfValuationV2.revenueGrowthRateManual) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ formatPercent(dcfValuationV2.revenueGrowthRateApplied) || '-' }}
                    </el-tag>
                    <span class="tag-caption">{{ hasValue(dcfValuationV2.revenueGrowthRateManual) ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="calc-label">折现率 (WACC)</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.discountRatePrediction) || '-' }}</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': hasValue(dcfValuationV2.discountRateManual) }">
                      {{ formatPercent(dcfValuationV2.discountRateManual) || '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-value">
                    <el-tag
                      :type="hasValue(dcfValuationV2.discountRateManual) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ formatPercent(dcfValuationV2.discountRateApplied) || '-' }}
                    </el-tag>
                    <span class="tag-caption">{{ hasValue(dcfValuationV2.discountRateManual) ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>
                <tr>
                  <td class="calc-label">永续增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.terminalGrowthRatePrediction) || '-' }}</td>
                  <td class="calc-value">
                    <span :class="{ 'manual-value': hasValue(dcfValuationV2.terminalGrowthRateManual) }">
                      {{ formatPercent(dcfValuationV2.terminalGrowthRateManual) || '（未设置）' }}
                    </span>
                  </td>
                  <td class="calc-value">
                    <el-tag
                      :type="hasValue(dcfValuationV2.terminalGrowthRateManual) ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ formatPercent(dcfValuationV2.terminalGrowthRateApplied) || '-' }}
                    </el-tag>
                    <span class="tag-caption">{{ hasValue(dcfValuationV2.terminalGrowthRateManual) ? '人工覆盖' : '系统预测' }}</span>
                  </td>
                </tr>`r`n              </tbody>`r`n              </table>
              <table class="calc-table section-block" width="100%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">阶段营收增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.averageRevenueGrowthRate) || '-' }}</td>
                  <td class="calc-label">经营利润率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.averageOperatingMargin) || '-' }}</td>
                  <td class="calc-label">税率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.averageTaxRate) || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">再投资率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.averageReinvestmentRatio) || '-' }}</td>
                  <td class="calc-label">模型版本</td>
                  <td class="calc-value">{{ dcfValuationV2.modelVersion || '-' }}</td>
                  <td class="calc-label">场景</td>
                  <td class="calc-value">{{ dcfValuationV2.scenarioKey || '-' }}</td>
                </tr>
                <tr>
                  <td class="calc-label">公式版本</td>
                  <td class="calc-value">{{ dcfValuationV2.formulaVersion || '-' }}</td>
                  <td class="calc-label">现金流口径</td>
                  <td class="calc-value">{{ dcfValuationV2.cashFlowBasis || '-' }}</td>
                  <td class="calc-label">参数来源</td>
                  <td class="calc-value">{{ dcfValuationV2.defaultParameterSource || '-' }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
            </section>

            <section class="calc-step">
              <h4>Step 2 — 分阶段自由现金流预测</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">基准自由现金流</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.baseFreeCashFlow) || '-' }}</td>
                  <td class="calc-label">折现率 (WACC)</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.discountRateApplied) || '-' }}</td>
                  <td class="calc-label">更新时间</td>
                  <td class="calc-value">{{ dcfValuationV2.updatedAt || '-' }}</td>
                </tr>`r`n              </tbody>`r`n              </table>
              <div v-if="dcfV2StageDetails.length" class="sub-section">
                <h5>逐年预测明细</h5>
                <div class="table-shell">
                  <el-table :data="dcfV2StageDetails" size="small">
                    <el-table-column prop="yearOffset" label="年度" width="80" />
                    <el-table-column label="营收增长率">
                      <template #default="{ row }">
                        {{ formatPercent(row.revenueGrowthRate) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="经营利润率">
                      <template #default="{ row }">
                        {{ formatPercent(row.operatingMargin) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="再投资率">
                      <template #default="{ row }">
                        {{ formatPercent(row.reinvestmentRatio) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="FCFF">
                      <template #default="{ row }">
                        {{ safeRound(row.freeCashFlow) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="折现因子">
                      <template #default="{ row }">
                        {{ row.discountFactor != null ? row.discountFactor.toFixed(4) : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="现值">
                      <template #default="{ row }">
                        <strong>{{ safeRound(row.presentValue) || '-' }}</strong>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <p class="calc-formula">
                  预测期现值合计 = <strong>{{ safeRound(dcfV2ForecastPV) || '-' }}</strong>
                </p>
              </div>
              <div v-else class="placeholder-panel section-block">
                <p>暂无逐年预测明细，可前往 DCF 一览页面刷新数据。</p>
              </div>
            </section>

            <section class="calc-step">
              <h4>Step 3 — 终值计算</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">永续增长率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.terminalGrowthRateApplied) || '-' }}</td>
                  <td class="calc-label">折现率</td>
                  <td class="calc-value">{{ formatPercent(dcfValuationV2.discountRateApplied) || '-' }}</td>
                  <td class="calc-label">终值现值</td>
                  <td class="calc-value"><strong>{{ safeRound(dcfV2TerminalPV) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                终值现值 = 终值 ÷ (1 + WACC)^n &nbsp; | &nbsp; 终值占比 = {{ formatPercent(dcfValuationV2.terminalValueRatio) || '-' }}
              </p>
            </section>

            <section class="calc-step">
              <h4>Step 4 — 估值汇总</h4>
              <table class="calc-table" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">预测期现值</td>
                  <td class="calc-value">{{ safeRound(dcfV2ForecastPV) || '-' }}</td>
                  <td class="calc-label">终值现值</td>
                  <td class="calc-value">{{ safeRound(dcfV2TerminalPV) || '-' }}</td>
                  <td class="calc-label">企业价值</td>
                  <td class="calc-value"><strong>{{ safeRound(dcfValuationV2.enterpriseValue) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                企业价值 = 预测期现值 + 终值现值 = {{ safeRound(dcfV2ForecastPV) || '?' }} + {{ safeRound(dcfV2TerminalPV) || '?' }} = <strong>{{ safeRound(dcfValuationV2.enterpriseValue) || '-' }}</strong>
              </p>
              <table class="calc-table section-block" width="75%">
                <tbody>`r`n                <tr>
                  <td class="calc-label">企业价值</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.enterpriseValue) || '-' }}</td>
                  <td class="calc-label">净债务</td>
                  <td class="calc-value">{{ safeRound(dcfValuationV2.netDebt) || '-' }}</td>
                  <td class="calc-label">股权价值</td>
                  <td class="calc-value"><strong>{{ safeRound(dcfValuationV2.equityValue) || '-' }}</strong></td>
                </tr>`r`n              </tbody>`r`n              </table>
              <p class="calc-formula">
                股权价值 = 企业价值 − 净债务 = {{ safeRound(dcfValuationV2.enterpriseValue) || '?' }} − {{ safeRound(dcfValuationV2.netDebt) || '?' }} = <strong>{{ safeRound(dcfValuationV2.equityValue) || '-' }}</strong>
              </p>
            </section>

            <section class="calc-step">
              <h4>Step 5 — 敏感性分析</h4>
              <div v-if="dcfV2SensitivitySnapshots.length" class="sub-section">
                <div class="table-shell">
                  <el-table :data="dcfV2SensitivitySnapshots" size="small">
                    <el-table-column prop="scenarioKey" label="场景" width="130" />
                    <el-table-column label="折现率">
                      <template #default="{ row }">
                        {{ formatPercent(row.discountRate) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="永续增长率">
                      <template #default="{ row }">
                        {{ formatPercent(row.terminalGrowthRate) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="每股估值">
                      <template #default="{ row }">
                        {{ safeRound(row.perShareValue) || '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column label="终值占比">
                      <template #default="{ row }">
                        {{ formatPercent(row.terminalValueRatio) || '-' }}
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
              <div v-else class="placeholder-panel section-block">
                <p>暂无敏感性分析数据。</p>
              </div>
            </section>

            <section class="calc-step calc-conclusion">
              <h4>Step 6 — 估值结论</h4>
              <div class="conclusion-row">
                <div class="conclusion-item">
                  <span class="conclusion-label">当前价格</span>
                  <strong>{{ safeRound(overview.price) || '-' }}</strong>
                </div>
                <div class="conclusion-item">
                  <span class="conclusion-label">DCF v2 每股估值</span>
                  <strong>{{ safeRound(dcfValuationV2.perShareValue) || '-' }}</strong>
                </div>
                <div class="conclusion-item">
                  <span class="conclusion-label">偏离率</span>
                  <strong
                    :class="{
                      'deviation-positive': dcfValuationV2.deviation > 0,
                      'deviation-negative': dcfValuationV2.deviation < 0
                    }"
                  >
                    {{ formatPercent(dcfValuationV2.deviation) || '-' }}
                  </strong>
                </div>
              </div>
              <p class="calc-formula">
                偏离率 = DCF v2 每股估值 ÷ 当前价格 − 1 = {{ safeRound(dcfValuationV2.perShareValue) || '?' }} ÷ {{ safeRound(overview.price) || '?' }} − 1 = <strong>{{ formatPercent(dcfValuationV2.deviation) || '-' }}</strong>
              </p>
            </section>

            <section class="calc-step">
              <div class="section-head">
                <h3>v1 / v2 对比</h3>
              </div>
              <div class="metric-grid">
                <ValuationMetric
                  label="v2 - v1 每股差异"
                  :value="safeRound(dcfComparison.perShareGap) || '-'"
                />
                <ValuationMetric
                  label="v2 - v1 偏离率差异"
                  :value="formatPercent(dcfComparison.deviationGap) || '-'"
                />
                <ValuationMetric
                  label="对比状态"
                  :value="dcfComparison.status"
                />
              </div>
            </section>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="财务评价" name="financial">
        <div class="page-card">
          <div class="section-head">
            <h3>财务评价</h3>
          </div>

          <AssumptionStrip :items="financialHighlightItems" />

          <div class="financial-layout section-block">
            <section
              v-for="group in financialMetricGroups"
              :key="group.title"
              class="financial-section"
            >
              <div class="section-head">
                <h3>{{ group.title }}</h3>
              </div>
              <div class="financial-metric-grid">
                <div
                  v-for="item in group.items"
                  :key="`${group.title}-${item.label}`"
                  class="financial-metric"
                  :class="`financial-metric--${item.status || 'neutral'}`"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value || '-' }}</strong>
                  <small>{{ item.description }}</small>
                </div>
              </div>
            </section>

            <section class="financial-section">
              <div class="section-head">
                <h3>风险提示</h3>
              </div>
              <ul class="risk-list">
                <li
                  v-for="item in financialReview.riskWarnings || []"
                  :key="item"
                >
                  {{ item }}
                </li>
              </ul>
            </section>
          </div>

          <div class="section-head section-block">
            <h3>最新财务快照</h3>
          </div>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="报告日期">{{
              latestReport.date
            }}</el-descriptions-item>
            <el-descriptions-item label="加权 ROE">{{
              formatPercent(latestReport.wroe)
            }}</el-descriptions-item>
            <el-descriptions-item label="每股经营现金流">{{
              safeRound(latestReport.operatingCashFlowPer)
            }}</el-descriptions-item>
            <el-descriptions-item label="资产负债率">{{
              formatPercent(latestReport.assetLiabilityRatio)
            }}</el-descriptions-item>
          </el-descriptions>

          <div class="section-head section-block">
            <h3>最近五年分红信息</h3>
          </div>
          <div class="table-shell">
            <el-table :data="dividendList" size="small">
              <el-table-column prop="dividendYear" label="年份" width="100" />
              <el-table-column label="分红金额">
                <template #default="{ row }">
                  {{ formatYi(row.dividendAmount) }}
                </template>
              </el-table-column>
              <el-table-column label="自由现金流">
                <template #default="{ row }">
                  {{ formatYi(row.freeCashFlow) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

    </el-tabs>
    <el-dialog
      v-model="helpDialogVisible"
      title="利润贴现估值说明"
      width="720px"
      class="profit-help-dialog"
    >
      <div class="help-content">
        <section>
          <h3>总体口径</h3>
          <p>
            利润贴现估值是一个每股估值，先估算净资产、高增长期利润和稳定期利润的现值，
            再乘以市场风险系数和行业风险系数。
          </p>
          <p class="formula">
            最终估值 = (净资产估值 + 高增长期估值 + 稳定期估值) × 市场风险系数 × 行业风险系数
          </p>
        </section>

        <section>
          <h3>增长率怎么来</h3>
          <p>
            采用增长率优先使用手动增长率；没有手动值时使用系统增长率。系统增长率由营收增速和扣非利润增速推算，
            并对乐观增速做上限约束。
          </p>
          <ul>
            <li>页面里的增长率是百分数点，例如 15 表示 15%。</li>
            <li>高增长期目前按 3 年计算。</li>
            <li>系统推算时，营收下降会保守处理利润增速；营收和利润增速上限按 30% 截断。</li>
          </ul>
        </section>

        <section>
          <h3>三段估值</h3>
          <ul>
            <li>净资产估值 = 每股净资产 × 净资产折算率。</li>
            <li>高增长期估值 = 每股扣非净利润 × 未来 3 年利润增长后的折现系数合计 × 分红/留存折算系数。</li>
            <li>稳定期估值 = 第 3 年后的永续利润价值 × 分红/留存折算系数。</li>
          </ul>
          <p>
            分红/留存折算系数会综合预期分红率和净资产折算率；预期分红率会参考上年度分红率、分红年数和分红连续性，
            且长期分红率上限按 70% 处理。
          </p>
        </section>

        <section>
          <h3>偏离率</h3>
          <p class="formula">偏离率 = 利润贴现估值 ÷ 当前价 - 1</p>
          <p>
            偏离率为正，表示模型估值高于当前价；偏离率为负，表示模型估值低于当前价。
          </p>
        </section>
      </div>
    </el-dialog>
    <el-dialog
      v-model="growthHelpVisible"
      title="增长率推算说明"
      width="640px"
      class="profit-help-dialog"
    >
      <div class="help-content">
        <section>
          <h3>数据来源</h3>
          <p>
            增长率推算基于最新一期财务报告中的营收增速和扣非利润增速。
            累积增速和当期增速均来自财报附注或理杏仁 API。
          </p>
        </section>
        <section>
          <h3>推算逻辑</h3>
          <ul>
            <li>先用累积增速和当期增速综合预测未来增速。两者同正取均值，同负取当期值，一正一负取较小值（保守）。</li>
            <li>再用营收增速和利润增速推算最终利润率增速。营收下降时取较保守值，营收正常时取两者均值，且上限按 30% 截断。</li>
            <li>如果仅有一季报（报告日期为 03-31），直接用当期增速推算，不做综合预测。</li>
          </ul>
        </section>
        <section>
          <h3>采用规则</h3>
          <ul>
            <li>优先使用人工设定的手动增长率。</li>
            <li>没有手动值时使用系统推算的增长率。</li>
            <li>两者都为空时，实时根据财务数据重新推算。</li>
          </ul>
        </section>
      </div>
    </el-dialog>
    <el-dialog
      v-model="dividendHelpVisible"
      title="分红率推算说明"
      width="640px"
      class="profit-help-dialog"
    >
      <div class="help-content">
        <section>
          <h3>数据来源</h3>
          <p>
            分红率推算基于公司历史分红记录。分红年数、持续分红标志、上年度分红率均来自
            理杏仁 API 的分红及股本变动数据。
          </p>
        </section>
        <section>
          <h3>分红稳定性</h3>
          <ul>
            <li>持续分红（上市以来每年都分）的公司：10 年以上稳定性为 100%，不足 10 年按年限折减。</li>
            <li>未持续分红的公司：5 年以上稳定性为 100%，不足 5 年同样按年限折减。</li>
          </ul>
        </section>
        <section>
          <h3>预期分红率</h3>
          <ul>
            <li>以上年度分红率为基础，乘以分红稳定性系数。</li>
            <li>长期分红率上限按 70% 处理，认为企业不可能维持长期 100% 分红。</li>
            <li>预期分红率会影响留存折算系数，进而影响高增长期和稳定期估值。</li>
          </ul>
        </section>
      </div>
    </el-dialog>
    <el-dialog
      v-model="dcfV1HelpVisible"
      title="DCF v1 模型说明"
      width="640px"
      class="profit-help-dialog"
    >
      <div class="help-content">
        <section>
          <h3>总体口径</h3>
          <p>
            DCF v1（简易 FCFF 模型）采用统一增长率假设，将基准自由现金流按固定增长率外推，
            折现后加总得到企业价值，再扣减净债务得到股权价值。
          </p>
          <p class="formula">
            股权价值 = 企业价值 − 净债务
          </p>
        </section>
        <section>
          <h3>参数来源</h3>
          <ul>
            <li>营收增长率：优先使用手动设置值，否则使用系统预测值（基于历史财务数据推算）。</li>
            <li>折现率（WACC）：优先使用手动设置值，否则使用系统默认值。</li>
            <li>永续增长率：优先使用手动设置值，否则使用系统默认值（通常 2%–3%）。</li>
          </ul>
        </section>
        <section>
          <h3>计算步骤</h3>
          <ul>
            <li>Step 1：确定关键参数（增长率、折现率、永续增长率）。</li>
            <li>Step 2：逐年外推自由现金流并折现。</li>
            <li>Step 3：计算终值（永续增长模型）并折现。</li>
            <li>Step 4：企业价值 = 预测期现值 + 终值现值；股权价值 = 企业价值 − 净债务。</li>
            <li>Step 5：每股估值 = 股权价值 ÷ 总股本。</li>
          </ul>
        </section>
        <section>
          <h3>偏离率</h3>
          <p class="formula">偏离率 = 每股估值 ÷ 当前价格 − 1</p>
          <p>
            偏离率为正，表示模型估值高于当前价；偏离率为负，表示模型估值低于当前价。
          </p>
        </section>
      </div>
    </el-dialog>
    <el-dialog
      v-model="dcfV2HelpVisible"
      title="DCF v2 模型说明"
      width="640px"
      class="profit-help-dialog"
    >
      <div class="help-content">
        <section>
          <h3>总体口径</h3>
          <p>
            DCF v2（标准 FCFF 模型）采用分阶段假设，每个阶段可设置不同的营收增长率、经营利润率、
            税率和再投资率，逐期推算自由现金流并折现。
          </p>
          <p class="formula">
            FCFF = 营收 × 经营利润率 × (1 − 税率) × (1 − 再投资率)
          </p>
        </section>
        <section>
          <h3>与 v1 的主要区别</h3>
          <ul>
            <li>v1 使用统一增长率外推 FCFF；v2 从营收出发，逐期推算 FCFF。</li>
            <li>v2 引入了经营利润率、税率、再投资率等中间变量，更贴近实际经营逻辑。</li>
            <li>v2 支持敏感性分析：在不同折现率和永续增长率组合下展示估值区间。</li>
          </ul>
        </section>
        <section>
          <h3>计算步骤</h3>
          <ul>
            <li>Step 1：确定关键参数和各阶段假设。</li>
            <li>Step 2：分阶段逐年推算营收 → 经营利润 → NOPAT → FCFF，并折现。</li>
            <li>Step 3：终值计算（与 v1 相同）。</li>
            <li>Step 4：估值汇总。</li>
            <li>Step 5：敏感性分析，展示不同参数组合下的估值区间。</li>
            <li>Step 6：估值结论。</li>
          </ul>
        </section>
        <section>
          <h3>敏感性分析</h3>
          <p>
            对折现率和永续增长率取不同组合（基准、乐观、悲观），计算对应的每股估值和终值占比，
            用于评估参数变动对估值的影响程度。
          </p>
        </section>
      </div>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Delete, QuestionFilled } from '@element-plus/icons-vue'

import { deleteCompany } from '@/api/company-command'
import { getProfitValuationDetail } from '@/api/profit-valuation'
import { getCompanyOverview } from '@/api/valuation-query'
import { formatPercent, formatYi, roundToDecimal } from '@/utils'
import AssumptionStrip from './components/AssumptionStrip.vue'
import ValuationMetric from './components/ValuationMetric.vue'

const route = useRoute()
const router = useRouter()
const companyId = route.params.id
const parentRoute = resolveParentRoute(route.query?.from)

const activeTab = ref(resolveInitialTab(route.query?.tab))
const loading = ref(false)
const overview = reactive({})
const profitValuation = reactive({})
const dcfValuationV1 = reactive({})
const dcfValuationV2 = reactive({})
const financialReview = reactive({})
const latestReport = reactive({})
const dividendList = ref([])
const profitDetail = ref(null)
const helpDialogVisible = ref(false)
const growthHelpVisible = ref(false)
const dividendHelpVisible = ref(false)
const dcfV1HelpVisible = ref(false)
const dcfV2HelpVisible = ref(false)

loadDetail()

const researchNavItems = computed(() => [
  {
    name: 'profit',
    label: '利润贴现',
    summary: `估值 ${safeRound(profitValuation.valuation) || '-'}`
  },
  {
    name: 'dcf-v1',
    label: 'DCF v1',
    summary:
      safeRound(dcfValuationV1.perShareValue) || dcfValuationV1.message || '-'
  },
  {
    name: 'dcf-v2',
    label: 'DCF v2',
    summary:
      safeRound(dcfValuationV2.perShareValue) || dcfValuationV2.message || '-'
  },
  {
    name: 'financial',
    label: '财务评价',
    summary: latestReport.date || '等待财报'
  },
])

const profitDetailYearlyRows = computed(() => {
  if (!profitDetail.value) return []
  const g = (profitDetail.value.appliedGrowthRate ?? 0) / 100
  const r = profitDetail.value.discountRate ?? 0
  return (profitDetail.value.yearlyDiscountFactors || []).map((coef, i) => {
    const year = i + 1
    return {
      year: `第 ${year} 年`,
      growthFactor: (Math.pow(1 + g, year)).toFixed(4),
      discountFactor: (Math.pow(1 + r, year)).toFixed(4),
      coefficient: coef.toFixed(4)
    }
  })
})

const dcfV2StageDetails = computed(() => dcfValuationV2.assumptionDetails || [])

const dcfV1YearlyRows = computed(() => {
  const details = dcfValuationV1.assumptionDetails || []
  return details.map((d, i) => ({
    year: `第 ${d.yearOffset || i + 1} 年`,
    freeCashFlow: d.freeCashFlow,
    discountFactor: d.discountFactor,
    presentValue: d.presentValue
  }))
})

const dcfV1ForecastPV = computed(() => {
  const details = dcfValuationV1.assumptionDetails || []
  if (!details.length) return null
  return details.reduce((sum, d) => sum + (d.presentValue || 0), 0)
})

const dcfV1TerminalPV = computed(() => {
  const ev = dcfValuationV1.enterpriseValue
  const fpv = dcfV1ForecastPV.value
  if (hasNumber(ev) && hasNumber(fpv)) return ev - fpv
  return null
})

const dcfV2ForecastPV = computed(() => {
  const details = dcfValuationV2.assumptionDetails || []
  if (!details.length) return null
  return details.reduce((sum, d) => sum + (d.presentValue || 0), 0)
})

const dcfV2TerminalPV = computed(() => {
  const ev = dcfValuationV2.enterpriseValue
  const fpv = dcfV2ForecastPV.value
  if (hasNumber(ev) && hasNumber(fpv)) return ev - fpv
  return null
})

const dcfV2SensitivitySnapshots = computed(
  () => dcfValuationV2.sensitivitySnapshots || []
)

const dcfComparison = computed(() => ({
  perShareGap: gap(dcfValuationV2.perShareValue, dcfValuationV1.perShareValue),
  deviationGap: gap(dcfValuationV2.deviation, dcfValuationV1.deviation),
  status:
    hasNumber(dcfValuationV1.perShareValue) &&
    hasNumber(dcfValuationV2.perShareValue)
      ? '可对比'
      : '等待 v2 结果'
}))

const financialMetricGroups = computed(() => [
  {
    title: '盈利能力',
    items: financialReview.profitability || []
  },
  {
    title: '现金流质量',
    items: financialReview.cashFlowQuality || []
  },
  {
    title: '分红稳定性',
    items: financialReview.dividendStability || []
  },
  {
    title: '偿债能力',
    items: financialReview.solvency || []
  },
  {
    title: '资产结构',
    items: financialReview.assetStructure || []
  }
])

const financialHighlightItems = computed(() => {
  const highlights = financialReview.highlights || []
  if (!highlights.length) {
    return [
      {
        label: '财务亮点',
        value: '-',
        source: '等待数据'
      }
    ]
  }
  return highlights.slice(0, 3).map((item, index) => ({
    label: `财务亮点 ${index + 1}`,
    value: item,
    source: latestReport.date || '最新财报'
  }))
})

function resolveInitialTab(tab) {
  return ['overview', 'profit', 'dcf-v1', 'dcf-v2', 'financial'].includes(tab)
    ? tab
    : 'overview'
}

async function loadDetail() {
  loading.value = true
  try {
    const { data } = await getCompanyOverview(companyId)
    const dcfV1 = data.dcfValuationV1 || {}
    const dcfV2 = data.dcfValuationV2 || {}
    Object.assign(overview, data.overview || {})
    Object.assign(profitValuation, data.profitValuation || {})
    Object.assign(dcfValuationV1, dcfV1)
    Object.assign(dcfValuationV2, dcfV2)
    Object.assign(financialReview, data.financialReview || {})
    Object.assign(latestReport, financialReview.latestReport || {})
    dividendList.value = financialReview.dividendList || []
  } finally {
    loading.value = false
  }
}

async function loadProfitDetail() {
  if (activeTab.value !== 'profit' || profitDetail.value) return
  try {
    const { data } = await getProfitValuationDetail(companyId)
    profitDetail.value = data.detail
  } catch {
    // silently ignore
  }
}

watch(activeTab, (tab) => {
  if (tab === 'profit') {
    loadProfitDetail()
  }
}, { immediate: true })

async function confirmDeleteCompany() {
  await ElMessageBox.confirm('此操作将删除本公司，是否继续？', '提示', {
    type: 'warning'
  })
  await deleteCompany(companyId)
  ElNotification.success({
    title: 'Success',
    message: '删除成功'
  })
  router.push(parentRoute)
}

function resolveParentRoute(source) {
  if (source === 'profit-discount') {
    return '/companyvaluation/valuation/profit-discount'
  }
  if (source === 'dcf-v1') {
    return '/companyvaluation/valuation/dcf-v1'
  }
  if (source === 'dcf-v2') {
    return '/companyvaluation/valuation/dcf-v2'
  }
  return '/companyvaluation/valuation/company'
}

function safeRound(value) {
  return value === null || value === undefined ? '' : roundToDecimal(value, 2)
}

function formatSensitivityRange(valuation) {
  if (
    !hasValue(valuation.sensitivityLowPerShareValue) ||
    !hasValue(valuation.sensitivityHighPerShareValue)
  ) {
    return '-'
  }
  return `${safeRound(valuation.sensitivityLowPerShareValue)} / ${safeRound(
    valuation.sensitivityHighPerShareValue
  )}`
}

function formatRatePoint(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return `${Number(value).toFixed(2)}%`
}

function gap(current, baseline) {
  if (!hasNumber(current) || !hasNumber(baseline)) {
    return null
  }
  return current - baseline
}

function hasNumber(value) {
  return typeof value === 'number' && !Number.isNaN(value)
}

function hasDcfManualOverride(valuation) {
  return (
    Boolean(valuation.manualOverrideFlag) ||
    hasValue(valuation.revenueGrowthRateManual) ||
    hasValue(valuation.discountRateManual) ||
    hasValue(valuation.terminalGrowthRateManual)
  )
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function conclusionType(conclusion) {
  if (conclusion === '重点关注') {
    return 'success'
  }
  if (conclusion === '偏贵') {
    return 'warning'
  }
  if (conclusion === '待补数据') {
    return 'info'
  }
  return ''
}
</script>

<style scoped lang="scss">
.company-overview {
  min-width: 0;
}

.overview-tabs {
  min-width: 0;
}

.overview-grid {
  display: grid;
  gap: var(--app-page-gap);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.section-head {
  margin-bottom: 14px;
}

.section-block {
  margin-top: 18px;
}

.placeholder-panel {
  display: grid;
  gap: 12px;
}

.overview-focus {
  display: grid;
  gap: 12px;
}

.highlight-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--app-text);
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.nav-card {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid rgba(16, 34, 53, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
}

.nav-card strong,
.nav-card span {
  overflow-wrap: anywhere;
}

.nav-card span {
  color: var(--app-text-muted);
  font-size: 12px;
}

.financial-layout {
  display: grid;
  gap: 18px;
}

.financial-section {
  min-width: 0;
}

.financial-metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.financial-metric {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 12px 14px;
  border-left: 3px solid rgba(25, 58, 84, 0.18);
  background: rgba(255, 255, 255, 0.68);
}

.financial-metric--good {
  border-left-color: #1d7f58;
}

.financial-metric--warn {
  border-left-color: #c43c2d;
}

.financial-metric span,
.financial-metric small {
  overflow-wrap: anywhere;
  color: var(--app-text-muted);
  font-size: 12px;
}

.financial-metric strong {
  overflow-wrap: anywhere;
  color: var(--app-text);
  font-size: 17px;
  line-height: 1.25;
}

.risk-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: var(--app-text);
}

.section-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.profit-calculation {
  display: grid;
  gap: 0;
}

.calc-summary {
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(16, 34, 53, 0.06);
}

.summary-result-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.summary-result-item {
  display: grid;
  gap: 6px;
  padding: 14px 18px;
  border-radius: 8px;
  background: #f4f7fb;
}

.summary-result-label {
  color: var(--app-text-muted);
  font-size: 13px;
}

.summary-result-item strong {
  font-size: 24px;
  color: var(--app-text);
}

.summary-params {
  margin-top: 4px;
}

.calc-step {
  padding: 18px 0;
  border-bottom: 1px solid rgba(16, 34, 53, 0.06);
}

.calc-step:last-child {
  border-bottom: none;
}

.calc-step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.calc-step-head h4 {
  margin: 0;
  font-size: 15px;
  color: var(--app-text);
}

.calc-step h4 {
  margin: 0 0 14px 0;
  font-size: 15px;
  color: var(--app-text);
}

.calc-step h5 {
  margin: 14px 0 8px 0;
  font-size: 13px;
  color: #43566b;
}

.calc-table {
  table-layout: fixed;
  border-collapse: collapse;
  border: 1px solid #e4e7ed;
  margin: 4px 0;
}

.calc-table td {
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid #e4e7ed;
  vertical-align: middle;
}

.calc-table .calc-label {
  width: 12.5%;
  background: #fafafa;
  color: #909399;
  white-space: nowrap;
}

.calc-table .calc-value {
  width: 12.5%;
  background: #fff;
  color: #303133;
}

.calc-table .calc-value strong {
  color: #303133;
}

.calc-formula {
  margin: 10px 0 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f4f7fb;
  color: #43566b;
  font-size: 13px;
  line-height: 1.75;
}

.tag-caption {
  margin-left: 8px;
  color: var(--app-text-muted);
  font-size: 12px;
}

.manual-value {
  color: #bb7b13;
  font-weight: 600;
}

.final-value {
  font-size: 18px;
  color: #1a3a54;
}

.calc-conclusion {
  background: #f8fafc;
  margin: 0 -20px;
  padding: 20px 24px;
  border-bottom: none;
  border-radius: 8px;
}

.conclusion-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.conclusion-item {
  display: grid;
  gap: 6px;
}

.conclusion-label {
  color: var(--app-text-muted);
  font-size: 13px;
}

.conclusion-item strong {
  font-size: 20px;
  color: var(--app-text);
}

.deviation-positive {
  color: #c43c2d;
}

.deviation-negative {
  color: #1d7f58;
}

.stored-note {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #fff8e1;
  color: #8a6d3b;
  font-size: 13px;
  line-height: 1.5;
}

.help-content {
  display: grid;
  gap: 18px;
  color: var(--app-text);
}

.help-content section {
  display: grid;
  gap: 8px;
}

.help-content h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
}

.help-content p {
  color: #43566b;
  line-height: 1.75;
}

.help-content ul {
  margin: 0;
  padding-left: 20px;
  color: #43566b;
  line-height: 1.75;
}

.formula {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f4f7fb;
  color: #22384f;
  font-weight: 700;
}
</style>
