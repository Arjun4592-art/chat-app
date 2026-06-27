'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthProvider'
import { useMessages } from '@/lib/hooks/useMessage'
import MessageBubble from '@/components/chat/MessageBubble'
import { messagesCol, chatDoc } from '@/lib/firebase/refs'
import { now, formatDate } from '@/lib/utils/helper'
import type { Chat, Message } from '@/types'

interface ChatWindowProps {
  chat: Chat
}

export default function ChatWindow({ chat }: ChatWindowProps) {
  const { user } = useAuth()
  const { messages, loading } = useMessages(chat.id)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  // Send message
  const sendMessage = useCallback(async () => {
    if (!user || !text.trim() || sending) return
    const trimmed = text.trim()
    setText('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setSending(true)

    try {
      const msg: Omit<Message, 'id'> = {
        chatId: chat.id,
        senderId: user.uid,
        senderName: user.name,
        senderAvatarColor: user.avatarColor,
        type: 'text',
        text: trimmed,
        fileURL: null,
        fileName: null,
        createdAt: now(),
        readBy: [user.uid],
        deleted: false,
      }

      await addDoc(messagesCol(chat.id), msg)

      // Update chat last message
      await updateDoc(chatDoc(chat.id), {
        lastMessage: trimmed,
        lastMessageAt: now(),
        lastMessageSenderId: user.uid,
      })

      // Increment unread for all other members
      const updates: Record<string, unknown> = {}
      chat.members.forEach((uid) => {
        if (uid !== user.uid) updates[`unreadCount.${uid}`] = increment(1)
      })
      if (Object.keys(updates).length > 0) {
        await updateDoc(chatDoc(chat.id), updates)
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }, [user, text, sending, chat])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Group messages by date + determine avatar/name visibility
  const grouped = groupMessages(messages, user?.uid ?? '')

  return (
    <div className='flex flex-col h-full'>
      {/* Messages */}
      <div
        className='flex-1 overflow-y-auto px-4 py-4'
        style={{ background: 'var(--color-bg)' }}
        aria-live='polite'
        aria-label='Messages'
      >
        {loading ? (
          <MessagesSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState chatType={chat.type} chatName={chat.name} />
        ) : (
          grouped.map((item) =>
            item.type === 'date' ? (
              <DateDivider key={item.date} date={item.date} />
            ) : (
              <MessageBubble
                key={item.message.id}
                message={item.message}
                isOwn={item.isOwn}
                showAvatar={item.showAvatar}
                showTimestamp={item.showTimestamp}
                showSenderName={chat.type !== 'dm' && !item.isOwn}
              />
            ),
          )
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className='flex-shrink-0 px-4 py-3 flex items-end gap-2'
        style={{
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
        }}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${chat.type === 'global' ? 'Global Room' : chat.type === 'dm' ? '…' : (chat.name ?? 'group')}`}
          rows={1}
          className='flex-1 resize-none outline-none text-sm py-2.5 px-4'
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.55,
            maxHeight: '120px',
            overflowY: 'auto',
          }}
          aria-label='Message input'
        />

        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          aria-label='Send message'
          className='icon-btn flex-shrink-0 flex items-center justify-center transition-all active:scale-95'
          style={{
            width: '38px',
            height: '38px',
            background: text.trim()
              ? 'var(--color-primary)'
              : 'var(--color-surface)',
            border: `1px solid ${text.trim() ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-lg)',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            color: text.trim() ? 'white' : 'var(--color-text-muted)',
            flexShrink: 0,
          }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type GroupedItem =
  | { type: 'date'; date: string }
  | {
      type: 'message'
      message: Message
      isOwn: boolean
      showAvatar: boolean
      showTimestamp: boolean
    }

function groupMessages(messages: Message[], uid: string): GroupedItem[] {
  const result: GroupedItem[] = []
  let lastDate = ''
  let lastSender = ''
  let lastTime = 0

  messages.forEach((msg, i) => {
    const date = formatDate(msg.createdAt)
    if (date !== lastDate) {
      result.push({ type: 'date', date })
      lastDate = date
      lastSender = ''
    }

    const isOwn = msg.senderId === uid
    const next = messages[i + 1]
    const sameNextSender = next?.senderId === msg.senderId
    const timeDiff = next ? next.createdAt - msg.createdAt : Infinity

    const showAvatar = !isOwn && (!sameNextSender || timeDiff > 2 * 60 * 1000)
    const showTimestamp = !sameNextSender || timeDiff > 2 * 60 * 1000

    result.push({
      type: 'message',
      message: msg,
      isOwn,
      showAvatar,
      showTimestamp,
    })

    lastSender = msg.senderId
    lastTime = msg.createdAt
  })

  return result
}

// ── Sub components ────────────────────────────────────────────────────────────

function DateDivider({ date }: { date: string }) {
  return (
    <div
      className='flex items-center gap-3 my-4'
      aria-label={`Messages from ${date}`}
    >
      <div
        className='flex-1 h-px'
        style={{ background: 'var(--color-border)' }}
      />
      <span
        className='text-xs px-2 py-0.5'
        style={{
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border)',
        }}
      >
        {date}
      </span>
      <div
        className='flex-1 h-px'
        style={{ background: 'var(--color-border)' }}
      />
    </div>
  )
}

function EmptyState({
  chatType,
  chatName,
}: {
  chatType: string
  chatName: string | null
}) {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-3 py-16'>
      <div
        className='w-14 h-14 flex items-center justify-center'
        style={{
          background: 'var(--color-primary-light)',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        <EmptyChatIcon />
      </div>
      <p
        className='font-heading font-semibold text-base'
        style={{ color: 'var(--color-text-primary)' }}
      >
        {chatType === 'global'
          ? 'Welcome to Global Room!'
          : chatType === 'group'
            ? `Welcome to ${chatName}!`
            : 'Start a conversation'}
      </p>
      <p
        className='text-sm text-center'
        style={{ color: 'var(--color-text-muted)', maxWidth: '260px' }}
      >
        {chatType === 'global'
          ? 'This is the beginning of the global conversation.'
          : chatType === 'group'
            ? 'This is the beginning of the group. Say hello!'
            : 'Send a message to start chatting.'}
      </p>
    </div>
  )
}

function MessagesSkeleton() {
  return (
    <div className='flex flex-col gap-3 py-2'>
      {[60, 45, 75, 50, 65].map((w, i) => (
        <div
          key={i}
          className={`flex gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
        >
          <div
            className='w-7 h-7 rounded animate-pulse flex-shrink-0'
            style={{ background: 'var(--color-border)' }}
          />
          <div
            className='h-9 rounded-lg animate-pulse'
            style={{
              width: `${w}%`,
              background: 'var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <path
          d='M22 2L11 13'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M22 2L15 22L11 13L2 9L22 2Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
      <g className='icon-filled'>
        <path d='M22 2L15 22L11 13L2 9L22 2Z' fill='currentColor' />
      </g>
    </svg>
  )
}

function EmptyChatIcon() {
  return (
    <svg
      width='28'
      height='28'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z'
        stroke='var(--color-primary)'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
