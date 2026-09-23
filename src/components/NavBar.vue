<template>
    <header class="navbar">
        <div class="navbar-inner">
            <!-- Logo -->
            <div class="logo" @click="router.push('/')">AI 智能助手</div>

            <!-- 菜单：首页、AI咨询、日记、知识库（登录后才显示） -->
            <nav v-if="isLogin" class="menu">
                <div
                    v-for="item in currentMenus"
                    :key="item.path"
                    :class="['menu-item', { active: isActive(item.path) }]"
                    @click="router.push(item.path)"
                >
                    {{ item.label }}
                </div>
            </nav>

            <!-- 右侧：已登录显示昵称+退出，未登录显示登录/注册 -->
            <div class="nav-actions">
                <template v-if="isLogin">
                    <span class="welcome">你好，{{ nickname || '用户' }}</span>
                    <el-button text type="danger" @click="handleLogout">退出</el-button>
                </template>
                <template v-else>
                    <el-button text @click="router.push('/login')">登录</el-button>
                    <el-button type="primary" round @click="router.push('/register')">注册</el-button>
                </template>
            </div>
        </div>
    </header>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getCurrentUserOnce } from '../api/user'

interface MenuItem {
    label: string
    path: string
}

// 静态菜单数据无需响应式
const menus: MenuItem[] = [
    { label: '首页', path: '/' },
    { label: 'AI咨询', path: '/consultation' },
    { label: '日记', path: '/diary' },
    { label: '知识库', path: '/knowledge' }
]

// 管理员额外显示后台管理菜单
const adminMenus: MenuItem[] = [
    ...menus,
    { label: '后台管理', path: '/admin' }
]

const route = useRoute()
const router = useRouter()

// 响应式状态，路由变化时刷新
const isLogin = ref(!!localStorage.getItem('token'))
const roleType = ref(Number(localStorage.getItem('roleType') || 0))
const nickname = ref(localStorage.getItem('nickname') || '')

// 根据角色返回当前应显示的菜单
const currentMenus = computed(() => (roleType.value === 2 ? adminMenus : menus))

const isActive = (path: string) => route.path === path

// 从 localStorage 刷新状态
const refreshUserState = () => {
    isLogin.value = !!localStorage.getItem('token')
    roleType.value = Number(localStorage.getItem('roleType') || 0)
    nickname.value = localStorage.getItem('nickname') || ''
}

// 路由变化时刷新登录态，保证登录/退出后 NavBar 立即更新
watch(() => route.path, refreshUserState, { immediate: true })

// 页面刷新/组件挂载时拉取最新用户信息
onMounted(async () => {
    if (!isLogin.value) return

    try {
        const user = await getCurrentUserOnce()
        if (user.nickname) {
            nickname.value = user.nickname
        }
    } catch {
        // 获取失败（如 token 过期）保持本地缓存，不阻断页面
    }
})

const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('roleType')
    localStorage.removeItem('nickname')
    ElMessage.success('已退出登录')
    router.push('/login')
}
</script>

<style scoped>
.navbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.navbar-inner {
    display: flex;
    align-items: center;
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;
    height: 60px;
}

.logo {
    font-size: 20px;
    font-weight: 700;
    color: #409eff;
    cursor: pointer;
    white-space: nowrap;
}

.menu {
    display: flex;
    gap: 8px;
    flex: 1;
}

.menu-item {
    padding: 6px 16px;
    font-size: 15px;
    color: #606266;
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s;
}

.menu-item:hover {
    color: #409eff;
    background: #ecf5ff;
}

.menu-item.active {
    color: #409eff;
    background: #ecf5ff;
    font-weight: 600;
}

.nav-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    white-space: nowrap;
}

.welcome {
    font-size: 14px;
    color: #606266;
    margin-right: 8px;
}

@media (max-width: 768px) {
    .navbar-inner {
        gap: 16px;
        padding: 0 16px;
    }

    .menu-item {
        padding: 6px 10px;
        font-size: 14px;
    }

    .welcome {
        display: none;
    }
}
</style>
