import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import pinia from '../stores'

const http = axios.create({
  baseURL: '/api',
})

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

export default http
