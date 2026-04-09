import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

export interface Message {
  id: string
  author: 'nova' | 'orion'
  text: string
  timestamp: number
  createdAt: string
  comments: Comment[]
}

export interface Comment {
  id: string
  author: string
  text: string
  timestamp: number
  createdAt: string
}

export async function getMessages(): Promise<Message[]> {
  try {
    const raw = await redis.get('voicememo:messages')
    if (!raw) return []
    const messages = JSON.parse(raw as string) as Message[]
    return messages.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return []
  }
}

export async function saveMessage(message: Message): Promise<void> {
  try {
    const messages = await getMessages()
    messages.unshift(message)
    await redis.set('voicememo:messages', JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving message:', error)
  }
}

export async function deleteMessage(messageId: string): Promise<void> {
  try {
    const messages = await getMessages()
    const filtered = messages.filter(m => m.id !== messageId)
    await redis.set('voicememo:messages', JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting message:', error)
  }
}

export async function addComment(messageId: string, comment: Comment): Promise<void> {
  try {
    const messages = await getMessages()
    const message = messages.find(m => m.id === messageId)
    if (message) {
      if (!message.comments) message.comments = []
      message.comments.push(comment)
      await redis.set('voicememo:messages', JSON.stringify(messages))
    }
  } catch (error) {
    console.error('Error adding comment:', error)
  }
}

export async function deleteComment(messageId: string, commentId: string): Promise<void> {
  try {
    const messages = await getMessages()
    const message = messages.find(m => m.id === messageId)
    if (message && message.comments) {
      message.comments = message.comments.filter(c => c.id !== commentId)
      await redis.set('voicememo:messages', JSON.stringify(messages))
    }
  } catch (error) {
    console.error('Error deleting comment:', error)
  }
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
