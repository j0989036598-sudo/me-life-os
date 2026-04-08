'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { getUserRecurringTasks, insertRecurringTasks, updateRecurringTask, type RecurringTask, type Profile } from '@/lib/supabase'

// ── 預設循環任務（首次登入時寫入） ──
const DEFAULT_RECURRING_TASKS = [
  { name: '週靈魂報告', icon: '📜', description: '每週一繳交上週工作回顧', period: 'weekly' as const, due_label: '每週一', xp_reward: 40 },
  { name: '將帥議事', icon: '⚔️', description: '管理層週會', period: 'weekly' as const, due_label: '每週二', xp_reward: 30 },
  { name: '操盤圓桌', icon: '🎯', description: '行銷策略討論會', period: 'weekly' as const, due_label: '每週三', xp_reward: 35 },
  { name: '月之封印', icon: '🌙', description: '每月月底繳交月報', period: 'monthly' as const, due_label: '每月30日', xp_reward: 100 },
  { name: 'IP 煉金術', icon: '✨', description: 'IP 經營月度檢討', period: 'monthly' as const, due_label: '每月15日', xp_reward: 80 },
  { name: '金庫議事', icon: '💰', description: '財務月度審查', period: 'monthly' as const, due_label: '每月5日', xp_reward: 60 },
  { name: '季度神諭', icon: '🔮', description: '季度目標檢討與下季規劃', period: 'quarterly' as const, due_label: '每季末', xp_reward: 200 },
]

// ── 判斷是否在當前週期內 ──
function isWithinCurrentPeriod(lastCompleted: string | null, period: 'weekly' | 'monthly' | 'quarterly'): boolean {
  if (!lastCompleted) return false
  const last = new Date(lastCompleted)
  const now = new Date()
  if (period === 'weekly') {
    const startOfWeek = new Date(now)
    const day = now.getDay()
    startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    return last >= startOfWeek
  }
  if (period === 'monthly') {
    return last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()
  }
  if (period === 'quarterly') {
    return Math.floor(last.getMonth() / 3) === Math.floor(now.getMonth() / 3) && last.getFullYear() === now.getFullYear()
  }
  return false
}

export default function MetronomePage({ profile }: { profile: Profile }) {
  const { addXp } = useGame()
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [loading, setLoading] = useState(true)
  const [completeAnim, setCompleteAnim] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      let loaded = await getUserRecurringTasks(profile.user_id)
      if (loaded.length === 0) {
        // 首次登入，寫入預設任務
        await insertRecurringTasks(DEFAULT_RECURRING_TASKS.map(t => ({
          ...t, user_id: profile.user_id, streak: 0, done_this_period: false, last_completed_at: null,
        })))
        loaded = await getUserRecurringTasks(profile.user_id)
      }
      // 自動重置：如果 last_completed_at 不在當前週期內，重置 done_this_period
      for (const task of loaded) {
        if (task.done_this_period && !isWithinCurrentPeriod(task.last_completed_at, task.period)) {
          await updateRecurringTask(task.id, { done_this_period: false })
          task.done_this_period = false
        }
      }
      setTasks(loaded)
      setLoading(false)
    })()
  }, [profile.user_id])

  const handleComplete = async (task: RecurringTask) => {
    const newStreak = task.streak + 1
    await updateRecurringTask(task.id, {
      done_this_period: true,
      streak: newStreak,
      last_completed_at: new Date().toISOString(),
    })
    setTasks(prev => prev.map(t =>
      t.id === task.id ? { ...t, done_this_period: true, streak: newStreak, last_completed_at: new Date().toISOString() } : t
    ))
    addXp(task.xp_reward)
    setCompleteAnim(task.name)
    setTimeout(() => setCompleteAnim(null), 1500)
  }

  const sections = [
    { key: 'weekly' as const, label: '📅 每週循環', items: tasks.filter(t => t.period === 'weekly') },
    { key: 'monthly' as const, label: '🌙 每月封印', items: tasks.filter(t => t.period === 'monthly') },
    { key: 'quarterly' as const, label: '🔮 季度神諭', items: tasks.filter(t => t.period === 'quarterly') },
  ]

  const totalDone = tasks.filter(t => t.done_this_period).length
  const totalItems = tasks.length

  if (loading) {
    return (
      <div className="animate-fade">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">⏱️</span>
          <div><h2 className="text-2xl font-black">節拍器</h2><p className="text-gray-400 text-sm">載入中...</p></div>
        </div>
        <div className="glass p-12 text-center"><div className="text-4xl mb-3 animate-pulse">⏳</div></div>
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">⏱️</span>
        <div>
          <h2 className="text-2xl font-black">節拍器</h2>
          <p className="text-gray-400 text-sm">週期性的靈魂儀式，維持你的冒險節奏</p>
        </div>
        <div className="ml-auto glass px-4 py-2">
          <span className="text-emerald-400 font-bold text-sm">{totalDone}/{totalItems} 完成</span>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        {sections.map(sec => (
          <div key={sec.key}>
            <h3 className="font-bold text-sm text-gray-400 mb-3 flex items-center gap-2">
              {sec.label}
            </h3>
            <div className="space-y-3">
              {sec.items.map((item) => (
                <div key={item.id} className={`glass p-5 transition-all relative overflow-hidden ${
                  item.done_this_period ? 'border border-emerald-500/20 bg-emerald-500/5' : 'hover:border-white/10'
                }`}>
                  {completeAnim === item.name && (
                    <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center animate-fade">
                      <span className="text-emerald-400 font-bold text-lg">+{item.xp_reward} XP ✦</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.name}</span>
                        {item.done_this_period && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✅ 已完成</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-gray-500">📅 {item.due_label}</span>
                        <span className="text-fire-400">🔥 連續 {item.streak} 次</span>
                        <span className="text-xp-400">+{item.xp_reward} XP</span>
                      </div>
                    </div>
                    {!item.done_this_period && (
                      <button onClick={() => handleComplete(item)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-sm font-bold hover:opacity-90 transition-all whitespace-nowrap">
                        ⚔️ 打卡
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
