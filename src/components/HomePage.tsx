'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'

const SEASON_PASS = {
  season: 'S1',
  name: '開拓者賽季',
  tiers: [
    { tier: 1, seasonXpReq: 100, reward: '🎫 賽季徽章', icon: '🎫', rewardText: '賽季徽章', effect: 'cosmetic' },
    { tier: 2, seasonXpReq: 200, reward: '🪙 500 Gold', icon: '🪙', rewardText: '500 金幣', effect: 'gold' },
    { tier: 3, seasonXpReq: 300, reward: '🔮 10 SP', icon: '🔮', rewardText: '10 SP', effect: 'sp' },
    { tier: 4, seasonXpReq: 400, reward: '⚡ 500 XP', icon: '⚡', rewardText: '500 XP', effect: 'xp' },
    { tier: 5, seasonXpReq: 500, reward: '💎 5 鑽石', icon: '💎', rewardText: '5 鑽石', effect: 'diamond' },
    { tier: 6, seasonXpReq: 600, reward: '🌟 傳說稱號', icon: '🌟', rewardText: '傳說稱號', effect: 'cosmetic' },
  ],
}
import { UserRole } from '@/app/page'
import { supabase, getAllProfiles, getAssignedTasksForUser, getUserDailyLogs, getDailyLogsByDate, type Profile, type AssignedTask, type DailyLog } from '@/lib/supabase'

export default function HomePage({ user, role, userId }: { user?: { avatar: string; name: string; level: number; title: string }; role?: UserRole; userId?: string }) {
  const { state, addGold, addSp, addXp, addDiamond } = useGame()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([])
  const [myLogs, setMyLogs] = useState<DailyLog[]>([])
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([])
  const [claimedTiers, setClaimedTiers] = useState<Set<number>>(new Set())
  const today = new Date()
  const days = ['日', '一', '二', '三', '四', '五', '六']
  const dateStr = `${today.getMonth() + 1}/${today.getDate()}（${days[today.getDay()]}）`
  const todayStr = today.toISOString().slice(0, 10)
  const isManager = role === 'boss' || role === 'manager'

  useEffect(() => {
    if (!userId) return
    // 載入我的任務 + 日誌
    getAssignedTasksForUser(userId).then(setMyTasks)
    getUserDailyLogs(userId).then(setMyLogs)

    if (isManager) {
      getAllProfiles().then(setProfiles)
      getDailyLogsByDate(todayStr).then(setTodayLogs)
      const channel = supabase.channel('home-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => getAllProfiles().then(setProfiles))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_logs' }, () => getDailyLogsByDate(todayStr).then(setTodayLogs))
        .subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [userId, isManager, todayStr])

  const totalMembers = profiles.length
  const todayCheckedIn = new Set(todayLogs.map(l => l.user_id))
  const activeTasks = myTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  const doneTasks = myTasks.filter(t => t.status === 'completed')

  const handleClaimTier = (tier: typeof SEASON_PASS.tiers[0]) => {
    if (claimedTiers.has(tier.tier)) return
    if (state.seasonXp < tier.seasonXpReq) return

    // Grant reward based on effect type
    switch (tier.effect) {
      case 'gold':
        addGold(500)
        break
      case 'sp':
        addSp(10)
        break
      case 'xp':
        addXp(500)
        break
      case 'diamond':
        addDiamond(5)
        break
      case 'cosmetic':
        // Cosmetic rewards don't need special handling
        break
    }

    // Mark tier as claimed
    setClaimedTiers(prev => new Set(Array.from(prev).concat([tier.tier])))
  }

  return (
    <div className="animate-fade space-y-6">
      {/* ── 管理者專屬 ── */}
      {isManager && totalMembers > 0 && (
        <div className="glass p-5">
          <div style={{ background: 'linear-gradient(to right, var(--wood-mid), var(--wood-frame))', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-light)', borderLeftColor: 'var(--wood-light)', padding: '0.75rem 1rem', marginBottom: '1rem' }} className="flex items-center gap-2">
            <span className="text-lg">{role === 'boss' ? '👑' : '🛡️'}</span>
            <h3 className="font-pixel text-xs text-gold-400">
              {role === 'boss' ? '老闆視角 · 全公司今日狀態' : '主管視角 · 團隊今日狀態'}
            </h3>
            <span className="ml-auto text-xs text-gray-500">{dateStr}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center">
              <div className="text-2xl font-black text-rpg-green">{totalMembers}</div>
              <div className="text-xs text-gray-500 mt-1">團隊成員</div>
            </div>
            <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center">
              <div className="text-2xl font-black text-rpg-cyan">{todayCheckedIn.size}</div>
              <div className="text-xs text-gray-500 mt-1">今日打卡</div>
            </div>
            <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center">
              <div className="text-2xl font-black text-rpg-red">{totalMembers - todayCheckedIn.size}</div>
              <div className="text-xs text-gray-500 mt-1">未打卡</div>
            </div>
            <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center">
              <div className="text-2xl font-black text-rpg-gold">{totalMembers > 0 ? Math.round((todayCheckedIn.size / totalMembers) * 100) : 0}%</div>
              <div className="text-xs text-gray-500 mt-1">打卡率</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profiles.map((p) => (
              <div key={p.id} style={{
                background: todayCheckedIn.has(p.user_id) ? 'var(--rpg-green)' : 'var(--rpg-red)',
                border: `2px solid ${todayCheckedIn.has(p.user_id) ? 'var(--rpg-green)' : 'var(--rpg-red)'}`,
                opacity: 0.8
              }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white">
                <span>{p.avatar}</span>
                <span>{p.name}</span>
                <span>{todayCheckedIn.has(p.user_id) ? '✅' : '○'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 個人角色卡 ── */}
      <div className="glass p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-frame)' }} className="w-24 h-24 flex items-center justify-center text-5xl">
              {user?.avatar}
            </div>
            <div style={{ background: 'var(--rpg-gold)', border: '2px solid var(--wood-dark)' }} className="mt-2 px-3 py-1 text-xs text-white font-bold">{user?.title}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white">{user?.name}</h1>
              <span style={{ background: 'var(--rpg-purple)', border: '2px solid var(--wood-dark)' }} className="text-xs text-white px-2 py-0.5">Lv.{state.level}</span>
              <span className="text-rpg-red text-sm font-bold">🔥 {state.streak} 天</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {isManager ? <span className="text-rpg-gold text-xs">{role === 'boss' ? '👑 最高指揮官' : '🛡️ 隊長'} · 今天是 {dateStr}</span> : `今天是 ${dateStr}`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">XP</div>
                <div className="text-lg font-bold text-xp-400">✦ {state.xp.toLocaleString()}</div>
                <div style={{ background: 'var(--bg-700)', border: '2px solid var(--wood-dark)' }} className="w-full h-1.5 mt-1.5 overflow-hidden">
                  <div className="h-full progress-bar" style={{ background: 'var(--rpg-cyan)', width: `${(state.xp / state.xpMax) * 100}%` }} />
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{state.xp}/{state.xpMax}</div>
              </div>
              <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center"><div className="text-xs text-gray-500 mb-1">SP</div><div className="text-lg font-bold text-sp-400">🔮 {state.sp}</div></div>
              <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center"><div className="text-xs text-gray-500 mb-1">Gold</div><div className="text-lg font-bold text-gold-400">🪙 {state.gold.toLocaleString()}</div></div>
              <div style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="p-3 text-center"><div className="text-xs text-gray-500 mb-1">鑽石</div><div className="text-lg font-bold text-rpg-cyan">💎 {state.diamond}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Season Pass ── */}
      <div className="glass p-6">
        <div style={{ background: 'linear-gradient(to right, var(--wood-mid), var(--wood-frame))', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-light)', borderLeftColor: 'var(--wood-light)', padding: '0.75rem 1rem', marginBottom: '1rem' }} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎫</span>
            <h3 className="font-pixel text-xs text-gold-400">Season Pass {SEASON_PASS.season}</h3>
            <span style={{ background: 'var(--rpg-gold)', color: 'var(--wood-darkest)' }} className="text-xs px-2 py-0.5 font-bold">{SEASON_PASS.name}</span>
          </div>
          <span className="text-xs text-gray-500">{state.seasonXp.toLocaleString()} / {state.seasonXpMax.toLocaleString()} 賽季XP</span>
        </div>
        <div style={{ background: 'var(--bg-700)', border: '2px solid var(--wood-dark)' }} className="w-full h-2 overflow-hidden mb-4 relative">
          <div className="h-full progress-bar" style={{ background: 'var(--rpg-gold)', width: `${(state.seasonXp / state.seasonXpMax) * 100}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white pointer-events-none">
            {Math.round((state.seasonXp / state.seasonXpMax) * 100)}%
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {SEASON_PASS.tiers.map((tier) => {
            const isClaimed = claimedTiers.has(tier.tier)
            const isUnlocked = state.seasonXp >= tier.seasonXpReq
            const canClaim = isUnlocked && !isClaimed

            return (
              <div key={tier.tier} style={{
                background: isClaimed ? 'var(--rpg-green)' : canClaim ? 'var(--rpg-gold)' : 'var(--bg-700)',
                border: `3px solid ${isClaimed ? 'var(--rpg-green)' : canClaim ? 'var(--rpg-gold)' : 'var(--wood-dark)'}`,
                borderTopColor: isClaimed || canClaim ? 'inherit' : 'var(--wood-mid)',
                borderLeftColor: isClaimed || canClaim ? 'inherit' : 'var(--wood-mid)',
                opacity: !isClaimed && !isUnlocked ? 0.5 : 1,
              }} className="text-center p-3 transition-all relative">
                {canClaim && (
                  <div style={{ background: 'var(--rpg-red)' }} className="absolute -top-2 -right-2 w-5 h-5 animate-pulse" />
                )}
                <div className="text-xs text-gray-500 mb-1">Tier {tier.tier}</div>
                <div className="text-lg mb-1">{tier.icon}</div>
                <div className="text-[10px] text-gray-400 truncate">{tier.rewardText}</div>
                {isClaimed && <div className="text-[10px] text-white mt-1">✅ 已領取</div>}
                {!isClaimed && !isUnlocked && (
                  <div className="text-[10px] text-gray-500 mt-1">🔒</div>
                )}
                {canClaim && (
                  <button onClick={() => handleClaimTier(tier)}
                    style={{ background: 'var(--rpg-green)', border: '2px solid var(--wood-dark)' }}
                    className="pixel-btn mt-2 w-full py-1 px-1 text-white text-[9px] font-bold transition-all">
                    領取
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 下方兩欄 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <div style={{ background: 'linear-gradient(to right, var(--wood-mid), var(--wood-frame))', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-light)', borderLeftColor: 'var(--wood-light)', padding: '0.75rem 1rem', marginBottom: '1rem' }} className="flex items-center justify-between">
            <h3 className="font-pixel text-xs text-gold-400">⚡ 待完成任務</h3>
            <span className="text-xs text-gray-500">{doneTasks.length}/{myTasks.length}</span>
          </div>
          {activeTasks.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">🎯</span>
              <p className="text-gray-400 text-sm mb-2">還沒有待完成的任務</p>
              <p className="text-gray-500 text-xs">去「任務委托」指派任務，或等主管分配吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.slice(0, 4).map((t) => (
                <div key={t.id} style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="flex items-center gap-3 p-3">
                  <div style={{ border: '2px solid var(--rpg-gold)' }} className="w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate text-white">{t.title}</div>
                    <div className="text-[10px] text-gray-500">來自 {t.assigned_by_name}</div>
                  </div>
                  {t.xp_reward > 0 && <div className="text-xs text-xp-400 whitespace-nowrap">+{t.xp_reward} XP</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-6">
          <div style={{ background: 'linear-gradient(to right, var(--wood-mid), var(--wood-frame))', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-light)', borderLeftColor: 'var(--wood-light)', padding: '0.75rem 1rem', marginBottom: '1rem' }} className="flex items-center gap-2">
            <span className="text-gold-400">📖</span>
            <h3 className="font-pixel text-xs text-gold-400">最近日誌</h3>
          </div>
          {myLogs.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">📖</span>
              <p className="text-gray-400 text-sm mb-2">還沒有日誌紀錄</p>
              <p className="text-gray-500 text-xs">去「賢者之書」寫下今天的冒險吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myLogs.slice(0, 4).map((log) => (
                <div key={log.id} style={{ background: 'var(--bg-800)', border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)' }} className="flex items-center gap-3 p-3">
                  <div className="text-2xl">{log.mood}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-white">{log.highlight || '(無亮點)'}</div>
                    <div className="text-xs text-gray-500">{log.date} · {log.quest}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} style={{ background: j < log.energy ? 'var(--rpg-gold)' : 'var(--bg-700)', border: '1px solid var(--wood-dark)' }} className="w-1.5 h-4" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
