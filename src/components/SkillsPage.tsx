'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { getUserSkills, insertUserSkills, updateUserSkill, type UserSkill, type Profile } from '@/lib/supabase'

const CATEGORIES = ['全部', '商業', '技術', '心理', '傳說']
const TIER_LABELS = ['', '初階', '進階', '精通', '傳說']
const TIER_COLORS = ['', 'from-emerald-500/20 to-emerald-500/5', 'from-blue-500/20 to-blue-500/5', 'from-purple-500/20 to-purple-500/5', 'from-amber-500/20 to-amber-500/5']

// ── 預設技能（首次登入時寫入） ──
const DEFAULT_SKILLS = [
  { name: '市場直覺', icon: '📊', description: '洞察市場趨勢的能力', category: '商業', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  { name: '第一性原理', icon: '🧠', description: '從根本思考問題的能力', category: '商業', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: true },
  { name: '攝影大師', icon: '📷', description: '完成 50 場拍攝任務', category: '技術', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  { name: '剪輯達人', icon: '✂️', description: '剪輯 30 支影片', category: '技術', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  { name: '社群操盤手', icon: '📱', description: '發布 100 則貼文', category: '技術', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: true },
  { name: '鋼鐵意志', icon: '💪', description: '連續打卡 30 天', category: '心理', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  { name: '客戶耳語者', icon: '🤝', description: '完成 10 次客戶提案', category: '商業', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: true },
  { name: 'AI 先鋒', icon: '🤖', description: '使用 AI 工具完成 20 個任務', category: '技術', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: true },
  { name: '數據分析師', icon: '📈', description: '完成 20 份數據報告', category: '商業', tier: 3, level: 0, max_level: 5, sp_cost: 35, unlocked: false },
  { name: '創意總監', icon: '🌟', description: '達到 Lv.15 解鎖', category: '傳說', tier: 4, level: 0, max_level: 5, sp_cost: 50, unlocked: false },
  { name: '團隊導師', icon: '🧭', description: '指導夥伴完成 15 項任務', category: '心理', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: true },
  { name: '時間領主', icon: '⏰', description: '連續 60 天零遲到', category: '傳說', tier: 4, level: 0, max_level: 5, sp_cost: 50, unlocked: false },
]

export default function SkillsPage({ profile }: { profile: Profile }) {
  const { state, spendSp } = useGame()
  const [category, setCategory] = useState('全部')
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeAnim, setUpgradeAnim] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      let loaded = await getUserSkills(profile.user_id)
      if (loaded.length === 0) {
        await insertUserSkills(DEFAULT_SKILLS.map(s => ({ ...s, user_id: profile.user_id })))
        loaded = await getUserSkills(profile.user_id)
      }
      setSkills(loaded)
      setLoading(false)
    })()
  }, [profile.user_id])

  const filtered = category === '全部' ? skills : skills.filter(s => s.category === category)

  const grouped = [1, 2, 3, 4].map(tier => ({
    tier,
    label: TIER_LABELS[tier],
    color: TIER_COLORS[tier],
    skills: filtered.filter(s => s.tier === tier),
  })).filter(g => g.skills.length > 0)

  const handleUpgrade = async (skill: UserSkill) => {
    if (skill.level >= skill.max_level || !skill.unlocked) return
    if (spendSp(skill.sp_cost)) {
      const newLevel = skill.level + 1
      await updateUserSkill(skill.id, { level: newLevel })
      setSkills(prev => prev.map(s =>
        s.id === skill.id ? { ...s, level: newLevel } : s
      ))
      setUpgradeAnim(skill.name)
      setTimeout(() => setUpgradeAnim(null), 1000)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌳</span>
          <div><h2 className="text-2xl font-black">成長技能樹</h2><p className="text-gray-400 text-sm">載入中...</p></div>
        </div>
        <div className="glass rounded-2xl p-12 text-center"><div className="text-4xl mb-3 animate-pulse">⏳</div></div>
      </div>
    )
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
              {g.skills.map((s) => {
                const canUpgrade = s.unlocked && s.level < s.max_level && state.sp >= s.sp_cost
                const isAnimating = upgradeAnim === s.name
                return (
                  <div key={s.id} className={`glass rounded-2xl p-4 transition-all ${
                    !s.unlocked ? 'opacity-30 grayscale' : isAnimating ? 'ring-2 ring-emerald-400 scale-[1.02]' : 'hover:border-white/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{s.name}</span>
                          {!s.unlocked && <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full">🔒</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-xp-500 to-xp-400 rounded-full progress-bar"
                              style={{ width: `${(s.level / s.max_level) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">Lv.{s.level}/{s.max_level}</span>
                        </div>
                        {s.unlocked && s.level < s.max_level && (
                          <button onClick={() => handleUpgrade(s)}
                            className={`mt-2 w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                              canUpgrade
                                ? 'bg-sp-400/20 text-sp-400 hover:bg-sp-400/30'
                                : 'bg-dark-600 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={!canUpgrade}>
                            升級 ({s.sp_cost} SP)
                          </button>
                        )}
                        {s.level === s.max_level && (
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
