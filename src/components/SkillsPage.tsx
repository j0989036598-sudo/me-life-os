'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { getUserSkills, insertUserSkills, updateUserSkill, type UserSkill, type Profile } from '@/lib/supabase'

const CATEGORIES = ['全部', '商業', '技術', '心理', '傳說']
const TIER_LABELS = ['', '初階', '進階', '精通', '傳說']
const TIER_COLORS = ['', 'from-emerald-500/20 to-emerald-500/5', 'from-blue-500/20 to-blue-500/5', 'from-purple-500/20 to-purple-500/5', 'from-amber-500/20 to-amber-500/5']

// ── 預設技能（首次登入時寫入） ──
const DEFAULT_SKILLS = [
  // Tier 1 - Marketing Fundamentals
  { name: '攝影術', icon: '📷', description: '掌握基礎的產品及內容拍攝技巧', category: '技術', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  { name: '文案力', icon: '✍️', description: '撰寫吸引人的行銷文案與廣告詞', category: '技術', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  { name: '社群經營', icon: '📱', description: '管理社群媒體帳號和互動', category: '技術', tier: 1, level: 0, max_level: 5, sp_cost: 10, unlocked: true },
  // Tier 2 - Intermediate Skills (Requires Level 10)
  { name: '視覺設計', icon: '🎨', description: '設計視覺化素材與品牌識別', category: '技術', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: false },
  { name: '數據分析', icon: '📊', description: '分析行銷數據與消費者洞察', category: '商業', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: false },
  { name: '短影音製作', icon: '🎬', description: '製作 TikTok、Reels 等短影音內容', category: '技術', tier: 2, level: 0, max_level: 5, sp_cost: 20, unlocked: false },
  // Tier 3 - Advanced Skills (Requires Level 20)
  { name: '品牌策略', icon: '🎯', description: '制定品牌定位與長期策略', category: '商業', tier: 3, level: 0, max_level: 5, sp_cost: 35, unlocked: false },
  { name: '客戶管理', icon: '🤝', description: '管理客戶關係與提升滿意度', category: '商業', tier: 3, level: 0, max_level: 5, sp_cost: 35, unlocked: false },
  { name: '專案領導', icon: '🧭', description: '領導行銷專案的規劃與執行', category: '商業', tier: 3, level: 0, max_level: 5, sp_cost: 35, unlocked: false },
  // Tier 4 - Expert Skills (Requires Level 30)
  { name: '商業洞察', icon: '🔮', description: '深度市場洞察與競爭分析能力', category: '商業', tier: 4, level: 0, max_level: 5, sp_cost: 50, unlocked: false },
  { name: '團隊培育', icon: '👥', description: '培育與管理高效能的行銷團隊', category: '商業', tier: 4, level: 0, max_level: 5, sp_cost: 50, unlocked: false },
  { name: '創新思維', icon: '⚡', description: '創意突破與創新行銷方案設計', category: '商業', tier: 4, level: 0, max_level: 5, sp_cost: 50, unlocked: false },
]

export default function SkillsPage({ profile }: { profile: Profile }) {
  const { state, spendSp } = useGame()
  const [category, setCategory] = useState('全部')
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeAnim, setUpgradeAnim] = useState<string | null>(null)

  // Tier unlock requirements
  const TIER_UNLOCK_REQS = { 1: 0, 2: 10, 3: 20, 4: 30 }

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

  // Calculate total XP bonus from all unlocked skills
  const totalXpBonus = skills
    .filter(s => s.unlocked && s.level > 0)
    .reduce((sum, s) => sum + (s.level * 5), 0)

  // Filter and enforce unlock conditions
  const filtered = category === '全部' ? skills : skills.filter(s => s.category === category)

  const grouped = [1, 2, 3, 4].map(tier => ({
    tier,
    label: TIER_LABELS[tier],
    color: TIER_COLORS[tier],
    skills: filtered.filter(s => s.tier === tier).map(s => ({
      ...s,
      // Enforce unlock conditions
      unlocked: state.level >= TIER_UNLOCK_REQS[s.tier as keyof typeof TIER_UNLOCK_REQS]
    })),
  })).filter(g => g.skills.length > 0)

  const handleUpgrade = async (skill: UserSkill) => {
    const unlocked = state.level >= TIER_UNLOCK_REQS[skill.tier as keyof typeof TIER_UNLOCK_REQS]
    if (skill.level >= skill.max_level || !unlocked) return
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

  const getLockRequirement = (tier: number): string => {
    const req = TIER_UNLOCK_REQS[tier as keyof typeof TIER_UNLOCK_REQS]
    return req === 0 ? '' : `Lv.${req} 解鎖`
  }

  if (loading) {
    return (
      <div className="animate-fade">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🌳</span>
          <div><h2 className="text-2xl font-black">成長技能樹</h2><p className="text-gray-400 text-sm">載入中...</p></div>
        </div>
        <div className="glass p-12 text-center"><div className="text-4xl mb-3 animate-pulse">⏳</div></div>
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
        <div className="ml-auto glass px-4 py-2 text-sm">
          <span className="text-sp-400 font-bold">🔮 {state.sp} SP</span>
        </div>
      </div>

      {/* XP Bonus Display */}
      <div className="glass p-4 mb-6 bg-gradient-to-r from-xp-500/10 to-amber-500/10 border border-xp-400/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-1">你的 XP 加成</div>
            <div className="text-2xl font-black text-xp-400">+{totalXpBonus}%</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-2">技能加成來自</div>
            <div className="text-sm text-gray-300">
              {skills.filter(s => s.unlocked && s.level > 0).length} 個已升級技能
            </div>
            {totalXpBonus > 0 && (
              <div className="mt-2 text-[10px] text-gray-500 max-w-xs">
                {skills
                  .filter(s => s.unlocked && s.level > 0)
                  .map(s => `${s.name} Lv.${s.level} (+${s.level * 5}%)`)
                  .join(' · ')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mt-4 mb-6">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 text-sm transition-all ${
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
                  <div key={s.id} className={`glass p-4 transition-all relative ${
                    !s.unlocked ? 'opacity-50 grayscale' : isAnimating ? 'ring-2 ring-emerald-400 scale-[1.02]' : 'hover:border-white/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl ${!s.unlocked ? 'opacity-50' : ''}`}>{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{s.name}</span>
                          {!s.unlocked && <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded-full">🔒</span>}
                        </div>
                        {!s.unlocked && (
                          <div className="text-xs text-amber-400 mt-0.5 font-bold">{getLockRequirement(s.tier)}</div>
                        )}
                        <div className={`text-xs mt-0.5 ${!s.unlocked ? 'text-gray-600' : 'text-gray-500'}`}>{s.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-2 bg-dark-600 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-xp-500 to-xp-400 progress-bar"
                              style={{ width: `${(s.level / s.max_level) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">Lv.{s.level}/{s.max_level}</span>
                        </div>
                        {s.unlocked && s.level < s.max_level && (
                          <button onClick={() => handleUpgrade(s)}
                            className={`mt-2 w-full py-1.5 text-xs font-bold transition-all ${
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
