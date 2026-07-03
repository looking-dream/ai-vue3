import axios, { type AxiosResponse } from 'axios'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatChoice {
  index: number
  message: ChatMessage
  finish_reason: string
}

export interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: ChatChoice[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export const chatWithAI = async (messages: ChatMessage[]): Promise<ChatResponse> => {
  const response: AxiosResponse<ChatResponse> = await axios({
    url: 'https://api.deepseek.com/v1/chat/completions',
    method: 'post',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: 'deepseek-chat',
      messages,
      stream: false,
      temperature: 0.7
    }
  })
  return response.data
}

export const chatWithAIStream = async (
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onComplete?: () => void
): Promise<void> => {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      stream: true,
      temperature: 0.7
    })
  })

  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      onComplete?.()
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') {
          onComplete?.()
          return
        }
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) {
            onChunk(content)
          }
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}
