<template>
  <section class="not-found">
    <div class="code">404</div>
    <h1>页面不存在</h1>
    <p>你访问的页面不存在或当前地址已经变更，请返回首页重新选择业务模块。</p>
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </section>
</template>

<style scoped lang="scss">
.not-found {
  display: grid;
  place-items: center;
  gap: 12px;
  min-height: 60vh;
  text-align: center;
}

.code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  color: #163657;
}

h1,
p {
  margin: 0;
}
</style>
