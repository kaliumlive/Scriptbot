import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scriptbot — Autonomous Content Agency',
  description: 'AI agents that run your social media 24/7',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-50 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
