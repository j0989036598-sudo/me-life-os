'use client'

import { useState, useEffect } from 'react'
import { supabase, getAllProfiles, getAllDailyLogs, getDailyLogsByDate, type Profile, type DailyLog } from '@/lib/supabase'

export default function TeamLogsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })

  const fetchLogs = async (date: string) => {
    setLoading(true)
    // date 格式是 YYYY-MM-DD，直接用這個格式查（與 DailyLogPage 儲存格式一致）
    const [p, l] = await Promise.all([
      getAllProfiles(),
      getDailyLogsByDate(date),
    ])
    setProfiles(p)
    setLogs(l)
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs(selectedDate)
    const channel = supabase.channel('team-logs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => {
        fetchLogs(selectedDate)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedDate])

  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId)
  const loggedUserIds = new Set(logs.map(l => l.user_id))
  const notLoggedProfiles = profiles.filter(p => !loggedUserIds.has(p.user_id))

  const dateLabel = (() => {
    const d = new Date(selectedDate)
    const days = ['日','一','二','三','四','五','六']
    return `${d.getMonth()+1}/${d.getDate()}（${days[d.getDay()]}）`
  })()

  // Calculate monthly attendance stats
  const currentYear = new Date(selectedDate).getFullYear()
  const currentMonth = new Date(selectedDate).getMonth()
  const workdaysThisMonth = (() => {
    let count = 0
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(currentYear, currentMonth, i)
      const dayOfWeek = d.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
    }
    return count
  })()

  const memberAttendance = profiles
    .filter(p => p.role === 'member')
    .map(p => {
      let daysLogged = 0
      for (let i = 1; i <= new Date(currentYear, currentMonth + 1, 0).getDate(); i++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        if (logs.some(l => l.user_id === p.user_id && l.date === dateStr)) {
          daysLogged++
        }
      }
      const percentage = workdaysThisMonth > 0 ? (daysLogged / workdaysThisMonth) * 100 : 0
      return { profile: p, daysLogged, percentage }
    })

  const teamAvgAttendance = memberAttendance.length > 0
    ? memberAttendance.reduce((sum, m) => sum + m.percentage, 0) / memberAttendance.length
    : 0

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-emerald-400'
    if (percentage >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📖</span>
        <div>
          <h2 className="text-2xl font-black">員工日誌總覽</h2>
          <p className="text-gray-400 text-sm">查看團隊成員的賢者之書</p>
        </div>
      </div>

      {/* 月度出勤率摘要 */}
      <div className="glass rounded-2xl p-5 mb-6 border border-white/5">
        <h3 className="font-bold text-sm text-amber-300 mb-4">📊 本月出勤統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
            <span className="text-sm text-gray-400">團隊平均出勤率</span>
            <span className={`text-xl font-bold ${getAttendanceColor(teamAvgAttendance)}`}>{teamAvgAttendance.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-dark-700/50 rounded-xl">
            <span className="text-sm text-gray-400">本月工作日數</span>
            <span className="text-xl font-bold text-gray-300">{workdaysThisMonth} 天</span>
          </div>
        </div>
        {memberAttendance.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-gray-500 mb-2">個人出勤率：</div>
            {memberAttendance.map(m => (
              <div key={m.profile.user_id} className="flex items-center gap-2 text-xs">
                <span className="text-lg">{m.profile.avatar}</span>
                <span className="text-gray-400 w-16">{m.profile.name}</span>
                <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    m.percentage >= 90 ? 'bg-emerald-400' : m.percentage >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                  }`} style={{ width: `${m.percentage}%` }} />
                </div>
                <span className={`w-12 text-right ${getAttendanceColor(m.percentage)}`}>{m.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 日期選擇 */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
        />
        <span className="text-gray-400 text-sm">{dateLabel}</span>
        <div className="ml-auto flex gap-3 text-sm">
          <span className="text-emerald-400">✅ {logs.length} 已提交</span>
          <span className="text-gray-500">⏳ {notLoggedProfiles.length} 未提交</span>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-500">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p>載入中...</p>
        </div>
      ) : (
        <>
          {/* 已提交的日誌 */}
          {logs.length > 0 ? (
            <div className="space-y-4 mb-6">
              {logs.map(log => {
                const profile = getProfileByUserId(log.user_id)
                return (
                  <div key={log.id} className="glass rounded-2xl p-5 border border-emerald-500/10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{profile?.avatar || '👤'}</span>
                      <div>
                        <div className="font-bold text-sm">{profile?.name || log.email}</div>
                        <div className="text-xs text-gray-500">{profile?.job_title} · {profile?.department}</div>
                      </div>
                      <span className="text-3xl ml-auto">{log.mood}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-dark-700/50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">🎯 今日重點</div>
                        <div className="text-sm">{log.highlight || '—'}</div>
                      </div>
                      <div className="bg-dark-700/50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">⚔️ 任務</div>
                        <div className="text-sm">{log.quest || '—'}</div>
                      </div>
                      <div className="bg-dark-700/50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">🏆 成就</div>
                        <div className="text-sm">{log.wins || '—'}</div>
                      </div>
                      <div className="bg-dark-700/50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">🚧 障礙</div>
                        <div className="text-sm">{log.blocks || '—'}</div>
                      </div>
                    </div>
                    {log.reflection && (
                      <div className="mt-3 bg-dark-700/50 rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">💭 反思</div>
                        <div className="text-sm">{log.reflection}</div>
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-gray-500">精力值</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, j) => (
                          <div key={j} className={`w-2 h-5 rounded-full ${j < log.energy ? 'bg-amber-400' : 'bg-dark-600'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center text-gray-500 mb-6">
              <div className="text-4xl mb-3">📋</div>
              <p>今日尚無員工提交日誌</p>
            </div>
          )}

          {/* 未提交的成員 */}
          {notLoggedProfiles.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold text-sm text-gray-400 mb-3">⏳ 尚未提交（{notLoggedProfiles.length} 人）</h3>
              <div className="flex flex-wrap gap-2">
                {notLoggedProfiles.map(p => (
                  <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-dark-700/50 border border-white/5 text-gray-500">
                    <span>{p.avatar}</span>
                    <span>{p.name}</span>
                    <span>⏳</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
