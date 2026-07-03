<template>
  <div class="chat-container">
    <el-container class="chat-wrapper">
      <el-header class="chat-header">
        <h2 class="header-title">DeepSeek AI 助手</h2>
        <el-button type="text" @click="clearChat">
          <Delete />
        </el-button>
      </el-header>

      <el-main class="chat-content">
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
      </el-main>

      <el-footer class="chat-footer">
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
      </el-footer>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { User, Cpu, Search, Delete } from '@element-plus/icons-vue'
import { chatWithAIStream, type ChatMessage } from '@/api/deepseek'

interface Message extends ChatMessage {
  loading?: boolean
}

const messages = ref<Message[]>([
  {
    role: 'assistant',
    content: '您好！我是 DeepSeek AI 助手，请问有什么可以帮助您的？'
  }
])

const formData = reactive({
  message: ''
})

const isLoading = ref(false)
const messageList = ref<HTMLElement | null>(null)

const formatMessage = (content: string) => {
  const parts: { type: string; content: string; lang?: string }[] = []
  const regex = /```(\w+)?\n([\s\S]*?)```/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) })
    }
    parts.push({
      type: 'code',
      content: match[2].trim(),
      lang: match[1] || 'text'
    })
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

const sendMessage = async () => {
  const content = formData.message.trim()
  if (!content || isLoading.value) return

  messages.value.push({ role: 'user', content })
  messages.value.push({ role: 'assistant', content: '', loading: true })

  formData.message = ''
  await scrollToBottom()

  isLoading.value = true
  const userMessages: ChatMessage[] = messages.value.map(m => ({
    role: m.role,
    content: m.content
  }))

  const assistantMsg = messages.value[messages.value.length - 1]

  try {
    await chatWithAIStream(
      userMessages,
      (chunk) => {
        assistantMsg.content += chunk
      },
      () => {
        assistantMsg.loading = false
        isLoading.value = false
        scrollToBottom()
      }
    )
  } catch {
    assistantMsg.content = '抱歉，请求失败，请稍后重试。'
    assistantMsg.loading = false
    isLoading.value = false
    scrollToBottom()
  }
}

const handleEnter = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

const clearChat = () => {
  messages.value = [
    {
      role: 'assistant',
      content: '您好！我是 DeepSeek AI 助手，请问有什么可以帮助您的？'
    }
  ]
}

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  background: #f5f7fa;
}

.chat-wrapper {
  width: 100%;
  max-width: 800px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
</style>
