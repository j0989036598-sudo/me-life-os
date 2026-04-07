'use client'

import { useState } from 'react'
import { MOCK_TASKS, MOCK_MEMBERS } from '@/lib/mockData'
import { useGame } from '@/lib/GameContext'
import { UserRole } from '@/components/LoginPage'

export default function TasksPage({ role }: { role?: UserRole }) {
  const { addXp, addGold } = useGame()
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [filter, setFilter] = useState('all')
  const [rewardAnim, setRewardAnim] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal')

  const isManager = role === 'boss' || role === 'manager'

  const toggle = (id: number) => {
    const task = tasks.find(t => t.id === id)
    if (task && !task.done) {
      addXp(task.xp)
      addGold(task.gold)
      setRewardAnim(id)
      setTimeout(() => setRewardAnim(null), 1500)
    }
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const done = tasks.filter((t) => t.done).length
  const filtered = filter === 'all' ? tasks : filter === 'main' ? tasks.filter(t => t.type === 'main') : tasks.filter(t => t.type === 'side')

  return (
    <div className="animate-fade">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h2 className="text-2xl font-black">任務中心</h2>
            <p className="text-gray-400 text-sm">完成任務獲得 XP 和金幣</p>
          </div>
        </div>
        <div className="glass rounded-xl px-5 py-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{done}/{tasks.length}</div>
          <div className="text-xs text-gray-500">已完成</div>
        </div>
      </div>

      {/* 管理者 Tab 切換 */}
      {isManager && (
        <div className="flex gap-2 mb-5">
          <button onClick={() => setActiveTab('personal')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'personal' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400'
            }`}>
            ⚔️ 我的任務
          </button>
          <button onClick={() => setActiveTab('team')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'team' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' : 'glass text-gray-400'
            }`}>
            👥 全員任務
          </button>
        </div>
      )}

      {/* 全員任務視圖（管理者限定） */}
      {isManager && activeTab === 'team' ? (
        <div className="space-y-5">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-amber-300">📊 今日全員完成概覽</h3>
            </div>
            <div className="space-y-3">
              {MOCK_MEMBERS.map((m, i) => {
                const memberDone = Math.floor(Math.random() * 5) + 1
                const memberTotal = 6
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl">{m.avatar}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{m.name}</span>
                        <span className="text-xs text-gray-500">{memberDone}/{memberTotal}</span>
                      </div>
                      <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          memberDone/memberTotal >= 0.8 ? 'bg-emerald-400' :
                          memberDone/memberTotal >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                        }`} style={{ width: `${(memberDone/memberTotal)*100}%` }} />
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      m.todayDone ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {m.todayDone ? '已打卡' : '未打卡'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 未完成提醒 */}
          <div className="glass rounded-2xl p-4">
            <h3 className="font-bold text-sm text-red-300 mb-3">⚠️ 今日未打卡成員</h3>
            <div className="flex flex-wrap gap-2">
              {MOCK_MEMBERS.filter(m => !m.todayDone).map((m, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm">
                  <span>{m.avatar}</span>
                  <span className="text-red-300">{m.name}</span>
                </div>
              ))}
              {MOCK_MEMBERS.filter(m => !m.todayDone).length === 0 && (
                <span className="text-emerald-400 text-sm">🎉 全員都打卡了！</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 個人任務視圖 */
        <>
          <div className="w-full h-3 bg-dark-700 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full progress-bar" style={{ width: `${(done / tasks.length) * 100}%` }} />
          </div>

          <div className="flex gap-2 mb-4">
            {[
              { key: 'all', label: '全部' },
              { key: 'main', label: '🗡️ 主線' },
              { key: 'side', label: '📜 支線' },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  filter === f.key ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400 hover:text-white'
                }`}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((t) => (
              <div key={t.id} onClick={() => toggle(t.id)}
                className={`relative flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                  t.done ? 'glass border border-emerald-500/20 bg-emerald-500/5' : 'glass hover:border-white/10'
                }`}>
                {rewardAnim === t.id && (
                  <div className="absolute inset-0 flex items-center justify-center animate-fade">
                    <span className="text-lg font-bold text-xp-400 animate-float">+{t.xp} XP ✦</span>
                  </div>
                )}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  t.done ? 'border-emerald-400 bg-emerald-400 text-dark-900 text-lg' : 'border-gray-600'
                }`}>
                  {t.done && '✓'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${t.done ? 'line-through text-gray-500' : ''}`}>{t.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.type === 'main' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {t.type === 'main' ? '主線' : '支線'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="px-2 py-0.5 bg-dark-600 rounded-full">{t.category}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-xp-400 font-bold">+{t.xp} XP</div>
                  <div className="text-sm text-gold-400">+{t.gold} 🪙</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
