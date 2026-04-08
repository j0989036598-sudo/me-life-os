'use client'

import { useState, useEffect } from 'react'
import {
  getAllProfiles,
  getAllAssignedTasks,
  getAllDailyLogs,
  getAllGameStats,
  type Profile,
  type UserRole,
  type AssignedTask,
  type DailyLog,
  type UserGameStats,
} from '@/lib/supabase'

type DateRange = 'week' | 'month' | 'all'

interface MemberStats {
  profile: Profile
  tasksCompleted: number
  tasksPending: number
  completionRate: number
  dailyLogCount: number
  currentStreak: number
  xpEarned: number
}

export default function PerformancePage({ role }: { role: UserRole }) {
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [members, setMembers] = useState<MemberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [teamTotals, setTeamTotals] = useState({
    completedThisMonth: 0,
    logSubmissionRate: 0,
    averageStreak: 0,
  })

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const [profiles, tasks, logs, gameStats] = await Promise.all([
        getAllProfiles(),
        getAllAssignedTasks(),
        getAllDailyLogs(),
        getAllGameStats(),
      ])

      const gameStatsMap = new Map(gameStats.map(s => [s.user_id, s]))

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())

      const getStartDate = () => {
        switch (dateRange) {
          case 'week':
            return startOfWeek
          case 'month':
            return startOfMonth
          default:
            return new Date(0) // All time
        }
      }

      const startDate = getStartDate()

      // Count expected log days in range (weekdays only)
      let expectedDays = 0
      for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = new Date(d).getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          expectedDays++
        }
      }

      const memberStats: MemberStats[] = profiles.map(profile => {
        const userTasks = tasks.filter(t => t.assigned_to === profile.user_id)
        const userTasksInRange = userTasks.filter(t => new Date(t.created_at) >= startDate)
        const completedInRange = userTasksInRange.filter(t => t.status === 'completed').length
        const totalInRange = userTasksInRange.length

        const userLogs = logs.filter(l => l.user_id === profile.user_id)
        const userLogsInRange = userLogs.filter(l => {
          const logDate = new Date(l.date)
          return logDate >= startDate
        })

        const stats = gameStatsMap.get(profile.user_id)

        return {
          profile,
          tasksCompleted: completedInRange,
          tasksPending: userTasksInRange.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
          completionRate: totalInRange > 0 ? Math.round((completedInRange / totalInRange) * 100) : 0,
          dailyLogCount: userLogsInRange.length,
          currentStreak: stats?.streak || 0,
          xpEarned: stats?.xp || 0,
        }
      })

      setMembers(memberStats)

      // Calculate team totals
      const totalCompleted = memberStats.reduce((sum, m) => sum + m.tasksCompleted, 0)
      const totalLogs = memberStats.reduce((sum, m) => sum + m.dailyLogCount, 0)
      const totalExpectedLogs = memberStats.length * expectedDays * 0.8 // Expect 80% compliance
      const avgStreak =
        memberStats.length > 0
          ? Math.round(memberStats.reduce((sum, m) => sum + m.currentStreak, 0) / memberStats.length)
          : 0

      setTeamTotals({
        completedThisMonth: totalCompleted,
        logSubmissionRate: totalExpectedLogs > 0 ? Math.round((totalLogs / totalExpectedLogs) * 100) : 0,
        averageStreak: avgStreak,
      })

      setLoading(false)
    })()
  }, [dateRange])

  if (!['boss', 'manager'].includes(role)) {
    return (
      <div className="glass p-8 text-center text-gray-400">
        <div className="text-4xl mb-2">🔒</div>
        <p>此功能只限管理者使用</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <span className="text-gray-400">⏳ 載入中...</span>
      </div>
    )
  }

  const maxTasks = Math.max(...members.map(m => m.tasksCompleted), 5)

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-3xl">📊</span>
        <div className="flex-1">
          <h2 className="text-2xl font-black">團隊績效看板</h2>
          <p className="text-gray-400 text-sm">成員表現分析與統計</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              dateRange === 'week'
                ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30'
                : 'glass text-gray-400'
            }`}
          >
            本週
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              dateRange === 'month'
                ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30'
                : 'glass text-gray-400'
            }`}
          >
            本月
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-4 py-2 text-sm font-bold transition-all ${
              dateRange === 'all' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30' : 'glass text-gray-400'
            }`}
          >
            全時間
          </button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass p-6 text-center border border-white/5">
          <div className="text-4xl font-black text-emerald-400 mb-2">{teamTotals.completedThisMonth}</div>
          <div className="text-sm text-gray-400">本期已完成任務</div>
        </div>
        <div className="glass p-6 text-center border border-white/5">
          <div className="text-4xl font-black text-blue-400 mb-2">{teamTotals.logSubmissionRate}%</div>
          <div className="text-sm text-gray-400">日誌提交率</div>
        </div>
        <div className="glass p-6 text-center border border-white/5">
          <div className="text-4xl font-black text-purple-400 mb-2">{teamTotals.averageStreak}</div>
          <div className="text-sm text-gray-400">平均連勝天數</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="glass p-6 mb-8 border border-white/5">
        <h3 className="text-lg font-bold mb-6">📈 任務完成進度</h3>
        <div className="space-y-4">
          {members
            .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
            .map(member => (
              <div key={member.profile.user_id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={member.profile.avatar}
                      alt={member.profile.name}
                      className="w-6 h-6 rounded-full"
                      onError={e => {
                        e.currentTarget.src = `https://avatar.vercel.sh/${member.profile.name}`
                      }}
                    />
                    <span className="font-medium text-sm">{member.profile.name}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{member.tasksCompleted}</span>
                </div>
                <div className="w-full h-4 overflow-hidden" style={{ background: 'var(--wood-darkest)', border: '3px solid var(--wood-dark)' }}>
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all"
                    style={{
                      width: `${(member.tasksCompleted / maxTasks) * 100}%`,
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(0,0,0,0.15) 6px, rgba(0,0,0,0.15) 8px)'
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Member Stats Table */}
      <div className="glass p-6 border border-white/5 overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">👥 成員詳細統計</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-3 font-bold text-gray-400">成員</th>
              <th className="text-center py-3 px-3 font-bold text-gray-400">已完成</th>
              <th className="text-center py-3 px-3 font-bold text-gray-400">待進行</th>
              <th className="text-center py-3 px-3 font-bold text-gray-400">完成率</th>
              <th className="text-center py-3 px-3 font-bold text-gray-400">日誌數</th>
              <th className="text-center py-3 px-3 font-bold text-gray-400">連勝</th>
              <th className="text-center py-3 px-3 font-bold text-gray-400">XP 獲得</th>
            </tr>
          </thead>
          <tbody>
            {members
              .sort((a, b) => b.tasksCompleted - a.tasksCompleted)
              .map(member => (
                <tr key={member.profile.user_id} className="border-b border-white/5 hover:bg-dark-700/30 transition-all">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={member.profile.avatar}
                        alt={member.profile.name}
                        className="w-7 h-7 rounded-full"
                        onError={e => {
                          e.currentTarget.src = `https://avatar.vercel.sh/${member.profile.name}`
                        }}
                      />
                      <span className="font-medium">{member.profile.name}</span>
                    </div>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className="font-bold text-emerald-400">{member.tasksCompleted}</span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className="font-bold text-amber-400">{member.tasksPending}</span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span
                      className={`font-bold ${
                        member.completionRate >= 80
                          ? 'text-emerald-400'
                          : member.completionRate >= 50
                            ? 'text-blue-400'
                            : 'text-red-400'
                      }`}
                    >
                      {member.completionRate}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className="font-bold text-blue-400">{member.dailyLogCount}</span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className="font-bold text-purple-400">
                      🔥 {member.currentStreak}
                    </span>
                  </td>
                  <td className="text-center py-3 px-3">
                    <span className="font-bold text-yellow-400">{member.xpEarned}</span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
