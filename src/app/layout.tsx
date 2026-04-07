import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ME Life OS — 穎流行銷',
  description: '把工作變成冒險，把成長變成遊戲',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  )
}
