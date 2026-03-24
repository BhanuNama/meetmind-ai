import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MeetMind AI — Your Meetings. Remembered. Actioned.',
  description: 'Transform meeting audio into structured, searchable, actionable intelligence powered by AI.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster
              richColors
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--surface)',
                  border: '1px solid var(--border-2)',
                  color: 'var(--text-1)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
