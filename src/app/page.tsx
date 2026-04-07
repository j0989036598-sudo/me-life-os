'use client'

import { useState, useEffect } from 'react'
import { GameProvider } from '@/lib/GameContext'
import { supabase, getProfile, type Profile, type UserRole } from '@/lib/supabase'
import LoginPage from '@/components/LoginPage'
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
import SettingsPage from '@/components/SettingsPage'

export type { UserRole }

const ROLE_PAGES: Record<UserRole, string[]> = {
  boss:    ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'settings', 'admin'],
  manager: ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'settings', 'admin'],
  member:  ['home', 'log', 'tasks', 'metronome', 'skills', 'explore', 'base', 'guild', 'market', 'settings'],
}

function AppContent() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [page, setPage] = useState('home')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const p = await getProfile(session.user.id)
        if (p) setProfile(p)
      }
      setReady(true)
    })
  }, [])

  const handleLogin = (p: Profile) => {
    setProfile(p)
    setPage('home')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setPage('home')
  }

  const handleProfileUpdate = (updated: Profile) => {
    setProfile(updated)
  }

  if (!ready) return null

  if (!profile) {
    return <LoginPage onLogin={handleLogin} />
  }

  const role = profile.role
  const allowedPages = ROLE_PAGES[role]
  const safePage = allowedPages.includes(page) ? page : 'home'

  const sidebarUser = {
    avatar: profile.avatar,
    name: profile.name,
    level: 1,
    title: profile.job_title || profile.department || '冒險者',
  }

  const renderPage = () => {
    switch (safePage) {
      case 'home':      return <HomePage user={sidebarUser} role={role} />
      case 'log':       return <DailyLogPage />
      case 'tasks':     return <TasksPage />
      case 'skills':    return <SkillsPage />
      case 'guild':     return <RankPage role={role} />
      case 'admin':     return <AdminPage />
      case 'metronome': return <MetronomePage />
      case 'market':    return <MarketPage />
      case 'explore':   return <ExplorePage />
      case 'base':      return <BasePage />
      case 'settings':  return <SettingsPage profile={profile} onProfileUpdate={handleProfileUpdate} />
      default:          return <HomePage user={sidebarUser} role={role} />
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <DesktopSidebar
        page={safePage}
        setPage={setPage}
        user={sidebarUser}
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
        {renderPage()}
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
