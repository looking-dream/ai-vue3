import request from '../utils/request'

// ========== 心理会话相关类型 ==========

export interface SessionInfo {
  sessionId?: string
  userHash?: number | string
  initialMessage?: string
  startTime?: number
  expiryTime?: number
  status?: string
  messageCount?: number
  // 本地扩展：标题（start 时由 sessionTitle 传入）
  sessionTitle?: string
  [key: string]: unknown
}

export interface SessionStartPayload {
  initialMessage: string
  sessionTitle?: string
}

export interface SessionStartResponse {
  code?: number | string
  msg?: string
  message?: string
  success?: boolean
  data?: SessionInfo
}

export interface ChatMessagePayload {
  sessionId: string
  message: string
  [key: string]: unknown
}

export interface StreamOptions {
  onMessage: (chunk: string) => void
  onError: (err: unknown) => void
  onComplete: () => void
  signal?: AbortSignal
}

// 侧边栏会话项（列表展示用）
export interface SessionListItem {
  sessionId: string
  title: string
  lastMessage?: string
  updateTime?: number
  messageCount?: number
}

// ========== 接口封装 ==========

/**
 * 心理会话 - 创建新会话（发送首条消息并创建会话）
 * POST /psychological-chat/session/start
 */
export const startPsychologicalSession = (payload: SessionStartPayload) =>
  request.post<SessionStartResponse>('/psychological-chat/session/start', payload)

/**
 * 心理会话 - 在会话中发送消息（后端接口待补充）
 */
export const sendPsychologicalMessage = (_payload: ChatMessagePayload) => {
  // TODO: 后端接口待补充
  return Promise.reject(new Error('发送消息接口暂未接入，请提供后端接口地址'))
}

/**
 * 心理会话 - 流式对话接口（SSE）
 * POST /psychological-chat/stream
 */
export const chatStream = async (
  payload: ChatMessagePayload,
  options: StreamOptions
) => {
  const { onMessage, onError, onComplete, signal } = options

  try {
    const token = localStorage.getItem('token')
    const response = await fetch('/api/psychological-chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        ...(token ? { token } : {})
      },
      body: JSON.stringify(payload),
      signal
    })

    if (!response.ok) {
      const msg = `HTTP ${response.status}: ${response.statusText}`
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('roleType')
        localStorage.removeItem('nickname')
        ElMessage.error('登录已过期，请重新登录')
      }
      throw new Error(msg)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('响应流不可读')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    const tryParseMessage = (text: string): { content: string; rest: string } | null => {
      const prefix = 'event:message'
      const start = text.indexOf(prefix)
      if (start === -1) return null

      const braceOpen = text.indexOf('{', start)
      if (braceOpen === -1) return null

      let depth = 0
      for (let i = braceOpen; i < text.length; i++) {
        if (text[i] === '{') depth++
        else if (text[i] === '}') {
          depth--
          if (depth === 0) {
            const jsonStr = text.slice(braceOpen, i + 1)
            try {
              const data = JSON.parse(jsonStr)
              const content = data?.data?.content
              if (typeof content === 'string') {
                return { content, rest: text.slice(i + 1) }
              }
            } catch {
              return null
            }
          }
        }
      }
      return null
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        onComplete()
        return
      }

      buffer += decoder.decode(value, { stream: true })

      // 优先检查结束标记
      const doneIdx = buffer.indexOf('event:done')
      if (doneIdx !== -1) {
        let rest = buffer.slice(0, doneIdx)
        let result: { content: string; rest: string } | null
        while ((result = tryParseMessage(rest))) {
          onMessage(result.content)
          rest = result.rest
        }
        onComplete()
        return
      }

      // 持续提取完整消息
      let result: { content: string; rest: string } | null
      while ((result = tryParseMessage(buffer))) {
        onMessage(result.content)
        buffer = result.rest
      }
    }
  } catch (err) {
    onError(err)
  }
}

/**
 * 心理会话 - 获取当前用户的会话历史列表（后端接口待补充）
 * 暂用 localStorage 本地持久化，后端接口到位后直接替换实现
 */
export const listPsychologicalSessions = async (): Promise<SessionListItem[]> => {
  // TODO: 后端接口：GET /psychological-chat/session/list
  // return request.get('/psychological-chat/session/list').then(res => res.data)
  const raw = localStorage.getItem('psychological_sessions')
  if (!raw) return []
  try {
    const list = JSON.parse(raw) as SessionListItem[]
    // 按更新时间倒序
    return list.sort((a, b) => (b.updateTime || 0) - (a.updateTime || 0))
  } catch {
    return []
  }
}

/**
 * 心理会话 - 获取某个会话的消息详情（后端接口待补充）
 * 暂用 localStorage 本地持久化
 */
export const getSessionMessages = async (sessionId: string) => {
  // TODO: 后端接口：GET /psychological-chat/session/{sessionId}/messages
  const raw = localStorage.getItem(`psychological_msgs_${sessionId}`)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// ========== 本地持久化辅助（后端接口到位后可删除） ==========

const SESSIONS_KEY = 'psychological_sessions'

export const saveSessionList = (list: SessionListItem[]) => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list))
}

export const upsertSession = (item: SessionListItem) => {
  const list = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') as SessionListItem[]
  const idx = list.findIndex(s => s.sessionId === item.sessionId)
  item.updateTime = item.updateTime || Date.now()
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...item }
  } else {
    list.unshift(item)
  }
  saveSessionList(list)
}

export const removeSession = (sessionId: string) => {
  const list = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') as SessionListItem[]
  saveSessionList(list.filter(s => s.sessionId !== sessionId))
  localStorage.removeItem(`psychological_msgs_${sessionId}`)
}

export const saveSessionMessages = (sessionId: string, messages: unknown[]) => {
  localStorage.setItem(`psychological_msgs_${sessionId}`, JSON.stringify(messages))
}
