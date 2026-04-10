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

  const handleMessageAdd = async (author: 'paul' | 'sylvanas', text: string) => {
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
    <main className="relative min-h-screen overflow-hidden bg-[#05060a] text-zinc-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(16,185,129,0.13),transparent_34%),radial-gradient(circle_at_85%_16%,rgba(217,70,239,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.7)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-6 pb-6 pt-8 lg:px-10">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-5 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.34em] text-zinc-500">Private Voice Archive</p>
            <h1 className="font-heading text-3xl tracking-[0.12em] text-white lg:text-4xl">Voice Memo</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              Two private channels, instant speech-to-text in Slovak, permanent history, and a darker premium presentation.
            </p>
          </div>
          <div className="flex gap-3 text-[11px] uppercase tracking-[0.18em] text-zinc-400">
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2">Upstash Connected</div>
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2">Newest First</div>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex min-h-[calc(100vh-13rem)] flex-col">
            <MessagePanel
              author="paul"
              displayName="Paul Atreides"
              messages={messages}
              onMessageAdd={(text) => handleMessageAdd('paul', text)}
              onMessageDelete={handleMessageDelete}
              onCommentAdd={(messageId, text, author) => handleCommentAdd(messageId, text, author)}
              onCommentDelete={handleCommentDelete}
            />
          </div>

          <div className="flex min-h-[calc(100vh-13rem)] flex-col">
            <MessagePanel
              author="sylvanas"
              displayName="Sylvanas Windrunner"
              messages={messages}
              onMessageAdd={(text) => handleMessageAdd('sylvanas', text)}
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
