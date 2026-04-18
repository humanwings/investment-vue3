import { createRouter, createWebHistory } from 'vue-router'

import { appRoutes } from './routes'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ left: 0, top: 0 }),
  routes: appRoutes
})

export default router
