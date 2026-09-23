<template>
  <div class="register-container">
    <!-- 返回首页（右上角，图标按钮） -->
    <el-button class="back-home" text :icon="ArrowLeft" @click="router.push('/')">
      返回首页
    </el-button>

    <!-- 左侧：助手介绍 -->
    <div class="intro">
      <h1>你的 AI 智能助手</h1>
      <p>
        随时随地为你解答问题、辅助写作、生成创意。
        注册后即可开启专属对话，体验高效智能的 AI 服务。
      </p>
      <img
        class="intro-img"
        src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=futuristic%20AI%20assistant%20robot%20illustration%2C%20friendly%20chatbot%20character%2C%20soft%20blue%20and%20purple%20gradient%20background%2C%20clean%20modern%20tech%20style%2C%20high%20quality%20digital%20art&image_size=portrait_4_3"
        alt="AI 助手"
      />
    </div>

    <!-- 右侧：注册表单 -->
    <div class="form-side">
      <el-card class="register-card">
        <template #header>
          <h2 class="register-title">注册账号</h2>
        </template>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
          size="large"
          @keyup.enter="handleRegister"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input
              v-model="formData.email"
              placeholder="请输入邮箱"
              :prefix-icon="Message"
            />
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="formData.nickname"
              placeholder="请输入昵称（选填）"
              :prefix-icon="Avatar"
            />
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input
              v-model="formData.phone"
              placeholder="请输入手机号（选填）"
              :prefix-icon="Iphone"
              maxlength="11"
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="formData.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              :prefix-icon="Lock"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="register-btn"
              @click="handleRegister"
            >
              {{ loading ? '注册中...' : '注 册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="to-login">
          已有账号？<el-link type="primary" @click="router.push('/login')">去登录</el-link>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Message, Avatar, Iphone, Lock, ArrowLeft } from '@element-plus/icons-vue'
import { register } from '../../api/user'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  password: '',
  confirmPassword: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为 3-20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  nickname: [
    { max: 20, message: '昵称最多 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为 6-20 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== formData.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await register({
      username: formData.username,
      email: formData.email,
      nickname: formData.nickname,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    })

    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    // 错误已在 request 拦截器中统一处理
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  position: relative;
  display: flex;
  height: 100%;
  background: #f0f2f5;
}

/* 返回首页图标按钮（右上角） */
.back-home {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
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

/* 右侧注册区 */
.form-side {
  width: 520px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
}

.register-card {
  width: 400px;
  border: none;
  box-shadow: none;
}

.register-title {
  text-align: center;
  margin: 0;
}

.register-btn {
  width: 100%;
}

.to-login {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

@media (max-width: 768px) {
  .register-container {
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
