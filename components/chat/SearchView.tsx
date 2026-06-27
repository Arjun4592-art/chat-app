'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  query,
  where,
  getDocs,
  setDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useAuth } from '@/context/AuthProvider'
import { usersCol, chatsCol, chatDoc } from '@/lib/firebase/refs'
import { getDmChatId, getInitials, now } from '@/lib/utils/helper'
import type { User, Chat } from '@/types'

type TabType = 'users' | 'groups'

export default function SearchView() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('users')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<(User | Chat)[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    if (!q.trim() || !user) return
    setLoading(true)
    setResults([])

    try {
      if (tab === 'users') {
        const snap = await getDocs(
          query(usersCol, where('name', '==', q.trim())),
        )
        const users = snap.docs
          .map((d) => d.data() as User)
          .filter((u) => u.uid !== user.uid)
        setResults(users)
      } else {
        // Exact group name search — private groups findable by exact name
        const snap = await getDocs(
          query(
            chatsCol,
            where('type', '==', 'group'),
            where('name', '==', q.trim()),
          ),
        )
        setResults(
          snap.docs.map(
            (d) => ({ ...(d.data() as Omit<Chat, 'id'>), id: d.id }) as Chat,
          ),
        )
      }
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  async function startDM(otherUser: User) {
    if (!user) return
    const chatId = getDmChatId(user.uid, otherUser.uid)
    const existing = await getDoc(chatDoc(chatId))

    if (!existing.exists()) {
      const dm: Chat = {
        id: chatId,
        type: 'dm',
        name: null,
        members: [user.uid, otherUser.uid],
        createdBy: user.uid,
        createdAt: now(),
        lastMessage: null,
        lastMessageAt: null,
        lastMessageSenderId: null,
        isPrivate: true,
        inviteCode: null,
        photoURL: null,
      }
      await setDoc(doc(db, 'chats', chatId), dm)
    }
    router.push(`/chat/${chatId}`)
  }

  async function joinGroup(chat: Chat) {
    if (!user) return
    if (chat.members.includes(user.uid)) {
      router.push(`/chat/${chat.id}`)
      return
    }
    await updateDoc(chatDoc(chat.id), { members: arrayUnion(user.uid) })
    router.push(`/chat/${chat.id}`)
  }

  return (
    <div
      className='min-h-screen'
      style={{ background: 'var(--color-surface)', padding: '32px 16px' }}
    >
      <div className='max-w-lg mx-auto'>
        <h1
          className='font-heading font-semibold text-xl mb-6'
          style={{ color: 'var(--color-text-primary)' }}
        >
          Search
        </h1>

        {/* Tabs */}
        <div
          className='flex mb-5 p-1'
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          {(['users', 'groups'] as TabType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setResults([])
                setSearched(false)
              }}
              className='flex-1 text-sm font-medium capitalize py-2 transition-all'
              style={{
                background: tab === t ? 'var(--color-primary)' : 'none',
                color: tab === t ? 'white' : 'var(--color-text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className='flex gap-2 mb-6'>
          <input
            type='search'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch()
            }}
            placeholder={
              tab === 'users'
                ? 'Search by exact name…'
                : 'Search by exact group name…'
            }
            className='flex-1 px-4 text-sm outline-none'
            style={{
              height: 'var(--input-height)',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !q.trim()}
            className='px-4 text-sm font-medium transition-all active:scale-[0.98]'
            style={{
              height: 'var(--input-height)',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: loading || !q.trim() ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-body)',
              opacity: loading || !q.trim() ? 0.6 : 1,
            }}
          >
            {loading ? '…' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {searched && results.length === 0 && (
          <p
            className='text-sm text-center py-8'
            style={{ color: 'var(--color-text-muted)' }}
          >
            No {tab} found with that exact name.
          </p>
        )}

        <div className='flex flex-col gap-2'>
          {results.map((item) =>
            tab === 'users' ? (
              <UserResult
                key={(item as User).uid}
                user={item as User}
                onStart={startDM}
              />
            ) : (
              <GroupResult
                key={(item as Chat).id}
                chat={item as Chat}
                currentUid={user?.uid ?? ''}
                onJoin={joinGroup}
              />
            ),
          )}
        </div>
      </div>
    </div>
  )
}

function UserResult({
  user,
  onStart,
}: {
  user: User
  onStart: (u: User) => void
}) {
  return (
    <div
      className='flex items-center gap-3 px-4 py-3'
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        className={`avatar-${user.avatarColor} flex items-center justify-center text-xs font-semibold relative flex-shrink-0`}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {getInitials(user.name)}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${user.online ? 'status-online' : 'status-offline'}`}
        />
      </div>
      <div className='flex-1 min-w-0'>
        <p
          className='text-sm font-medium truncate'
          style={{ color: 'var(--color-text-primary)' }}
        >
          {user.name}
        </p>
        <p
          className='text-xs'
          style={{
            color: user.online
              ? 'var(--color-online)'
              : 'var(--color-text-muted)',
          }}
        >
          {user.online ? 'Online' : 'Offline'}
        </p>
      </div>
      <button
        onClick={() => onStart(user)}
        className='text-xs font-medium px-3 py-1.5 transition-all'
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        Message
      </button>
    </div>
  )
}

function GroupResult({
  chat,
  currentUid,
  onJoin,
}: {
  chat: Chat
  currentUid: string
  onJoin: (c: Chat) => void
}) {
  const isMember = chat.members.includes(currentUid)
  return (
    <div
      className='flex items-center gap-3 px-4 py-3'
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        className='avatar-purple flex items-center justify-center flex-shrink-0'
        style={{
          width: '38px',
          height: '38px',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <svg
          width='18'
          height='18'
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
      </div>
      <div className='flex-1 min-w-0'>
        <p
          className='text-sm font-medium truncate'
          style={{ color: 'var(--color-text-primary)' }}
        >
          {chat.name}
        </p>
        <p className='text-xs' style={{ color: 'var(--color-text-muted)' }}>
          {chat.members.length} member{chat.members.length !== 1 ? 's' : ''} ·
          Private
        </p>
      </div>
      <button
        onClick={() => onJoin(chat)}
        className='text-xs font-medium px-3 py-1.5 transition-all'
        style={{
          background: isMember
            ? 'var(--color-primary-light)'
            : 'var(--color-primary)',
          color: isMember ? 'var(--color-primary)' : 'white',
          border: isMember ? '1px solid var(--color-primary-muted)' : 'none',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        {isMember ? 'Open' : 'Join'}
      </button>
    </div>
  )
}
