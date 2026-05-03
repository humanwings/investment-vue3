<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol>
      <li v-for="item in breadcrumbItems" :key="item.path" class="crumb">
        <router-link v-if="!item.isCurrent" :to="item.path">{{
          item.title
        }}</router-link>
        <span v-else>{{ item.title }}</span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbItems = computed(() => {
  const visibleItems = route.matched
    .filter(
      (record) =>
        record.meta?.title && !record.meta?.hidden && record.path !== '/'
    )
    .map((record, index, matched) => ({
      path:
        typeof record.redirect === 'string'
          ? record.redirect
          : resolveRecordPath(record.path),
      title: record.meta.title,
      isCurrent: index === matched.length - 1
    }))

  if (isCompanyOverview.value) {
    return [
      ...visibleItems.map((item) => ({ ...item, isCurrent: false })),
      companyOverviewSource.value,
      {
        path: route.fullPath,
        title: '公司总览',
        isCurrent: true
      }
    ]
  }

  return visibleItems
})

const isCompanyOverview = computed(() => route.name === 'CompanyDetail')
const companyOverviewSource = computed(() => {
  if (route.query?.from === 'profit-discount') {
    return {
      path: '/companyvaluation/valuation/profit-discount',
      title: '利润贴现一览',
      isCurrent: false
    }
  }
  if (route.query?.from === 'dcf-v1') {
    return {
      path: '/companyvaluation/valuation/dcf-v1',
      title: 'DCF v1一览',
      isCurrent: false
    }
  }
  if (route.query?.from === 'dcf-v2') {
    return {
      path: '/companyvaluation/valuation/dcf-v2',
      title: 'DCF v2一览',
      isCurrent: false
    }
  }
  return {
    path: '/companyvaluation/valuation/company',
    title: '公司列表',
    isCurrent: false
  }
})

function resolveRecordPath(path) {
  return path.replace(/:([A-Za-z0-9_]+)/g, (_, key) => route.params[key] ?? '')
}
</script>

<style scoped lang="scss">
.breadcrumb ol {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.crumb {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6c8196;
  font-size: 13px;
}

.crumb + .crumb::before {
  content: '/';
  color: #9aabbb;
  margin-right: 2px;
}

.crumb a {
  color: inherit;
}

.crumb span {
  color: #17324a;
  font-weight: 600;
}
</style>
