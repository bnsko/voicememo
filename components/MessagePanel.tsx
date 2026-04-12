'use client'

import React, { useState, useRef } from 'react'
import { Message } from '@/lib/redis'

interface MessagePanelProps {
  author: 'clovek_vyssi' | 'clovek_nizsi'
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
  const accentClass = author === 'clovek_vyssi' ? 'before:from-emerald-300/30' : 'before:from-emerald-300/12'

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
    <section className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-6 backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:to-transparent ${accentClass}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Channel</p>
          <h2 className="font-heading text-2xl tracking-[0.08em] text-zinc-100">{displayName}</h2>
        </div>
        <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-300">Memo</span>
      </div>

      <div className="mb-6 space-y-3 flex-shrink-0">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/65">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write or speak in Slovak..."
            className="h-32 w-full resize-none bg-transparent p-5 pr-40 text-sm leading-7 text-zinc-100 outline-none transition placeholder:text-zinc-500 focus:ring-2 focus:ring-emerald-300/40"
          />
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute right-4 top-4 rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition ${
              isRecording
                ? 'border-emerald-300/50 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18'
                : 'border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08]'
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
              ? 'cursor-pointer border border-emerald-300/35 bg-emerald-300/12 text-emerald-100 hover:bg-emerald-300/16'
              : 'cursor-not-allowed border border-white/10 bg-white/[0.03] text-zinc-500'
          } rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-all`}
        >
          Publish
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {filterMessages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/50 py-12 text-center text-zinc-500">
            <p className="text-sm uppercase tracking-[0.22em]">No notes yet</p>
            <p className="mt-2 text-xs tracking-[0.08em]">Your newest note will appear at the top.</p>
          </div>
        ) : (
          filterMessages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_16px_35px_rgba(0,0,0,0.35)]">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-200">
                  {displayName}
                </span>
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-zinc-200 transition hover:bg-white/[0.08]"
                  title="Delete note"
                >
                  Delete
                </button>
              </div>

              <p className="mb-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">{message.text}</p>

              <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500">{message.createdAt}</div>

              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <button
                  onClick={() => toggleExpanded(message.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-zinc-950/65 px-3 py-1.5 text-zinc-300 transition hover:bg-white/[0.06]"
                  title="Toggle comments"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 9H17M7 13H14M6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H11L7 20V16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-zinc-200">
                    {message.comments?.length || 0}
                  </span>
                </button>

                {expandedMessages.has(message.id) && (
                  <>
                    <div className="space-y-2 mt-2">
                      {message.comments?.map((comment) => (
                        <div key={comment.id} className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-semibold text-zinc-200">{comment.author}</span>
                            <button
                              onClick={() => {
                                if (confirm('Delete this comment permanently?')) {
                                  onCommentDelete(message.id, comment.id)
                                }
                              }}
                              className="rounded-full border border-white/20 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-zinc-200 transition hover:bg-white/[0.08]"
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
                          className="w-full rounded-xl border border-white/12 bg-zinc-950/65 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="h-20 w-full resize-none rounded-xl border border-white/12 bg-zinc-950/65 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddComment(message.id)}
                            className="flex-1 rounded-full border border-emerald-300/35 bg-emerald-300/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-300/16"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowCommentForm(null)
                              setCommentText('')
                              setCommentAuthor('')
                            }}
                            className="flex-1 rounded-full border border-white/15 bg-zinc-950/65 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:bg-white/[0.07]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCommentForm(message.id)}
                        className="mt-2 rounded-full border border-white/15 bg-zinc-950/65 px-3 py-2 text-xs uppercase tracking-[0.14em] text-zinc-300 transition hover:bg-white/[0.06]"
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
