import { NextRequest, NextResponse } from 'next/server'
import { addComment, Comment, generateId, formatDateTime } from '@/lib/redis'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id
    const body = await request.json()
    const { author, text } = body

    if (!author || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const comment: Comment = {
      id: generateId(),
      author,
      text,
      timestamp: Date.now(),
      createdAt: formatDateTime(Date.now()),
    }

    await addComment(messageId, comment)

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
