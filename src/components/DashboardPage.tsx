'use client'

import { useState, useEffect } from 'react'
import {
  supabase,
  getAllProfiles,
  getAllDailyLogs,
  getDailyLogsByDate,
  getRedemptions,
  getAllGameStats,
} from '@/lib/supabase'
import { type UserRole } from '@/app/page'

interface DashboardStats {
  totalMembers: number
  todayCheckins: number
  weekCheckins: number
  pendingRedemptions: number
  activeTasks: number
  completedTasks: number
  avgMood: string
  avgEnergy: number
  topPerformers: { name: string; avatar: string; xp: number; level: number }[]
  recentLogs: { name: string; avatar: string; mood: string; date: string }[]
  moodDistribution: Record<string, number>
  weeklyTrend: { date: string; count: number }[]
}

export default function DashboardPage({ role }: { role: UserRole }) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week')

  useEffect(() => {
    loadDashboard()

    // Realtime 自動更新
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_redemptions' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_tasks' }, () => loadDashboard())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_game_stats' }, () => loadDashboard())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [timeRange])

  const loadDashboard = async () => {
    const today = new Date().toISOString().slice(0, 10)
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const [profiles, allLogs, todayLogs, redemptions, gameStats, tasksData] = await Promise.all([
      getAllProfiles(),
      getAllDailyLogs(),
      getDailyLogsByDate(today),
      getRedemptions(),
      getAllGameStats(),
      supabase.from('assigned_tasks').select('*'),
    ])

    const tasks = (tasksData.data || []) as { status: string; assigned_to: string; completed_at: string | null }[]

    // 計算一週內的日誌數
    const weekLogs = allLogs.filter(l => l.date >= weekAgo)
    const monthLogs = allLogs.filter(l => l.date >= monthAgo)

    // 心情統計
    const moodMap: Record<string, number> = {}
    const targetLogs = timeRange === 'today' ? todayLogs : timeRange === 'week' ? weekLogs : monthLogs
    targetLogs.forEach(l => {
      if (l.mood) moodMap[l.mood] = (moodMap[l.mood] || 0) + 1
    })

    // 平均精力
    const energyLogs = targetLogs.filter(l => l.energy > 0)
    const avgEnergy = energyLogs.length > 0
      ? Math.round(energyLogs.reduce((sum, l) => sum + l.energy, 0) / energyLogs.length)
      : 0

    // 最常見心情
    const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0]
    const avgMood = topMood ? topMood[0] : '—'

    // 排行榜（依 XP）
    const profileMap = new Map(profiles.map(p => [p.user_id, p]))
    const topPerformers = gameStats
      .sort((a, b) => (b.xp + (b.level - 1) * 100) - (a.xp + (a.level - 1) * 100))
      .slice(0, 5)
      .map(g => {
        const p = profileMap.get(g.user_id)
        return {
          name: p?.name || '未知',
          avatar: p?.avatar || '👤',
          xp: g.xp,
          level: g.level,
        }
      })

    // 最近日誌
    const recentLogs = allLogs.slice(0, 8).map(l => {
      const p = profileMap.get(l.user_id)
      return {
        name: p?.name || '未知',
        avatar: p?.avatar || '👤',
        mood: l.mood || '—',
        date: l.date,
      }
    })

    // 每日趨勢（近 7 天）
    const weeklyTrend: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      weeklyTrend.push({
        date: d.slice(5), // MM-DD
        count: allLogs.filter(l => l.date === d).length,
      })
    }

    // 待審核兌換
    const pendingRedemptions = redemptions.filter(r => r.status === 'pending').length

    // 任務統計
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length
    const completedTasks = tasks.filter(t => t.status === 'completed').length

    setStats({
      totalMembers: profiles.length,
      todayCheckins: todayLogs.length,
      weekCheckins: weekLogs.length,
      pendingRedemptions,
      activeTasks,
      completedTasks,
      avgMood,
      avgEnergy,
      topPerformers,
      recentLogs,
      moodDistribution: moodMap,
      weeklyTrend,
    })
    setLoading(false)
  }

  if (loading) return (
    <div className="animate-fade flex items-center justify-center h-64">
      <div className="text-gray-400 animate-pulse text-lg">📊 載入儀表板中...</div>
    </div>
  )

  if (!stats) return null

  const checkinRate = stats.totalMembers > 0
    ? Math.round((stats.todayCheckins / stats.totalMembers) * 100)
    : 0

  const maxTrend = Math.max(...stats.weeklyTrend.map(t => t.count), 1)

  return (
    <div className="animate-fade space-y-6">
      {/* 標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            📊 營運儀表板
          </h1>
          <p className="text-gray-400 text-sm mt-1">即時掌握團隊狀態</p>
        </div>
        <div className="flex gap-1 bg-dark-700 p-1">
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-purple-500/30 text-purple-300'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range === 'today' ? '今日' : range === 'week' ? '本週' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 卡片區 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="👥" label="團隊人數" value={stats.totalMembers} unit="人" color="purple" />
        <KpiCard icon="📝" label="今日打卡" value={stats.todayCheckins} unit={`/ ${stats.totalMembers}`} color="green" highlight={checkinRate >= 80 ? 'good' : checkinRate >= 50 ? 'warn' : 'bad'} />
        <KpiCard icon="🎯" label="進行中任務" value={stats.activeTasks} unit="個" color="blue" />
        <KpiCard icon="⏳" label="待審核兌換" value={stats.pendingRedemptions} unit="筆" color="amber" highlight={stats.pendingRedemptions > 0 ? 'alert' : undefined} />
      </div>

      {/* 第二排 KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon="✅" label="已完成任務" value={stats.completedTasks} unit="個" color="green" />
        <KpiCard icon={stats.avgMood} label="團隊心情" value={stats.avgMood} unit="" color="pink" isEmoji />
        <KpiCard icon="⚡" label="平均精力" value={stats.avgEnergy} unit="/ 5" color="yellow" />
        <KpiCard icon="📖" label={timeRange === 'today' ? '今日日誌' : timeRange === 'week' ? '本週日誌' : '本月日誌'} value={timeRange === 'today' ? stats.todayCheckins : timeRange === 'week' ? stats.weekCheckins : stats.weekCheckins} unit="篇" color="indigo" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 打卡趨勢圖 */}
        <div className="glass p-5 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">📈 近 7 天打卡趨勢</h3>
          <div className="flex items-end gap-2 h-32">
            {stats.weeklyTrend.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{day.count}</span>
                <div
                  className={`w-full transition-all duration-500 ${
                    day.count === 0
                      ? 'bg-gray-700/30 border border-dashed border-gray-600'
                      : 'bg-gradient-to-t from-purple-500/60 to-purple-400/40'
                  }`}
                  style={{ height: `${day.count === 0 ? 8 : Math.max((day.count / maxTrend) * 100, 15)}%` }}
                />
                <span className="text-[10px] text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 心情分佈 */}
        <div className="glass p-5 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">😊 心情分佈</h3>
          {Object.keys(stats.moodDistribution).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.moodDistribution)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([mood, count]) => {
                  const total = Object.values(stats.moodDistribution).reduce((a, b) => a + b, 0)
                  const pct = Math.round((count / total) * 100)
                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-2xl w-8 text-center">{mood}</span>
                      <div className="flex-1 h-6 bg-dark-600 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400/30 flex items-center px-2"
                          style={{ width: `${Math.max(pct, 8)}%` }}
                        >
                          <span className="text-[10px] text-white font-bold">{pct}%</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">尚無心情資料</div>
          )}
        </div>

        {/* 排行榜 */}
        <div className="glass p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">🏆 排行榜 TOP 5</h3>
          </div>
          <div className="space-y-2">
            {stats.topPerformers.map((p, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 transition-all">
                <span className="text-lg font-black w-6 text-center">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <span className="text-2xl">{p.avatar}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-[10px] text-gray-400">Lv.{p.level}</div>
                </div>
                <div className="text-xp-400 font-bold text-sm">✦ {p.xp}</div>
              </div>
            ))}
            {stats.topPerformers.length === 0 && (
              <div className="text-gray-500 text-center py-4">尚無資料</div>
            )}
          </div>
        </div>

        {/* 最近日誌動態 */}
        <div className="glass p-5 border border-white/5">
          <h3 className="font-bold mb-4 flex items-center gap-2">📖 最近日誌動態</h3>
          <div className="space-y-2">
            {stats.recentLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 py-2 px-3 hover:bg-white/5 transition-all">
                <span className="text-xl">{log.avatar}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{log.name}</div>
                  <div className="text-[10px] text-gray-400">{log.date}</div>
                </div>
                <span className="text-xl">{log.mood}</span>
              </div>
            ))}
            {stats.recentLogs.length === 0 && (
              <div className="text-gray-500 text-center py-4">尚無日誌</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── KPI 卡片元件 ──
function KpiCard({ icon, label, value, unit, color, highlight, isEmoji }: {
  icon: string
  label: string
  value: number | string
  unit: string
  color: string
  highlight?: 'good' | 'warn' | 'bad' | 'alert'
  isEmoji?: boolean
}) {
  const highlightBorder = highlight === 'alert'
    ? 'border-amber-500/40 animate-pulse'
    : highlight === 'bad'
    ? 'border-red-500/30'
    : highlight === 'warn'
    ? 'border-yellow-500/20'
    : 'border-white/5'

  const colorMap: Record<string, string> = {
    purple: 'from-purple-500/20 to-purple-500/5',
    green: 'from-green-500/20 to-green-500/5',
    blue: 'from-blue-500/20 to-blue-500/5',
    amber: 'from-amber-500/20 to-amber-500/5',
    pink: 'from-pink-500/20 to-pink-500/5',
    yellow: 'from-yellow-500/20 to-yellow-500/5',
    indigo: 'from-indigo-500/20 to-indigo-500/5',
  }

  return (
    <div className={`glass p-4 border ${highlightBorder}`} style={{ backgroundImage: `linear-gradient(135deg, ${colorMap[color] || colorMap.purple})` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        {isEmoji ? (
          <span className="text-3xl">{value}</span>
        ) : (
          <span className="text-2xl font-black">{value}</span>
        )}
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      {highlight === 'alert' && (
        <div className="mt-2 text-[10px] text-amber-400 font-medium">⚠️ 需要處理</div>
      )}
    </div>
  )
}
