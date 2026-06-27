'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthProvider'
import { getInitials, formatLastSeen } from '@/lib/utils/helper'
import type { Chat, User } from '@/types'

interface ChatTopbarProps {
  chat: Chat | null
  otherUser: User | null
  onInfoOpen?: () => void
}

export default function ChatTopbar({
  chat,
  otherUser,
  onInfoOpen,
}: ChatTopbarProps) {
  const { user } = useAuth()

  if (!chat) return null

  const isGlobal = chat.type === 'global'
  const isDM = chat.type === 'dm'
  const isGroup = chat.type === 'group'

  const name = isGlobal
    ? 'Global Room'
    : isDM
      ? (otherUser?.name ?? 'Unknown')
      : (chat.name ?? 'Group')

  const avatarColor = isDM ? (otherUser?.avatarColor ?? 'purple') : 'purple'
  const initials = isGlobal ? null : isDM ? getInitials(name) : null

  const subtitle = isGlobal
    ? 'Everyone can chat here'
    : isDM
      ? otherUser?.online
        ? 'Online'
        : `Last seen ${formatLastSeen(otherUser?.lastSeen ?? 0)}`
      : `${chat.members.length} member${chat.members.length !== 1 ? 's' : ''}`

  return (
    <header
      className='flex items-center gap-3 px-4 flex-shrink-0'
      style={{
        height: 'var(--topbar-height)',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      {/* Avatar */}
      <div
        className={`avatar-${avatarColor} flex items-center justify-center font-semibold flex-shrink-0 relative`}
        style={{
          width: 'var(--avatar-md)',
          height: 'var(--avatar-md)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
        }}
      >
        {isGlobal ? (
          <GlobalIcon />
        ) : isDM && otherUser?.photoURL ? (
          <img
            src={otherUser.photoURL}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
            }}
          />
        ) : isGroup ? (
          <GroupIcon />
        ) : (
          initials
        )}

        {/* Online dot for DM */}
        {isDM && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${otherUser?.online ? 'status-online' : 'status-offline'}`}
            aria-hidden='true'
          />
        )}
      </div>

      {/* Info */}
      <div className='flex-1 min-w-0'>
        <p
          className='font-heading font-semibold text-sm truncate'
          style={{ color: 'var(--color-text-primary)' }}
        >
          {name}
        </p>
        <p
          className='text-xs truncate flex items-center gap-1'
          style={{
            color:
              isDM && otherUser?.online
                ? 'var(--color-online)'
                : 'var(--color-text-muted)',
          }}
        >
          {isDM && otherUser?.online && (
            <span
              className='w-1.5 h-1.5 rounded-full status-online inline-block'
              aria-hidden='true'
            />
          )}
          {subtitle}
        </p>
      </div>

      {/* Actions */}
      <div className='flex items-center gap-1 flex-shrink-0'>
        {isGroup && (
          <button
            onClick={onInfoOpen}
            className='icon-btn p-2 transition-colors'
            aria-label='Group info'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <InfoIcon />
          </button>
        )}
        {isGroup && user?.uid === chat.createdBy && (
          <InviteLinkButton
            inviteCode={chat.inviteCode}
            groupName={chat.name ?? 'Group'}
          />
        )}
      </div>
    </header>
  )
}

// ── Invite link copy button ───────────────────────────────────────────────────

function InviteLinkButton({
  inviteCode,
  groupName,
}: {
  inviteCode: string | null
  groupName: string
}) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    if (!inviteCode) return
    const url = `${window.location.origin}/join/${inviteCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copyLink}
      className='icon-btn flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-all'
      aria-label='Copy invite link'
      style={{
        background: copied
          ? 'var(--color-success-bg)'
          : 'var(--color-primary-light)',
        border: `1px solid ${copied ? 'var(--color-success)' : 'var(--color-primary-muted)'}`,
        color: copied ? 'var(--color-success)' : 'var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}
    >
      {copied ? <CheckIcon /> : <LinkIcon />}
      {copied ? 'Copied!' : 'Invite'}
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function GlobalIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
      <path
        d='M2 12H22M12 2C9.33 7 9.33 17 12 22M12 2C14.67 7 14.67 17 12 22'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GroupIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
      <path
        d='M3 21V19C3 16.79 4.79 15 7 15H11C13.21 15 15 16.79 15 19V21'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M16 3.13C17.16 3.44 18 4.5 18 5.75C18 7 17.16 8.06 16 8.37M21 21V19C20.99 17.76 20.16 16.71 19 16.38'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' />
        <path
          d='M12 8V12M12 16H12.01'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
      <g className='icon-filled'>
        <circle cx='12' cy='12' r='10' fill='currentColor' />
        <path
          d='M12 8V12M12 16H12.01'
          stroke='white'
          strokeWidth='2'
          strokeLinecap='round'
        />
      </g>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg
      width='14'
      height='14'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M10 13C10.83 14.11 12.11 14.83 13.5 14.97C14.89 15.11 16.28 14.65 17.31 13.73L20.31 10.73C22.19 8.78 22.15 5.67 20.22 3.78C18.29 1.89 15.18 1.93 13.29 3.86L11.75 5.39'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M14 11C13.17 9.89 11.89 9.17 10.5 9.03C9.11 8.89 7.72 9.35 6.69 10.27L3.69 13.27C1.81 15.22 1.85 18.33 3.78 20.22C5.71 22.11 8.82 22.07 10.71 20.14L12.24 18.61'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CheckIcon() {
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
        stroke='currentColor'
        strokeWidth='2.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}
