'use client'

import { useState } from 'react'
import { useGame } from '@/lib/GameContext'
import { UserRole } from '@/app/page'

const ROLE_LABELS: Record<UserRole, { label: string; color: string; icon: string }> = {
  boss: { label: '老闆', color: 'text-amber-400', icon: '👑' },
  manager: { label: '主管', color: 'text-blue-400', icon: '🛡️' },
  member: { label: '員工', color: 'text-purple-400', icon: '⚔️' },
}

/* ── 選單分組，對應參考圖頂部 tab ── */
const MENU_GROUPS: { id: string; label: string; icon: string; pages: string[] }[] = [
  { id: 'file', label: 'FILE', icon: '🔧', pages: ['settings', 'admin'] },
  { id: 'edit', label: 'EDIT', icon: '📝', pages: ['log', 'tasks'] },
  { id: 'view', label: 'VIEW', icon: '👁️', pages: ['dashboard', 'performance'] },
  { id: 'corp', label: 'CORP.', icon: '🏢', pages: ['home'] },
  { id: 'battle', label: 'BATTLE', icon: '⚔️', pages: ['metronome', 'task-delegate'] },
  { id: 'map', label: 'MAP', icon: '🗺️', pages: ['guild', 'skills'] },
  { id: 'system', label: 'SYSTEM', icon: '⚙️', pages: ['market', 'rewards', 'team-logs'] },
]

const ALL_NAV = [
  { id: 'home', icon: '🏠', label: '冒險首頁' },
  { id: 'dashboard', icon: '📊', label: '儀表板' },
  { id: 'log', icon: '📖', label: '賢者之書' },
  { id: 'tasks', icon: '⚡', label: '任務中心' },
  { id: 'metronome', icon: '⏱️', label: '節拍器' },
  { id: 'skills', icon: '🌳', label: '技能樹' },
  { id: 'guild', icon: '⚔️', label: '公會' },
  { id: 'market', icon: '🏪', label: '市集' },
  { id: 'rewards', icon: '🎁', label: '獎勵中心' },
  { id: 'team-logs', icon: '📋', label: '員工日誌' },
  { id: 'performance', icon: '📈', label: '績效報表' },
  { id: 'task-delegate', icon: '📝', label: '任務委托' },
  { id: 'settings', icon: '⚙️', label: '個人設定' },
  { id: 'admin', icon: '👁️', label: '管理後台' },
]

interface SidebarProps {
  page: string
  setPage: (page: string) => void
  user: { avatar: string; name: string; level: number; title: string }
  role: UserRole
  allowedPages: string[]
  onLogout: () => void
}

/* ═══════════════════════════════════════
   桌面版：頂部選單列（FILE/EDIT/VIEW...）
   ═══════════════════════════════════════ */
export function DesktopSidebar({ page, setPage, user, role, allowedPages, onLogout }: SidebarProps) {
  const { state } = useGame()
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const handleTabClick = (group: typeof MENU_GROUPS[0]) => {
    // 如果群組只有一個可用頁面，直接導航
    const available = group.pages.filter(p => allowedPages.includes(p))
    if (available.length === 1) {
      setPage(available[0])
      setOpenMenu(null)
    } else if (available.length > 0) {
      setOpenMenu(openMenu === group.id ? null : group.id)
    }
  }

  const currentGroup = MENU_GROUPS.find(g => g.pages.includes(page))

  return (
    <div className="hidden md:block">
      {/* 頂部選單列 */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-stretch"
        style={{
          background: 'linear-gradient(180deg, var(--wood-light) 0%, var(--wood-frame) 60%, var(--wood-mid) 100%)',
          borderBottom: '4px solid var(--wood-dark)',
          minHeight: '44px',
        }}
      >
        {MENU_GROUPS.map((group) => {
          const available = group.pages.filter(p => allowedPages.includes(p))
          if (available.length === 0) return null
          const isActive = currentGroup?.id === group.id

          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => handleTabClick(group)}
                className="flex items-center gap-1.5 px-4 h-full"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '10px',
                  color: isActive ? 'var(--rpg-gold)' : 'var(--text-primary)',
                  textShadow: '1px 1px 0 rgba(0,0,0,0.6)',
                  letterSpacing: '1px',
                  background: isActive ? 'var(--bg-700)' : 'transparent',
                  borderLeft: '3px solid transparent',
                  borderRight: '3px solid transparent',
                  borderTop: '3px solid transparent',
                  borderTopColor: isActive ? 'var(--wood-highlight)' : 'transparent',
                  borderLeftColor: isActive ? 'var(--wood-light)' : 'transparent',
                  borderRightColor: isActive ? 'var(--wood-mid)' : 'transparent',
                  marginTop: '4px',
                }}
              >
                <span style={{ fontSize: '12px' }}>{group.icon}</span>
                {group.label}
              </button>

              {/* 下拉選單 */}
              {openMenu === group.id && available.length > 1 && (
                <div
                  className="absolute top-full left-0 z-50 min-w-[200px]"
                  style={{
                    background: 'var(--bg-700)',
                    border: '4px solid var(--wood-frame)',
                    borderTopColor: 'var(--wood-highlight)',
                    borderLeftColor: 'var(--wood-light)',
                    borderRightColor: 'var(--wood-mid)',
                    borderBottomColor: 'var(--wood-dark)',
                    boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
                  }}
                >
                  {available.map(pid => {
                    const nav = ALL_NAV.find(n => n.id === pid)
                    if (!nav) return null
                    return (
                      <button
                        key={pid}
                        onClick={() => { setPage(pid); setOpenMenu(null) }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-none"
                        style={{
                          color: page === pid ? 'var(--rpg-gold)' : 'var(--text-primary)',
                          background: page === pid ? 'rgba(232,200,64,0.08)' : 'transparent',
                          borderBottom: '2px solid var(--wood-dark)',
                        }}
                      >
                        <span>{nav.icon}</span>
                        <span>{nav.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* 右側：用戶資訊 */}
        <div className="ml-auto flex items-center gap-3 px-4" style={{ fontSize: '12px' }}>
          <span style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px', color: 'var(--rpg-gold)' }}>
            Lv.{state.level}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>{user.name}</span>
          <div
            className="flex items-center justify-center text-xl"
            style={{
              width: '32px', height: '32px',
              background: 'var(--wood-darkest)',
              border: '3px solid var(--wood-highlight)',
              boxShadow: '2px 2px 0 rgba(0,0,0,0.4)',
            }}
          >
            {user.avatar}
          </div>
          <button
            onClick={onLogout}
            className="text-sm"
            style={{ color: 'var(--rpg-red)' }}
            title="登出"
          >🚪</button>
        </div>
      </div>

      {/* 底部資源列 + 動作按鈕 */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* 圖標工具列 */}
        <div className="flex items-center gap-0.5 px-2 py-1"
          style={{
            background: 'linear-gradient(180deg, var(--wood-mid) 0%, var(--wood-dark) 100%)',
            borderTop: '3px solid var(--wood-frame)',
            borderBottom: '2px solid var(--wood-dark)',
          }}
        >
          {['🔧', '📊', '⬆️', '⬇️'].map((icon, i) => (
            <div key={i}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '28px', height: '28px',
                background: 'var(--wood-frame)',
                border: '2px solid var(--wood-dark)',
                borderTopColor: 'var(--wood-highlight)',
                borderLeftColor: 'var(--wood-light)',
                fontSize: '14px',
                boxShadow: '1px 1px 0 rgba(0,0,0,0.3)',
              }}
            >{icon}</div>
          ))}
          <div style={{ width: '2px', height: '22px', background: 'var(--wood-dark)', margin: '0 4px' }} />
          {['👤', '🏗️', '⚔️', '📦'].map((icon, i) => (
            <div key={i}
              className="flex items-center justify-center cursor-pointer"
              style={{
                width: '28px', height: '28px',
                background: 'var(--wood-frame)',
                border: '2px solid var(--wood-dark)',
                borderTopColor: 'var(--wood-highlight)',
                borderLeftColor: 'var(--wood-light)',
                fontSize: '14px',
                boxShadow: '1px 1px 0 rgba(0,0,0,0.3)',
              }}
            >{icon}</div>
          ))}
        </div>

        {/* 動作按鈕 + 資源 */}
        <div className="flex items-center px-2 py-1 gap-1"
          style={{
            background: 'linear-gradient(180deg, var(--wood-frame) 0%, var(--wood-mid) 50%, var(--wood-dark) 100%)',
            borderTop: '3px solid var(--wood-highlight)',
          }}
        >
          {['CONSTRUCT', 'RECRUIT', 'INVEST', 'ATTACK'].map(label => (
            <button key={label} className="pixel-btn" style={{ padding: '5px 12px', fontSize: '9px', fontFamily: '"Press Start 2P", monospace', letterSpacing: '1px' }}>
              {label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-4 pr-2">
            <span className="flex items-center gap-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}>
              <span>🪵</span><span style={{ color: 'var(--text-dim)', fontSize: '7px' }}>WOOD:</span><span style={{ color: 'var(--text-primary)' }}>{state.gold > 0 ? Math.floor(state.gold * 1.5).toLocaleString() : '0'}</span>
            </span>
            <span className="flex items-center gap-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}>
              <span>🪨</span><span style={{ color: 'var(--text-dim)', fontSize: '7px' }}>STONE:</span><span style={{ color: 'var(--text-primary)' }}>{state.sp > 0 ? (state.sp * 50).toLocaleString() : '0'}</span>
            </span>
            <span className="flex items-center gap-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}>
              <span>⛏️</span><span style={{ color: 'var(--text-dim)', fontSize: '7px' }}>IRON:</span><span style={{ color: 'var(--text-primary)' }}>{state.diamond > 0 ? (state.diamond * 100).toLocaleString() : '0'}</span>
            </span>
            <span className="flex items-center gap-1" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}>
              <span style={{ color: 'var(--rpg-purple)' }}>🔮</span><span style={{ color: 'var(--rpg-pink)', fontSize: '7px' }}>MANA:</span><span style={{ color: 'var(--rpg-pink)' }}>{state.xp > 0 ? Math.floor(state.xp / 10).toLocaleString() : '0'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 點擊外部關閉下拉選單 */}
      {openMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════
   手機版：底部 Tab（維持基本導航）
   ═══════════════════════════════════════ */
export function BottomTabBar({ page, setPage, allowedPages, onLogout }: {
  page: string; setPage: (page: string) => void; allowedPages: string[]; onLogout?: () => void
}) {
  const mobileNav = ALL_NAV.filter(n =>
    ['home', 'log', 'tasks', 'rewards'].includes(n.id) && allowedPages.includes(n.id)
  )

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'linear-gradient(180deg, var(--wood-frame) 0%, var(--wood-dark) 100%)',
        borderTop: '4px solid var(--wood-highlight)',
      }}
    >
      <div className="flex items-stretch">
        {mobileNav.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-none"
            style={{
              color: page === n.id ? 'var(--rpg-gold)' : 'var(--text-dim)',
              textShadow: page === n.id ? '0 0 6px rgba(232,200,64,0.4)' : 'none',
            }}
          >
            <span className="text-xl">{n.icon}</span>
            <span style={{ fontSize: '10px' }}>{n.label}</span>
            {page === n.id && (
              <div style={{ position: 'absolute', bottom: 0, width: '32px', height: '3px', background: 'var(--rpg-gold)' }} />
            )}
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
  const [open, setOpen] = useState(false)
  const moreItems = ALL_NAV.filter(n =>
    !['home', 'log', 'tasks', 'rewards'].includes(n.id) && allowedPages.includes(n.id)
  )

  return (
    <div className="flex-1 relative">
      <button onClick={() => setOpen(!open)}
        className="w-full h-full flex flex-col items-center justify-center py-3 gap-1 transition-none"
        style={{ color: moreItems.some(n => n.id === page) ? 'var(--rpg-gold)' : 'var(--text-dim)' }}
      >
        <span className="text-xl">⋯</span>
        <span style={{ fontSize: '10px' }}>更多</span>
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 overflow-hidden"
          style={{
            background: 'var(--bg-700)',
            border: '4px solid var(--wood-frame)',
            borderTopColor: 'var(--wood-highlight)',
            borderLeftColor: 'var(--wood-light)',
            borderRightColor: 'var(--wood-mid)',
            borderBottomColor: 'var(--wood-dark)',
            boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
          }}
        >
          {moreItems.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setOpen(false) }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-none"
              style={{
                color: page === n.id ? 'var(--rpg-gold)' : 'var(--text-primary)',
                background: page === n.id ? 'rgba(232,200,64,0.08)' : 'transparent',
                borderBottom: '2px solid var(--wood-dark)',
              }}
            >
              <span>{n.icon}</span><span>{n.label}</span>
            </button>
          ))}
          {onLogout && (
            <>
              <div style={{ borderTop: '2px solid var(--wood-mid)' }} />
              <button onClick={() => { onLogout(); setOpen(false) }}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-none"
                style={{ color: 'var(--rpg-red)' }}
              >
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
