import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { Brain } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <Link href="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent)' }}>
            <Brain className="h-[15px] w-[15px] text-white" />
          </div>
          <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>MeetMind AI</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-1)' }}>
              Create account
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>
              Free forever on Groq free tier
            </p>
          </div>
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none border-0 p-0 bg-transparent',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton: `w-full h-10 rounded-xl text-sm font-semibold border transition-all`,
                formButtonPrimary: `w-full h-10 rounded-xl text-sm font-semibold btn-accent`,
                formFieldInput: `input-base w-full h-10 px-3 text-sm rounded-xl`,
                formFieldLabel: `text-xs font-semibold mb-1`,
                footerActionLink: `font-semibold`,
              },
              variables: {
                colorPrimary: '#6366f1',
                colorBackground: 'var(--surface)',
                colorText: 'var(--text-1)',
                colorTextSecondary: 'var(--text-2)',
                colorInputBackground: 'var(--surface)',
                colorInputText: 'var(--text-1)',
                borderRadius: '12px',
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
