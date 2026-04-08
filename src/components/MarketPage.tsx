'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { getUserInventory, addToInventory, getUserGachaCollection, addGachaCard, type Profile } from '@/lib/supabase'

// ── 商品定義（靜態資料，不需要存 DB） ──
const MARKET_ITEMS = [
  { id: 1, name: '雙倍XP藥水', icon: '⚡', desc: '激活 2 倍 XP，持續 3 個任務', price: 2000, currency: 'gold' as const, rarity: '稀有', effect: 'double_xp' },
  { id: 2, name: '能量飲料', icon: '🥤', desc: '恢復 1 SP', price: 1500, currency: 'gold' as const, rarity: '普通', effect: 'restore_sp' },
  { id: 3, name: '幸運符', icon: '🍀', desc: '下次抽卡保證 SR 或更高', price: 3000, currency: 'gold' as const, rarity: '史詩', effect: 'lucky_charm' },
  { id: 4, name: '重置卷軸', icon: '🔄', desc: '重置任意連續任務的連勝，無懲罰', price: 5000, currency: 'gold' as const, rarity: '史詩', effect: 'reset_scroll' },
  { id: 5, name: '經驗書', icon: '📚', desc: '立即獲得 200 XP', price: 800, currency: 'gold' as const, rarity: '普通', effect: 'xp_book' },
  { id: 6, name: '金幣袋', icon: '💰', desc: '獲得 5000 金幣', price: 5, currency: 'diamond' as const, rarity: '稀有', effect: 'gold_bag' },
]

const GACHA_POOL = [
  { name: '市場洞察：短影音紅利期', rarity: 'R', icon: '📊', desc: '短影音平台的流量紅利預計持續到 2027 年' },
  { name: '心理洞察：峰終定律', rarity: 'SR', icon: '🧠', desc: '人們記住的是體驗的高峰和結尾' },
  { name: '技術洞察：AI 工作流', rarity: 'SR', icon: '🤖', desc: '善用 AI 工具的人效率提升 10 倍' },
  { name: '傳說洞察：第一性原理', rarity: 'SSR', icon: '⭐', desc: '把問題拆解到最基本的事實，從零推理' },
  { name: '商業洞察：飛輪效應', rarity: 'R', icon: '💼', desc: '好的商業模式會形成正向循環' },
  { name: '傳說洞察：複利思維', rarity: 'SSR', icon: '🌟', desc: '每天進步 1%，一年後你會強 37 倍' },
]

export default function MarketPage({ profile }: { profile: Profile }) {
  const { state, spendGold, spendDiamond, addXp, addSp, addGold } = useGame()
  const [tab, setTab] = useState<'shop' | 'gacha'>('shop')
  const [buyAnim, setBuyAnim] = useState<number | null>(null)
  const [gachaResult, setGachaResult] = useState<typeof GACHA_POOL[0] | null>(null)
  const [gachaAnimating, setGachaAnimating] = useState(false)
  const [collection, setCollection] = useState<string[]>([])
  const [purchaseCount, setPurchaseCount] = useState(0)

  // 載入已收藏的卡片和購買紀錄
  useEffect(() => {
    ;(async () => {
      const cards = await getUserGachaCollection(profile.user_id)
      setCollection(cards.map(c => c.card_name))
      const inventory = await getUserInventory(profile.user_id)
      setPurchaseCount(inventory.length)
    })()
  }, [profile.user_id])

  const handleBuy = async (item: typeof MARKET_ITEMS[0]) => {
    const success = item.currency === 'gold' ? spendGold(item.price) : spendDiamond(item.price)
    if (success) {
      await addToInventory({ user_id: profile.user_id, item_name: item.name, item_icon: item.icon })
      setPurchaseCount(prev => prev + 1)

      // 道具效果
      switch (item.effect) {
        case 'xp_book':
          addXp(200)
          break
        case 'restore_sp':
          addSp(1)
          break
        case 'gold_bag':
          addGold(5000)
          break
        case 'double_xp':
          // Save active buff to inventory with flag - would be implemented in future
          break
        case 'lucky_charm':
          // Gacha guaranteed SR or above - would be implemented in future
          break
        case 'reset_scroll':
          // Reset recurring task streak - would be implemented in future
          break
      }

      setBuyAnim(item.id)
      setTimeout(() => setBuyAnim(null), 1500)
    }
  }

  const handleGacha = async () => {
    if (!spendGold(200)) return
    setGachaAnimating(true)
    setGachaResult(null)
    setTimeout(async () => {
      const weights = GACHA_POOL.map(g => g.rarity === 'SSR' ? 1 : g.rarity === 'SR' ? 3 : 6)
      const total = weights.reduce((a, b) => a + b, 0)
      let r = Math.random() * total
      let idx = 0
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]
        if (r <= 0) { idx = i; break }
      }
      const result = GACHA_POOL[idx]
      setGachaResult(result)
      setGachaAnimating(false)
      // 寫入 Supabase
      await addGachaCard({
        user_id: profile.user_id,
        card_name: result.name,
        card_icon: result.icon,
        card_rarity: result.rarity,
        card_desc: result.desc,
      })
      if (!collection.includes(result.name)) {
        setCollection(prev => [...prev, result.name])
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

  // Calculate unique cards bonus (1% per unique card)
  const collectionBonus = collection.length

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="text-3xl">🏪</span>
        <div className="flex-1">
          <h2 className="text-2xl font-black">市集</h2>
          <p className="text-gray-400 text-sm">用金幣和鑽石兌換強化道具 · 已購買 {purchaseCount} 件</p>
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

      {/* Tabs and Collection Bonus */}
      <div className="flex flex-wrap gap-2 items-center mt-4 mb-6">
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
        {collectionBonus > 0 && (
          <div className="ml-auto glass rounded-xl px-4 py-2.5 text-sm">
            <span className="text-emerald-400 font-bold">收藏加成: +{collectionBonus}% XP</span>
          </div>
        )}
      </div>

      {tab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKET_ITEMS.map(item => {
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
              <h4 className="font-bold text-sm mb-3">📚 已收集的洞見 ({collection.length}/{GACHA_POOL.length})</h4>
              <div className="space-y-2">
                {collection.map((name, i) => {
                  const card = GACHA_POOL.find(g => g.name === name)
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
