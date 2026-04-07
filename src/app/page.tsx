'use client'

import { useState, useEffect } from 'react'
import { MOCK_USER } from '@/lib/mockData'
import { GameProvider } from '@/lib/GameContext'
import { supabase } from '@/lib/supabase'
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

  useEffect(() => {
        const validRoles: UserRole[] = ['boss', 'manager', 'member']

                // 優先讀 URL 參數（直連連結）
                const params = new URLSearchParams(window.location.search)
        const urlRole = params.get('role') as UserRole | null
        if (urlRole && validRoles.includes(urlRole)) {
                setRole(urlRole)
                localStorage.setItem('melife_role', urlRole)
                setReady(true)
                return
        }

                // 沒有 URL 參數 → 檢查 Supabase session + localStorage
                supabase.auth.getSession().then(({ data: { session } }) => {
                        if (session) {
                                  const saved = localStorage.getItem('melife_role') as UserRole | null
                                  if (saved && validRoles.includes(saved)) {
                                              setRole(saved)
                                  }
                        }
                        setReady(true)
                })
  }, [])

  const handleLogin = (selectedRole: UserRole) => {
        localStorage.setItem('melife_role', selectedRole)
        setRole(selectedRole)
        setPage('home')
  }

  const handleLogout = async () => {
        await supabase.auth.signOut()
        localStorage.removeItem('melife_role')
        const url = new URL(window.location.href)
        url.searchParams.delete('role')
        window.history.replaceState({}, '', url.toString())
        setRole(null)
        setPage('home')
  }

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
