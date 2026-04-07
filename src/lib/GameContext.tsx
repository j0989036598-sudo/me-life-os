'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { getGameStats, upsertGameStats } from '@/lib/supabase'

export interface GameState {
  xp: number
  xpMax: number
  sp: number
  gold: number
  diamond: number
  level: number
  streak: number
  seasonTier: number
  seasonXp: number
  seasonXpMax: number
}

interface GameContextType {
  state: GameState
  ready: boolean
  addXp: (amount: number) => void
  addGold: (amount: number) => void
  addSp: (amount: number) => void
  addDiamond: (amount: number) => void
  spendGold: (amount: number) => boolean
  spendDiamond: (amount: number) => boolean
  spendSp: (amount: number) => boolean
  resetState: () => void
}

const DEFAULT_STATE: GameState = {
  xp: 0, xpMax: 100, sp: 0, gold: 0, diamond: 0,
  level: 1, streak: 0, seasonTier: 0, seasonXp: 0, seasonXpMax: 500,
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ userId, children }: { userId?: string; children: ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE)
  const [ready, setReady] = useState(false)

  // ── 初始化：從 Supabase 讀取 ──
  useEffect(() => {
    if (!userId) { setReady(true); return }
    ;(async () => {
      const stats = await getGameStats(userId)
      if (stats) {
        const today = new Date().toISOString().slice(0, 10)
        const lastDate = stats.streak_last_date
        let streak = stats.streak || 0
        if (lastDate) {
          const diffDays = (new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000
          if (diffDays > 1) streak = 0
        }
        setState({
          xp: stats.xp ?? 0, xpMax: stats.xp_max ?? 100,
          sp: stats.sp ?? 0, gold: stats.gold ?? 0, diamond: stats.diamond ?? 0,
          level: stats.level ?? 1, streak,
          seasonTier: stats.season_tier ?? 0, seasonXp: stats.season_xp ?? 0, seasonXpMax: 500,
        })
      } else {
        // 第一次登入，建立初始資料
        await upsertGameStats({ user_id: userId, xp: 0, xp_max: 100, sp: 0, gold: 0, diamond: 0, level: 1, streak: 0, streak_last_date: null, season_tier: 0, season_xp: 0 })
      }
      setReady(true)
    })()
  }, [userId])

  // ── 同步寫回 Supabase ──
  const syncToSupabase = useCallback((next: GameState) => {
    if (!userId) return
    upsertGameStats({
      user_id: userId, xp: next.xp, xp_max: next.xpMax,
      sp: next.sp, gold: next.gold, diamond: next.diamond,
      level: next.level, streak: next.streak,
      streak_last_date: new Date().toISOString().slice(0, 10),
      season_tier: next.seasonTier, season_xp: next.seasonXp,
    })
  }, [userId])

  const addXp = (amount: number) => {
    setState(prev => {
      let newXp = prev.xp + amount, newLevel = prev.level, newXpMax = prev.xpMax, newSp = prev.sp
      while (newXp >= newXpMax) { newXp -= newXpMax; newLevel++; newXpMax = Math.floor(newXpMax * 1.2); newSp += 5 }
      const newSeasonXp = Math.min(prev.seasonXp + amount, prev.seasonXpMax)
      const newSeasonTier = newSeasonXp >= prev.seasonXpMax ? prev.seasonTier + 1 : prev.seasonTier
      const next = { ...prev, xp: newXp, level: newLevel, xpMax: newXpMax, sp: newSp, seasonXp: newSeasonXp, seasonTier: newSeasonTier }
      syncToSupabase(next)
      return next
    })
  }

  const addGold = (amount: number) => setState(prev => { const next = { ...prev, gold: prev.gold + amount }; syncToSupabase(next); return next })
  const addSp = (amount: number) => setState(prev => { const next = { ...prev, sp: prev.sp + amount }; syncToSupabase(next); return next })
  const addDiamond = (amount: number) => setState(prev => { const next = { ...prev, diamond: prev.diamond + amount }; syncToSupabase(next); return next })

  const spendGold = (amount: number) => {
    if (state.gold < amount) return false
    setState(prev => { const next = { ...prev, gold: prev.gold - amount }; syncToSupabase(next); return next })
    return true
  }
  const spendDiamond = (amount: number) => {
    if (state.diamond < amount) return false
    setState(prev => { const next = { ...prev, diamond: prev.diamond - amount }; syncToSupabase(next); return next })
    return true
  }
  const spendSp = (amount: number) => {
    if (state.sp < amount) return false
    setState(prev => { const next = { ...prev, sp: prev.sp - amount }; syncToSupabase(next); return next })
    return true
  }

  const resetState = () => {
    setState(DEFAULT_STATE)
    syncToSupabase(DEFAULT_STATE)
  }

  return (
    <GameContext.Provider value={{ state, ready, addXp, addGold, addSp, addDiamond, spendGold, spendDiamond, spendSp, resetState }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
