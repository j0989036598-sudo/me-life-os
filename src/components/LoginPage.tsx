'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getRolesForEmail, isEmailAllowed } from '@/lib/roleConfig'

export type UserRole = 'boss' | 'manager' | 'member'

const ROLE_CONFIG = {
  boss: {
    label: '老闆', title: '最高指揮官', icon: '👑',
    desc: '完整系統權限 · 所有數據總覽 · 系統設定',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-400/40 hover:border-amber-400',
    badge: 'text-amber-400 bg-amber-500/10',
  },
  manager: {
    label: '主管', title: '隊長', icon: '🛡️',
    desc: '管理所屬組員 · 審核任務 · 查看組別報告',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-400/40 hover:border-blue-400',
    badge: 'text-blue-400 bg-blue-500/10',
  },
  member: {
    label: '員工', title: '冒險者', icon: '⚔️',
    desc: '個人任務 · 技能成長 · 公會活動',
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-400/40 hover:border-purple-400',
    badge: 'text-purple-400 bg-purple-500/10',
  },
}

interface LoginPageProps {
  onLogin: (role: UserRole) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 檢查已登入的 session（處理 OAuth callback 返回）
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        handleAuthenticatedUser(session.user.email)
      }
    })

    // 監聽 auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        handleAuthenticatedUser(session.user.email)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthenticatedUser = (email: string) => {
    if (!isEmailAllowed(email)) {
      setError(`${email} 沒有系統存取權限，請聯繫管理員。`)
      supabase.auth.signOut()
      return
    }
    const roles = getRolesForEmail(email)
    setUserEmail(email)
    if (roles.length === 1) {
      // 只有一個角色 → 直接進入
      onLogin(roles[0])
    } else {
      // 多個角色 → 顯示選擇畫面
      setAvailableRoles(roles)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      setError('登入失敗，請稍後再試。')
      setLoading(false)
    }
  }

  // 角色選擇畫面（同一 email 有多個角色）
  if (userEmail && availableRoles.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative z-10 w-full max-w-lg mx-4 animate-fade">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-float inline-block">⚔️</div>
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">
              ME Life OS
            </h1>
            <p className="text-green-400 text-sm mb-1">✓ {userEmail}</p>
            <p className="text-gray-500 text-xs">選擇今天的身份進入系統</p>
          </div>
          <div className="space-y-3 mb-6">
            <p className="text-center text-xs text-gray-500 mb-4 tracking-widest">— 選擇你的身份登入 —</p>
            {availableRoles.map((role) => {
              const r = ROLE_CONFIG[role]
              return (
                <button
                  key={role}
                  onClick={() => onLogin(role)}
                  className={`w-full glass rounded-2xl p-5 text-left transition-all duration-200 border bg-gradient-to-r ${r.color} ${r.border} hover:scale-[1.01] hover:shadow-lg group`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl group-hover:animate-pulse-slow">{r.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-lg text-white">{r.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.badge}`}>
                          {r.title}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{r.desc}</p>
                    </div>
                    <div className="text-gray-600 group-hover:text-gray-300 transition-colors text-xl">›</div>
                  </div>
                </button>
              )
            })}
          </div>
          <p className="text-center text-gray-700 text-xs mt-4">v3.0 · 穎流行銷內部系統</p>
        </div>
      </div>
    )
  }

  // Google 登入畫面
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4 text-center animate-fade">
        <div className="text-6xl mb-4 animate-float inline-block">⚔️</div>
        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">
          ME Life OS
        </h1>
        <p className="text-gray-400 text-base mb-1">穎流行銷 · 內部冒險者系統</p>
        <p className="text-gray-600 text-sm mb-8">把工作變成冒險，把成長變成遊戲</p>

        <div className="glass rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? '登入中...' : '使用 Google 帳號登入'}
          </button>
          <p className="text-xs text-gray-600 mt-4">僅限穎流行銷內部成員使用</p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">v3.0 · 穎流行銷內部系統</p>
      </div>
    </div>
  )
}
