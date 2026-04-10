import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ''
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ''

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
})

export interface Message {
  id: string
  author: 'paul' | 'sylvanas'
  text: string
  timestamp: number
  createdAt: string
  comments: Comment[]
}

function assertRedisConfigured() {
  if (!redisUrl || !redisToken) {
    throw new Error('Redis is not configured: UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN are required.')
  }
}

export interface Comment {
  id: string
  author: string
  text: string
  timestamp: number
  createdAt: string
}

function normalizeAuthor(value: unknown): 'paul' | 'sylvanas' {
  if (value === 'sylvanas' || value === 'minsc' || value === 'orion' || value === 'peto') {
    return 'sylvanas'
  }

  return 'paul'
}

function mapMessageShape(message: any): Message {
  return {
    ...message,
    author: normalizeAuthor(message?.author),
    comments: Array.isArray(message?.comments) ? message.comments : [],
  }
}

function normalizeMessages(raw: unknown): Message[] {
  if (!raw) return []

  if (typeof raw === 'string') {
    const parsed = JSON.parse(raw) as Message[]
    return Array.isArray(parsed) ? parsed.map(mapMessageShape) : []
  }

  if (Array.isArray(raw)) {
    return (raw as any[]).map(mapMessageShape)
  }

  return []
}

export async function getMessages(): Promise<Message[]> {
  assertRedisConfigured()
  const raw = await redis.get('voicememo:messages')
  const messages = normalizeMessages(raw)
  return messages.sort((a, b) => b.timestamp - a.timestamp)
}

export async function saveMessage(message: Message): Promise<void> {
  const messages = await getMessages()
  messages.unshift(message)
  await redis.set('voicememo:messages', messages)
}

export async function deleteMessage(messageId: string): Promise<void> {
  const messages = await getMessages()
  const filtered = messages.filter(m => m.id !== messageId)
  await redis.set('voicememo:messages', filtered)
}

export async function addComment(messageId: string, comment: Comment): Promise<void> {
  const messages = await getMessages()
  const message = messages.find(m => m.id === messageId)
  if (!message) {
    throw new Error('Message not found')
  }

  if (!message.comments) message.comments = []
  message.comments.push(comment)
  await redis.set('voicememo:messages', messages)
}

export async function deleteComment(messageId: string, commentId: string): Promise<void> {
  const messages = await getMessages()
  const message = messages.find(m => m.id === messageId)
  if (!message || !message.comments) {
    throw new Error('Message or comments not found')
  }

  message.comments = message.comments.filter(c => c.id !== commentId)
  await redis.set('voicememo:messages', messages)
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
