// ── User ──────────────────────────────────────────────────────────────────────

export type UserType = 'registered' | 'guest'

export interface User {
  uid: string
  name: string
  email: string | null
  photoURL: string | null
  type: UserType
  online: boolean
  lastSeen: number // unix ms
  createdAt: number
  // Guest-specific
  logoutAt?: number | null // timestamp when guest logged out
  deleteAt?: number | null // logoutAt + 30min — scheduled cleanup time
  // OTP verification
  otpVerified: boolean
  // Avatar color (assigned on signup)
  avatarColor: AvatarColor
}

export type AvatarColor =
  | 'purple'
  | 'pink'
  | 'blue'
  | 'green'
  | 'orange'
  | 'teal'

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface OtpRecord {
  email: string
  otp: string // hashed
  expiresAt: number // unix ms (10 min)
  attempts: number // max 3
}

// ── Chat ──────────────────────────────────────────────────────────────────────

export type ChatType = 'global' | 'dm' | 'group'

export interface Chat {
  id: string
  type: ChatType
  name: string | null // group name / null for dm/global
  members: string[] // uids
  createdBy: string | null // uid of creator
  createdAt: number
  lastMessage: string | null
  lastMessageAt: number | null
  lastMessageSenderId: string | null
  // Group-specific
  isPrivate: boolean
  inviteCode: string | null // nanoid — for invite links
  photoURL: string | null // group avatar
  // Unread counts per user — stored as map
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
  readBy: string[] // uids who have read
  deleted: boolean
}

// ── Invite ────────────────────────────────────────────────────────────────────

export interface InviteLink {
  code: string
  chatId: string
  createdBy: string
  createdAt: number
  expiresAt: number | null // null = never
}

// ── Store / UI ────────────────────────────────────────────────────────────────

export interface ChatPreview extends Chat {
  otherUser?: User | null // for DM — the other person
  unread: number // unread count for current user
}

export interface MessageWithSender extends Message {
  isOwn: boolean
  showAvatar: boolean // show avatar if first in group or sender changed
  showTimestamp: boolean
}

// ── API responses ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
}

// ── Guest session ─────────────────────────────────────────────────────────────

export const GUEST_INACTIVITY_MS = 5 * 60 * 1000 // 5 minutes
export const GUEST_DELETE_DELAY_MS = 30 * 60 * 1000 // 30 minutes after logout
