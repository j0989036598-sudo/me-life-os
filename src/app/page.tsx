'use client'

import { useState, useEffect } from 'react'
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

const ROLE_PAGES: Record<UserRole, string[]> = {
  boss:    ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'admin'],
  manager: ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'admin'],
  member:  ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market'],
}

export type { UserRole }

function AppContent() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [page, setPage] = useState('home')
  const [ready, setReady] = useState(false)

  // 初始化：先從 URL 參數讀角色，再從 localStorage 讀
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRole = params.get('role') as UserRole | null
    const validRoles: UserRole[] = ['boss', 'manager', 'member']

    if (urlRole && validRoles.includes(urlRole)) {
      // URL 有帶角色 → 直接登入並存到 localStorage
      setRole(urlRole)
      localStorage.setItem('melife_role', urlRole)
    } else {
      // 沒有 URL 參數 → 從 localStorage 讀取上次登入的角色
      const saved = localStorage.getItem('melife_role') as UserRole | null
      if (saved && validRoles.includes(saved)) {
        setRole(saved)
      }
    }
    setReady(true)
  }, [])

  // 登入：存到 localStorage
  const handleLogin = (selectedRole: UserRole) => {
    localStorage.setItem('melife_role', selectedRole)
    setRole(selectedRole)
    setPage('home')
  }

  // 登出：清除 localStorage 和 URL 參數
  const handleLogout = () => {
    localStorage.removeItem('melife_role')
    // 清除 URL 參數
    const url = new URL(window.location.href)
    url.searchParams.delete('role')
    window.history.replaceState({}, '', url.toString())
    setRole(null)
    setPage('home')
  }

  // 等待讀取完成再渲染，避免閃爍
  if (!ready) return null

  if (!role) {
    return <LoginPage onLogin={handleLogin} />
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

  const safePage = allowedPages.includes(page) ? page : 'home'
  const PageComponent = allPages[safePage] || HomePage

  return (
    <div className="min-h-screen bg-dark-900">
      <DesktopSidebar
        page={safePage}
        setPage={setPage}
        user={MOCK_USER}
        role={role}
        allowedPages={allowedPages}
        onLogout={handleLogout}
      />
      <BottomTabBar
        page={safePage}
        setPage={setPage}
        allowedPages={allowedPages}
        onLogout={handleLogout}
      />
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
