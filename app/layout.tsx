import type { Metadata } from 'next'
import { Space_Grotesk, Changa } from 'next/font/google'
import '../styles/globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const changa = Changa({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-changa',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'EventZone CRM',
  description: 'Manage your event contacts and network in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${changa.variable}`}>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  )
}
