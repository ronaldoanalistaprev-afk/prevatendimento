import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './apple-design.css'

// Apple Design (skill): fonte Inter com tamanho óptico automático.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PrevAtendimento — SIAP',
  description: 'Central de Atendimento Multicanal (WhatsApp) — Aposentar',
}

// Dimensionamento correto no celular (base para o uso responsivo/PWA).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0F6273',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  )
}
