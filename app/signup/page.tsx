import type { Metadata } from 'next'
import SignupForm from '@/components/auth/SignUp'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your ChatSpace account and start messaging instantly.',
  openGraph: {
    title: 'Sign Up | ChatSpace',
    description: 'Create your ChatSpace account and start messaging instantly.',
  },
}

export default function SignupPage() {
  return (
    <section
      aria-label='Sign up'
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
                d='M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z'
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
            Create account
          </h1>
          <p
            className='text-sm mt-1'
            style={{ color: 'var(--color-text-muted)' }}
          >
            Join ChatSpace today
          </p>
        </div>

        <SignupForm />
      </div>
    </section>
  )
}
