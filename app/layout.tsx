import type { Metadata } from 'next'
import { Fredoka, Nunito, Playfair_Display, Bebas_Neue, Inter, Cormorant_Garamond, Montserrat } from 'next/font/google'
import './globals.css'
import { DevToolsLoader } from '@/components/DevToolsLoader'
import { ValidationNotifications } from '@/components/ValidationNotifications'
import { Providers } from '@/components/Providers'

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['300', '400', '500', '600', '700'],
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  variable: '--font-bebas',
  weight: ['400'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://bridezilla-demo.vercel.app'),
  title: {
    default: 'Bridezilla - The AI Powered Workspace for Modern Wedding Planning',
    template: '%s | Bridezilla',
  },
  description: 'The AI powered workspace for modern wedding planning. For planners and couples.',
  openGraph: {
    title: 'Bridezilla - The AI Powered Workspace for Modern Wedding Planning',
    description: 'The AI powered workspace for modern wedding planning. For planners and couples.',
    siteName: 'Bridezilla',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bridezilla - The AI Powered Workspace for Modern Wedding Planning',
    description: 'The AI powered workspace for modern wedding planning. For planners and couples.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable} ${playfair.variable} ${bebasNeue.variable} ${inter.variable} ${cormorant.variable} ${montserrat.variable} font-sans antialiased`}>
        <Providers>
          <DevToolsLoader />
          <ValidationNotifications />
          {children}
        </Providers>
      </body>
    </html>
  )
}

