// ── User ──────────────────────────────────────────────────────────────────────

export type UserType = 'registered' | 'guest'

export type AvatarColor =
  | 'purple'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'teal'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export interface User {
  uid: string
  name: string
  email: string | null
  photoURL: string | null
  type: UserType
  online: boolean
  lastSeen: number
  createdAt: number
  age?: number | null
  gender?: Gender | null
  logoutAt?: number | null
  deleteAt?: number | null
  otpVerified: boolean
  avatarColor: AvatarColor
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface OtpRecord {
  email: string
  otp: string
  expiresAt: number
  attempts: number
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export type ChatType = 'global' | 'dm' | 'group'

export interface Chat {
  id: string
  type: ChatType
  name: string | null
  members: string[]
  createdBy: string | null
  createdAt: number
  lastMessage: string | null
  lastMessageAt: number | null
  lastMessageSenderId: string | null
  isPrivate: boolean
  inviteCode: string | null
  photoURL: string | null
  unreadCount?: Record<string, number>
}

// ── Message ───────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'file' | 'system'

export interface Message {
  id: string
  chatId: string
  senderId: string
  senderName: string
  senderAvatarColor: AvatarColor
  type: MessageType
  text: string | null
  fileURL: string | null
  fileName: string | null
  createdAt: number
  readBy: string[]
  deleted: boolean
  edited?: boolean // ← new
}

// ── Invite ────────────────────────────────────────────────────────────────────

export interface InviteLink {
  code: string
  chatId: string
  createdBy: string
  createdAt: number
  expiresAt: number | null
}

// ── Store / UI ────────────────────────────────────────────────────────────────

export interface ChatPreview extends Chat {
  otherUser?: User | null
  unread: number
}

export interface MessageWithSender extends Message {
  isOwn: boolean
  showAvatar: boolean
  showTimestamp: boolean
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}

// ── Guest session ─────────────────────────────────────────────────────────────

export const GUEST_INACTIVITY_MS = 5 * 60 * 1000
export const GUEST_DELETE_DELAY_MS = 30 * 60 * 1000
