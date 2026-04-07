'use client'

import { useState } from 'react'
import { updateProfile, type Profile } from '@/lib/supabase'

const AVATAR_OPTIONS = ['⚔️', '🛡️', '🏹', '🪄', '🔮', '🦅', '🐉', '🌟', '⚡', '🔥', '🌊', '🌸', '🎯', '🏆', '💎', '🌙']

const DEPARTMENT_OPTIONS = [
  '行銷部', '業務部', '設計部', '工程部', '客服部', '財務部', '人資部', '管理部', '其他'
]

interface SettingsPageProps {
  profile: Profile
  onProfileUpdate: (updated: Profile) => void
}

export default function SettingsPage({ profile, onProfileUpdate }: SettingsPageProps) {
  const [name, setName] = useState(profile.name)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [jobTitle, setJobTitle] = useState(profile.job_title)
  const [department, setDepartment] = useState(profile.department)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChanges = name !== profile.name || avatar !== profile.avatar ||
    jobTitle !== profile.job_title || department !== profile.department

  const handleSave = async () => {
    if (!name.trim()) { setError('名字不能為空'); return }
    setSaving(true)
    setError(null)
    const updated = await updateProfile(profile.user_id, {
      name: name.trim(),
      avatar,
      job_title: jobTitle,
      department,
    })
    setSaving(false)
    if (updated) {
      onProfileUpdate(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setError('儲存失敗，請再試一次')
    }
  }

  return (
    <div className="animate-fade max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚙️</span>
        <div>
          <h2 className="text-2xl font-black">個人設定</h2>
          <p className="text-gray-400 text-sm">編輯你的角色資料</p>
        </div>
      </div>

      {saved && (
        <div className="glass rounded-xl p-4 mb-4 border border-emerald-500/30 bg-emerald-500/5 text-emerald-300 text-sm text-center animate-fade">
          ✅ 個人資料已儲存！
        </div>
      )}

      {error && (
        <div className="glass rounded-xl p-4 mb-4 border border-red-500/30 bg-red-500/5 text-red-300 text-sm text-center">
          ⚠️ {error}
        </div>
      )}

      {/* 頭像 + 預覽 */}
      <div className="glass rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{avatar}</div>
          <div>
            <div className="font-bold text-lg">{name || '（未命名）'}</div>
            <div className="text-sm text-gray-400">{jobTitle} · {department}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile.email}</div>
          </div>
        </div>
        <div className="border-t border-white/5 pt-4">
          <div className="text-sm text-gray-400 mb-3">選擇頭像</div>
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_OPTIONS.map(a => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl p-2 rounded-xl transition-all ${
                  avatar === a
                    ? 'bg-purple-500/30 ring-2 ring-purple-400/50 scale-110'
                    : 'hover:bg-dark-600 hover:scale-105'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 基本資料 */}
      <div className="glass rounded-2xl p-6 mb-4">
        <h3 className="font-bold mb-4">✏️ 基本資料</h3>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1.5 block">顯示名稱</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            placeholder="輸入你的名字"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1.5 block">職稱</label>
          <input
            type="text"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            maxLength={30}
            placeholder="例：資深設計師"
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">部門</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            {DEPARTMENT_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 唯讀資訊 */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h3 className="font-bold mb-4 text-gray-400">🔒 帳號資訊（不可修改）</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-300">{profile.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">角色</span>
            <span className={`font-bold ${
              profile.role === 'boss' ? 'text-amber-400' :
              profile.role === 'manager' ? 'text-blue-400' : 'text-purple-400'
            }`}>
              {profile.role === 'boss' ? '👑 老闆' : profile.role === 'manager' ? '🛡️ 主管' : '⚔️ 員工'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">加入日期</span>
            <span className="text-gray-300">
              {new Date(profile.created_at).toLocaleDateString('zh-TW')}
            </span>
          </div>
        </div>
      </div>

      {/* 儲存按鈕 */}
      <button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all ${
          hasChanges && !saving
            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20'
            : 'bg-dark-700 text-gray-600 cursor-not-allowed'
        }`}
      >
        {saving ? '儲存中...' : hasChanges ? '💾 儲存變更' : '（尚未修改）'}
      </button>
    </div>
  )
}
