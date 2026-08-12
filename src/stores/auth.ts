import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface AuthSession {
  userId: number
  accessToken: string
  expiresTime: string
}

export const useAuthStore = defineStore('auth', () => {
  const userId = ref<number | null>(null)
  const accessToken = ref<string | null>(null)
  const expiresTime = ref<string | null>(null)
  const permissions = ref<string[]>([])

  const hasSession = computed(() => accessToken.value !== null)

  function setSession(session: AuthSession) {
    userId.value = session.userId
    accessToken.value = session.accessToken
    expiresTime.value = session.expiresTime
  }

  function clearSession() {
    userId.value = null
    accessToken.value = null
    expiresTime.value = null
    permissions.value = []
  }

  function setPermissions(value: string[]) {
    permissions.value = value
  }

  function hasPermission(permission: string) {
    return permissions.value.includes(permission)
  }

  return {
    userId,
    accessToken,
    expiresTime,
    permissions,
    hasSession,
    setSession,
    setPermissions,
    hasPermission,
    clearSession,
  }
})
