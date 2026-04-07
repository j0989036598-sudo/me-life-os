'use client'

import { useState } from 'react'
import { MOCK_USER } from '@/lib/mockData'
import { GameProvider } from '@/lib/GameContext'
import LoginPage, { UserRole } from '@/components/LoginPage'
import { DesktopSidebar, BottomTabBar } from '@/components/Sidebar'
import HomePage from '@/components/HomePage'
import DailyLogPage from '@/components/DailyLogPage'
import TasksPage from '@/components/TasksPage'
import SkillsPage from '@/components/SkillsPage'
import RankPage from '@/components/RankPage'
import AdminPage from '@/components/AdminPage'
import MetronomePage from '@/components/MetronomePage'
import MarketPage from '@/components/MarketPage'
import ExplorePage from '@/components/ExplorePage'
import BasePage from '@/components/BasePage'

// 各角色可使用的頁面
const ROLE_PAGES: Record<UserRole, string[]> = {
  boss:    ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'admin'],
  manager: ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'admin'],
  member:  ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market'],
}

export type { UserRole }

function AppContent() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [page, setPage] = useState('home')

  if (!role) {
    return <LoginPage onLogin={(selectedRole) => { setRole(selectedRole); setPage('home') }} />
  }

  const allowedPages = ROLE_PAGES[role]

  const allPages: Record<string, React.ComponentType<any>> = {
    home:      HomePage,
    log:       DailyLogPage,
    tasks:     TasksPage,
    skills:    SkillsPage,
    guild:     RankPage,
    admin:     AdminPage,
    metronome: MetronomePage,
    market:    MarketPage,
    explore:   ExplorePage,
    base:      BasePage,
  }

  // 如果目前頁面不在權限內，自動跳回首頁
  const safePage = allowedPages.includes(page) ? page : 'home'
  const PageComponent = allPages[safePage] || HomePage

  return (
    <div className="min-h-screen bg-dark-900">
      {/* 桌機版左側欄 */}
      <DesktopSidebar
        page={safePage}
        setPage={setPage}
        user={MOCK_USER}
        role={role}
        allowedPages={allowedPages}
        onLogout={() => setRole(null)}
      />
      {/* 手機版底部 Tab Bar */}
      <BottomTabBar
        page={safePage}
        setPage={setPage}
        allowedPages={allowedPages}
      />
      {/* 主內容區：桌機 ml-64，手機無縮排；底部 padding 避免被 Tab Bar 遮住 */}
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen">
        <PageComponent user={MOCK_USER} role={role} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  )
}
