import { createRouter, createWebHistory,type RouteRecordRaw } from 'vue-router'

// 静态路由表
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        component: () => import('../views/index.vue')
    },
    {
        path: '/login',
        component: () => import('../views/login.vue')
    },
    {
        path: '/chat',
        component: () => import('../views/chat.vue')
    }
]

// 路由对象
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 白名单路由（无需登录）
const WHITE_LIST = ['/login']

// 路由守卫：未登录强制跳转登录页
router.beforeEach((to, _from, next) => {
    const token = localStorage.getItem('token')

    if (token) {
        // 已登录访问登录页 → 重定向到首页
        if (to.path === '/login') {
            next('/')
        } else {
            next()
        }
    } else {
        // 未登录 → 白名单放行，否则去登录页
        if (WHITE_LIST.includes(to.path)) {
            next()
        } else {
            next('/login')
        }
    }
})

export default router