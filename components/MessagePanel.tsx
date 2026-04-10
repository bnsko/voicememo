'use client'

import React, { useState, useRef } from 'react'
import { Message } from '@/lib/redis'

interface MessagePanelProps {
  author: 'paul' | 'sylvanas'
  displayName: string
  messages: Message[]
  onMessageAdd: (text: string) => Promise<void>
  onMessageDelete: (messageId: string) => Promise<void>
  onCommentAdd: (messageId: string, text: string, authorName: string) => Promise<void>
  onCommentDelete: (messageId: string, commentId: string) => Promise<void>
}

export const MessagePanel: React.FC<MessagePanelProps> = ({
  author,
  displayName,
  messages,
  onMessageAdd,
  onMessageDelete,
  onCommentAdd,
  onCommentDelete,
}) => {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const recognitionRef = useRef<any>(null)
  const finalTranscriptRef = useRef('')

  const filterMessages = messages.filter(m => m.author === author)
  const authorColors: { [key: string]: { edge: string; ring: string; tag: string; panelGlow: string } } = {
    paul: {
      edge: 'border-emerald-300/30',
      ring: 'focus:ring-emerald-200/60',
      tag: 'text-emerald-100 bg-emerald-300/10 border-emerald-200/20',
      panelGlow: 'shadow-[0_0_60px_rgba(16,185,129,0.08)]',
    },
    sylvanas: {
      edge: 'border-fuchsia-300/30',
      ring: 'focus:ring-fuchsia-200/60',
      tag: 'text-fuchsia-100 bg-fuchsia-300/10 border-fuchsia-200/20',
      panelGlow: 'shadow-[0_0_60px_rgba(217,70,239,0.08)]',
    },
  }

  const colors = authorColors[author]

  const createRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support voice input.')
      return
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.lang = 'sk-SK'
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true

    recognitionRef.current.onstart = () => setIsRecording(true)
    recognitionRef.current.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current.onresult = (event: any) => {
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${transcript} `
        } else {
          interim += transcript
        }
      }

      setText(`${finalTranscriptRef.current}${interim}`.trim())
    }
  }

  const startRecording = () => {
    if (!recognitionRef.current) {
      createRecognition()
    }

    if (!recognitionRef.current) {
      return
    }

    finalTranscriptRef.current = text ? `${text} ` : ''
    recognitionRef.current.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSendMessage = async () => {
    if (!text.trim()) return

    try {
      await onMessageAdd(text)
      setText('')
      finalTranscriptRef.current = ''
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (confirm('Delete this note permanently?')) {
      await onMessageDelete(messageId)
    }
  }

  const handleAddComment = async (messageId: string) => {
    if (!commentText.trim() || !commentAuthor.trim()) return

    try {
      await onCommentAdd(messageId, commentText, commentAuthor)
      setCommentText('')
      setCommentAuthor('')
      setShowCommentForm(null)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const toggleExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId)
    } else {
      newExpanded.add(messageId)
    }
    setExpandedMessages(newExpanded)
  }

  return (
    <section className={`flex h-full flex-col rounded-[2rem] border ${colors.edge} bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl ${colors.panelGlow}`}>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">Private Channel</p>
          <h2 className="font-heading text-3xl tracking-[0.08em] text-zinc-100">{displayName}</h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${colors.tag}`}>
          Voice Memo
        </span>
      </div>

      <div className="mb-6 space-y-3 flex-shrink-0">
        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/25">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write or use speech-to-text in Slovak..."
            className={`h-32 w-full resize-none bg-transparent p-5 pr-40 text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:ring-2 ${colors.ring}`}
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute right-4 top-4 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
              isRecording
                ? 'border-red-300/40 bg-red-500/12 text-red-100 hover:bg-red-500/20'
                : 'border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
            }`}
          >
            {isRecording ? 'Stop Voice' : 'Start Voice'}
          </button>
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!text.trim()}
          className={`w-full ${
            text.trim()
              ? 'cursor-pointer bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(214,214,214,0.88))] text-zinc-950 shadow-[0_12px_30px_rgba(255,255,255,0.08)] hover:translate-y-[-1px] hover:brightness-105'
              : 'cursor-not-allowed bg-white/5 text-zinc-500'
          } rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-all`}
        >
          Publish
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {filterMessages.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-white/15 bg-black/20 py-12 text-center text-zinc-500">
            <p className="text-sm uppercase tracking-[0.22em]">No notes yet</p>
            <p className="mt-2 text-xs tracking-[0.08em]">Your newest note will appear at the top.</p>
          </div>
        ) : (
          filterMessages.map((message) => (
            <article key={message.id} className="rounded-[1.6rem] border border-white/12 bg-[linear-gradient(180deg,rgba(20,20,26,0.95),rgba(10,10,14,0.92))] p-4 shadow-[0_22px_45px_rgba(0,0,0,0.22)] backdrop-blur-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${colors.tag}`}>
                  {displayName}
                </span>
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="rounded-full border border-red-300/25 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-red-100 transition hover:bg-red-400/10"
                  title="Delete note"
                >
                  Delete
                </button>
              </div>

              <p className="mb-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">{message.text}</p>

              <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500">{message.createdAt}</div>

              <div className="rounded-[1.2rem] border border-white/8 bg-black/25 p-3">
                <button
                  onClick={() => toggleExpanded(message.id)}
                  className="text-[11px] uppercase tracking-[0.18em] text-zinc-400 transition hover:text-zinc-200"
                >
                  Comments {message.comments?.length || 0}
                </button>

                {expandedMessages.has(message.id) && (
                  <>
                    <div className="space-y-2 mt-2">
                      {message.comments?.map((comment) => (
                        <div key={comment.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-zinc-200">{comment.author}</span>
                            <button
                              onClick={() => onCommentDelete(message.id, comment.id)}
                              className="rounded-full border border-red-300/25 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-400/10"
                              title="Delete comment"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-zinc-300">{comment.text}</p>
                          <p className="mt-1 text-xs text-zinc-500">{comment.createdAt}</p>
                        </div>
                      ))}
                    </div>

                    {showCommentForm === message.id ? (
                      <div className="space-y-2 mt-2">
                        <input
                          type="text"
                          value={commentAuthor}
                          onChange={(e) => setCommentAuthor(e.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-xl border border-white/12 bg-white/[0.03] p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="h-20 w-full resize-none rounded-xl border border-white/12 bg-white/[0.03] p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddComment(message.id)}
                            className="flex-1 rounded-full bg-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-950 transition hover:bg-white"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowCommentForm(null)
                              setCommentText('')
                              setCommentAuthor('')
                            }}
                            className="flex-1 rounded-full border border-white/15 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:bg-white/[0.07]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCommentForm(message.id)}
                        className="mt-2 rounded-full border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-300 transition hover:bg-white/[0.06]"
                      >
                        Add comment
                      </button>
                    )}
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
