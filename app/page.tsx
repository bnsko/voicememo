'use client'

import React, { useState, useEffect } from 'react'
import { MessagePanel } from '@/components/MessagePanel'
import { Message } from '@/lib/redis'

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load messages on component mount
  useEffect(() => {
    loadMessages()
    // Poll for new messages every 2 seconds
    const interval = setInterval(loadMessages, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageAdd = async (author: 'nova' | 'orion', text: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      })
      if (response.ok) {
        await loadMessages()
      }
    } catch (error) {
      console.error('Error adding message:', error)
    }
  }

  const handleMessageDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await loadMessages()
      }
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const handleCommentAdd = async (messageId: string, text: string, author: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      })
      if (response.ok) {
        await loadMessages()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleCommentDelete = async (messageId: string, commentId: string) => {
    if (confirm('Delete this comment permanently?')) {
      try {
        const response = await fetch(`/api/messages/${messageId}/comments/${commentId}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          await loadMessages()
        }
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#06070d]">
        <div className="text-center text-zinc-300">
          <h1 className="font-heading text-3xl tracking-[0.14em] text-zinc-100">VOICE MEMO</h1>
          <p className="mt-2 text-sm uppercase tracking-[0.12em] text-zinc-500">Loading stream</p>
        </div>
      </div>
    )
  }

  return (
    <main className="h-screen w-screen overflow-hidden bg-[#06070d] text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(34,211,238,0.08),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(251,191,36,0.08),transparent_40%)]" />
      <div className="relative grid h-full grid-cols-2">
        <div className="flex flex-col border-r border-white/15">
          <MessagePanel
            author="nova"
            displayName="Nova Kade"
            messages={messages}
            onMessageAdd={(text) => handleMessageAdd('nova', text)}
            onMessageDelete={handleMessageDelete}
            onCommentAdd={(messageId, text, author) => handleCommentAdd(messageId, text, author)}
            onCommentDelete={handleCommentDelete}
          />
        </div>

        <div className="flex flex-col">
          <MessagePanel
            author="orion"
            displayName="Orion Vale"
            messages={messages}
            onMessageAdd={(text) => handleMessageAdd('orion', text)}
            onMessageDelete={handleMessageDelete}
            onCommentAdd={(messageId, text, author) => handleCommentAdd(messageId, text, author)}
            onCommentDelete={handleCommentDelete}
          />
        </div>
      </div>
    </main>
  )
}
