'use client'

export type UserRole = 'boss' | 'manager' | 'member'

interface RoleConfig {
  role: UserRole
  label: string
  title: string
  icon: string
  desc: string
  color: string
  border: string
  badge: string
}

const ROLES: RoleConfig[] = [
  {
    role: 'boss',
    label: '老闆',
    title: '最高指揮官',
    icon: '👑',
    desc: '完整系統權限 · 所有數據總覽 · 系統設定',
    color: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-400/40 hover:border-amber-400',
    badge: 'text-amber-400 bg-amber-500/10',
  },
  {
    role: 'manager',
    label: '主管',
    title: '隊長',
    icon: '🛡️',
    desc: '管理所屬組員 · 審核任務 · 查看組別報告',
    color: 'from-blue-500/20 to-blue-500/5',
    border: 'border-blue-400/40 hover:border-blue-400',
    badge: 'text-blue-400 bg-blue-500/10',
  },
  {
    role: 'member',
    label: '員工',
    title: '冒險者',
    icon: '⚔️',
    desc: '個人任務 · 技能成長 · 公會活動',
    color: 'from-purple-500/20 to-purple-500/5',
    border: 'border-purple-400/40 hover:border-purple-400',
    badge: 'text-purple-400 bg-purple-500/10',
  },
]

interface LoginPageProps {
  onLogin: (role: UserRole) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 w-full max-w-lg mx-4 animate-fade">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-float inline-block">⚔️</div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-amber-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">
            ME Life OS
          </h1>
          <p className="text-gray-400 text-base">穎流行銷 · 內部冒險者系統</p>
          <p className="text-gray-600 text-sm mt-1">把工作變成冒險，把成長變成遊戲</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-3 mb-6">
          <p className="text-center text-xs text-gray-500 mb-4 tracking-widest">— 選擇你的身份登入 —</p>
          {ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => onLogin(r.role)}
              className={`w-full glass rounded-2xl p-5 text-left transition-all duration-200 border bg-gradient-to-r ${r.color} ${r.border} hover:scale-[1.01] hover:shadow-lg group`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl group-hover:animate-pulse-slow">{r.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-lg text-white">{r.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.badge}`}>
                      {r.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
                <div className="text-gray-600 group-hover:text-gray-300 transition-colors text-xl">›</div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo notice */}
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">🔧 Demo 模式</p>
          <p className="text-xs text-gray-600">
            目前為展示用途，選擇任一角色即可進入。
            <br />正式版將透過 Google 帳號自動識別身份。
          </p>
        </div>

        <p className="text-center text-gray-700 text-xs mt-4">v2.0 Demo · 穎流行銷內部系統</p>
      </div>
    </div>
  )
}
