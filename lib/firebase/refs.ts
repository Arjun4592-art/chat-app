import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore'
import { db } from './config'
import type { User, Chat, Message, InviteLink, OtpRecord } from '@/types'

// ── Collection refs ───────────────────────────────────────────────────────────

export const usersCol = collection(db, 'users') as CollectionReference<User>
export const chatsCol = collection(db, 'chats') as CollectionReference<Chat>
export const invitesCol = collection(
  db,
  'invites',
) as CollectionReference<InviteLink>
export const otpCol = collection(
  db,
  'otpCodes',
) as CollectionReference<OtpRecord>

// ── Document refs ─────────────────────────────────────────────────────────────

export const userDoc = (uid: string) =>
  doc(db, 'users', uid) as DocumentReference<User>
export const chatDoc = (chatId: string) =>
  doc(db, 'chats', chatId) as DocumentReference<Chat>
export const inviteDoc = (code: string) =>
  doc(db, 'invites', code) as DocumentReference<InviteLink>

// ── Subcollection refs ────────────────────────────────────────────────────────

export const messagesCol = (chatId: string) =>
  collection(db, 'chats', chatId, 'messages') as CollectionReference<Message>

export const messageDoc = (chatId: string, msgId: string) =>
  doc(db, 'chats', chatId, 'messages', msgId) as DocumentReference<Message>

// ── Constants ─────────────────────────────────────────────────────────────────

export const GLOBAL_CHAT_ID = 'global'
