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
import SettingsPage from '@/components/SettingsPage'
import TeamLogsPage from '@/components/TeamLogsPage'
import TaskDelegatePage from '@/components/TaskDelegatePage'
import RewardPage from '@/components/RewardPage'
import PerformancePage from '@/components/PerformancePage'
import DashboardPage from '@/components/DashboardPage'
import NotificationCenter from '@/components/NotificationCenter'

export type { UserRole }

const ROLE_PAGES: Record<UserRole, string[]> = {
  boss:    ['home', 'dashboard', 'log', 'tasks', 'metronome', 'skills', 'guild', 'market', 'rewards', 'performance', 'team-logs', 'task-delegate', 'settings', 'admin'],
  manager: ['home', 'dashboard', 'log', 'tasks', 'metronome', 'skills', 'guild', 'market', 'rewards', 'performance', 'team-logs', 'task-delegate', 'settings', 'admin'],
  member:  ['home', 'log', 'tasks', 'metronome', 'skills', 'guild', 'market', 'rewards', 'task-delegate', 'settings'],
}

function AppContent({ profile, onLogout, onProfileUpdate }: { profile: Profile; onLogout: () => void; onProfileUpdate: (p: Profile) => void }) {
  const [page, setPage] = useState('home')

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
      case 'home': return <HomePage user={sidebarUser} role={role} userId={profile.user_id} />
      case 'dashboard': return <DashboardPage role={role} />
      case 'log': return <DailyLogPage role={role} profile={profile} />
      case 'tasks': return <TasksPage role={role} profile={profile} />
      case 'skills': return <SkillsPage profile={profile} />
      case 'guild': return <RankPage role={role} />
      case 'admin': return <AdminPage role={role} currentUserId={profile.user_id} />
      case 'metronome': return <MetronomePage profile={profile} />
      case 'market': return <MarketPage profile={profile} />
      case 'rewards': return <RewardPage profile={profile} role={role} />
      case 'performance': return <PerformancePage role={role} />
      case 'settings': return <SettingsPage profile={profile} onProfileUpdate={onProfileUpdate} />
      case 'team-logs': return <TeamLogsPage />
      case 'task-delegate': return <TaskDelegatePage currentUserId={profile.user_id} currentUserName={profile.name} currentRole={role} />
      default: return <HomePage user={sidebarUser} role={role} userId={profile.user_id} />
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <DesktopSidebar page={safePage} setPage={setPage} user={sidebarUser} role={role} allowedPages={allowedPages} onLogout={onLogout} />
      <BottomTabBar page={safePage} setPage={setPage} allowedPages={allowedPages} onLogout={onLogout} />
      {/* 通知鈴鐺（固定右上角） */}
      <div className="fixed top-4 right-4 z-30">
        <NotificationCenter userId={profile.user_id} onNavigate={setPage} />
      </div>
      <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8 min-h-screen">
        {renderPage()}
      </main>
    </div>
  )
}

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null)
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

  const handleLogin = (p: Profile) => setProfile(p)
  const handleLogout = async () => { await supabase.auth.signOut(); setProfile(null) }
  const handleProfileUpdate = (updated: Profile) => setProfile(updated)

  if (!ready) return null
  if (!profile) return <LoginPage onLogin={handleLogin} />

  return (
    <GameProvider userId={profile.user_id}>
      <AppContent profile={profile} onLogout={handleLogout} onProfileUpdate={handleProfileUpdate} />
    </GameProvider>
  )
}
