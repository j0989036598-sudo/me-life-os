'use client'

import { MOCK_MEMBERS } from '@/lib/mockData'

export default function AdminPage() {
  const totalDone = MOCK_MEMBERS.filter((m) => m.todayDone).length
  const totalLog = MOCK_MEMBERS.filter((m) => m.dailyLog).length

  return (
    <div className="animate-fade">
      <h2 className="text-2xl font-bold mb-2">👁️ 管理後台</h2>
      <p className="text-gray-400 mb-8">ME 專屬 · 團隊總覽</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-emerald-400">{totalDone}/{MOCK_MEMBERS.length}</div>
          <div className="text-sm text-gray-400 mt-2">今日打卡完成</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-purple-400">{totalLog}/{MOCK_MEMBERS.length}</div>
          <div className="text-sm text-gray-400 mt-2">今日日誌封印</div>
        </div>
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-4xl font-black text-amber-400">{Math.round((totalDone / MOCK_MEMBERS.length) * 100)}%</div>
          <div className="text-sm text-gray-400 mt-2">團隊活躍度</div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-bold">🧑‍🤝‍🧑 全體成員狀態</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-6 text-xs text-gray-500 p-4 border-b border-white/5">
              <span>成員</span><span>角色</span><span className="text-center">等級</span>
              <span className="text-center">今日打卡</span><span className="text-center">今日日誌</span>
              <span className="text-center">連續天數</span>
            </div>
            {MOCK_MEMBERS.map((m, i) => (
              <div key={i} className="grid grid-cols-6 items-center p-4 border-b border-white/5 hover:bg-dark-700 transition-all">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.avatar}</span>
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                <span className="text-sm text-gray-400">{m.role}</span>
                <div className="text-center text-sm">Lv.{m.level}</div>
                <div className="text-center">{m.todayDone ? <span className="text-emerald-400">✅</span> : <span className="text-red-400">❌</span>}</div>
                <div className="text-center">{m.dailyLog ? <span className="text-emerald-400">✅</span> : <span className="text-red-400">❌</span>}</div>
                <div className="text-center text-fire-400 font-bold">🔥 {m.streak}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
