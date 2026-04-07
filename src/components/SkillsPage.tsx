'use client'

import { useState } from 'react'
import { MOCK_SKILLS } from '@/lib/mockData'
import { useGame } from '@/lib/GameContext'

const CATEGORIES = ['全部', '商業', '技術', '心理', '傳說']
const TIER_LABELS = ['', '初階', '進階', '精通', '傳說']
const TIER_COLORS = ['', 'from-emerald-500/20 to-emerald-500/5', 'from-blue-500/20 to-blue-500/5', 'from-purple-500/20 to-purple-500/5', 'from-amber-500/20 to-amber-500/5']

export default function SkillsPage() {
  const { state, spendSp } = useGame()
  const [category, setCategory] = useState('全部')
  const [skills, setSkills] = useState(MOCK_SKILLS)
  const [upgradeAnim, setUpgradeAnim] = useState<string | null>(null)

  const filtered = category === '全部' ? skills : skills.filter(s => s.category === category)

  const grouped = [1, 2, 3, 4].map(tier => ({
    tier,
    label: TIER_LABELS[tier],
    color: TIER_COLORS[tier],
    skills: filtered.filter(s => s.tier === tier),
  })).filter(g => g.skills.length > 0)

  const handleUpgrade = (skillName: string, cost: number) => {
    if (spendSp(cost)) {
      setSkills(prev => prev.map(s =>
        s.name === skillName && s.level < s.maxLevel
          ? { ...s, level: s.level + 1 }
          : s
      ))
      setUpgradeAnim(skillName)
      setTimeout(() => setUpgradeAnim(null), 1000)
    }
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🌳</span>
        <div>
          <h2 className="text-2xl font-black">成長技能樹</h2>
          <p className="text-gray-400 text-sm">消耗 SP 來升級你的技能</p>
        </div>
        <div className="ml-auto glass rounded-xl px-4 py-2 text-sm">
          <span className="text-sp-400 font-bold">🔮 {state.sp} SP</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mt-4 mb-6">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              category === c ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400 hover:text-white'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Skill Tree by Tier */}
      <div className="space-y-6">
        {grouped.map(g => (
          <div key={g.tier}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-px flex-1 bg-gradient-to-r ${g.color}`} />
              <span className="text-xs text-gray-500 px-3 py-1 glass rounded-full">
                {g.tier === 4 ? '⭐' : `Tier ${g.tier}`} {g.label}
              </span>
              <div className={`h-px flex-1 bg-gradient-to-l ${g.color}`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {g.skills.map((s, i) => {
                const canUpgrade = s.unlocked && s.level < s.maxLevel && state.sp >= s.spCost
                const isAnimating = upgradeAnim === s.name
                return (
                  <div key={i} className={`glass rounded-2xl p-4 transition-all ${
                    !s.unlocked ? 'opacity-30 grayscale' : isAnimating ? 'ring-2 ring-emerald-400 scale-[1.02]' : 'hover:border-white/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{s.name}</span>
                          {!s.unlocked && <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full">🔒</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-xp-500 to-xp-400 rounded-full progress-bar"
                              style={{ width: `${(s.level / s.maxLevel) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">Lv.{s.level}/{s.maxLevel}</span>
                        </div>
                        {s.unlocked && s.level < s.maxLevel && (
                          <button onClick={() => handleUpgrade(s.name, s.spCost)}
                            className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                              canUpgrade
                                ? 'bg-sp-400/20 text-sp-400 hover:bg-sp-400/30'
                                : 'bg-dark-600 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={!canUpgrade}>
                            升級 ({s.spCost} SP)
                          </button>
                        )}
                        {s.level === s.maxLevel && (
                          <div className="mt-2 text-center text-xs text-amber-400 font-bold">⭐ MAX</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
