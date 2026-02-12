import type { Metadata } from 'next'
import { Fredoka, Nunito, Playfair_Display, Bebas_Neue, Inter } from 'next/font/google'
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

export const metadata: Metadata = {
  title: {
    default: 'Bridezilla Demo',
    template: '%s | Bridezilla',
  },
  description: 'Demo wedding website - Experience Bridezilla',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable} ${playfair.variable} ${bebasNeue.variable} ${inter.variable} font-sans antialiased`}>
        <Providers>
          <DevToolsLoader />
          <ValidationNotifications />
          {children}
        </Providers>
      </body>
    </html>
  )
}

