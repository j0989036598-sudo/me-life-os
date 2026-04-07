'use client'

import { UserRole } from '@/components/LoginPage'

export default function RankPage({ role }: { role?: UserRole }) {
  const isManager = role === 'boss' || role === 'manager'

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚔️</span>
        <div>
          <h2 className="text-2xl font-black">公會：穎流行銷</h2>
          <p className="text-gray-400 text-sm">等待冒險者加入...</p>
        </div>
        {isManager && (
          <div className="ml-auto glass rounded-xl px-3 py-2 text-xs text-amber-300 border border-amber-500/20">
            {role === 'boss' ? '👑 公會會長' : '🛡️ 副會長'}
          </div>
        )}
      </div>

      {/* Empty State */}
      <div className="glass rounded-2xl p-16 text-center">
        <div className="text-6xl mb-4">🏰</div>
        <h3 className="text-xl font-bold text-white mb-2">公會尚無成員</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          當員工完成首次登入並建立角色後，<br />
          將自動出現在這裡的排行榜。
        </p>
        <div className="mt-6 text-xs text-gray-600">
          分享系統連結給同事，讓他們用 Google 帳號登入即可加入
        </div>
      </div>
    </div>
  )
}
