import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 静态路由表
const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        component: () => import('../views/index.vue')
    },
    {
        path: '/login',
        component: () => import('../views/login/login.vue')
    },
    {
        path: '/register',
        component: () => import('../views/login/register.vue')
    },
    {
        path: '/consultation',
        component: () => import('../views/assistant/consultation.vue')
    },
    {
        path: '/diary',
        component: () => import('../views/assistant/diary.vue')
    },
    {
        path: '/knowledge',
        component: () => import('../views/assistant/knowledge.vue')
    },
    {
        path: '/admin',
        component: () => import('../views/admin/admin.vue')
    }
]

// 路由对象
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 白名单路由（无需登录，首页默认放行）
const WHITE_LIST = ['/', '/login', '/register']

// 路由守卫：只有访问非首页时才校验登录态
router.beforeEach((to, _from, next) => {
    // 首页和白名单直接放行，不校验 token
    if (WHITE_LIST.includes(to.path)) {
        next()
        return
    }

    const token = localStorage.getItem('token')
    if (!token) {
        // 未登录访问其他页面 → 拦截到登录页
        next('/login')
        return
    }

    // 后台管理页仅管理员可访问（与 login.vue 中 roleType === 2 保持一致）
    if (to.path === '/admin' && Number(localStorage.getItem('roleType')) !== 2) {
        next('/')
        return
    }

    next()
})

export default router
