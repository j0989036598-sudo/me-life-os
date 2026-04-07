'use client'

import { useState } from 'react'
import { MOCK_MARKET_ITEMS, MOCK_GACHA_POOL } from '@/lib/mockData'
import { useGame } from '@/lib/GameContext'

export default function MarketPage() {
  const { state, spendGold, spendDiamond } = useGame()
  const [tab, setTab] = useState<'shop' | 'gacha'>('shop')
  const [buyAnim, setBuyAnim] = useState<number | null>(null)
  const [gachaResult, setGachaResult] = useState<typeof MOCK_GACHA_POOL[0] | null>(null)
  const [gachaAnimating, setGachaAnimating] = useState(false)
  const [collection, setCollection] = useState<string[]>([])

  const handleBuy = (item: typeof MOCK_MARKET_ITEMS[0]) => {
    const success = item.currency === 'gold' ? spendGold(item.price) : spendDiamond(item.price)
    if (success) {
      setBuyAnim(item.id)
      setTimeout(() => setBuyAnim(null), 1500)
    }
  }

  const handleGacha = () => {
    if (!spendGold(200)) return
    setGachaAnimating(true)
    setGachaResult(null)
    setTimeout(() => {
      const weights = MOCK_GACHA_POOL.map(g => g.rarity === 'SSR' ? 1 : g.rarity === 'SR' ? 3 : 6)
      const total = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      let idx = 0
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]
        if (r <= 0) { idx = i; break }
      }
      const result = MOCK_GACHA_POOL[idx]
      setGachaResult(result)
      setGachaAnimating(false)
      if (!collection.includes(result.name)) {
        setCollection([...collection, result.name])
      }
    }, 2000)
  }

  const rarityColors: Record<string, string> = {
    '普通': 'text-gray-400 bg-gray-500/10',
    '稀有': 'text-blue-400 bg-blue-500/10',
    '史詩': 'text-purple-400 bg-purple-500/10',
    'R': 'text-blue-400 border-blue-400/30',
    'SR': 'text-purple-400 border-purple-400/30',
    'SSR': 'text-amber-400 border-amber-400/30 glow-gold',
  }

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="text-3xl">🏪</span>
        <div className="flex-1">
          <h2 className="text-2xl font-black">市集</h2>
          <p className="text-gray-400 text-sm">用金幣和鑽石兌換強化道具</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <div className="glass rounded-xl px-3 sm:px-4 py-2 text-sm">
            <span className="text-gold-400 font-bold">🪙 {state.gold.toLocaleString()}</span>
          </div>
          <div className="glass rounded-xl px-3 sm:px-4 py-2 text-sm">
            <span className="text-blue-400 font-bold">💎 {state.diamond}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-4 mb-6">
        <button onClick={() => setTab('shop')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'shop' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' : 'glass text-gray-400'
          }`}>
          🛒 商店
        </button>
        <button onClick={() => setTab('gacha')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'gacha' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400'
          }`}>
          🎰 洞見抽卡
        </button>
      </div>

      {tab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_MARKET_ITEMS.map(item => {
            const canAfford = item.currency === 'gold' ? state.gold >= item.price : state.diamond >= item.price
            return (
              <div key={item.id} className={`glass rounded-2xl p-5 transition-all relative overflow-hidden ${
                buyAnim === item.id ? 'ring-2 ring-emerald-400' : 'hover:border-white/10'
              }`}>
                {buyAnim === item.id && (
                  <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center animate-fade z-10">
                    <span className="text-emerald-400 font-bold">購買成功！</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${rarityColors[item.rarity]}`}>{item.rarity}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`font-bold text-sm ${item.currency === 'gold' ? 'text-gold-400' : 'text-blue-400'}`}>
                        {item.currency === 'gold' ? '🪙' : '💎'} {item.price}
                      </span>
                      <button onClick={() => handleBuy(item)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          canAfford ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-dark-900 hover:opacity-90' : 'bg-dark-600 text-gray-600 cursor-not-allowed'
                        }`}
                        disabled={!canAfford}>
                        購買
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'gacha' && (
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="glass rounded-2xl p-8">
            <div className="text-6xl mb-4">{gachaAnimating ? '🌀' : gachaResult ? gachaResult.icon : '🎰'}</div>
            <h3 className="text-xl font-black mb-2">洞見抽卡</h3>
            <p className="text-gray-400 text-sm mb-6">每次消耗 200 Gold，隨機獲得一張洞見卡</p>

            {gachaAnimating && (
              <div className="py-8">
                <div className="text-4xl animate-pulse-slow">✨</div>
                <p className="text-gray-400 mt-2 text-sm">命運之輪轉動中...</p>
              </div>
            )}

            {gachaResult && !gachaAnimating && (
              <div className={`p-6 rounded-2xl border ${rarityColors[gachaResult.rarity]} bg-dark-700/50 mb-6`}>
                <div className="text-xs mb-2 font-bold">{gachaResult.rarity}</div>
                <div className="text-4xl mb-3">{gachaResult.icon}</div>
                <div className="font-bold text-lg mb-2">{gachaResult.name}</div>
                <div className="text-sm text-gray-300">{gachaResult.desc}</div>
              </div>
            )}

            {!gachaAnimating && (
              <button onClick={handleGacha}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                  state.gold >= 200
                    ? 'bg-gradient-to-r from-purple-600 to-amber-500 hover:opacity-90 shadow-lg'
                    : 'bg-dark-600 text-gray-600 cursor-not-allowed'
                }`}
                disabled={state.gold < 200}>
                🎰 抽一次（🪙 200）
              </button>
            )}
          </div>

          {collection.length > 0 && (
            <div className="glass rounded-2xl p-6 text-left">
              <h4 className="font-bold text-sm mb-3">📚 已收集的洞見 ({collection.length}/{MOCK_GACHA_POOL.length})</h4>
              <div className="space-y-2">
                {collection.map((name, i) => {
                  const card = MOCK_GACHA_POOL.find(g => g.name === name)
                  return card ? (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-dark-700/50 text-sm">
                      <span>{card.icon}</span>
                      <span className="flex-1 truncate">{card.name}</span>
                      <span className={`text-xs ${rarityColors[card.rarity]?.split(' ')[0]}`}>{card.rarity}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
