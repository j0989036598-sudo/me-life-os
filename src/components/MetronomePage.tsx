'use client'

import { useState } from 'react'
import { MOCK_METRONOME } from '@/lib/mockData'
import { useGame } from '@/lib/GameContext'

export default function MetronomePage() {
  const { addXp } = useGame()
  const [metronome, setMetronome] = useState(MOCK_METRONOME)
  const [completeAnim, setCompleteAnim] = useState<string | null>(null)

  const handleComplete = (period: 'weekly' | 'monthly' | 'quarterly', name: string, xp: number) => {
    setMetronome(prev => ({
      ...prev,
      [period]: prev[period].map(item =>
        item.name === name ? { ...item, done: true, streak: item.streak + 1 } : item
      ),
    }))
    addXp(xp)
    setCompleteAnim(name)
    setTimeout(() => setCompleteAnim(null), 1500)
  }

  const sections = [
    { key: 'weekly' as const, label: '📅 每週循環', icon: '🔵', items: metronome.weekly },
    { key: 'monthly' as const, label: '🌙 每月封印', icon: '🟣', items: metronome.monthly },
    { key: 'quarterly' as const, label: '🔮 季度神諭', icon: '🟡', items: metronome.quarterly },
  ]

  const totalDone = [...metronome.weekly, ...metronome.monthly, ...metronome.quarterly].filter(i => i.done).length
  const totalItems = [...metronome.weekly, ...metronome.monthly, ...metronome.quarterly].length

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">⏱️</span>
        <div>
          <h2 className="text-2xl font-black">節拍器</h2>
          <p className="text-gray-400 text-sm">週期性的靈魂儀式，維持你的冒險節奏</p>
        </div>
        <div className="ml-auto glass rounded-xl px-4 py-2">
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
              {sec.items.map((item, i) => (
                <div key={i} className={`glass rounded-2xl p-5 transition-all relative overflow-hidden ${
                  item.done ? 'border border-emerald-500/20 bg-emerald-500/5' : 'hover:border-white/10'
                }`}>
                  {completeAnim === item.name && (
                    <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center animate-fade">
                      <span className="text-emerald-400 font-bold text-lg">+{item.xp} XP ✦</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{item.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.name}</span>
                        {item.done && <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">✅ 已完成</span>}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-gray-500">📅 {item.due}</span>
                        <span className="text-fire-400">🔥 連續 {item.streak} 次</span>
                        <span className="text-xp-400">+{item.xp} XP</span>
                      </div>
                    </div>
                    {!item.done && (
                      <button onClick={() => handleComplete(sec.key, item.name, item.xp)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl text-sm font-bold hover:opacity-90 transition-all whitespace-nowrap">
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
