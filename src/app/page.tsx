'use client'

import { useState, useEffect } from 'react'
import { GameProvider } from '@/lib/GameContext'
import { useTheme } from '@/lib/ThemeContext'
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

const PAGE_LABELS: Record<string, string> = {
  home: '🏠 冒險首頁',
  dashboard: '📊 儀表板',
  log: '📖 賢者之書',
  tasks: '⚡ 任務中心',
  metronome: '⏱️ 節拍器',
  skills: '🌳 技能樹',
  guild: '⚔️ 公會',
  market: '🏪 市集',
  rewards: '🎁 獎勵中心',
  performance: '📈 績效報表',
  'team-logs': '📋 員工日誌',
  'task-delegate': '📝 任務委托',
  settings: '⚙️ 個人設定',
  admin: '👁️ 管理後台',
}

function AppContent({ profile, onLogout, onProfileUpdate }: { profile: Profile; onLogout: () => void; onProfileUpdate: (p: Profile) => void }) {
  const [page, setPage] = useState('home')
  const { theme, toggleTheme } = useTheme()

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
    <div className="min-h-screen"
      style={{ background: 'var(--wood-dark)', padding: '6px' }}
    >
      {/* 外框 */}
      <div className="flex flex-col min-h-screen"
        style={{
          border: '8px solid var(--wood-frame)',
          borderTopColor: 'var(--wood-highlight)',
          borderLeftColor: 'var(--wood-light)',
          borderRightColor: 'var(--wood-mid)',
          borderBottomColor: 'var(--wood-dark)',
          boxShadow: 'inset 0 0 0 3px var(--wood-darkest), 0 0 0 3px #1a0e06, inset 2px 2px 0 var(--wood-shine)',
          background: 'var(--bg-900)',
        }}
      >
        {/* 頂部選單列（桌面） */}
        <DesktopSidebar page={safePage} setPage={setPage} user={sidebarUser} role={role} allowedPages={allowedPages} onLogout={onLogout} />

        {/* 主內容區 */}
        <main className="flex-1 md:mt-[48px] md:mb-[80px] pb-20 md:pb-0 overflow-y-auto">
          {/* 頂部導航列：麵包屑 + 通知 + 主題切換 */}
          <div className="sticky top-0 z-20 px-4 md:px-6 py-2 flex items-center justify-between"
            style={{
              background: 'linear-gradient(180deg, var(--wood-mid) 0%, var(--wood-dark) 100%)',
              borderBottom: '3px solid var(--wood-darkest)',
            }}
          >
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--text-dim)', fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>⚔️ ME Life OS</span>
              <span style={{ color: 'var(--wood-frame)' }}>›</span>
              <span style={{ color: 'var(--rpg-gold)', fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                {PAGE_LABELS[safePage] || safePage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center text-lg cursor-pointer"
                style={{
                  width: '28px', height: '28px',
                  background: 'var(--wood-frame)',
                  border: '2px solid var(--wood-dark)',
                  borderTopColor: 'var(--wood-highlight)',
                  borderLeftColor: 'var(--wood-light)',
                  boxShadow: '1px 1px 0 rgba(0,0,0,0.3)',
                }}
                title={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
              <NotificationCenter userId={profile.user_id} onNavigate={setPage} />
            </div>
          </div>

          <div className="p-3 md:p-6">
            {renderPage()}
          </div>
        </main>

        {/* 手機底部導航 */}
        <BottomTabBar page={safePage} setPage={setPage} allowedPages={allowedPages} onLogout={onLogout} />
      </div>
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
