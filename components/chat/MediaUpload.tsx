'use client'

import { useRef, useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase/config'

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadResult {
  url: string
  name: string
  type: 'image' | 'file'
  mimeType: string
}

interface MediaUploadProps {
  chatId: string
  onUpload: (result: UploadResult) => void
  onError: (msg: string) => void
}

export default function MediaUpload({
  chatId,
  onUpload,
  onError,
}: MediaUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  function handleClick() {
    inputRef.current?.click()
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input
    e.target.value = ''

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Only images and documents (PDF, DOC, DOCX, TXT) are allowed.')
      return
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      onError('File size must be under 10MB.')
      return
    }

    const isImage = file.type.startsWith('image/')
    const fileName = `${Date.now()}_${file.name}`
    const storageRef = ref(storage, `chats/${chatId}/${fileName}`)

    const task = uploadBytesResumable(storageRef, file)

    task.on(
      'state_changed',
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        setProgress(pct)
      },
      (err) => {
        console.error('Upload error:', err)
        onError('Upload failed. Please try again.')
        setProgress(null)
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        setProgress(null)
        onUpload({
          url,
          name: file.name,
          type: isImage ? 'image' : 'file',
          mimeType: file.type,
        })
      },
    )
  }

  return (
    <div className='relative flex-shrink-0'>
      <input
        ref={inputRef}
        type='file'
        accept='image/*,.pdf,.doc,.docx,.txt'
        onChange={handleChange}
        className='hidden'
        aria-label='Upload file'
      />

      <button
        onClick={handleClick}
        disabled={progress !== null}
        aria-label='Attach file'
        className='icon-btn flex items-center justify-center transition-all'
        style={{
          width: '36px',
          height: '36px',
          background: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          cursor: progress !== null ? 'not-allowed' : 'pointer',
          color:
            progress !== null
              ? 'var(--color-primary)'
              : 'var(--color-text-muted)',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        {progress !== null ? (
          // Progress ring
          <svg width='18' height='18' viewBox='0 0 36 36' aria-hidden='true'>
            <circle
              cx='18'
              cy='18'
              r='14'
              fill='none'
              stroke='var(--color-border)'
              strokeWidth='3'
            />
            <circle
              cx='18'
              cy='18'
              r='14'
              fill='none'
              stroke='var(--color-primary)'
              strokeWidth='3'
              strokeDasharray={`${2 * Math.PI * 14}`}
              strokeDashoffset={`${2 * Math.PI * 14 * (1 - progress / 100)}`}
              strokeLinecap='round'
              transform='rotate(-90 18 18)'
            />
          </svg>
        ) : (
          <PaperclipIcon />
        )}
      </button>
    </div>
  )
}

function PaperclipIcon() {
  return (
    <svg
      width='17'
      height='17'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <g className='icon-outline'>
        <path
          d='M21.44 11.05L12.25 20.24C11.12 21.37 9.59 22 7.99 22C6.39 22 4.86 21.37 3.73 20.24C2.6 19.11 1.97 17.58 1.97 15.98C1.97 14.38 2.6 12.85 3.73 11.72L12.92 2.53C13.68 1.77 14.72 1.34 15.8 1.34C16.88 1.34 17.92 1.77 18.68 2.53C19.44 3.29 19.87 4.33 19.87 5.41C19.87 6.49 19.44 7.53 18.68 8.29L9.48 17.48C9.1 17.86 8.58 18.07 8.04 18.07C7.5 18.07 6.98 17.86 6.6 17.48C6.22 17.1 6.01 16.58 6.01 16.04C6.01 15.5 6.22 14.98 6.6 14.6L15.07 6.14'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
      <g className='icon-filled'>
        <path
          d='M21.44 11.05L12.25 20.24C11.12 21.37 9.59 22 7.99 22C6.39 22 4.86 21.37 3.73 20.24C2.6 19.11 1.97 17.58 1.97 15.98C1.97 14.38 2.6 12.85 3.73 11.72L12.92 2.53C13.68 1.77 14.72 1.34 15.8 1.34C16.88 1.34 17.92 1.77 18.68 2.53C19.44 3.29 19.87 4.33 19.87 5.41C19.87 6.49 19.44 7.53 18.68 8.29L9.48 17.48C9.1 17.86 8.58 18.07 8.04 18.07C7.5 18.07 6.98 17.86 6.6 17.48C6.22 17.1 6.01 16.58 6.01 16.04C6.01 15.5 6.22 14.98 6.6 14.6L15.07 6.14'
          fill='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
    </svg>
  )
}
