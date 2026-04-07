'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import {
  supabase,
  getRewardItems,
  createRewardItem,
  updateRewardItem,
  deleteRewardItem,
  getRedemptions,
  createRedemption,
  reviewRedemption,
  type Profile,
  type UserRole,
  type RewardItem,
  type RewardRedemption,
} from '@/lib/supabase'

const DEFAULT_REWARDS: Omit<RewardItem, 'id' | 'created_at'>[] = [
  { name: '半天假', description: '可請半天假期', icon: '🌴', cost_gold: 5000, cost_diamond: 0, category: 'leave', active: true, created_by: 'system' },
  { name: '全天假', description: '可請全天假期', icon: '🏝️', cost_gold: 10000, cost_diamond: 0, category: 'leave', active: true, created_by: 'system' },
  { name: '獎金500元', description: '現金獎金', icon: '💰', cost_gold: 8000, cost_diamond: 0, category: 'bonus', active: true, created_by: 'system' },
  { name: '星巴克券', description: 'Starbucks 飲料券', icon: '☕', cost_gold: 3000, cost_diamond: 0, category: 'gift', active: true, created_by: 'system' },
  { name: '團隊午餐', description: '團隊聚餐名額', icon: '🍽️', cost_gold: 15000, cost_diamond: 0, category: 'gift', active: true, created_by: 'system' },
]

export default function RewardPage({ profile, role }: { profile: Profile; role: UserRole }) {
  const { state, spendGold, spendDiamond } = useGame()
  const [tab, setTab] = useState<'shop' | 'history' | 'manage'>('shop')
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null)
  const [confirmingRedemption, setConfirmingRedemption] = useState(false)
  const [redemptionMsg, setRedemptionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Manage tab state
  const [newRewardName, setNewRewardName] = useState('')
  const [newRewardDesc, setNewRewardDesc] = useState('')
  const [newRewardIcon, setNewRewardIcon] = useState('🎁')
  const [newRewardGold, setNewRewardGold] = useState(5000)
  const [newRewardDiamond, setNewRewardDiamond] = useState(0)
  const [newRewardCategory, setNewRewardCategory] = useState<'leave' | 'bonus' | 'gift' | 'custom'>('custom')
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null)
  const [creatingMsg, setCreatingMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadRewards = async () => {
    const items = await getRewardItems()
    if (items.length === 0) {
      // Seed default rewards
      for (const reward of DEFAULT_REWARDS) {
        await createRewardItem(reward)
      }
      const seeded = await getRewardItems()
      setRewards(seeded)
    } else {
      setRewards(items)
    }
  }

  const loadRedemptions = async () => {
    const data = await getRedemptions()
    setRedemptions(data)
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      await Promise.all([loadRewards(), loadRedemptions()])
      setLoading(false)
    })()

    // ── Realtime 訂閱：獎勵商品 + 兌換申請即時同步 ──
    const channel = supabase.channel('reward-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_items' }, () => loadRewards())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_redemptions' }, () => loadRedemptions())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleRedeem = async (reward: RewardItem) => {
    const canAfford = reward.cost_gold > 0 ? state.gold >= reward.cost_gold : state.diamond >= reward.cost_diamond
    if (!canAfford) {
      setRedemptionMsg({ type: 'error', text: '資源不足' })
      return
    }

    if (reward.cost_gold > 0) {
      if (!spendGold(reward.cost_gold)) return
    } else if (reward.cost_diamond > 0) {
      if (!spendDiamond(reward.cost_diamond)) return
    }

    const success = await createRedemption({
      user_id: profile.user_id,
      user_name: profile.name,
      reward_id: reward.id,
      reward_name: reward.name,
      reward_icon: reward.icon,
      cost_gold: reward.cost_gold,
      cost_diamond: reward.cost_diamond,
      status: 'pending',
      note: '',
    })

    if (success) {
      setRedemptionMsg({ type: 'success', text: `✅ 已兌換「${reward.name}」，等待審批中...` })
      setSelectedReward(null)
      setConfirmingRedemption(false)
      await loadRedemptions()
      setTimeout(() => setRedemptionMsg(null), 3000)
    } else {
      setRedemptionMsg({ type: 'error', text: '兌換失敗' })
    }
  }

  const handleCreateReward = async () => {
    if (!newRewardName.trim()) {
      setCreatingMsg({ type: 'error', text: '名稱為必填' })
      return
    }

    const success = await createRewardItem({
      name: newRewardName.trim(),
      description: newRewardDesc.trim(),
      icon: newRewardIcon,
      cost_gold: newRewardGold,
      cost_diamond: newRewardDiamond,
      category: newRewardCategory,
      active: true,
      created_by: profile.user_id,
    })

    if (success) {
      setCreatingMsg({ type: 'success', text: '✅ 已新增獎勵' })
      setNewRewardName('')
      setNewRewardDesc('')
      setNewRewardIcon('🎁')
      setNewRewardGold(5000)
      setNewRewardDiamond(0)
      setNewRewardCategory('custom')
      await loadRewards()
      setTimeout(() => setCreatingMsg(null), 3000)
    } else {
      setCreatingMsg({ type: 'error', text: '新增失敗' })
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('確定要刪除此獎勵嗎？')) return
    const success = await deleteRewardItem(rewardId)
    if (success) {
      await loadRewards()
    }
  }

  const handleReviewRedemption = async (redemptionId: string, status: 'approved' | 'rejected') => {
    const success = await reviewRedemption(redemptionId, status, profile.name)
    if (success) {
      await loadRedemptions()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ 待審批'
      case 'approved':
        return '✅ 已批准'
      case 'rejected':
        return '❌ 已拒絕'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <span className="text-gray-400">⏳ 載入中...</span>
      </div>
    )
  }

  return (
    <div className="animate-fade">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="text-3xl">🎁</span>
        <div className="flex-1">
          <h2 className="text-2xl font-black">獎勵兌換</h2>
          <p className="text-gray-400 text-sm">用金幣和鑽石兌換獎勵</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <div className="glass rounded-xl px-3 sm:px-4 py-2 text-sm">
            <span className="text-amber-400 font-bold">🪙 {state.gold.toLocaleString()}</span>
          </div>
          <div className="glass rounded-xl px-3 sm:px-4 py-2 text-sm">
            <span className="text-blue-400 font-bold">💎 {state.diamond}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button
          onClick={() => setTab('shop')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            tab === 'shop' ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30' : 'glass text-gray-400'
          }`}
        >
          🎁 獎勵商店
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            tab === 'history' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30' : 'glass text-gray-400'
          }`}
        >
          📋 我的兌換
        </button>
        {role === 'boss' && (
          <button
            onClick={() => setTab('manage')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              tab === 'manage' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400'
            }`}
          >
            ⚙️ 管理獎勵
          </button>
        )}
      </div>

      {/* Shop Tab */}
      {tab === 'shop' && (
        <div>
          {redemptionMsg && (
            <div
              className={`mb-4 p-4 rounded-xl text-sm font-medium transition-all ${
                redemptionMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {redemptionMsg.text}
            </div>
          )}

          {confirmingRedemption && selectedReward && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="glass rounded-2xl p-6 max-w-sm w-full border border-white/10">
                <div className="text-center">
                  <div className="text-6xl mb-4">{selectedReward.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{selectedReward.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{selectedReward.description}</p>
                  <div className="mb-6 p-4 bg-dark-700/50 rounded-xl">
                    <div className="text-sm text-gray-400 mb-2">消耗資源：</div>
                    {selectedReward.cost_gold > 0 && (
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="font-bold text-amber-400">🪙 {selectedReward.cost_gold.toLocaleString()}</span>
                        <span className="text-xs text-gray-500">
                          {state.gold >= selectedReward.cost_gold ? '✓' : '✗'}
                        </span>
                      </div>
                    )}
                    {selectedReward.cost_diamond > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-bold text-blue-400">💎 {selectedReward.cost_diamond}</span>
                        <span className="text-xs text-gray-500">
                          {state.diamond >= selectedReward.cost_diamond ? '✓' : '✗'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setConfirmingRedemption(false)
                        setSelectedReward(null)
                      }}
                      className="flex-1 px-4 py-2 rounded-lg glass text-gray-300 font-bold text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleRedeem(selectedReward)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-dark-900 font-bold text-sm hover:opacity-90"
                    >
                      確認兌換
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map(reward => {
              const canAfford =
                reward.cost_gold > 0 ? state.gold >= reward.cost_gold : state.diamond >= reward.cost_diamond
              return (
                <div
                  key={reward.id}
                  className="glass rounded-2xl p-5 transition-all hover:border-white/20 cursor-pointer group"
                  onClick={() => {
                    setSelectedReward(reward)
                    setConfirmingRedemption(true)
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{reward.icon}</div>
                    <div className="flex-1">
                      <div className="font-bold">{reward.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{reward.description}</div>
                      <div className="flex items-center gap-2 mt-3">
                        {reward.cost_gold > 0 ? (
                          <span className={`font-bold text-sm ${canAfford ? 'text-amber-400' : 'text-gray-600'}`}>
                            🪙 {reward.cost_gold}
                          </span>
                        ) : (
                          <span className={`font-bold text-sm ${canAfford ? 'text-blue-400' : 'text-gray-600'}`}>
                            💎 {reward.cost_diamond}
                          </span>
                        )}
                        <button
                          className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            canAfford
                              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-dark-900 hover:opacity-90'
                              : 'bg-dark-600 text-gray-600 cursor-not-allowed'
                          }`}
                          disabled={!canAfford}
                        >
                          兌換
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {redemptions.filter(r => r.user_id === profile.user_id).length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <p>暫無兌換紀錄</p>
            </div>
          ) : (
            redemptions
              .filter(r => r.user_id === profile.user_id)
              .map(redemption => (
                <div key={redemption.id} className="glass rounded-2xl p-5 border border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{redemption.reward_icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold">{redemption.reward_name}</div>
                        <span
                          className={`text-xs px-3 py-1 rounded-full border font-bold ${getStatusColor(redemption.status)}`}
                        >
                          {getStatusLabel(redemption.status)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {redemption.cost_gold > 0
                          ? `消耗 🪙 ${redemption.cost_gold.toLocaleString()}`
                          : `消耗 💎 ${redemption.cost_diamond}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(redemption.created_at).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {redemption.reviewed_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          審批時間：
                          {new Date(redemption.reviewed_at).toLocaleString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Manage Tab (Boss Only) */}
      {tab === 'manage' && role === 'boss' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create New Reward */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4">➕ 新增獎勵</h3>
            {creatingMsg && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  creatingMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {creatingMsg.text}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">獎勵圖標</label>
                <input
                  type="text"
                  value={newRewardIcon}
                  onChange={e => setNewRewardIcon(e.target.value)}
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="🎁"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">獎勵名稱 *</label>
                <input
                  type="text"
                  value={newRewardName}
                  onChange={e => setNewRewardName(e.target.value)}
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="e.g. 獎金 500 元"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">描述</label>
                <input
                  type="text"
                  value={newRewardDesc}
                  onChange={e => setNewRewardDesc(e.target.value)}
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                  placeholder="詳細描述"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">金幣成本</label>
                  <input
                    type="number"
                    value={newRewardGold}
                    onChange={e => setNewRewardGold(parseInt(e.target.value) || 0)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 block mb-1">鑽石成本</label>
                  <input
                    type="number"
                    value={newRewardDiamond}
                    onChange={e => setNewRewardDiamond(parseInt(e.target.value) || 0)}
                    className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">分類</label>
                <select
                  value={newRewardCategory}
                  onChange={e => setNewRewardCategory(e.target.value as 'leave' | 'bonus' | 'gift' | 'custom')}
                  className="w-full bg-dark-700 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="leave">假期</option>
                  <option value="bonus">獎金</option>
                  <option value="gift">禮物</option>
                  <option value="custom">自訂</option>
                </select>
              </div>
              <button
                onClick={handleCreateReward}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold text-sm hover:opacity-90"
              >
                新增獎勵
              </button>
            </div>
          </div>

          {/* Review Redemptions */}
          <div className="glass rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold mb-4">📋 待審批的兌換</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {redemptions.filter(r => r.status === 'pending').length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>沒有待審批的兌換</p>
                </div>
              ) : (
                redemptions
                  .filter(r => r.status === 'pending')
                  .map(redemption => (
                    <div key={redemption.id} className="p-4 bg-dark-700/50 rounded-xl border border-yellow-500/20">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{redemption.reward_icon}</span>
                          <div>
                            <div className="font-bold text-sm">{redemption.user_name}</div>
                            <div className="text-xs text-gray-400">{redemption.reward_name}</div>
                          </div>
                        </div>
                        <span className="text-xs text-yellow-400 font-bold">⏳ 待審</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewRedemption(redemption.id, 'approved')}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-400 font-bold text-xs hover:bg-emerald-600/50"
                        >
                          ✅ 批准
                        </button>
                        <button
                          onClick={() => handleReviewRedemption(redemption.id, 'rejected')}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-red-600/30 text-red-400 font-bold text-xs hover:bg-red-600/50"
                        >
                          ❌ 拒絕
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* All Rewards Management */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">🎁 所有獎勵</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map(reward => (
                <div key={reward.id} className="glass rounded-2xl p-4 border border-white/5">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{reward.icon}</span>
                    <button
                      onClick={() => handleDeleteReward(reward.id)}
                      className="px-2 py-1 rounded-lg bg-red-600/30 text-red-400 text-xs font-bold hover:bg-red-600/50"
                    >
                      刪除
                    </button>
                  </div>
                  <div className="font-bold text-sm mb-1">{reward.name}</div>
                  <div className="text-xs text-gray-400 mb-3">{reward.description}</div>
                  <div className="flex gap-2 text-xs">
                    {reward.cost_gold > 0 && <span className="text-amber-400 font-bold">🪙 {reward.cost_gold}</span>}
                    {reward.cost_diamond > 0 && <span className="text-blue-400 font-bold">💎 {reward.cost_diamond}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
