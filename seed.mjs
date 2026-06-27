// seed.mjs — run with: node seed.mjs
// Creates the global chat document in Firestore

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

// ── Load .env.local manually ──────────────────────────────────────────────────
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envFile.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const idx = trimmed.indexOf('=')
  if (idx === -1) continue
  const key = trimmed.slice(0, idx).trim()
  let val = trimmed.slice(idx + 1).trim()
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
  env[key] = val
}

// ── Init Firebase Admin ───────────────────────────────────────────────────────
initializeApp({
  credential: cert({
    projectId: env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})

const db = getFirestore()

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding Firestore...')

  const globalRef = db.collection('chats').doc('global')
  const snap = await globalRef.get()

  if (snap.exists) {
    console.log('✅ Global chat already exists — skipping.')
  } else {
    await globalRef.set({
      id: 'global',
      type: 'global',
      name: 'Global Room',
      members: [],
      createdBy: null,
      createdAt: Date.now(),
      lastMessage: null,
      lastMessageAt: null,
      lastMessageSenderId: null,
      isPrivate: false,
      inviteCode: null,
      photoURL: null,
    })
    console.log('✅ Global chat created!')
  }

  console.log('🎉 Seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
