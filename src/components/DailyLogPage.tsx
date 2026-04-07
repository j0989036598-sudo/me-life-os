'use client'

import { useState } from 'react'
import { MOCK_DAILY_LOGS } from '@/lib/mockData'
import { useGame } from '@/lib/GameContext'

export default function DailyLogPage() {
  const { addXp, addGold } = useGame()
  const [mood, setMood] = useState('')
  const [energy, setEnergy] = useState(0)
  const [highlight, setHighlight] = useState('')
  const [quest, setQuest] = useState('')
  const [wins, setWins] = useState('')
  const [blocks, setBlocks] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const moods = [
    { emoji: '😴', label: '疲憊' },
    { emoji: '😰', label: '焦慮' },
    { emoji: '😐', label: '普通' },
    { emoji: '😊', label: '開心' },
    { emoji: '💪', label: '充實' },
    { emoji: '🔥', label: '爆發' },
    { emoji: '🎯', label: '專注' },
  ]

  const handleSubmit = () => {
    addXp(30)
    addGold(15)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="animate-fade text-center py-20">
        <div className="text-7xl mb-6 animate-float">📖</div>
        <h2 className="text-3xl font-black mb-2">賢者之書已封印！</h2>
        <p className="text-gray-400 mb-4 text-sm">今日的冒險紀錄已寫入靈魂卷軸</p>
        <div className="inline-flex gap-4 mb-6">
          <span className="px-4 py-2 bg-xp-400/10 rounded-xl text-xp-400 font-bold">+30 XP ✦</span>
          <span className="px-4 py-2 bg-gold-400/10 rounded-xl text-gold-400 font-bold">+15 🪙</span>
        </div>
        <br />
        <button onClick={() => setSubmitted(false)} className="mt-4 px-6 py-3 glass rounded-xl text-sm hover:bg-dark-600 transition-all">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mood */}
          <div className="glass rounded-2xl p-6">
            <label className="block text-sm font-bold mb-3 text-purple-300">💫 今日靈魂狀態</label>
            <div className="flex gap-2 flex-wrap">
              {moods.map((m, i) => (
                <button key={i} onClick={() => setMood(m.emoji)}
                  className={`flex flex-col items-center p-3 rounded-xl transition-all min-w-[64px] ${
                    mood === m.emoji ? 'bg-purple-500/20 ring-2 ring-purple-400 scale-105' : 'bg-dark-700/50 hover:bg-dark-600'
                  }`}>
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className="text-[10px] text-gray-400">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy */}
          <div className="glass rounded-2xl p-6">
            <label className="block text-sm font-bold mb-3 text-amber-300">⚡ 能量值</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((e) => (
                <button key={e} onClick={() => setEnergy(e)}
                  className={`flex-1 h-12 rounded-xl font-bold transition-all text-sm ${
                    energy >= e ? 'bg-gradient-to-t from-amber-600 to-amber-400 text-dark-900' : 'bg-dark-700/50 text-gray-500 hover:bg-dark-600'
                  }`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Quest + Highlight */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-emerald-300">🗡️ 今日主線任務</label>
              <input type="text" value={quest} onChange={(e) => setQuest(e.target.value)}
                placeholder="今天最重要的一件事..."
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-blue-300">✨ 今日亮點</label>
              <input type="text" value={highlight} onChange={(e) => setHighlight(e.target.value)}
                placeholder="今天最值得記住的一件事..."
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600" />
            </div>
          </div>

          {/* Wins and Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-6">
              <label className="block text-sm font-bold mb-2 text-emerald-300">⚔️ 戰功（做得好的）</label>
              <textarea value={wins} onChange={(e) => setWins(e.target.value)}
                placeholder="今天的勝利..."
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-600 h-20 resize-none" />
            </div>
            <div className="glass rounded-2xl p-6">
              <label className="block text-sm font-bold mb-2 text-red-300">🚧 卡點（遇到的困難）</label>
              <textarea value={blocks} onChange={(e) => setBlocks(e.target.value)}
                placeholder="今天的挑戰..."
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder-gray-600 h-20 resize-none" />
            </div>
          </div>

          <button onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-amber-500 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/25">
            📖 封印今日賢者之書
          </button>
        </div>

        {/* History Sidebar */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-gray-400 mb-2">📜 歷史卷軸</h3>
          {MOCK_DAILY_LOGS.map((log, i) => (
            <div key={i} className="glass rounded-xl p-4">
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
              <div className="text-xs text-gray-500 mt-1">{log.quest}</div>
              {log.wins !== '無' && <div className="text-xs text-emerald-400 mt-1">⚔️ {log.wins}</div>}
              {log.blocks !== '無' && <div className="text-xs text-red-400 mt-0.5">🚧 {log.blocks}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
