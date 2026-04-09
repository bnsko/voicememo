'use client'

import React, { useState, useRef } from 'react'
import { Message } from '@/lib/redis'

interface MessagePanelProps {
  author: 'nova' | 'orion'
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
    nova: {
      edge: 'border-cyan-400/35',
      ring: 'focus:ring-cyan-300/70',
      tag: 'text-cyan-200 bg-cyan-500/10 border-cyan-300/30',
      panelGlow: 'shadow-[0_0_45px_rgba(34,211,238,0.09)]',
    },
    orion: {
      edge: 'border-amber-300/35',
      ring: 'focus:ring-amber-300/70',
      tag: 'text-amber-200 bg-amber-500/10 border-amber-300/30',
      panelGlow: 'shadow-[0_0_45px_rgba(251,191,36,0.09)]',
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
    <div className={`flex flex-col h-full rounded-none border-r border-white/15 bg-zinc-950/60 p-6 ${colors.panelGlow}`}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-heading text-3xl tracking-[0.08em] text-zinc-100">{displayName}</h2>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${colors.tag}`}>
          {isRecording ? 'Listening' : 'Idle'}
        </span>
      </div>

      <div className="mb-6 space-y-3 flex-shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => {
            if (!isRecording) startRecording()
          }}
          onBlur={() => {
            if (isRecording) stopRecording()
          }}
          placeholder="Click in this field and start speaking in Slovak..."
          className={`h-28 w-full resize-none rounded-2xl border border-white/15 bg-zinc-900/80 p-4 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:ring-2 ${colors.ring}`}
        />

        <p className="text-[12px] text-zinc-500">
          Voice-to-text is active while this field is focused.
        </p>

        <button
          onClick={handleSendMessage}
          disabled={!text.trim()}
          className={`w-full ${
            text.trim()
              ? 'cursor-pointer bg-zinc-100 text-zinc-950 hover:bg-white'
              : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
          } rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-all`}
        >
          Publish
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {filterMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-zinc-900/55 py-10 text-center text-zinc-500">
            <p className="text-sm uppercase tracking-[0.14em]">No notes yet</p>
            <p className="mt-2 text-xs">Your newest note will appear at the top.</p>
          </div>
        ) : (
          filterMessages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-white/15 bg-zinc-900/80 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.14em] ${colors.tag}`}>
                  {displayName}
                </span>
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="rounded-full border border-red-300/30 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-400/10"
                  title="Delete note"
                >
                  Delete
                </button>
              </div>

              <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-zinc-200">{message.text}</p>

              <div className="mb-3 text-xs tracking-[0.08em] text-zinc-500">{message.createdAt}</div>

              <div className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                <button
                  onClick={() => toggleExpanded(message.id)}
                  className="text-[11px] uppercase tracking-[0.14em] text-zinc-400 transition hover:text-zinc-200"
                >
                  Comments {message.comments?.length || 0}
                </button>

                {expandedMessages.has(message.id) && (
                  <>
                    <div className="space-y-2 mt-2">
                      {message.comments?.map((comment) => (
                        <div key={comment.id} className="rounded-lg border border-white/10 bg-zinc-900 p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-zinc-200">{comment.author}</span>
                            <button
                              onClick={() => onCommentDelete(message.id, comment.id)}
                              className="rounded-full border border-red-300/30 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-400/10"
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
                          className="w-full rounded-lg border border-white/15 bg-zinc-900 p-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="h-16 w-full resize-none rounded-lg border border-white/15 bg-zinc-900 p-2 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddComment(message.id)}
                            className="flex-1 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-950 transition hover:bg-white"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowCommentForm(null)
                              setCommentText('')
                              setCommentAuthor('')
                            }}
                            className="flex-1 rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-200 transition hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCommentForm(message.id)}
                        className="mt-2 rounded-lg border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.12em] text-zinc-300 transition hover:bg-zinc-800"
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
    </div>
  )
}
