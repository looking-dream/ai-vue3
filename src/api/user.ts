import request from '../utils/request'

// 用户信息
export interface UserInfo {
  id?: number
  username?: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  roleType?: number | string
  [key: string]: unknown
}

// 注册
export const register = (data: {
  username: string
  email: string
  nickname?: string
  phone?: string
  password: string
  confirmPassword: string
}) => request.post('/user/add', data)

// 登录
export const login = (data: { username: string; password: string }) =>
  request.post('/user/login', data)

// 获取当前登录用户信息
export const getCurrentUser = () => request.get('/user/current')

// 缓存本次请求，避免组件重复挂载（路由切换）时多次请求
let currentUserPromise: Promise<UserInfo> | null = null

/**
 * 获取当前用户信息（每次页面刷新只请求一次，路由切换复用结果）
 * 页面刷新后模块重新加载，会重新发起请求
 */
export const getCurrentUserOnce = (): Promise<UserInfo> => {
  if (!currentUserPromise) {
    currentUserPromise = getCurrentUser()
      .then(res => {
        const user: UserInfo = res.data || {}
        if (user.nickname) {
          localStorage.setItem('nickname', user.nickname)
        }
        if (user.roleType !== undefined && user.roleType !== null) {
          localStorage.setItem('roleType', String(user.roleType))
        }
        return user
      })
      .catch(err => {
        // 失败后清空缓存，下次挂载可重试
        currentUserPromise = null
        throw err
      })
  }
  return currentUserPromise
}
