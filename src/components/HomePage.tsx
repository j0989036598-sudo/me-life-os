'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGame } from '@/lib/GameContext'
import OfficeCanvas, { type OfficeMember, type CharacterAppearance } from './OfficeCanvas'
import CharacterCreator from './CharacterCreator'

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
import { supabase, getAllProfiles, getAssignedTasksForUser, getUserDailyLogs, getDailyLogsByDate, getAllCharacterProfiles, getAllPresence, getCharacterProfile, upsertCharacterProfile, updatePresence, type Profile, type AssignedTask, type DailyLog, type CharacterProfile, type UserPresence } from '@/lib/supabase'

export default function HomePage({ user, role, userId }: { user?: { avatar: string; name: string; level: number; title: string }; role?: UserRole; userId?: string }) {
  const { state, addGold, addSp, addXp, addDiamond } = useGame()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [myTasks, setMyTasks] = useState<AssignedTask[]>([])
  const [myLogs, setMyLogs] = useState<DailyLog[]>([])
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([])
  const [claimedTiers, setClaimedTiers] = useState<Set<number>>(new Set())
  const [officeMembers, setOfficeMembers] = useState<OfficeMember[]>([])
  const [showCharCreator, setShowCharCreator] = useState(false)
  const [hasCharacter, setHasCharacter] = useState(true) // assume true until checked
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

  // ═══ 辦公室可視化：載入角色 + 狀態 ═══
  const loadOfficeData = useCallback(async () => {
    if (!userId) return
    const [allProfiles, allChars, allPresence] = await Promise.all([
      getAllProfiles(),
      getAllCharacterProfiles(),
      getAllPresence(),
    ])
    const charMap = new Map(allChars.map(c => [c.user_id, c]))
    const presMap = new Map(allPresence.map(p => [p.user_id, p]))

    const members: OfficeMember[] = allProfiles.map(p => {
      const char = charMap.get(p.user_id)
      const pres = presMap.get(p.user_id)
      return {
        id: p.user_id,
        name: p.name || '未命名',
        status: pres?.status || 'offline',
        character: char ? {
          spriteId: char.sprite_id ?? 'dog-chill',
        } : null,
      }
    })
    setOfficeMembers(members)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    // 檢查自己有沒有角色
    getCharacterProfile(userId).then(cp => {
      if (!cp) { setHasCharacter(false); setShowCharCreator(true) }
      else setHasCharacter(true)
    })
    // 設定自己為上線
    updatePresence(userId, 'online')
    // 載入辦公室資料
    loadOfficeData()

    // Realtime 訂閱角色和狀態變化
    const officeChannel = supabase.channel('office-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_profiles' }, () => loadOfficeData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => loadOfficeData())
      .subscribe()

    // 定期更新自己的在線狀態 (每 60 秒)
    const presenceInterval = setInterval(() => {
      updatePresence(userId, 'online')
    }, 60000)

    // 離開時設定離線
    const handleBeforeUnload = () => { updatePresence(userId, 'offline') }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      supabase.removeChannel(officeChannel)
      clearInterval(presenceInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      updatePresence(userId, 'offline')
    }
  }, [userId, loadOfficeData])

  const handleSaveCharacter = async (char: CharacterAppearance) => {
    if (!userId) return
    await upsertCharacterProfile(userId, {
      sprite_id: char.spriteId,
    })
    setHasCharacter(true)
    setShowCharCreator(false)
    updatePresence(userId, 'online')
    loadOfficeData()
  }

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
      {/* ── 角色創建彈窗 ── */}
      {showCharCreator && (
        <CharacterCreator
          onSave={handleSaveCharacter}
          onCancel={hasCharacter ? () => setShowCharCreator(false) : undefined}
          isNewUser={!hasCharacter}
        />
      )}

      {/* ── 辦公室 + 休息區 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 左：辦公室（在線 / 工作中） */}
        <div className="glass rounded-2xl p-3 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span>🏢</span>
              <h3 className="font-bold text-xs text-purple-300">辦公室</h3>
              <span className="text-xs text-gray-500">
                {officeMembers.filter(m => m.status !== 'offline').length} 人
              </span>
            </div>
            <button
              onClick={() => setShowCharCreator(true)}
              className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
            >
              ✏️
            </button>
          </div>
          <OfficeCanvas
            members={officeMembers.filter(m => m.status !== 'offline')}
            bgImage="/office-bg.jpg"
            emptyText="目前沒有人在工作"
          />
        </div>

        {/* 右：休息區（離線） */}
        <div className="glass rounded-2xl p-3 border border-white/10">
          <div className="flex items-center gap-1.5 mb-2">
            <span>🛋️</span>
            <h3 className="font-bold text-xs text-blue-300">休息區</h3>
            <span className="text-xs text-gray-500">
              {officeMembers.filter(m => m.status === 'offline').length} 人
            </span>
          </div>
          <OfficeCanvas
            members={officeMembers.filter(m => m.status === 'offline')}
            bgImage="/rest-bg.jpg"
            emptyText="大家都在工作！"
          />
        </div>
      </div>

      {/* ── 管理者專屬 ── */}
      {isManager && totalMembers > 0 && (
        <div className="glass rounded-2xl p-5 border border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-amber-500/5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{role === 'boss' ? '👑' : '🛡️'}</span>
            <h3 className="font-bold text-sm text-purple-300">
              {role === 'boss' ? '老闆視角 · 全公司今日狀態' : '主管視角 · 團隊今日狀態'}
            </h3>
            <span className="ml-auto text-xs text-gray-500">{dateStr}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-dark-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-emerald-400">{totalMembers}</div>
              <div className="text-xs text-gray-500 mt-1">團隊成員</div>
            </div>
            <div className="bg-dark-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-blue-400">{todayCheckedIn.size}</div>
              <div className="text-xs text-gray-500 mt-1">今日打卡</div>
            </div>
            <div className="bg-dark-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-amber-400">{totalMembers - todayCheckedIn.size}</div>
              <div className="text-xs text-gray-500 mt-1">未打卡</div>
            </div>
            <div className="bg-dark-700/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-black text-purple-400">{totalMembers > 0 ? Math.round((todayCheckedIn.size / totalMembers) * 100) : 0}%</div>
              <div className="text-xs text-gray-500 mt-1">打卡率</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {profiles.map((p) => (
              <div key={p.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${
                todayCheckedIn.has(p.user_id) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'
              }`}>
                <span>{p.avatar}</span>
                <span>{p.name}</span>
                <span>{todayCheckedIn.has(p.user_id) ? '✅' : '○'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 個人角色卡 ── */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/30 to-amber-500/30 flex items-center justify-center text-5xl border border-white/10">
              {user?.avatar}
            </div>
            <div className="mt-2 px-3 py-1 bg-amber-500/20 rounded-full text-xs text-amber-400 font-bold">{user?.title}</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black">{user?.name}</h1>
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Lv.{state.level}</span>
              <span className="text-fire-400 text-sm font-bold">🔥 {state.streak} 天</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {isManager ? <span className="text-purple-300 text-xs">{role === 'boss' ? '👑 最高指揮官' : '🛡️ 隊長'} · 今天是 {dateStr}</span> : `今天是 ${dateStr}`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-dark-700/50 rounded-xl p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">XP</div>
                <div className="text-lg font-bold text-xp-400">✦ {state.xp.toLocaleString()}</div>
                <div className="w-full h-1.5 bg-dark-600 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-xp-500 to-xp-400 rounded-full progress-bar" style={{ width: `${(state.xp / state.xpMax) * 100}%` }} />
                </div>
                <div className="text-[10px] text-gray-600 mt-0.5">{state.xp}/{state.xpMax}</div>
              </div>
              <div className="bg-dark-700/50 rounded-xl p-3 text-center"><div className="text-xs text-gray-500 mb-1">SP</div><div className="text-lg font-bold text-sp-400">🔮 {state.sp}</div></div>
              <div className="bg-dark-700/50 rounded-xl p-3 text-center"><div className="text-xs text-gray-500 mb-1">Gold</div><div className="text-lg font-bold text-gold-400">🪙 {state.gold.toLocaleString()}</div></div>
              <div className="bg-dark-700/50 rounded-xl p-3 text-center"><div className="text-xs text-gray-500 mb-1">鑽石</div><div className="text-lg font-bold text-blue-400">💎 {state.diamond}</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Season Pass ── */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎫</span>
            <h3 className="font-bold">Season Pass {SEASON_PASS.season}</h3>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{SEASON_PASS.name}</span>
          </div>
          <span className="text-xs text-gray-500">{state.seasonXp.toLocaleString()} / {state.seasonXpMax.toLocaleString()} 賽季XP</span>
        </div>
        <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden mb-4 relative">
          <div className="h-full bg-gradient-to-r from-amber-500 via-purple-500 to-emerald-500 rounded-full progress-bar" style={{ width: `${(state.seasonXp / state.seasonXpMax) * 100}%` }} />
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
              <div key={tier.tier} className={`text-center p-3 rounded-xl transition-all relative ${
                isClaimed ? 'bg-emerald-500/10 border border-emerald-500/20'
                : canClaim ? 'bg-amber-500/15 border border-amber-500/30 cursor-pointer hover:scale-105 hover:bg-amber-500/20'
                : 'bg-dark-700/50 border border-white/5 opacity-40'
              }`}>
                {canClaim && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 rounded-full animate-pulse" />
                )}
                <div className="text-xs text-gray-500 mb-1">Tier {tier.tier}</div>
                <div className="text-lg mb-1">{tier.icon}</div>
                <div className="text-[10px] text-gray-400 truncate">{tier.rewardText}</div>
                {isClaimed && <div className="text-[10px] text-emerald-400 mt-1">✅ 已領取</div>}
                {!isClaimed && !isUnlocked && (
                  <div className="text-[10px] text-gray-500 mt-1">🔒</div>
                )}
                {canClaim && (
                  <button onClick={() => handleClaimTier(tier)}
                    className="mt-2 w-full py-1 px-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded transition-all">
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
        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            ⚡ 待完成任務 <span className="text-xs text-gray-500">{doneTasks.length}/{myTasks.length}</span>
          </h3>
          {activeTasks.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">🎯</span>
              <p className="text-gray-500 text-sm mb-2">還沒有待完成的任務</p>
              <p className="text-gray-600 text-xs">去「任務委托」指派任務，或等主管分配吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 border border-white/5">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    <div className="text-[10px] text-gray-500">來自 {t.assigned_by_name}</div>
                  </div>
                  {t.xp_reward > 0 && <div className="text-xs text-xp-400 whitespace-nowrap">+{t.xp_reward} XP</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">📖 最近日誌</h3>
          {myLogs.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">📖</span>
              <p className="text-gray-500 text-sm mb-2">還沒有日誌紀錄</p>
              <p className="text-gray-600 text-xs">去「賢者之書」寫下今天的冒險吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-dark-700/50 border border-white/5">
                  <div className="text-2xl">{log.mood}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{log.highlight || '(無亮點)'}</div>
                    <div className="text-xs text-gray-500">{log.date} · {log.quest}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <div key={j} className={`w-1.5 h-4 rounded-full ${j < log.energy ? 'bg-amber-400' : 'bg-dark-600'}`} />
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
