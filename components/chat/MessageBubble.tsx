'use client'

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getInitials, formatTime } from '@/lib/utils/helper'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  showTimestamp: boolean
  showSenderName: boolean
  chatMembers: string[]
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
  showSenderName,
  chatMembers,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text ?? '')
  const [saving, setSaving] = useState(false)

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

  // Tick logic
  const otherMembers = chatMembers.filter((uid) => uid !== message.senderId)
  const seenByOthers = otherMembers.some((uid) => message.readBy.includes(uid))
  const delivered = message.readBy.includes(message.senderId)
  const tickStatus: 'sent' | 'delivered' | 'seen' = seenByOthers
    ? 'seen'
    : delivered
      ? 'delivered'
      : 'sent'

  // ── Edit ──────────────────────────────────────────────────────────────────

  async function handleEdit() {
    if (!editText.trim() || editText.trim() === message.text) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const msgRef = doc(db, 'chats', message.chatId, 'messages', message.id)
      await updateDoc(msgRef, {
        text: editText.trim(),
        edited: true,
      })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    setShowMenu(false)
    const msgRef = doc(db, 'chats', message.chatId, 'messages', message.id)
    await updateDoc(msgRef, {
      deleted: true,
      text: null,
      fileURL: null,
      fileName: null,
    })
  }

  return (
    <div
      className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      style={{
        marginBottom: showTimestamp ? '2px' : '1px',
        position: 'relative',
      }}
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

        {/* Bubble with action button */}
        <div
          className={`flex items-end gap-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        >
          {/* Bubble content */}
          <div style={{ position: 'relative' }}>
            {message.deleted ? (
              <div
                className='bubble-received'
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  opacity: 0.6,
                }}
              >
                Message deleted
              </div>
            ) : editing ? (
              <EditBox
                value={editText}
                onChange={setEditText}
                onSave={handleEdit}
                onCancel={() => {
                  setEditing(false)
                  setEditText(message.text ?? '')
                }}
                saving={saving}
              />
            ) : message.type === 'image' ? (
              <ImageBubble message={message} isOwn={isOwn} />
            ) : message.type === 'file' ? (
              <FileBubble message={message} isOwn={isOwn} />
            ) : (
              <TextBubble message={message} isOwn={isOwn} />
            )}
          </div>

          {/* Action button — show on hover, only for own messages and not deleted */}
          {isOwn && !message.deleted && !editing && (
            <div
              style={{
                position: 'relative',
                flexShrink: 0,
                alignSelf: 'center',
              }}
            >
              <button
                onClick={() => setShowMenu((v) => !v)}
                className='opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'
                aria-label='Message options'
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                }}
              >
                <DotsIcon />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <>
                  <div
                    className='fixed inset-0 z-10'
                    onClick={() => setShowMenu(false)}
                    aria-hidden='true'
                  />
                  <div
                    className='absolute z-20 animate-scale-in'
                    style={{
                      bottom: '110%',
                      right: isOwn ? 0 : 'auto',
                      left: isOwn ? 'auto' : 0,
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '120px',
                      overflow: 'hidden',
                    }}
                  >
                    {message.type === 'text' && (
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setEditing(true)
                        }}
                        className='w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors'
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--color-text-primary)',
                          fontFamily: 'var(--font-body)',
                          textAlign: 'left',
                        }}
                      >
                        <EditIcon /> Edit
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      className='w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors'
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--color-error)',
                        fontFamily: 'var(--font-body)',
                        textAlign: 'left',
                      }}
                    >
                      <DeleteIcon /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Timestamp + ticks */}
        {showTimestamp && !editing && (
          <div
            className={`flex items-center gap-1 mt-0.5 mx-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span
              className='text-xs'
              style={{ color: 'var(--color-text-muted)' }}
            >
              {formatTime(message.createdAt)}
              {(message as any).edited && (
                <span style={{ marginLeft: '4px', fontSize: '10px' }}>
                  · edited
                </span>
              )}
            </span>
            {isOwn && !message.deleted && (
              <span aria-label={tickStatus}>
                <TickIcon status={tickStatus} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Edit box ──────────────────────────────────────────────────────────────────

function EditBox({
  value,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div style={{ minWidth: '200px', maxWidth: '320px' }}>
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            onSave()
          }
          if (e.key === 'Escape') onCancel()
        }}
        rows={2}
        className='w-full resize-none outline-none text-sm px-3 py-2'
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-primary)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.55,
        }}
      />
      <div className='flex gap-1.5 mt-1 justify-end'>
        <button
          onClick={onCancel}
          className='text-xs px-2.5 py-1'
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className='text-xs px-2.5 py-1'
          style={{
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: saving ? 'not-allowed' : 'pointer',
            color: 'white',
            fontFamily: 'var(--font-body)',
          }}
        >
          {saving ? '…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Tick icon ─────────────────────────────────────────────────────────────────

function TickIcon({ status }: { status: 'sent' | 'delivered' | 'seen' }) {
  const color =
    status === 'seen' ? 'var(--color-primary)' : 'var(--color-text-muted)'
  if (status === 'sent') {
    return (
      <svg
        width='14'
        height='14'
        viewBox='0 0 24 24'
        fill='none'
        aria-hidden='true'
      >
        <path
          d='M20 6L9 17L4 12'
          stroke={color}
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }
  return (
    <svg
      width='18'
      height='14'
      viewBox='0 0 28 18'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M2 9L8 15L20 3'
        stroke={color}
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M9 15L21 3'
        stroke={color}
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
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
      {message.text}
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
        alt='Image'
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
  const name = message.fileName ?? 'File'
  const ext = name.split('.').pop()?.toLowerCase() ?? ''

  const label =
    ext === 'pdf'
      ? 'PDF Document'
      : ext === 'docx'
        ? 'Word Document'
        : ext === 'doc'
          ? 'Word Document'
          : ext === 'txt'
            ? 'Text File'
            : 'File'

  return (
    <a
      href={message.fileURL ?? '#'}
      target='_blank'
      rel='noopener noreferrer'
      className='flex items-center gap-3 no-underline'
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
      <div className='flex-1 min-w-0'>
        <p
          className='text-xs font-medium'
          style={{ color: isOwn ? 'white' : 'var(--color-text-primary)' }}
        >
          {label}
        </p>
        <p
          className='text-xs mt-0.5'
          style={{
            color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)',
          }}
        >
          Tap to open
        </p>
      </div>
    </a>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function DotsIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='12' cy='5' r='1.5' fill='currentColor' />
      <circle cx='12' cy='12' r='1.5' fill='currentColor' />
      <circle cx='12' cy='19' r='1.5' fill='currentColor' />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M11 4H4C3.47 4 2.96 4.21 2.59 4.59C2.21 4.96 2 5.47 2 6V20C2 20.53 2.21 21.04 2.59 21.41C2.96 21.79 3.47 22 4 22H18C18.53 22 19.04 21.79 19.41 21.41C19.79 21.04 20 20.53 20 20V13'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M18.5 2.5C18.89 2.11 19.41 1.89 19.95 1.89C20.49 1.89 21.01 2.11 21.4 2.5C21.79 2.89 22.01 3.41 22.01 3.95C22.01 4.49 21.79 5.01 21.4 5.4L12 14.8L8 16L9.2 12L18.5 2.5Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M3 6H5H21'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M8 6V4C8 3.47 8.21 2.96 8.59 2.59C8.96 2.21 9.47 2 10 2H14C14.53 2 15.04 2.21 15.41 2.59C15.79 2.96 16 3.47 16 4V6M19 6L18.1 19.1C18.05 19.62 17.8 20.1 17.41 20.44C17.02 20.79 16.52 20.99 16 21H8C7.48 21 6.98 20.79 6.59 20.44C6.2 20.1 5.95 19.62 5.9 19.1L5 6H19Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

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
        d='M14 2V8H20M16 13H8M16 17H8M10 9H8'
        stroke={color}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
