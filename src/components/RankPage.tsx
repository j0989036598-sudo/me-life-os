'use client'

import { useState } from 'react'
import { MOCK_MEMBERS } from '@/lib/mockData'
import { UserRole } from '@/components/LoginPage'

export default function RankPage({ role }: { role?: UserRole }) {
  const sorted = [...MOCK_MEMBERS].sort((a, b) => b.xp - a.xp)
  const medals = ['🥇', '🥈', '🥉']
  const totalMonthXp = sorted.reduce((sum, m) => sum + m.monthXp, 0)
  const monthTarget = 5000
  const monthProgress = Math.min(Math.round((totalMonthXp / monthTarget) * 100), 100)
  const isManager = role === 'boss' || role === 'manager'
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [awardMsg, setAwardMsg] = useState<string | null>(null)

  const handleAward = (name: string) => {
    setAwardMsg(`已給予 ${name} +50 XP 獎勵！`)
    setTimeout(() => setAwardMsg(null), 2500)
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚔️</span>
        <div>
          <h2 className="text-2xl font-black">公會：穎流行銷</h2>
          <p className="text-gray-400 text-sm">Guild Lv.7 · 8 位冒險者</p>
        </div>
        {isManager && (
          <div className="ml-auto glass rounded-xl px-3 py-2 text-xs text-amber-300 border border-amber-500/20">
            {role === 'boss' ? '👑 公會會長' : '🛡️ 副會長'}
          </div>
        )}
      </div>

      {/* 管理者：獎懲提示 */}
      {awardMsg && (
        <div className="glass rounded-xl p-4 mb-4 border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 text-sm text-center animate-fade">
          🎉 {awardMsg}
        </div>
      )}

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
        {isManager && (
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-500">距離目標還差 {(monthTarget - totalMonthXp).toLocaleString()} XP</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${monthProgress >= 80 ? 'bg-emerald-500/10 text-emerald-400' : monthProgress >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
              {monthProgress >= 80 ? '🔥 進度超前' : monthProgress >= 50 ? '⚡ 進度正常' : '⚠️ 需要加速'}
            </span>
          </div>
        )}
      </div>

      {/* Top 3 Podium */}
      <div className="flex gap-4 mb-8 justify-center items-end">
        {[1, 0, 2].map((idx) => {
          const m = sorted[idx]
          if (!m) return null
          const isFirst = idx === 0
          return (
            <div key={idx} className={`glass rounded-2xl p-5 text-center flex-1 max-w-[200px] transition-all ${
              isFirst ? 'ring-2 ring-amber-400/50 glow-gold' : ''
            }`}>
              <div className="text-4xl mb-1">{medals[idx]}</div>
              <div className={`text-4xl mb-2 ${isFirst ? 'animate-pulse-slow' : ''}`}>{m.avatar}</div>
              <div className="font-bold">{m.name}</div>
              <div className="text-xs text-gray-400">{m.role}</div>
              <div className="text-xp-400 font-bold mt-2">{m.xp.toLocaleString()} XP</div>
              <div className="text-xs text-gray-500 mt-0.5">本月 +{m.monthXp}</div>
              <div className="text-xs text-fire-400 mt-1">🔥 {m.streak} 天</div>
              {isManager && (
                <button onClick={() => handleAward(m.name)}
                  className="mt-3 w-full py-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-all">
                  🏆 給予獎勵
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Full Leaderboard */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-sm">🏆 完整排行榜</h3>
          {isManager && <span className="text-xs text-gray-500">點擊成員可查看詳情</span>}
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-6 text-xs text-gray-500 p-4 border-b border-white/5 font-medium">
              <span>排名</span><span>冒險者</span><span className="text-center">等級</span>
              <span className="text-center">總 XP</span><span className="text-center">本月</span>
              <span className="text-center">{isManager ? '操作' : '連續'}</span>
            </div>
            {sorted.map((m, i) => (
              <div key={i}
                onClick={() => isManager && setSelectedMember(selectedMember === m.name ? null : m.name)}
                className={`grid grid-cols-6 items-center p-4 border-b border-white/5 transition-all ${
                  i === 0 ? 'bg-amber-500/5' : ''
                } ${isManager ? 'cursor-pointer hover:bg-dark-700' : 'hover:bg-dark-700/50'} ${
                  selectedMember === m.name ? 'bg-purple-500/5 border-l-2 border-l-purple-400' : ''
                }`}>
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
                <div className="text-center">
                  {isManager ? (
                    <button onClick={(e) => { e.stopPropagation(); handleAward(m.name); }}
                      className="text-xs px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all">
                      +XP
                    </button>
                  ) : (
                    <span className="text-sm text-fire-400">🔥 {m.streak}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 管理者：選中成員詳情 */}
      {isManager && selectedMember && (() => {
        const m = MOCK_MEMBERS.find(x => x.name === selectedMember)
        if (!m) return null
        return (
          <div className="glass rounded-2xl p-5 mt-4 border border-purple-500/20 animate-fade">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{m.avatar}</span>
              <div>
                <div className="font-black text-lg">{m.name}</div>
                <div className="text-xs text-gray-400">{m.role} · Lv.{m.level}</div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="ml-auto text-gray-500 hover:text-white glass px-3 py-1 rounded-lg text-xs">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-xp-400">{m.xp.toLocaleString()}</div>
                <div className="text-xs text-gray-500">總 XP</div>
              </div>
              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-fire-400">🔥 {m.streak}</div>
                <div className="text-xs text-gray-500">連續天數</div>
              </div>
              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className={`text-lg font-bold ${m.todayDone ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.todayDone ? '✅' : '❌'}
                </div>
                <div className="text-xs text-gray-500">今日打卡</div>
              </div>
            </div>
            <button onClick={() => handleAward(m.name)}
              className="mt-4 w-full py-2.5 bg-gradient-to-r from-amber-600/30 to-amber-500/20 hover:from-amber-600/50 hover:to-amber-500/40 text-amber-300 rounded-xl text-sm font-bold border border-amber-500/20 transition-all">
              🏆 給予 +50 XP 特別獎勵
            </button>
          </div>
        )
      })()}
    </div>
  )
}
