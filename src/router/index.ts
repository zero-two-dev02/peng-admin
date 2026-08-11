import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import PermissionListView from '../views/PermissionListView.vue'
import RoleListView from '../views/RoleListView.vue'
import UserListView from '../views/UserListView.vue'
import pinia from '../stores'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/system/users',
    name: 'user-list',
    component: UserListView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/system/roles',
    name: 'role-list',
    component: RoleListView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/system/permissions',
    name: 'permission-list',
    component: PermissionListView,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)

  if (to.meta.requiresAuth && !authStore.hasSession) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.hasSession) {
    return { name: 'home' }
  }
})

export default router
