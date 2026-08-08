import router from '../router'
import pinia from '../stores'
import { useAuthStore } from '../stores/auth'
import http from './http'

const AUTH_ACCESS_TOKEN_INVALID = 1_002_001_003

function getResultCode(data: unknown): number | null {
  if (typeof data !== 'object' || data === null || !('code' in data)) {
    return null
  }

  const code = (data as { code?: unknown }).code
  return typeof code === 'number' ? code : null
}

export function setupHttpInterceptors() {
  http.interceptors.request.use((config) => {
    const authStore = useAuthStore(pinia)

    if (authStore.accessToken !== null) {
      config.headers.set(
        'Authorization',
        `Bearer ${authStore.accessToken}`,
      )
    }

    return config
  })

  http.interceptors.response.use(async (response) => {
    if (getResultCode(response.data) === AUTH_ACCESS_TOKEN_INVALID) {
      const authStore = useAuthStore(pinia)
      authStore.clearSession()

      if (router.currentRoute.value.name !== 'login') {
        await router.replace({ name: 'login' })
      }
    }

    return response
  })
}
