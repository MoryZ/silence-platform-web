import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from './App.vue'
import router from './router'
import { setupI18n } from './locales';
import { piniaPluginPersist } from './stores/config'
import { permissionDirective } from './directives/permission'

// 引入样式
import 'ant-design-vue/dist/reset.css' // Ant Design Vue 样式
import './assets/main.css' // 全局样式

const app = createApp(App)
const pinia = createPinia()

// 添加持久化插件
pinia.use(piniaPluginPersist)

// 初始化 Pinia
app.use(pinia)

// 初始化路由
app.use(router)

// 初始化 Ant Design Vue
app.use(Antd)

setupI18n(app);

// 注册权限指令
app.directive('permission', permissionDirective)

// 挂载应用
app.mount('#app') 