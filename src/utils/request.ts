import axios, { AxiosError } from 'axios'
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// 响应数据结构
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 创建 axios 实例
const service = axios.create({
  // baseURL: import.meta.env.VITE_API_BASE_URL as string, // 从环境变量获取
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// -------------------- 请求拦截器 --------------------
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// -------------------- 响应拦截器 --------------------
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 文件流直接返回
    if (response.config.responseType === 'blob') {
      return response
    }

    // 业务状态码判断
    if (data.code === 200) {
      return data as any
    }

    // token 过期处理
    if (data.code === 401) {
      localStorage.removeItem('token')
      // 跳转登录页（可按需调整路由路径）
      // router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
      return Promise.reject(new Error(data.message || 'token 已过期'))
    }

    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error: AxiosError) => {
    const message = error.message || '网络异常'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
