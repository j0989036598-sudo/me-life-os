'use client'

import { useState } from 'react'
import { MOCK_EXPLORE_REGIONS } from '@/lib/mockData'
import { useGame } from '@/lib/GameContext'

export default function ExplorePage() {
  const { state } = useGame()
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const selected = MOCK_EXPLORE_REGIONS.find(r => r.id === selectedRegion)

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🗺️</span>
        <div>
          <h2 className="text-2xl font-black">探險地圖</h2>
          <p className="text-gray-400 text-sm">探索不同領域，完成區域任務獲得豐厚獎勵</p>
        </div>
      </div>

      {/* World Map Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {MOCK_EXPLORE_REGIONS.map(region => {
          const canAccess = region.unlocked
          return (
            <div key={region.id}
              onClick={() => canAccess && setSelectedRegion(region.id === selectedRegion ? null : region.id)}
              className={`glass rounded-2xl p-6 text-center transition-all cursor-pointer relative overflow-hidden ${
                !canAccess ? 'opacity-30 grayscale cursor-not-allowed' :
                selectedRegion === region.id ? 'ring-2 scale-[1.02]' : 'hover:scale-[1.01] hover:border-white/10'
              }`}
              style={{ ['--ring-color' as string]: region.color, borderColor: selectedRegion === region.id ? region.color : undefined,
                boxShadow: selectedRegion === region.id ? `0 0 30px ${region.color}20` : undefined }}>

              {/* Background glow */}
              <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${region.color}, transparent)` }} />

              <div className="relative">
                <div className="text-5xl mb-3">{region.icon}</div>
                <h3 className="font-bold text-lg">{region.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{region.desc}</p>

                {canAccess ? (
                  <>
                    <div className="mt-3 w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full rounded-full progress-bar" style={{ width: `${region.progress}%`, backgroundColor: region.color }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-xs">
                      <span className="text-gray-500">進度 {region.progress}%</span>
                      <span style={{ color: region.color }}>{region.quests} 個任務</span>
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-xs text-gray-500">
                    🔒 需要 Lv.{region.level} 解鎖
                    <div className="text-gray-600 mt-0.5">（目前 Lv.{state.level}）</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Region Detail */}
      {selected && (
        <div className="glass rounded-2xl p-6 animate-fade">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-5xl">{selected.icon}</div>
            <div>
              <h3 className="text-xl font-black">{selected.name}</h3>
              <p className="text-sm text-gray-400">{selected.desc}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span style={{ color: selected.color }}>📍 進度 {selected.progress}%</span>
                <span className="text-gray-500">⚔️ {selected.quests} 個活動任務</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {selected.id === 'silicon' && [
              { name: '研究 AI 產品趨勢', xp: 60, gold: 40, done: true },
              { name: '分析 SaaS 定價策略', xp: 80, gold: 50, done: false },
              { name: '完成科技業競品報告', xp: 100, gold: 70, done: false },
            ].map((q, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl ${q.done ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-dark-700/50 border border-white/5'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${q.done ? 'border-emerald-400 bg-emerald-400 text-dark-900' : 'border-gray-600'}`}>
                  {q.done && '✓'}
                </div>
                <span className={`flex-1 text-sm ${q.done ? 'line-through text-gray-500' : ''}`}>{q.name}</span>
                <span className="text-xs text-xp-400">+{q.xp} XP</span>
                <span className="text-xs text-gold-400">+{q.gold} 🪙</span>
              </div>
            ))}
            {selected.id === 'media' && [
              { name: '撰寫社群危機處理 SOP', xp: 70, gold: 45, done: true },
              { name: '分析輿論風向指標', xp: 50, gold: 30, done: false },
            ].map((q, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl ${q.done ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-dark-700/50 border border-white/5'}`}>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${q.done ? 'border-emerald-400 bg-emerald-400 text-dark-900' : 'border-gray-600'}`}>
                  {q.done && '✓'}
                </div>
                <span className={`flex-1 text-sm ${q.done ? 'line-through text-gray-500' : ''}`}>{q.name}</span>
                <span className="text-xs text-xp-400">+{q.xp} XP</span>
                <span className="text-xs text-gold-400">+{q.gold} 🪙</span>
              </div>
            ))}
            {selected.id === 'wallstreet' && [
              { name: '學習基礎財務報表分析', xp: 60, gold: 35, done: false },
              { name: '研究行銷 ROI 計算方法', xp: 70, gold: 45, done: false },
            ].map((q, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 rounded-xl bg-dark-700/50 border border-white/5`}>
                <div className="w-6 h-6 rounded-full border-2 border-gray-600 flex items-center justify-center text-xs" />
                <span className="flex-1 text-sm">{q.name}</span>
                <span className="text-xs text-xp-400">+{q.xp} XP</span>
                <span className="text-xs text-gold-400">+{q.gold} 🪙</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
