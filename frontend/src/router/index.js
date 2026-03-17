import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/home/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/viewer/:projectId',
      name: 'viewer',
      component: () => import('../views/viewer/index.vue')
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/index.vue')
    }
  ]
})

export default router
