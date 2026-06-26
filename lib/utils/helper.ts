import { AvatarColor } from '@/types'

// ── OTP hashing (SHA-256 via Web Crypto) ─────────────────────────────────────

export async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp + process.env.OTP_SALT)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyOtp(
  plain: string,
  hashed: string,
): Promise<boolean> {
  const h = await hashOtp(plain)
  return h === hashed
}

// ── Avatar color — deterministic from uid ────────────────────────────────────

const AVATAR_COLORS: AvatarColor[] = [
  'purple',
  'pink',
  'blue',
  'green',
  'orange',
  'teal',
]

export function getAvatarColor(uid: string): AvatarColor {
  let hash = 0
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ── Invite code generator (nanoid-style, no dep) ─────────────────────────────

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

export function generateInviteCode(length = 10): string {
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('')
}

// ── Timestamp helpers ─────────────────────────────────────────────────────────

export function now(): number {
  return Date.now()
}

export function formatTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(ms: number): string {
  const d = new Date(ms)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' })
  return d.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatLastSeen(ms: number): string {
  const diffMin = Math.floor((Date.now() - ms) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h ago`
  return formatDate(ms)
}

// ── String helpers ────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ── DM chat ID — deterministic from two uids ─────────────────────────────────

export function getDmChatId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join('__dm__')
}

// ── Guest helpers ─────────────────────────────────────────────────────────────

export function guestDisplayName(): string {
  const adj = ['Swift', 'Silent', 'Bright', 'Calm', 'Bold', 'Sharp']
  const noun = ['Fox', 'Owl', 'Wolf', 'Bear', 'Hawk', 'Lynx']
  const num = Math.floor(Math.random() * 900) + 100
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${num}`
}

// ── Class name helper ─────────────────────────────────────────────────────────

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
