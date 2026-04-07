'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

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
  addXp: (amount: number) => void
  addGold: (amount: number) => void
  addSp: (amount: number) => void
  addDiamond: (amount: number) => void
  spendGold: (amount: number) => boolean
  spendDiamond: (amount: number) => boolean
  spendSp: (amount: number) => boolean
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    xp: 0,
    xpMax: 100,
    sp: 0,
    gold: 0,
    diamond: 0,
    level: 1,
    streak: 0,
    seasonTier: 0,
    seasonXp: 0,
    seasonXpMax: 500,
  })

  const addXp = (amount: number) => {
    setState(prev => {
      let newXp = prev.xp + amount
      let newLevel = prev.level
      let newXpMax = prev.xpMax
      let newSp = prev.sp

      while (newXp >= newXpMax) {
        newXp -= newXpMax
        newLevel++
        newXpMax = Math.floor(newXpMax * 1.2)
        newSp += 5
      }

      const newSeasonXp = Math.min(prev.seasonXp + amount, prev.seasonXpMax)
      const newSeasonTier = newSeasonXp >= prev.seasonXpMax ? prev.seasonTier + 1 : prev.seasonTier

      return { ...prev, xp: newXp, level: newLevel, xpMax: newXpMax, sp: newSp, seasonXp: newSeasonXp, seasonTier: newSeasonTier }
    })
  }

  const addGold = (amount: number) => setState(prev => ({ ...prev, gold: prev.gold + amount }))
  const addSp = (amount: number) => setState(prev => ({ ...prev, sp: prev.sp + amount }))
  const addDiamond = (amount: number) => setState(prev => ({ ...prev, diamond: prev.diamond + amount }))

  const spendGold = (amount: number) => {
    if (state.gold < amount) return false
    setState(prev => ({ ...prev, gold: prev.gold - amount }))
    return true
  }

  const spendDiamond = (amount: number) => {
    if (state.diamond < amount) return false
    setState(prev => ({ ...prev, diamond: prev.diamond - amount }))
    return true
  }

  const spendSp = (amount: number) => {
    if (state.sp < amount) return false
    setState(prev => ({ ...prev, sp: prev.sp - amount }))
    return true
  }

  return (
    <GameContext.Provider value={{ state, addXp, addGold, addSp, addDiamond, spendGold, spendDiamond, spendSp }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}
