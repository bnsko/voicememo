import { NextRequest, NextResponse } from 'next/server'
import { deleteComment } from '@/lib/redis'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const { id, commentId } = params
    await deleteComment(id, commentId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
