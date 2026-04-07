'use client'

import { MOCK_MEMBERS } from '@/lib/mockData'

export default function RankPage() {
  const sorted = [...MOCK_MEMBERS].sort((a, b) => b.xp - a.xp)
  const medals = ['🥇', '🥈', '🥉']
  const totalMonthXp = sorted.reduce((sum, m) => sum + m.monthXp, 0)
  const monthTarget = 5000
  const monthProgress = Math.min(Math.round((totalMonthXp / monthTarget) * 100), 100)

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚔️</span>
        <div>
          <h2 className="text-2xl font-black">公會：穎流行銷</h2>
          <p className="text-gray-400 text-sm">Guild Lv.7 · 8 位冒險者</p>
        </div>
      </div>

      {/* Monthly Target */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm">🎯 本月公會目標</span>
          <span className="text-sm text-amber-400 font-bold">{monthProgress}%</span>
        </div>
        <div className="w-full h-4 bg-dark-600 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-400 rounded-full progress-bar" style={{ width: `${monthProgress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>本月累計 {totalMonthXp.toLocaleString()} XP</span>
          <span>目標 {monthTarget.toLocaleString()} XP</span>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="flex gap-4 mb-8 justify-center items-end">
        {[1, 0, 2].map((idx) => {
          const m = sorted[idx]
          if (!m) return null
          const isFirst = idx === 0
          return (
            <div key={idx} className={`glass rounded-2xl p-5 text-center flex-1 max-w-[200px] transition-all ${
              isFirst ? 'ring-2 ring-amber-400/50 glow-gold pb-8' : ''
            }`} style={{ marginBottom: isFirst ? 0 : '0' }}>
              <div className="text-4xl mb-1">{medals[idx]}</div>
              <div className={`text-4xl mb-2 ${isFirst ? 'animate-pulse-slow' : ''}`}>{m.avatar}</div>
              <div className="font-bold">{m.name}</div>
              <div className="text-xs text-gray-400">{m.role}</div>
              <div className="text-xp-400 font-bold mt-2">{m.xp.toLocaleString()} XP</div>
              <div className="text-xs text-gray-500 mt-0.5">本月 +{m.monthXp}</div>
              <div className="text-xs text-fire-400 mt-1">🔥 {m.streak} 天</div>
            </div>
          )
        })}
      </div>

      {/* Full Leaderboard */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-bold text-sm">🏆 完整排行榜</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-6 text-xs text-gray-500 p-4 border-b border-white/5 font-medium">
              <span>排名</span><span>冒險者</span><span className="text-center">等級</span>
              <span className="text-center">總 XP</span><span className="text-center">本月</span>
              <span className="text-center">連續</span>
            </div>
            {sorted.map((m, i) => (
              <div key={i} className={`grid grid-cols-6 items-center p-4 border-b border-white/5 hover:bg-dark-700 transition-all ${i === 0 ? 'bg-amber-500/5' : ''}`}>
                <span className={`text-lg font-bold ${i < 3 ? 'text-amber-400' : 'text-gray-500'}`}>#{i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.avatar}</span>
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-xs text-gray-500">{m.role}</div>
                  </div>
                </div>
                <div className="text-center text-sm">Lv.{m.level}</div>
                <div className="text-center text-sm text-xp-400 font-bold">{m.xp.toLocaleString()}</div>
                <div className="text-center text-sm text-emerald-400">+{m.monthXp}</div>
                <div className="text-center text-sm text-fire-400">🔥 {m.streak}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
