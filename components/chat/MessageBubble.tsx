'use client'

import { getInitials, formatTime } from '@/lib/utils/helper'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  showTimestamp: boolean
  showSenderName: boolean
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  showSenderName,
}: MessageBubbleProps) {
  if (message.type === 'system') {
    return (
      <div className='flex justify-center my-1'>
        <span
          className='text-xs px-3 py-1'
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-muted)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--color-border)',
          }}
        >
          {message.text}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      style={{ marginBottom: showTimestamp ? '2px' : '1px' }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 'var(--avatar-sm)',
          flexShrink: 0,
          alignSelf: 'flex-end',
        }}
      >
        {showAvatar && !isOwn ? (
          <div
            className={`avatar-${message.senderAvatarColor} flex items-center justify-center font-semibold`}
            style={{
              width: 'var(--avatar-sm)',
              height: 'var(--avatar-sm)',
              borderRadius: 'var(--radius-md)',
              fontSize: '10px',
            }}
            aria-hidden='true'
          >
            {getInitials(message.senderName)}
          </div>
        ) : (
          <div style={{ width: 'var(--avatar-sm)' }} />
        )}
      </div>

      {/* Bubble + meta */}
      <div
        className={`flex flex-col max-w-[68%] sm:max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}
      >
        {/* Sender name */}
        {showSenderName && !isOwn && (
          <span
            className='text-xs font-medium mb-0.5 ml-1'
            style={{ color: 'var(--color-primary)' }}
          >
            {message.senderName}
          </span>
        )}

        {/* Bubble content */}
        {message.type === 'image' ? (
          <ImageBubble message={message} isOwn={isOwn} />
        ) : message.type === 'file' ? (
          <FileBubble message={message} isOwn={isOwn} />
        ) : (
          <TextBubble message={message} isOwn={isOwn} />
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <span
            className='text-xs mt-0.5 mx-1'
            style={{ color: 'var(--color-text-muted)' }}
          >
            {formatTime(message.createdAt)}
            {isOwn && (
              <span className='ml-1'>
                {message.readBy.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Text bubble ───────────────────────────────────────────────────────────────

function TextBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <div
      className={isOwn ? 'bubble-sent' : 'bubble-received'}
      style={{
        padding: '8px 12px',
        fontSize: '13px',
        lineHeight: 1.55,
        wordBreak: 'break-word',
      }}
    >
      {message.deleted ? (
        <span style={{ fontStyle: 'italic', opacity: 0.6 }}>
          Message deleted
        </span>
      ) : (
        message.text
      )}
    </div>
  )
}

// ── Image bubble ──────────────────────────────────────────────────────────────

function ImageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <a
      href={message.fileURL ?? '#'}
      target='_blank'
      rel='noopener noreferrer'
      style={{
        display: 'block',
        borderRadius: isOwn
          ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
          : 'var(--radius-sm) var(--radius-xl) var(--radius-xl) var(--radius-xl)',
        overflow: 'hidden',
        maxWidth: '240px',
        border: '1px solid var(--color-border)',
      }}
    >
      <img
        src={message.fileURL ?? ''}
        alt={message.fileName ?? 'Image'}
        style={{
          width: '100%',
          display: 'block',
          maxHeight: '300px',
          objectFit: 'cover',
        }}
        loading='lazy'
      />
    </a>
  )
}

// ── File bubble ───────────────────────────────────────────────────────────────

function FileBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const ext = message.fileName?.split('.').pop()?.toUpperCase() ?? 'FILE'

  return (
    <a
      href={message.fileURL ?? '#'}
      target='_blank'
      rel='noopener noreferrer'
      className='flex items-center gap-3 no-underline transition-all'
      style={{
        padding: '10px 14px',
        background: isOwn ? 'var(--color-primary)' : 'var(--color-surface)',
        border: `1px solid ${isOwn ? 'transparent' : 'var(--color-border)'}`,
        borderRadius: isOwn
          ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)'
          : 'var(--radius-sm) var(--radius-xl) var(--radius-xl) var(--radius-xl)',
        textDecoration: 'none',
        minWidth: '180px',
        maxWidth: '240px',
      }}
    >
      {/* File icon */}
      <div
        className='flex items-center justify-center flex-shrink-0'
        style={{
          width: '36px',
          height: '36px',
          background: isOwn
            ? 'rgba(255,255,255,0.2)'
            : 'var(--color-primary-light)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <FileIcon color={isOwn ? 'white' : 'var(--color-primary)'} />
      </div>

      {/* File info */}
      <div className='flex-1 min-w-0'>
        <p
          className='text-xs font-medium truncate'
          style={{ color: isOwn ? 'white' : 'var(--color-text-primary)' }}
        >
          {message.fileName ?? 'File'}
        </p>
        <p
          className='text-xs mt-0.5'
          style={{
            color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)',
          }}
        >
          {ext} · Tap to open
        </p>
      </div>
    </a>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function FileIcon({ color }: { color: string }) {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M14 2H6C5.47 2 4.96 2.21 4.59 2.59C4.21 2.96 4 3.47 4 4V20C4 20.53 4.21 21.04 4.59 21.41C4.96 21.79 5.47 22 6 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V8L14 2Z'
        stroke={color}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M14 2V8H20'
        stroke={color}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M16 13H8M16 17H8M10 9H8'
        stroke={color}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
