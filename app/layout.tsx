import type { Metadata } from 'next'
import { Manrope, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
})

const headingFont = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Voice Memo Archive',
  description: 'Premium dark dual-channel voice memo board backed by Upstash Redis.',
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
