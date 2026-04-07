'use client'

import { useState } from 'react'
import { useGame } from '@/lib/GameContext'
import { UserRole } from '@/app/page'

const ROLE_LABELS: Record<UserRole, { label: string; color: string; icon: string }> = {
  boss: { label: '老闆', color: 'text-amber-400 bg-amber-500/10', icon: '👑' },
  manager: { label: '主管', color: 'text-blue-400 bg-blue-500/10', icon: '🛡️' },
  member: { label: '員工', color: 'text-purple-400 bg-purple-500/10', icon: '⚔️' },
}

const ALL_NAV = [
  { id: 'home', icon: '🏠', label: '首頁', badge: undefined },
  { id: 'log', icon: '📖', label: '賢者之書', badge: undefined },
  { id: 'tasks', icon: '⚡', label: '任務中心', badge: undefined },
  { id: 'metronome', icon: '⏱️', label: '節拍器', badge: undefined },
  { id: 'skills', icon: '🌳', label: '技能樹', badge: undefined },
  { id: 'guild', icon: '⚔️', label: '公會', badge: undefined },
  { id: 'market', icon: '🏪', label: '市集', badge: undefined },
  { id: 'team-logs', icon: '📋', label: '員工日誌', badge: undefined },
  { id: 'task-delegate', icon: '📝', label: '任務委托', badge: undefined },
  { id: 'settings', icon: '⚙️', label: '個人設定', badge: undefined },
  { id: 'admin', icon: '👁️', label: '管理後台', badge: undefined },
]

interface SidebarProps {
  page: string
  setPage: (page: string) => void
  user: { avatar: string; name: string; level: number; title: string }
  role: UserRole
  allowedPages: string[]
  onLogout: () => void
}

function NavItem({ icon, label, active, onClick, badge }: {
  icon: string; label: string; active: boolean; onClick: () => void; badge?: string
}) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 ${
      active ? 'bg-gradient-to-r from-purple-500/20 to-transparent text-white font-medium' : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600'
    }`}>
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
      {badge && <span className="ml-auto text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
  )
}

export function DesktopSidebar({ page, setPage, user, role, allowedPages, onLogout }: SidebarProps) {
  const { state } = useGame()
  const roleInfo = ROLE_LABELS[role]

  const mainNav = ALL_NAV.filter(n =>
    allowedPages.includes(n.id) && n.id !== 'admin' && n.id !== 'settings' && n.id !== 'team-logs' && n.id !== 'task-delegate'
  )
  const hasAdmin = allowedPages.includes('admin')
  const hasSettings = allowedPages.includes('settings')
  const hasTeamLogs = allowedPages.includes('team-logs')
  const hasTaskDelegate = allowedPages.includes('task-delegate')

  return (
    <div className="hidden md:flex w-64 min-h-screen bg-dark-800 border-r border-white/5 p-4 flex-col fixed left-0 top-0 z-20">
      <div className="flex items-center gap-3 mb-5 px-2">
        <span className="text-2xl">⚔️</span>
        <div>
          <div className="font-bold text-lg bg-gradient-to-r from-amber-400 to-purple-400 text-transparent bg-clip-text">ME Life OS</div>
          <div className="text-[10px] text-gray-500">穎流行銷</div>
        </div>
      </div>

      <div className="glass rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-2xl">{user.avatar}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{user.name}</div>
            <div className="text-[10px] text-gray-400">Lv.{state.level} · {user.title}</div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${roleInfo.color}`}>
            {roleInfo.icon} {roleInfo.label}
          </span>
        </div>
        <div className="w-full h-1.5 bg-dark-600 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-xp-500 to-xp-400 rounded-full progress-bar" style={{ width: `${(state.xp / state.xpMax) * 100}%` }} />
        </div>
        <div className="mt-1.5 grid grid-cols-4 gap-1 text-[10px]">
          <span className="text-xp-400">✦{state.xp}</span>
          <span className="text-gold-400">🪙{state.gold.toLocaleString()}</span>
          <span className="text-sp-400">🔮{state.sp}</span>
          <span className="text-blue-400">💎{state.diamond}</span>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
        {mainNav.map(n => (
          <NavItem key={n.id} icon={n.icon} label={n.label} active={page === n.id} onClick={() => setPage(n.id)} badge={n.badge} />
        ))}

        {(hasTeamLogs || hasTaskDelegate) && (
          <>
            <div className="border-t border-white/5 my-2" />
            {hasTeamLogs && <NavItem icon="📋" label="員工日誌" active={page === 'team-logs'} onClick={() => setPage('team-logs')} />}
            {hasTaskDelegate && <NavItem icon="📝" label="任務委托" active={page === 'task-delegate'} onClick={() => setPage('task-delegate')} />}
          </>
        )}

        {hasSettings && (
          <>
            <div className="border-t border-white/5 my-2" />
            <NavItem icon="⚙️" label="個人設定" active={page === 'settings'} onClick={() => setPage('settings')} />
          </>
        )}

        {hasAdmin && (
          <>
            <div className="border-t border-white/5 my-2" />
            <NavItem icon="👁️" label="管理後台" active={page === 'admin'} onClick={() => setPage('admin')} />
          </>
        )}
      </nav>

      <button onClick={onLogout} className="mt-4 flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm">
        <span>🚪</span><span>切換角色</span>
      </button>
      <div className="text-[10px] text-gray-600 px-2 mt-1">v2.0 · 遊戲化介面</div>
    </div>
  )
}

export function BottomTabBar({ page, setPage, allowedPages, onLogout }: {
  page: string; setPage: (page: string) => void; allowedPages: string[]; onLogout?: () => void
}) {
  const mobileNav = ALL_NAV.filter(n =>
    ['home', 'log', 'tasks', 'guild', 'market'].includes(n.id) && allowedPages.includes(n.id)
  )

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark-800 border-t border-white/5">
      <div className="flex items-stretch">
        {mobileNav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all relative ${
            page === n.id ? 'text-white' : 'text-gray-500'
          }`}>
            <span className={`text-xl transition-transform ${page === n.id ? 'scale-110' : ''}`}>{n.icon}</span>
            <span className="text-[10px]">{n.label}</span>
            {page === n.id && <div className="absolute bottom-0 w-8 h-0.5 bg-purple-400 rounded-full" />}
          </button>
        ))}
        <MobileMoreMenu page={page} setPage={setPage} allowedPages={allowedPages} onLogout={onLogout} />
      </div>
    </div>
  )
}

function MobileMoreMenu({ page, setPage, allowedPages, onLogout }: {
  page: string; setPage: (p: string) => void; allowedPages: string[]; onLogout?: () => void
}) {
  // useState is already imported at file top
  const [open, setOpen] = useState(false)
  const moreItems = ALL_NAV.filter(n =>
    !['home', 'log', 'tasks', 'guild', 'market'].includes(n.id) && allowedPages.includes(n.id)
  )

  return (
    <div className="flex-1 relative">
      <button onClick={() => setOpen(!open)} className={`w-full h-full flex flex-col items-center justify-center py-3 gap-1 transition-all ${
        moreItems.some(n => n.id === page) ? 'text-white' : 'text-gray-500'
      }`}>
        <span className="text-xl">⋯</span>
        <span className="text-[10px]">更多</span>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-dark-800 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {moreItems.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setOpen(false) }}
              className={`flex items-center gap-3 w-full px-4 py-3 text-sm transition-all ${
                page === n.id ? 'bg-purple-500/20 text-white' : 'text-gray-400 hover:bg-dark-600'
              }`}>
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
          {onLogout && (
            <>
              <div className="border-t border-white/5" />
              <button onClick={() => { onLogout(); setOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-all">
                <span>🚪</span><span>切換角色</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function Sidebar(props: SidebarProps) { return <DesktopSidebar {...props} /> }
