'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { onSnapshot } from 'firebase/firestore'
import { auth } from '@/lib/firebase/config'
import { userDoc } from '@/lib/firebase/refs'
import { now } from '@/lib/utils/helper'
import { GUEST_INACTIVITY_MS, GUEST_DELETE_DELAY_MS } from '@/types'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  firebaseUid: string | null
  loading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  firebaseUid: null,
  loading: true,
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUid, setFbUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unsubUserDoc = useRef<(() => void) | null>(null)

  // ── Logout ──────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    if (user?.type === 'guest') {
      // Store logout time for 30-min deletion window
      const { updateDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      const deleteAt = now() + GUEST_DELETE_DELAY_MS
      await updateDoc(userDoc(user.uid), {
        online: false,
        logoutAt: now(),
        deleteAt,
      })
      // Schedule cleanup via API
      fetch('/api/guest/schedule-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid, deleteAt }),
      }).catch(() => {})
    } else if (user) {
      const { updateDoc } = await import('firebase/firestore')
      const { db } = await import('@/lib/firebase/config')
      await updateDoc(userDoc(user.uid), { online: false, lastSeen: now() })
    }
    clearInactivityTimer()
    await signOut(auth)
  }, [user])

  // ── Guest inactivity timer ──────────────────────────────────────────────────

  function clearInactivityTimer() {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
  }

  const resetInactivityTimer = useCallback(() => {
    if (!user || user.type !== 'guest') return
    clearInactivityTimer()
    inactivityTimer.current = setTimeout(() => {
      logout()
    }, GUEST_INACTIVITY_MS)
  }, [user, logout])

  // Bind activity events for guests
  useEffect(() => {
    if (!user || user.type !== 'guest') return
    const events = [
      'mousemove',
      'keydown',
      'pointerdown',
      'touchstart',
      'scroll',
    ]
    events.forEach((e) =>
      window.addEventListener(e, resetInactivityTimer, { passive: true }),
    )
    resetInactivityTimer() // start timer immediately
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer))
      clearInactivityTimer()
    }
  }, [user, resetInactivityTimer])

  // ── Auth state listener ─────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      // Cleanup previous user doc listener
      unsubUserDoc.current?.()

      if (!fbUser) {
        setUser(null)
        setFbUid(null)
        setLoading(false)
        return
      }

      setFbUid(fbUser.uid)

      // Realtime listener on user doc
      unsubUserDoc.current = onSnapshot(userDoc(fbUser.uid), (snap) => {
        if (snap.exists()) {
          setUser(snap.data() as User)
        }
        setLoading(false)
      })

      // Mark online
      const { updateDoc } = await import('firebase/firestore')
      updateDoc(userDoc(fbUser.uid), { online: true, lastSeen: now() }).catch(
        () => {},
      )
    })

    return () => {
      unsub()
      unsubUserDoc.current?.()
    }
  }, [])

  // Mark offline on tab close
  useEffect(() => {
    const handleUnload = () => {
      if (user) {
        navigator.sendBeacon(
          '/api/user/offline',
          JSON.stringify({ uid: user.uid, isGuest: user.type === 'guest' }),
        )
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, firebaseUid, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
