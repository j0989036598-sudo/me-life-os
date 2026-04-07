'use client'

import { useState, useEffect } from 'react'
import { supabase, getAllProfiles, getAllInvited, inviteUser, removeInvited, updateUserRole, type Profile, type InvitedUser, type UserRole } from '@/lib/supabase'

const DEPARTMENT_OPTIONS = ['行銷部', '業務部', '設計部', '工程部', '客服部', '財務部', '人資部', '管理部', '其他']

type AdminTab = 'members' | 'invite' | 'invited'

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('members')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [invited, setInvited] = useState<InvitedUser[]>([])
  const [loading, setLoading] = useState(true)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteJobTitle, setInviteJobTitle] = useState('')
  const [inviteDept, setInviteDept] = useState('行銷部')
  const [inviteRole, setInviteRole] = useState<UserRole>('member')
  const [inviteNote, setInviteNote] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [p, i] = await Promise.all([getAllProfiles(), getAllInvited()])
      setProfiles(p)
      setInvited(i)
      setLoading(false)
    }
    fetchData()

    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        getAllProfiles().then(setProfiles)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invited_users' }, () => {
        getAllInvited().then(setInvited)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteJobTitle.trim()) {
      setInviteMsg({ type: 'error', text: 'Email 和職稱為必填' })
      return
    }
    setInviting(true)
    setInviteMsg(null)
    const result = await inviteUser({
      email: inviteEmail.trim().toLowerCase(),
      job_title: inviteJobTitle.trim(),
      department: inviteDept,
      role: inviteRole,
      invited_by: '老闆',
      note: inviteNote,
    })
    setInviting(false)
    if (result) {
      setInviteMsg({ type: 'success', text: `✅ 已邀請 ${inviteEmail}` })
      setInviteEmail('')
      setInviteJobTitle('')
      setInviteNote('')
      getAllInvited().then(setInvited)
    } else {
      setInviteMsg({ type: 'error', text: '邀請失敗，請確認 Email 格式是否正確' })
    }
  }

  const handleRemoveInvite = async (id: string, email: string) => {
    if (!confirm(`確定要移除 ${email} 的邀請嗎？`)) return
    await removeInvited(id)
    getAllInvited().then(setInvited)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRole(userId, newRole)
    getAllProfiles().then(setProfiles)
  }

  const tabClass = (t: AdminTab) =>
    `px-4 py-2 text-sm font-medium rounded-xl transition-all ${
      tab === t ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'
    }`

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">👁️</span>
        <div>
          <h2 className="text-2xl font-black">管理後台</h2>
          <p className="text-gray-400 text-sm">ME 專屬 · 團隊總覽</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-emerald-400">{profiles.length}</div>
          <div className="text-sm text-gray-400 mt-2">已加入成員</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-purple-400">{invited.length}</div>
          <div className="text-sm text-gray-400 mt-2">待加入邀請</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-amber-400">{profiles.length + invited.length}</div>
          <div className="text-sm text-gray-400 mt-2">總名額</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 p-1 glass rounded-xl w-fit">
        <button className={tabClass('members')} onClick={() => setTab('members')}>
          🧑‍🤝‍🧑 成員列表 ({profiles.length})
        </button>
        <button className={tabClass('invite')} onClick={() => setTab('invite')}>
          ➕ 邀請員工
        </button>
        <button className={tabClass('invited')} onClick={() => setTab('invited')}>
          📋 邀請名單 ({invited.length})
        </button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p>載入中...</p>
        </div>
      ) : (
        <>
          {tab === 'members' && (
            <div className="glass rounded-2xl overflow-hidden">
              {profiles.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">🏰</div>
                  <p>尚無成員加入，先邀請員工吧！</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-white/5">
                    <h3 className="font-bold text-sm">全體成員（{profiles.length} 人）</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      <div className="grid grid-cols-5 text-xs text-gray-500 px-4 py-3 border-b border-white/5 font-medium">
                        <span>成員</span><span>職稱 / 部門</span>
                        <span className="text-center">加入日期</span>
                        <span className="text-center">角色</span>
                        <span className="text-center">調整角色</span>
                      </div>
                      {profiles.map(p => (
                        <div key={p.id} className="grid grid-cols-5 items-center px-4 py-3 border-b border-white/5 hover:bg-dark-700/50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{p.avatar}</span>
                            <div>
                              <div className="text-sm font-medium">{p.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[100px]">{p.email}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm">{p.job_title}</div>
                            <div className="text-xs text-gray-500">{p.department}</div>
                          </div>
                          <div className="text-center text-xs text-gray-400">
                            {new Date(p.created_at).toLocaleDateString('zh-TW')}
                          </div>
                          <div className="text-center">
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                              p.role === 'boss' ? 'bg-amber-500/10 text-amber-400' :
                              p.role === 'manager' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-purple-500/10 text-purple-400'
                            }`}>
                              {p.role === 'boss' ? '👑 老闆' : p.role === 'manager' ? '🛡️ 主管' : '⚔️ 員工'}
                            </span>
                          </div>
                          <div className="text-center">
                            {p.role !== 'boss' && (
                              <select
                                value={p.role}
                                onChange={e => handleRoleChange(p.user_id, e.target.value as UserRole)}
                                className="text-xs bg-dark-700 border border-white/10 rounded-lg px-2 py-1 text-gray-300 focus:outline-none"
                              >
                                <option value="member">員工</option>
                                <option value="manager">主管</option>
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'invite' && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-bold mb-5">➕ 邀請新員工</h3>
              {inviteMsg && (
                <div className={`rounded-xl p-3 mb-4 text-sm text-center ${
                  inviteMsg.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}>
                  {inviteMsg.text}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">員工 Gmail *</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">職稱 *</label>
                  <input type="text" value={inviteJobTitle} onChange={e => setInviteJobTitle(e.target.value)}
                    placeholder="例：資深設計師"
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">部門</label>
                    <select value={inviteDept} onChange={e => setInviteDept(e.target.value)}
                      className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                      {DEPARTMENT_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">角色</label>
                    <select value={inviteRole} onChange={e => setInviteRole(e.target.value as UserRole)}
                      className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                      <option value="member">⚔️ 員工</option>
                      <option value="manager">🛡️ 主管</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">備註（選填）</label>
                  <input type="text" value={inviteNote} onChange={e => setInviteNote(e.target.value)}
                    placeholder="例：新進員工、試用期 3 個月"
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <button onClick={handleInvite} disabled={inviting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                  {inviting ? '邀請中...' : '✉️ 送出邀請'}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-4 text-center">邀請後，該員工以 Gmail 登入即可加入系統</p>
            </div>
          )}

          {tab === 'invited' && (
            <div className="glass rounded-2xl overflow-hidden">
              {invited.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-4xl mb-3">📋</div>
                  <p>尚無待加入邀請</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-white/5">
                    <h3 className="font-bold text-sm">邀請名單（{invited.length} 人尚未登入）</h3>
                  </div>
                  {invited.map(inv => (
                    <div key={inv.id} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-dark-700/50 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{inv.email}</div>
                        <div className="text-xs text-gray-500">
                          {inv.job_title} · {inv.department} ·{inv.role === 'manager' ? ' 🛡️ 主管' : ' ⚔️ 員工'}
                        </div>
                        {inv.note && <div className="text-xs text-gray-600 mt-0.5">📝 {inv.note}</div>}
                      </div>
                      <div className="text-xs text-gray-600 whitespace-nowrap">
                        {new Date(inv.created_at).toLocaleDateString('zh-TW')}
                      </div>
                      <button onClick={() => handleRemoveInvite(inv.id, inv.email)}
                        className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-all">
                        ✕ 移除
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
