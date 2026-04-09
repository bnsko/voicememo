import { NextRequest, NextResponse } from 'next/server'
import { deleteMessage, getMessages } from '@/lib/redis'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    await deleteMessage(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
  }
}
