<template>
  <section class="placeholder">
    <h2>{{ $route.meta?.title }}</h2>
    <p>该模块将在后续步骤中迁移，目前用于保持菜单和路由骨架完整。</p>
  </section>
</template>

<style scoped lang="scss">
.placeholder {
  padding: 28px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 18px 40px rgba(18, 51, 83, 0.06);
}

h2 {
  margin: 0 0 10px;
  color: #11293f;
}

p {
  margin: 0;
  color: #5d748b;
}
</style>
