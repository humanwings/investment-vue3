<template>
  <main class="content">
    <router-view />
  </main>
</template>

<style scoped lang="scss">
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  padding: 24px 28px 32px;
  overflow: auto;
  overflow-x: hidden;
}

@media (max-width: 960px) {
  .content {
    padding: 18px;
  }
}
</style>
