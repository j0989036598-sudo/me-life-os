'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { supabase, getAssignedTasksForUser, getAllAssignedTasks, getAllProfiles, updateAssignedTaskStatus, type AssignedTask, type Profile, type UserRole } from '@/lib/supabase'

export default function TasksPage({ role, profile }: { role?: UserRole; profile?: Profile }) {
  const { addXp, addGold } = useGame()
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([])
  const [allTasks, setAllTasks] = useState<AssignedTask[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [rewardAnim, setRewardAnim] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal')
  const [filter, setFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const isManager = role === 'boss' || role === 'manager'

  useEffect(() => {
    if (!profile?.user_id) return
    ;(async () => {
      setLoading(true)
      const [mine, allP] = await Promise.all([
        getAssignedTasksForUser(profile.user_id),
        getAllProfiles(),
      ])
      setMyTasks(mine)
      setProfiles(allP)
      if (isManager) {
        const all = await getAllAssignedTasks()
        setAllTasks(all)
      }
      setLoading(false)
    })()

    const channel = supabase.channel('tasks-page-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_tasks' }, async () => {
        if (profile?.user_id) {
          const mine = await getAssignedTasksForUser(profile.user_id)
          setMyTasks(mine)
          if (isManager) {
            const all = await getAllAssignedTasks()
            setAllTasks(all)
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile?.user_id, isManager])

  const handleComplete = async (task: AssignedTask) => {
    if (task.status === 'completed') return
    const ok = await updateAssignedTaskStatus(task.id, 'completed')
    if (ok && task.xp_reward > 0) {
      addXp(task.xp_reward)
      addGold(Math.floor(task.xp_reward / 2))
      setRewardAnim(task.id)
      setTimeout(() => setRewardAnim(null), 1500)
    }
  }

  const handleStart = async (taskId: string) => {
    await updateAssignedTaskStatus(taskId, 'in_progress')
  }

  const done = myTasks.filter(t => t.status === 'completed').length
  const total = myTasks.length

  const filtered = (filter === 'all' ? myTasks
    : filter === 'active' ? myTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    : myTasks.filter(t => t.status === 'completed')
  ).filter(t => {
    if (priorityFilter === 'all') return true
    return (t.priority || 'medium') === priorityFilter
  })

  const getProfileByUserId = (uid: string) => profiles.find(p => p.user_id === uid)

  const getPriorityBadge = (priority?: string) => {
    const p = priority || 'medium'
    if (p === 'high') return { icon: '🔴', label: '緊急', color: 'bg-red-500/20 text-red-400' }
    if (p === 'low') return { icon: '🟢', label: '低', color: 'bg-green-500/20 text-green-400' }
    return { icon: '🟡', label: '一般', color: 'bg-yellow-500/20 text-yellow-400' }
  }

  if (loading) {
    return (
      <div className="animate-fade text-center py-20">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        <p className="text-gray-500">載入任務中...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h2 className="text-2xl font-black">任務中心</h2>
            <p className="text-gray-400 text-sm">完成被指派的任務獲得 XP 和金幣</p>
          </div>
        </div>
        <div className="glass rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{done}/{total}</div>
          <div className="text-xs text-gray-500">已完成</div>
        </div>
      </div>

      {isManager && (
        <div className="flex gap-2 mb-5">
          <button onClick={() => setActiveTab('personal')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'personal' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400'
            }`}>⚔️ 我的任務</button>
          <button onClick={() => setActiveTab('team')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'team' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' : 'glass text-gray-400'
            }`}>👥 全員任務</button>
        </div>
      )}

      {isManager && activeTab === 'team' ? (
        <div className="space-y-5">
          <div className="glass rounded-2xl p-4">
            <h3 className="font-bold text-sm text-amber-300 mb-3">📊 全員任務完成概覽</h3>
            <div className="space-y-3">
              {profiles.filter(p => p.role === 'member').map((p) => {
                const memberTasks = allTasks.filter(t => t.assigned_to === p.user_id)
                const memberDone = memberTasks.filter(t => t.status === 'completed').length
                const memberTotal = memberTasks.length
                const pct = memberTotal > 0 ? memberDone / memberTotal : 0
                return (
                  <div key={p.user_id} className="flex items-center gap-3">
                    <span className="text-xl">{p.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className="text-xs text-gray-500">{memberDone}/{memberTotal}</span>
                      </div>
                      <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          pct >= 0.8 ? 'bg-emerald-400' : pct >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                        }`} style={{ width: `${pct * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          {total > 0 && (
            <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden mb-6">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full progress-bar" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
            </div>
          )}

          <div className="flex gap-2 mb-4 flex-wrap">
            <div className="flex gap-1">
              {[{ key: 'all', label: '全部' }, { key: 'active', label: '⚡ 進行中' }, { key: 'done', label: '✅ 已完成' }].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    filter === f.key ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400 hover:text-white'
                  }`}>{f.label}</button>
              ))}
            </div>
            <div className="flex gap-1">
              {[{ key: 'all', label: '優先度: 全部' }, { key: 'high', label: '🔴 緊急' }, { key: 'medium', label: '🟡 一般' }, { key: 'low', label: '🟢 低' }].map(f => (
                <button key={f.key} onClick={() => setPriorityFilter(f.key)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    priorityFilter === f.key ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30' : 'glass text-gray-400 hover:text-white'
                  }`}>{f.label}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>尚無任務，等老闆指派吧！</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => {
                const isDone = t.status === 'completed'
                const assigner = getProfileByUserId(t.assigned_by)
                return (
                  <div key={t.id} className={`relative flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 ${
                    isDone ? 'glass border border-emerald-500/20 bg-emerald-500/5' : 'glass hover:border-white/10'
                  }`}>
                    {rewardAnim === t.id && (
                      <div className="absolute inset-0 flex items-center justify-center animate-fade z-10">
                        <span className="text-lg font-bold text-xp-400 animate-float">+{t.xp_reward} XP ✦</span>
                      </div>
                    )}
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                      isDone ? 'border-emerald-400 bg-emerald-400 text-dark-900 text-lg' : 'border-gray-600'
                    }`} onClick={() => !isDone && t.status === 'in_progress' && handleComplete(t)}>
                      {isDone && '✓'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${isDone ? 'line-through text-gray-500' : ''}`}>{t.title}</span>
                        {(() => {
                          const priorityBadge = getPriorityBadge(t.priority)
                          return <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityBadge.color}`}>{priorityBadge.icon} {priorityBadge.label}</span>
                        })()}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
                          : t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400'
                          : t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                        }`}>{t.status === 'pending' ? '待處理' : t.status === 'in_progress' ? '進行中' : t.status === 'completed' ? '已完成' : '已取消'}</span>
                        {t.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">{t.category}</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        來自 {assigner?.avatar || '👤'} {t.assigned_by_name}
                        {t.due_date && <span className="ml-2">📅 {t.due_date}</span>}
                      </div>
                      {t.description && <div className="text-xs text-gray-400 mt-1">{t.description}</div>}
                    </div>
                    <div className="text-right flex flex-col gap-1">
                      {t.xp_reward > 0 && <div className="text-sm text-xp-400 font-bold">+{t.xp_reward} XP</div>}
                      {!isDone && t.status === 'pending' && (
                        <button onClick={() => handleStart(t.id)} className="text-xs text-blue-400 hover:bg-blue-500/10 px-2 py-1 rounded-lg">開始</button>
                      )}
                      {!isDone && t.status === 'in_progress' && (
                        <button onClick={() => handleComplete(t)} className="text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg">完成</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
