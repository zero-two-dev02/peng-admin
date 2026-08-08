import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setupHttpInterceptors } from './api/setup-http-interceptors'
import router from './router'
import pinia from './stores'

setupHttpInterceptors()

createApp(App).use(pinia).use(router).mount('#app')
