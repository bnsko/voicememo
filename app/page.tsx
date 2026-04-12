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

  const handleMessageAdd = async (author: 'clovek_vyssi' | 'clovek_nizsi', text: string) => {
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, text }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to publish note' }))
        throw new Error(err.error || 'Failed to publish note')
      }
      await loadMessages()
    } catch (error) {
      console.error('Error adding message:', error)
      alert('Publishing failed. Check server/API logs and Redis credentials.')
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
    <main className="relative min-h-screen overflow-hidden bg-[#030405] text-zinc-100">
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(86,171,110,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(86,171,110,0.55)_1px,transparent_1px)] [background-size:36px_36px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(67,121,80,0.2),transparent_48%),linear-gradient(180deg,rgba(0,0,0,0.45),transparent_22%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 pb-6 pt-8 lg:px-10">
        <header className="mb-6 rounded-2xl border border-white/10 bg-black/35 px-6 py-4 backdrop-blur-sm">
          <p className="font-heading text-xl uppercase tracking-[0.18em] text-zinc-100">Private archive</p>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex min-h-[calc(100vh-13rem)] flex-col">
            <MessagePanel
              author="clovek_vyssi"
              displayName="človek vyšší"
              messages={messages}
              onMessageAdd={(text) => handleMessageAdd('clovek_vyssi', text)}
              onMessageDelete={handleMessageDelete}
              onCommentAdd={(messageId, text, author) => handleCommentAdd(messageId, text, author)}
              onCommentDelete={handleCommentDelete}
            />
          </div>

          <div className="flex min-h-[calc(100vh-13rem)] flex-col">
            <MessagePanel
              author="clovek_nizsi"
              displayName="človek nižší"
              messages={messages}
              onMessageAdd={(text) => handleMessageAdd('clovek_nizsi', text)}
              onMessageDelete={handleMessageDelete}
              onCommentAdd={(messageId, text, author) => handleCommentAdd(messageId, text, author)}
              onCommentDelete={handleCommentDelete}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
