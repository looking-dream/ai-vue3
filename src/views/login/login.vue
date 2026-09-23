<template>
  <div class="login-container">
    <!-- 左侧：助手介绍 -->
    <div class="intro">
      <h1>你的 AI 智能助手</h1>
      <p>
        随时随地为你解答问题、辅助写作、生成创意。
        登录后即可开启专属对话，体验高效智能的 AI 服务。
      </p>
      <img
        class="intro-img"
        src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20AI%20assistant%20robot%20illustration%2C%20friendly%20chatbot%20character%2C%20soft%20blue%20and%20purple%20gradient%20background%2C%20clean%20modern%20tech%20style%2C%20high%20quality%20digital%20art&image_size=portrait_4_3"
        alt="AI 助手"
      />
    </div>

    <!-- 返回首页（右上角） -->
    <el-button class="back-home" text :icon="ArrowLeft" @click="router.push('/')">
      返回首页
    </el-button>

    <!-- 右侧：登录表单 -->
    <div class="form-side">
      <el-card class="login-card">
        <template #header>
          <h2 class="login-title">系统登录</h2>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="0"
          size="large"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入账号"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="to-register">
          还没有账号？<el-link type="primary" @click="router.push('/register')">去注册</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, ArrowLeft } from '@element-plus/icons-vue'
import { login, getCurrentUser, type UserInfo } from '../../api/user'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  username: 'admin',
  password: '123456'
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login({
      username: formData.username,
      password: formData.password
    })

    // 保存 token
    const token = res.data?.token
    if (token) {
      localStorage.setItem('token', token)
    }

    // 登录成功后获取用户信息
    let roleType = res.data?.roleType
    try {
      const userRes = await getCurrentUser()
      const user: UserInfo = userRes.data || {}
      if (user.roleType !== undefined && user.roleType !== null) {
        roleType = user.roleType
        localStorage.setItem('roleType', String(user.roleType))
      }
      if (user.nickname) {
        localStorage.setItem('nickname', user.nickname)
      }
    } catch {
      // 获取用户信息失败不阻断登录流程
    }

    ElMessage.success('登录成功')
    // 根据角色跳转：管理员 → 后台管理，普通用户 → 官网首页
    if (Number(roleType) === 2) {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch {
    // 错误已在 request 拦截器中统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  height: 100%;
  background: #f0f2f5;
}

/* 返回首页按钮（右上角） */
.back-home {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
}

/* 左侧介绍区 */
.intro {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 64px;
  background: linear-gradient(135deg, #e8f1ff 0%, #f0f2f5 100%);
}

.intro h1 {
  font-size: 36px;
  margin: 0 0 16px;
  color: #303133;
}

.intro p {
  font-size: 16px;
  line-height: 1.8;
  color: #606266;
  margin: 0 0 32px;
  max-width: 480px;
}

.intro-img {
  width: 360px;
  max-width: 100%;
  border-radius: 16px;
  object-fit: cover;
}

/* 右侧登录区 */
.form-side {
  width: 480px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
}

.login-card {
  width: 360px;
  border: none;
  box-shadow: none;
}

.login-title {
  text-align: center;
  margin: 0;
}

.login-btn {
  width: 100%;
}

.to-register {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }

  .intro {
    padding: 32px;
    text-align: center;
    align-items: center;
  }

  .intro-img {
    display: none;
  }

  .form-side {
    width: 100%;
    padding: 32px 0;
  }
}
</style>
