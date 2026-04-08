'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { createDailyLog, getUserDailyLogs, getDailyLogsByDate, createNotificationBatch, getBossAndManagerIds, type Profile, type DailyLog, type UserRole } from '@/lib/supabase'

export default function DailyLogPage({ role, profile }: { role?: UserRole; profile?: Profile }) {
  const { addXp, addGold } = useGame()
  const [mood, setMood] = useState('')
  const [energy, setEnergy] = useState(0)
  const [highlight, setHighlight] = useState('')
  const [quest, setQuest] = useState('')
  const [wins, setWins] = useState('')
  const [blocks, setBlocks] = useState('')
  const [reflection, setReflection] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [historyLogs, setHistoryLogs] = useState<DailyLog[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [alreadySubmittedToday, setAlreadySubmittedToday] = useState(false)

  // 使用本地時區日期（避免 UTC 在台灣凌晨 0~8 點顯示前一天）
  const today = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  })()

  // 載入歷史日誌 + 檢查今天是否已提交
  useEffect(() => {
    if (!profile?.user_id) return
    ;(async () => {
      setLoadingHistory(true)
      const logs = await getUserDailyLogs(profile.user_id)
      setHistoryLogs(logs)
      const todayLog = logs.find(l => l.date === today)
      if (todayLog) setAlreadySubmittedToday(true)
      setLoadingHistory(false)
    })()
  }, [profile?.user_id, today])

  const moods = [
    { emoji: '😴', label: '疲憊' }, { emoji: '😰', label: '焦慮' }, { emoji: '😐', label: '普通' },
    { emoji: '😊', label: '開心' }, { emoji: '💪', label: '充實' }, { emoji: '🔥', label: '爆發' }, { emoji: '🎯', label: '專注' },
  ]

  const handleSubmit = async () => {
    if (!profile?.user_id || !profile?.email) return
    if (alreadySubmittedToday) { setError('今天已經封印過了！'); return }
    setSubmitting(true)
    setError('')
    try {
      const result = await createDailyLog({
        user_id: profile.user_id,
        email: profile.email,
        date: today,
        mood, energy, highlight, quest, wins, blocks, reflection,
      })
      if (result) {
        addXp(30)
        addGold(15)
        setSubmitted(true)
        setAlreadySubmittedToday(true)
        // 通知老闆/主管有新日誌
        const managerIds = await getBossAndManagerIds()
        const otherManagers = managerIds.filter(id => id !== profile.user_id)
        if (otherManagers.length > 0) {
          createNotificationBatch(otherManagers, {
            type: 'system',
            title: '📖 新日誌提交',
            message: `${profile.name} 提交了今日賢者之書 ${mood}`,
            link_to: 'team-logs',
          })
        }
        // 刷新歷史
        const logs = await getUserDailyLogs(profile.user_id)
        setHistoryLogs(logs)
      } else {
        setError('儲存失敗，請再試一次')
      }
    } catch {
      setError('發生錯誤，請再試一次')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="animate-fade text-center py-20">
        <div className="text-7xl mb-6 animate-float">📖</div>
        <h2 className="text-3xl font-black mb-2">賢者之書已封印！</h2>
        <p className="text-gray-400 mb-4 text-sm">今日的冒險紀錄已寫入 Supabase 雲端</p>
        <div className="inline-flex gap-4 mb-6">
          <span className="px-4 py-2 bg-xp-400/10 text-xp-400 font-bold">+30 XP ✦</span>
          <span className="px-4 py-2 bg-gold-400/10 text-gold-400 font-bold">+15 🪙</span>
        </div>
        <br />
        <button onClick={() => setSubmitted(false)} className="mt-4 px-6 py-3 glass text-sm hover:bg-dark-600 transition-all">
          查看歷史日誌
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">📖</span>
        <div>
          <h2 className="text-2xl font-black">賢者之書</h2>
          <p className="text-gray-400 text-sm">記錄今天的冒險，封印你的靈魂</p>
        </div>
      </div>

      {alreadySubmittedToday && !submitted && (
        <div className="glass p-4 mt-4 mb-2 border border-emerald-500/20 bg-emerald-500/5 text-center">
          <span className="text-emerald-400 text-sm font-bold">✅ 今天已經封印過賢者之書了！</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass p-6">
            <label className="block text-sm font-bold mb-3 text-purple-300">💫 今日靈魂狀態</label>
            <div className="flex gap-2 flex-wrap">
              {moods.map((m, i) => (
                <button key={i} onClick={() => setMood(m.emoji)}
                  className={`flex flex-col items-center p-3 transition-all min-w-[64px] ${
                    mood === m.emoji ? 'bg-purple-500/20 ring-2 ring-purple-400 scale-105' : 'bg-dark-700/50 hover:bg-dark-600'
                  }`}>
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-[10px] text-gray-400">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass p-6">
            <label className="block text-sm font-bold mb-3 text-amber-300">⚡ 能量值</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((e) => (
                <button key={e} onClick={() => setEnergy(e)}
                  className={`flex-1 h-12 font-bold transition-all text-sm ${
                    energy >= e ? 'bg-gradient-to-t from-amber-600 to-amber-400 text-dark-900' : 'bg-dark-700/50 text-gray-500 hover:bg-dark-600'
                  }`}>{e}</button>
              ))}
            </div>
          </div>

          <div className="glass p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-emerald-300">🗡️ 今日主線任務</label>
              <input type="text" value={quest} onChange={(e) => setQuest(e.target.value)} placeholder="今天最重要的一件事..."
                className="w-full bg-dark-700 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-blue-300">✨ 今日亮點</label>
              <input type="text" value={highlight} onChange={(e) => setHighlight(e.target.value)} placeholder="今天最值得記住的一件事..."
                className="w-full bg-dark-700 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6">
              <label className="block text-sm font-bold mb-2 text-emerald-300">⚔️ 戰功（做得好的）</label>
              <textarea value={wins} onChange={(e) => setWins(e.target.value)} placeholder="今天的勝利..."
                className="w-full bg-dark-700 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600 h-20 resize-none" />
            </div>
            <div className="glass p-6">
              <label className="block text-sm font-bold mb-2 text-red-300">🚧 卡點（遇到的困難）</label>
              <textarea value={blocks} onChange={(e) => setBlocks(e.target.value)} placeholder="今天的挑戰..."
                className="w-full bg-dark-700 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600 h-20 resize-none" />
            </div>
          </div>

          <div className="glass p-6">
            <label className="block text-sm font-bold mb-2 text-purple-300">🔮 今日反思</label>
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="回顧今天，有什麼領悟..."
              className="w-full bg-dark-700 border border-white/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-600 h-20 resize-none" />
          </div>

          {error && <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 border border-red-500/20">{error}</div>}

          <button onClick={handleSubmit} disabled={submitting || alreadySubmittedToday}
            className={`w-full py-4 font-bold text-lg transition-all shadow-lg ${
              alreadySubmittedToday ? 'bg-dark-600 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-amber-500 hover:opacity-90 hover:shadow-purple-500/25'
            }`}>
            {submitting ? '封印中...' : alreadySubmittedToday ? '✅ 今天已封印' : '📖 封印今日賢者之書'}
          </button>
        </div>

        {/* History */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-gray-400 mb-2">📜 歷史卷軸</h3>
          {loadingHistory ? (
            <div className="glass p-8 text-center text-gray-500">
              <div className="text-2xl mb-2 animate-pulse">⏳</div>
              <p className="text-xs">載入中...</p>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="glass p-8 text-center text-gray-500">
              <div className="text-2xl mb-2">📖</div>
              <p className="text-xs">尚無歷史日誌</p>
            </div>
          ) : (
            historyLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="glass p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{log.mood}</span>
                  <span className="text-xs text-gray-500">{log.date}</span>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className={`w-1 h-3 rounded-full ${j < log.energy ? 'bg-amber-400' : 'bg-dark-600'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-sm font-medium">{log.highlight}</div>
                <div className="text-xs text-gray-500 mt-1">🗡️ {log.quest}</div>
                {log.wins && log.wins !== '無' && <div className="text-xs text-emerald-400 mt-1">⚔️ {log.wins}</div>}
                {log.blocks && log.blocks !== '無' && <div className="text-xs text-red-400 mt-0.5">🚧 {log.blocks}</div>}
                {log.reflection && <div className="text-xs text-purple-400 mt-0.5">🔮 {log.reflection}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
