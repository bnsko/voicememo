import { NextRequest, NextResponse } from 'next/server'
import { getMessages, saveMessage, Message, generateId, formatDateTime } from '@/lib/redis'

export async function GET() {
  try {
    const messages = await getMessages()
    return NextResponse.json(messages)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { author, text } = body

    if (!author || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const message: Message = {
      id: generateId(),
      author,
      text,
      timestamp: Date.now(),
      createdAt: formatDateTime(Date.now()),
      comments: [],
    }

    await saveMessage(message)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}
