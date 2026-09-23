<template>
  <div class="chat-container">
    <div class="chat-layout">
      <!-- 左侧：会话历史侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <el-button type="primary" class="new-session-btn" @click="createNewSession">
            <Plus />
            <span>新对话</span>
          </el-button>
        </div>

        <div class="session-list">
          <div
            v-for="item in sessions"
            :key="item.sessionId"
            :class="['session-item', { active: item.sessionId === sessionId }]"
            @click="switchSession(item.sessionId)"
          >
            <div class="session-info">
              <div class="session-title">{{ item.title }}</div>
              <div class="session-meta">
                <span>{{ item.messageCount || 0 }} 条消息</span>
                <span>{{ formatTime(item.updateTime) }}</span>
              </div>
            </div>
            <el-popconfirm title="确定删除该会话？" @confirm="handleDeleteSession(item.sessionId)">
              <template #reference>
                <el-button text class="delete-btn" @click.stop>
                  <Delete />
                </el-button>
              </template>
            </el-popconfirm>
          </div>

          <div v-if="sessions.length === 0" class="empty-sessions">
            暂无历史会话
          </div>
        </div>
      </aside>

      <!-- 右侧：聊天区 -->
      <section class="chat-main">
        <header class="chat-header">
          <h2 class="header-title">AI 在线咨询</h2>
          <el-tooltip content="清空当前对话" placement="left">
            <el-button text class="clear-btn" @click="createNewSession">
              <Plus />
            </el-button>
          </el-tooltip>
        </header>

        <main class="chat-content">
          <div class="message-list" ref="messageList">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              :class="['message-item', msg.role]"
            >
              <div class="avatar">
                <User v-if="msg.role === 'user'" />
                <Cpu v-else />
              </div>
              <div class="message-content">
                <div class="message-text">
                  <span v-for="(part, i) in formatMessage(msg.content)" :key="i">
                    <code v-if="part.type === 'code'" :class="'language-' + part.lang">
                      <pre>{{ part.content }}</pre>
                    </code>
                    <span v-else>{{ part.content }}</span>
                  </span>
                </div>
                <div v-if="msg.role === 'assistant' && msg.loading" class="loading">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer class="chat-footer">
          <el-form :model="formData" @submit.prevent="sendMessage">
            <div class="input-group">
              <el-input
                v-model="formData.message"
                type="textarea"
                :rows="2"
                placeholder="请输入您的问题..."
                resize="none"
                @keyup.enter.exact="handleEnter"
              />
              <el-button
                type="primary"
                :loading="isLoading"
                @click="sendMessage"
                :disabled="!formData.message.trim() || isLoading"
              >
                <Search />
              </el-button>
            </div>
          </el-form>
        </footer>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Cpu, Search, Delete, Plus } from '@element-plus/icons-vue'
import {
  startPsychologicalSession,
  chatStream,
  listPsychologicalSessions,
  getSessionMessages,
  upsertSession,
  removeSession,
  saveSessionMessages,
  type SessionInfo,
  type SessionListItem
} from '../../api/psychological'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Message extends ChatMessage {
  loading?: boolean
}

const CURRENT_SESSION_KEY = 'psychological_current_session'

const messages = ref<Message[]>([
  { role: 'assistant', content: '您好！我是心理 AI 助手，请开始您的对话～' }
])

const formData = reactive({ message: '' })
const isLoading = ref(false)
const messageList = ref<HTMLElement | null>(null)
const abortController = ref<AbortController | null>(null)

// 当前会话 ID（持久化到 localStorage，刷新页面不丢失）
const sessionId = ref<string>(localStorage.getItem(CURRENT_SESSION_KEY) || '')

// 会话历史列表
const sessions = ref<SessionListItem[]>([])

const formatMessage = (content: string) => {
  const parts: { type: string; content: string; lang?: string }[] = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'code', content: match[2].trim(), lang: match[1] || 'text' })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) })
  }

  return parts.length > 0 ? parts : [{ type: 'text', content }]
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight
  }
}

// ========== 会话历史加载 / 切换 / 删除 ==========

const loadSessions = async () => {
  sessions.value = await listPsychologicalSessions()
}

const loadSessionMessages = async (sid: string) => {
  const list = await getSessionMessages(sid)
  if (list.length > 0) {
    messages.value = list as Message[]
  } else {
    messages.value = [{ role: 'assistant', content: '您好！我是心理 AI 助手，请开始您的对话～' }]
  }
  await scrollToBottom()
}

const switchSession = async (sid: string) => {
  if (sid === sessionId.value) return
  sessionId.value = sid
  await loadSessionMessages(sid)
}

const handleDeleteSession = async (sid: string) => {
  removeSession(sid)
  await loadSessions()
  if (sid === sessionId.value) {
    createNewSession()
  }
}

// ========== 新建会话 ==========

const createNewSession = () => {
  sessionId.value = ''
  messages.value = [{ role: 'assistant', content: '已开启新会话，请开始您的对话～' }]
  localStorage.removeItem(CURRENT_SESSION_KEY)
}

// ========== 发送消息 ==========

const sendMessage = async () => {
  const content = formData.message.trim()
  if (!content || isLoading.value) return

  messages.value.push({ role: 'user', content })
  messages.value.push({ role: 'assistant', content: '', loading: true })

  formData.message = ''
  await scrollToBottom()

  isLoading.value = true
  const assistantMsg = messages.value[messages.value.length - 1]

  try {
    // 1) 首次发送：调用 start 创建新会话
    if (!sessionId.value) {
      const title = content.length > 20 ? content.slice(0, 20) + '...' : content
      const res = await startPsychologicalSession({
        initialMessage: content,
        sessionTitle: title
      })
      const info: SessionInfo = (res.data as SessionInfo) || {}
      if (!info.sessionId) {
        throw new Error('创建会话失败，未返回 sessionId')
      }
      sessionId.value = info.sessionId
      // 写入会话列表
      upsertSession({
        sessionId: info.sessionId,
        title: info.sessionTitle || title,
        lastMessage: content,
        updateTime: Date.now(),
        messageCount: 1
      })
      await loadSessions()
    } else {
      // 已有会话：更新最后一条消息
      upsertSession({
        sessionId: sessionId.value,
        title: sessions.value.find(s => s.sessionId === sessionId.value)?.title || 'AI 对话',
        lastMessage: content,
        updateTime: Date.now()
      })
      await loadSessions()
    }

    // 2) 发送消息并获取 AI 回复（流式）
    if (abortController.value) {
      abortController.value.abort()
    }
    const controller = new AbortController()
    abortController.value = controller

    let fullReply = ''
    await chatStream(
      { sessionId: sessionId.value, userMessage: content },
      {
        onMessage: (chunk: string) => {
          fullReply += chunk
          assistantMsg.content = fullReply
          scrollToBottom()
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : '请求失败'
          assistantMsg.content = `抱歉，${msg}`
          assistantMsg.loading = false
          isLoading.value = false
          scrollToBottom()
        },
        onComplete: () => {
          assistantMsg.loading = false
          isLoading.value = false
          // 持久化当前会话消息
          saveSessionMessages(sessionId.value, messages.value)
          // 更新会话列表
          upsertSession({
            sessionId: sessionId.value,
            title: sessions.value.find(s => s.sessionId === sessionId.value)?.title || 'AI 对话',
            lastMessage: fullReply,
            updateTime: Date.now(),
            messageCount: messages.value.filter(m => m.role === 'user').length
          })
          loadSessions()
          scrollToBottom()
        },
        signal: controller.signal
      }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '请求失败'
    if (msg.includes('暂未接入')) {
      ElMessage.info(msg)
      // 发送消息接口未接入时，先占位回复并持久化会话（列表有记录）
      assistantMsg.content = '（AI 回复接口待后端接入）'
      assistantMsg.loading = false
      isLoading.value = false
      saveSessionMessages(sessionId.value, messages.value)
      await scrollToBottom()
    } else {
      assistantMsg.content = `抱歉，${msg}`
      assistantMsg.loading = false
      isLoading.value = false
      await scrollToBottom()
    }
  }
}

const handleEnter = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// ========== 工具 ==========

const formatTime = (t?: number) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  const yesterday = new Date(now.getTime() - 86400000)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ========== 生命周期 ==========

// 监听 sessionId 变化，持久化
watch(sessionId, (val) => {
  if (val) {
    localStorage.setItem(CURRENT_SESSION_KEY, val)
  } else {
    localStorage.removeItem(CURRENT_SESSION_KEY)
  }
})

onMounted(async () => {
  await loadSessions()
  // 如果刷新前有会话，自动加载消息记录
  if (sessionId.value) {
    await loadSessionMessages(sessionId.value)
  }
  await scrollToBottom()
})
</script>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

/* 左右两栏布局 */
.chat-layout {
  flex: 1;
  display: flex;
  min-height: 0;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

/* 侧边栏 */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.new-session-btn {
  width: 100%;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;
  position: relative;
}

.session-item:hover {
  background: #f0f2f5;
}

.session-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.session-item.active .delete-btn {
  color: #fff;
}

.session-info {
  flex: 1;
  min-width: 0;
}

.session-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.session-meta {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
  display: flex;
  gap: 8px;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.15s;
  color: #999;
}

.session-item:hover .delete-btn {
  opacity: 1;
}

.empty-sessions {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 32px 0;
}

/* 右侧聊天区 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #fff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.clear-btn {
  color: #fff;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  display: flex;
  gap: 12px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 16px 4px 16px 16px;
}

.message-item.assistant .message-content {
  background: #f5f7fa;
  color: #333;
  border-radius: 4px 16px 16px 16px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.user .avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.assistant .avatar {
  background: #e8eef5;
}

.message-content {
  max-width: 75%;
  padding: 12px 16px;
}

.message-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-text code {
  display: block;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
}

.message-text code pre {
  margin: 0;
  white-space: pre;
}

.loading {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #999;
  border-radius: 50%;
  animation: loading 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.chat-footer {
  padding: 16px 24px;
  background: #fff;
  border-top: 1px solid #eee;
}

.input-group {
  display: flex;
  gap: 12px;
}

.input-group :deep(.el-textarea) {
  flex: 1;
}

.input-group :deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
}

.input-group :deep(.el-button) {
  align-self: flex-end;
  border-radius: 12px;
  padding: 8px 20px;
}

/* 响应式：窄屏隐藏侧边栏 */
@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}
</style>
