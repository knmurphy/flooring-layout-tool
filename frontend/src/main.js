import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import router from './router' // Import the router instance, not just the routes
import { draggable } from './directives/draggable'

const app = createApp(App)
app.use(router) // Use the router instance
app.use(ElementPlus)
app.directive('draggable', draggable)
app.mount('#app')