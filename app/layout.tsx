import type { Metadata } from 'next'
import { Space_Grotesk, Orbitron } from 'next/font/google'
import './globals.css'

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
})

const headingFont = Orbitron({
  subsets: ['latin'],
  variable: '--font-heading',
})

export const metadata: Metadata = {
  title: 'VoiceMemo Stream',
  description: 'Dual-panel voice-to-text memo board with unlimited history and comments.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
