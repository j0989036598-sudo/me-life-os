'use client'

import { useState, useEffect } from 'react'
import { supabase, getAllProfiles, type Profile, type UserRole } from '@/lib/supabase'

export default function RankPage({ role }: { role?: UserRole }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const isManager = role === 'boss' || role === 'manager'

  useEffect(() => {
    getAllProfiles().then(p => {
      setProfiles(p)
      setLoading(false)
    })

    const channel = supabase.channel('rank-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        getAllProfiles().then(setProfiles)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const medals = ['🥇', '🥈', '🥉']

  const Header = () => (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-3xl">⚔️</span>
      <div>
        <h2 className="text-2xl font-black">公會：穎流行銷</h2>
        <p className="text-gray-400 text-sm">
          {loading ? '載入中...' : `Guild · ${profiles.length} 位冒險者`}
        </p>
      </div>
      {isManager && (
        <div className="ml-auto glass rounded-xl px-3 py-2 text-xs text-amber-300 border border-amber-500/20">
          {role === 'boss' ? '👑 公會會長' : '🛡️ 副會長'}
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="animate-fade">
        <Header />
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p className="text-gray-500">載入成員資料...</p>
        </div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
      <div className="animate-fade">
        <Header />
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-6xl mb-4">🏰</div>
          <h3 className="text-xl font-bold text-white mb-2">公會尚無成員</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            當員工完成首次登入並建立角色後，<br />
            將自動出現在這裡的排行榜。
          </p>
        </div>
      </div>
    )
  }

  const sorted = [...profiles].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="animate-fade">
      <Header />

      <div className="flex gap-4 mb-8 justify-center items-end">
        {[1, 0, 2].map((idx) => {
          const m = sorted[idx]
          if (!m) return null
          const isFirst = idx === 0
          return (
            <div key={m.id} className={`glass rounded-2xl p-5 text-center flex-1 max-w-[200px] transition-all ${
              isFirst ? 'ring-2 ring-amber-400/50' : ''
            }`}>
              <div className="text-4xl mb-1">{medals[idx]}</div>
              <div className={`text-4xl mb-2 ${isFirst ? 'animate-pulse-slow' : ''}`}>{m.avatar}</div>
              <div className="font-bold text-sm">{m.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.job_title}</div>
              <div className="text-xs text-gray-500">{m.department}</div>
              <div className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block ${
                m.role === 'boss' ? 'bg-amber-500/10 text-amber-400' :
                m.role === 'manager' ? 'bg-blue-500/10 text-blue-400' :
                'bg-purple-500/10 text-purple-400'
              }`}>
                {m.role === 'boss' ? '👑 老闆' : m.role === 'manager' ? '🛡️ 主管' : '⚔️ 員工'}
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-bold text-sm">🏆 全體成員排行</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            <div className="grid grid-cols-4 text-xs text-gray-500 px-4 py-3 border-b border-white/5 font-medium">
              <span>成員</span>
              <span>職稱 / 部門</span>
              <span className="text-center">角色</span>
              <span className="text-center">加入日期</span>
            </div>
            {sorted.map((m, i) => (
              <div key={m.id} className="grid grid-cols-4 items-center px-4 py-3 border-b border-white/5 hover:bg-dark-700/50 transition-all">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold w-6 ${i < 3 ? 'text-amber-400' : 'text-gray-600'}`}>
                    #{i + 1}
                  </span>
                  <span className="text-xl">{m.avatar}</span>
                  <span className="text-sm font-medium">{m.name}</span>
                </div>
                <div>
                  <div className="text-sm">{m.job_title}</div>
                  <div className="text-xs text-gray-500">{m.department}</div>
                </div>
                <div className="text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    m.role === 'boss' ? 'bg-amber-500/10 text-amber-400' :
                    m.role === 'manager' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {m.role === 'boss' ? '👑 老闆' : m.role === 'manager' ? '🛡️ 主管' : '⚔️ 員工'}
                  </span>
                </div>
                <div className="text-center text-xs text-gray-400">
                  {new Date(m.created_at).toLocaleDateString('zh-TW')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
