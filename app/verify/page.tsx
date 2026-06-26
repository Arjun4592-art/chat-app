import type { Metadata } from 'next'
import OtpVerifyForm from '@/components/auth/OTPVerifyForm'

export const metadata: Metadata = {
  title: 'Verify Email',
  description:
    'Enter the OTP sent to your email to verify your ChatSpace account.',
  robots: { index: false, follow: false },
}

export default function VerifyOtpPage() {
  return (
    <section
      aria-label='Verify email'
      className='min-h-screen w-full flex items-center justify-center px-4 py-10'
      style={{ background: 'var(--color-surface)' }}
    >
      <div className='w-full max-w-md'>
        <div className='flex flex-col items-center mb-8'>
          <div
            className='w-12 h-12 flex items-center justify-center mb-3'
            style={{
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              aria-hidden='true'
            >
              <path
                d='M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
              <path
                d='M22 6L12 13L2 6'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <h1
            className='text-2xl font-heading font-semibold'
            style={{ color: 'var(--color-text-primary)' }}
          >
            Verify your email
          </h1>
          <p
            className='text-sm mt-1 text-center'
            style={{ color: 'var(--color-text-muted)' }}
          >
            We sent a 6-digit code to your email
          </p>
        </div>

        <OtpVerifyForm />
      </div>
    </section>
  )
}
