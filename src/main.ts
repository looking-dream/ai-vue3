import { createApp } from 'vue'
import FcDesigner from '@form-create/designer';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import './style.css'
import App from './App.vue'
import router from './router'


const app = createApp(App)
 
// 启用路由
app.use(router)
app.use(ElementPlus)
app.use(FcDesigner)
app.use(FcDesigner.formCreate)
 
app.mount('#app')