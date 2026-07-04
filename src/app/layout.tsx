import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'

// -- NEXTAUTH (re-enable by uncommenting and wrapping children in SessionProvider) --
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { SessionProvider } from '@/components/SessionProvider'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Connection — AI Voice Assistant',
  description:
    'Conversational AI voice assistant powered by Gemini — wake-word activation, live speech recognition, and an audio-reactive orb.',
}

export const viewport: Viewport = {
  themeColor: '#07060d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // -- NEXTAUTH (re-enable) --
  // const session = await getServerSession(authOptions)
  // return <html><body><SessionProvider session={session}>{children}</SessionProvider></body></html>

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} h-full`}>
      <body className="h-full m-0 overflow-hidden font-body bg-void text-ink">
        {children}
      </body>
    </html>
  )
}
