'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthProvider'
import { useChatList } from '@/lib/hooks/useChatList'
import { GLOBAL_CHAT_ID } from '@/lib/firebase/refs'
import { getInitials, truncate, formatTime } from '@/lib/utils/helper'
import NewGroupModal from '@/components/sidebar/NewGrouptModal'
import UserMenu from '@/components/sidebar/UserMenu'
import type { ChatPreview } from '@/types'

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { chats, loading } = useChatList(user?.uid ?? '')
  const [search, setSearch] = useState('')
  const [showNewGroup, setShowNewGroup] = useState(false)

  const dms = chats.filter((c) => c.type === 'dm')
  const groups = chats.filter((c) => c.type === 'group')

  const filtered = (list: ChatPreview[]) =>
    search
      ? list.filter((c) =>
          (c.type === 'dm' ? c.otherUser?.name : c.name)
            ?.toLowerCase()
            .includes(search.toLowerCase()),
        )
      : list

  const isActive = (chatId: string) =>
    pathname === `/chat/${chatId}` ||
    (chatId === GLOBAL_CHAT_ID && pathname === '/chat')

  return (
    <>
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div
          className='flex items-center justify-between px-4'
          style={{
            height: 'var(--topbar-height)',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <div className='flex items-center gap-2.5'>
            <div
              className='w-7 h-7 flex items-center justify-center'
              style={{
                background: 'var(--color-primary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <LogoIcon />
            </div>
            <span
              className='font-heading font-semibold text-base'
              style={{ color: 'var(--color-text-primary)' }}
            >
              ChatSpace
            </span>
          </div>

          {/* Close btn — mobile only */}
          <button
            onClick={onClose}
            className='md:hidden icon-btn p-1'
            aria-label='Close sidebar'
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        <div className='px-3 py-3' style={{ flexShrink: 0 }}>
          <div className='relative'>
            <span
              className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'
              style={{ color: 'var(--color-text-muted)' }}
            >
              <SearchIcon />
            </span>
            <input
              type='search'
              placeholder='Search chats…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full text-sm outline-none'
              style={{
                height: 'var(--input-height-sm)',
                paddingLeft: '34px',
                paddingRight: '12px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
          </div>
        </div>

        {/* Chat list */}
        <nav className='flex-1 overflow-y-auto px-2 pb-2' aria-label='Chats'>
          {/* Global room */}
          <SectionLabel>Public</SectionLabel>
          <ChatItem
            href='/chat'
            active={isActive(GLOBAL_CHAT_ID)}
            onClick={onClose}
            avatar={<GlobalIcon />}
            avatarColor='purple'
            name='Global Room'
            preview='Everyone can chat here'
            unread={0}
          />

          {/* DMs */}
          {(filtered(dms).length > 0 || !search) && (
            <SectionLabel>Direct Messages</SectionLabel>
          )}
          {loading && dms.length === 0 ? (
            <SkeletonList count={3} />
          ) : (
            filtered(dms).map((chat) => (
              <ChatItem
                key={chat.id}
                href={`/chat/${chat.id}`}
                active={isActive(chat.id)}
                onClick={onClose}
                avatar={<span>{getInitials(chat.otherUser?.name ?? '?')}</span>}
                avatarColor={chat.otherUser?.avatarColor ?? 'purple'}
                name={chat.otherUser?.name ?? 'Unknown'}
                preview={
                  chat.lastMessage
                    ? truncate(chat.lastMessage, 32)
                    : 'No messages yet'
                }
                unread={chat.unread}
                online={chat.otherUser?.online}
                time={
                  chat.lastMessageAt
                    ? formatTime(chat.lastMessageAt)
                    : undefined
                }
              />
            ))
          )}

          {/* Groups */}
          <div className='flex items-center justify-between pr-1'>
            <SectionLabel>Groups</SectionLabel>
            <button
              onClick={() => setShowNewGroup(true)}
              className='icon-btn flex items-center gap-1 text-xs px-2 py-1 mb-1'
              aria-label='New group'
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <PlusIcon />
              New
            </button>
          </div>

          {loading && groups.length === 0 ? (
            <SkeletonList count={2} />
          ) : filtered(groups).length === 0 ? (
            <p
              className='text-xs px-2 py-2'
              style={{ color: 'var(--color-text-muted)' }}
            >
              {search ? 'No groups found' : 'No groups yet'}
            </p>
          ) : (
            filtered(groups).map((chat) => (
              <ChatItem
                key={chat.id}
                href={`/chat/${chat.id}`}
                active={isActive(chat.id)}
                onClick={onClose}
                avatar={<GroupIcon />}
                avatarColor='purple'
                name={chat.name ?? 'Group'}
                preview={
                  chat.lastMessage
                    ? truncate(chat.lastMessage, 32)
                    : 'No messages yet'
                }
                unread={chat.unread}
                time={
                  chat.lastMessageAt
                    ? formatTime(chat.lastMessageAt)
                    : undefined
                }
              />
            ))
          )}
        </nav>

        {/* User footer */}
        <div
          style={{ borderTop: '1px solid var(--color-border)', flexShrink: 0 }}
        >
          <UserMenu />
        </div>
      </div>

      {/* New group modal */}
      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className='text-xs font-medium px-2 pt-3 pb-1 uppercase tracking-wider'
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </p>
  )
}

interface ChatItemProps {
  href: string
  active: boolean
  onClick?: () => void
  avatar: React.ReactNode
  avatarColor: string
  name: string
  preview: string
  unread: number
  online?: boolean
  time?: string
}

function ChatItem({
  href,
  active,
  onClick,
  avatar,
  avatarColor,
  name,
  preview,
  unread,
  online,
  time,
}: ChatItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className='flex items-center gap-2.5 px-2 py-2 relative transition-colors'
      style={{
        borderRadius: 'var(--radius-md)',
        background: active ? 'var(--color-primary-light)' : 'transparent',
        textDecoration: 'none',
      }}
      aria-current={active ? 'page' : undefined}
    >
      {/* Active indicator */}
      {active && (
        <span
          className='absolute left-0 top-2 bottom-2'
          style={{
            width: '3px',
            background: 'var(--color-primary)',
            borderRadius: '0 3px 3px 0',
          }}
          aria-hidden='true'
        />
      )}

      {/* Avatar */}
      <div
        className={`avatar-${avatarColor} relative flex items-center justify-center text-xs font-semibold flex-shrink-0`}
        style={{
          width: 'var(--avatar-sm)',
          height: 'var(--avatar-sm)',
          borderRadius: 'var(--radius-md)',
          fontSize: '11px',
        }}
      >
        {avatar}
        {online !== undefined && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${online ? 'status-online' : 'status-offline'}`}
            aria-hidden='true'
          />
        )}
      </div>

      {/* Info */}
      <div className='flex-1 min-w-0'>
        <div className='flex items-center justify-between gap-1'>
          <span
            className='text-sm font-medium truncate'
            style={{
              color: active
                ? 'var(--color-primary)'
                : 'var(--color-text-primary)',
            }}
          >
            {name}
          </span>
          {time && (
            <span
              className='text-xs flex-shrink-0'
              style={{ color: 'var(--color-text-muted)' }}
            >
              {time}
            </span>
          )}
        </div>
        <div className='flex items-center justify-between gap-1'>
          <span
            className='text-xs truncate'
            style={{ color: 'var(--color-text-muted)' }}
          >
            {preview}
          </span>
          {unread > 0 && (
            <span
              className='text-xs font-semibold flex-shrink-0 flex items-center justify-center'
              style={{
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                background: 'var(--color-primary)',
                color: 'white',
                borderRadius: 'var(--radius-full)',
                fontSize: '10px',
              }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function SkeletonList({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className='flex items-center gap-2.5 px-2 py-2'>
          <div
            className='flex-shrink-0 animate-pulse'
            style={{
              width: 'var(--avatar-sm)',
              height: 'var(--avatar-sm)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-border)',
            }}
          />
          <div className='flex-1 flex flex-col gap-1.5'>
            <div
              className='animate-pulse h-3 rounded'
              style={{ width: '55%', background: 'var(--color-border)' }}
            />
            <div
              className='animate-pulse h-2.5 rounded'
              style={{ width: '75%', background: 'var(--color-border)' }}
            />
          </div>
        </div>
      ))}
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M21 15C21 15.53 20.79 16.04 20.41 16.41C20.04 16.79 19.53 17 19 17H7L3 21V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H19C19.53 3 20.04 3.21 20.41 3.59C20.79 3.96 21 4.47 21 5V15Z'
        stroke='white'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width='15'
      height='15'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2' />
      <path
        d='M21 21L16.65 16.65'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function GlobalIcon() {
  return (
    <svg
      width='14'
      height='14'
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
      width='14'
      height='14'
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
        d='M16 3.13C17.16 3.44 18 4.5 18 5.75C18 7 17.16 8.06 16 8.37'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
      <path
        d='M21 21V19C20.99 17.76 20.16 16.71 19 16.38'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M12 5V19M5 12H19'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M18 6L6 18M6 6L18 18'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
      />
    </svg>
  )
}
