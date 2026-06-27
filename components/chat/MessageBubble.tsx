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
            className={`avatar-${message.senderAvatarColor} flex items-center justify-center text-xs font-semibold`}
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
        {/* Sender name — show in group chats for others */}
        {showSenderName && !isOwn && (
          <span
            className='text-xs font-medium mb-0.5 ml-1'
            style={{
              color: `var(--color-${getNameColor(message.senderAvatarColor)})`,
            }}
          >
            {message.senderName}
          </span>
        )}

        {/* Bubble */}
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

        {/* Timestamp */}
        {showTimestamp && (
          <span
            className='text-xs mt-0.5 mx-1'
            style={{ color: 'var(--color-text-muted)' }}
          >
            {formatTime(message.createdAt)}
            {isOwn && (
              <span className='ml-1' aria-label='Delivered'>
                {message.readBy.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

function getNameColor(color: string): string {
  const map: Record<string, string> = {
    purple: 'purple-600',
    pink: 'purple-400',
    blue: 'purple-500',
    green: 'purple-600',
    orange: 'purple-500',
    teal: 'purple-400',
  }
  return map[color] ?? 'purple-600'
}
