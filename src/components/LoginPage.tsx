'use client'

import { useEffect, useState } from 'react'
import { supabase, getProfile, createProfile, checkInvited, removeInvitedByEmail, type Profile, type UserRole, type InvitedUser } from '@/lib/supabase'
import { isBossEmail } from '@/lib/roleConfig'

export type { UserRole } from '@/lib/supabase'

interface LoginPageProps {
  onLogin: (profile: Profile) => void
}

const AVATAR_OPTIONS = ['⚔️', '🛡️', '🎯', '🔮', '⚡', '🌟', '🎪', '🦊', '🐉', '🌙', '🔥', '💎']
const DEPARTMENT_OPTIONS = [
  '行銷部', '業務部', '設計部', '工程部', '客服部', '財務部', '人資部', '管理部', '其他'
]

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showUnauthorized, setShowUnauthorized] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [inviteInfo, setInviteInfo] = useState<InvitedUser | null>(null)
  const [formName, setFormName] = useState('')
  const [formJobTitle, setFormJobTitle] = useState('')
  const [formDepartment, setFormDepartment] = useState('行銷部')
  const [formAvatar, setFormAvatar] = useState('⚔️')
  const [formSubmitting, setFormSubmitting] = useState(false)

  // Wood frame border style
  const woodFrameStyle = {
    border: '5px solid',
    borderColor: `var(--wood-darkest) var(--wood-light) var(--wood-light) var(--wood-darkest)`,
    boxShadow: `inset 2px 2px 0 var(--wood-highlight), inset -2px -2px 0 var(--wood-dark), 3px 3px 8px rgba(0,0,0,0.8)`,
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await handleAuthenticatedUser(session.user.id, session.user.email || '')
      } else { setLoading(false) }
    }
    checkSession()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthenticatedUser(session.user.id, session.user.email || '')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleAuthenticatedUser = async (userId: string, email: string) => {
    setLoading(true); setError(null)
    const profile = await getProfile(userId)
    if (profile) { onLogin(profile); return }
    if (isBossEmail(email)) {
      setPendingUserId(userId); setPendingEmail(email); setShowCreateForm(true); setLoading(false); return
    }
    const invite = await checkInvited(email)
    if (!invite) { setPendingEmail(email); setShowUnauthorized(true); setLoading(false); return }
    setPendingUserId(userId); setPendingEmail(email); setInviteInfo(invite)
    setFormJobTitle(invite.job_title); setFormDepartment(invite.department)
    setShowCreateForm(true); setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin },
    })
    if (error) { setError('Google 登入失敗，請再試一次'); setGoogleLoading(false) }
  }

  const handleCreateProfile = async () => {
    if (!pendingUserId || !pendingEmail) return
    if (!formName.trim()) { setError('請輸入你的姓名'); return }
    if (!formJobTitle.trim()) { setError('請輸入你的職位'); return }
    setFormSubmitting(true); setError(null)
    const role: UserRole = isBossEmail(pendingEmail) ? 'boss' : (inviteInfo?.role || 'member')
    const profile = await createProfile({
      user_id: pendingUserId, email: pendingEmail,
      name: formName.trim(), job_title: formJobTitle.trim(),
      department: formDepartment, avatar: formAvatar, role,
    })
    if (profile) {
      // Auto-remove from invited_users after successful profile creation
      await removeInvitedByEmail(pendingEmail)
      onLogin(profile)
    } else { setError('建立角色失敗，請再試一次'); setFormSubmitting(false) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowCreateForm(false); setShowUnauthorized(false)
    setPendingUserId(null); setPendingEmail(null); setInviteInfo(null)
    setError(null); setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--wood-dark)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⚔️</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>載入中...</p>
        </div>
      </div>
    )
  }

  if (showUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--wood-dark)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)', fontFamily: "'Press Start 2P', monospace" }}>尚未獲得授權</h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>你的帳號尚未被加入系統。<br />請聯繫老闆將你的 Gmail 加入白名單後再試。</p>
          <div className="px-4 py-3 mb-6 text-sm break-all glass" style={{ color: 'var(--text-muted)' }}>{pendingEmail}</div>
          <button onClick={handleLogout} className="text-sm transition-colors underline underline-offset-2 hover:text-red-400" style={{ color: 'var(--text-muted)' }}>切換帳號 / 登出</button>
        </div>
      </div>
    )
  }

  if (showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--wood-dark)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{formAvatar}</div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Press Start 2P', monospace" }}>建立你的角色</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{pendingEmail}</p>
          </div>
          <div className="glass p-6 space-y-5" style={woodFrameStyle}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>選擇頭像</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => setFormAvatar(emoji)} className="text-2xl p-2 transition-all" style={{
                    backgroundColor: formAvatar === emoji ? 'var(--rpg-gold)' : 'var(--bg-700)',
                    border: formAvatar === emoji ? '2px solid var(--rpg-gold)' : '1px solid var(--wood-mid)',
                    transform: formAvatar === emoji ? 'scale(1.1)' : 'scale(1)',
                  }}>{emoji}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>姓名 <span style={{ color: 'var(--rpg-red)' }}>*</span></label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="例：王小明"
                className="w-full px-4 py-2.5 text-sm glass" style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-800)',
                  borderColor: 'var(--wood-mid)',
                }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>職位 <span style={{ color: 'var(--rpg-red)' }}>*</span></label>
              <input type="text" value={formJobTitle} onChange={e => setFormJobTitle(e.target.value)} placeholder="例：社群行銷專員"
                className="w-full px-4 py-2.5 text-sm glass" style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-800)',
                  borderColor: 'var(--wood-mid)',
                }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>部門</label>
              <select value={formDepartment} onChange={e => setFormDepartment(e.target.value)}
                className="w-full px-4 py-2.5 text-sm glass" style={{
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-800)',
                  borderColor: 'var(--wood-mid)',
                }}>
                {DEPARTMENT_OPTIONS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            {error && <p className="text-sm text-center" style={{ color: 'var(--rpg-red)' }}>{error}</p>}
            <button onClick={handleCreateProfile} disabled={formSubmitting}
              className="w-full pixel-btn font-semibold py-3 transition-colors" style={{
                color: 'var(--text-primary)',
                backgroundColor: formSubmitting ? 'var(--bg-700)' : 'var(--rpg-gold)',
                opacity: formSubmitting ? 0.6 : 1,
              }}>
              {formSubmitting ? '建立中...' : '完成，進入系統 →'}
            </button>
            <button onClick={handleLogout} className="block mx-auto text-xs transition-colors underline underline-offset-2" style={{ color: 'var(--text-muted)' }}>切換帳號 / 登出</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--wood-dark)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">⚔️</div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)', fontFamily: "'Press Start 2P', monospace" }}>穎流行銷</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>內部管理系統</p>
        <div className="glass p-6" style={woodFrameStyle}>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>使用公司 Google 帳號登入</p>
          <button onClick={handleGoogleLogin} disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 pixel-btn font-semibold py-3 px-6 transition-colors" style={{
              backgroundColor: googleLoading ? 'var(--bg-700)' : 'var(--wood-light)',
              color: 'var(--text-primary)',
              opacity: googleLoading ? 0.6 : 1,
            }}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? '登入中...' : '使用 Google 登入'}
          </button>
          {error && <p className="text-sm mt-4" style={{ color: 'var(--rpg-red)' }}>{error}</p>}
        </div>
      </div>
    </div>
  )
}
