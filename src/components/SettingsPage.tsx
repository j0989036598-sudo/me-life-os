'use client'

import { useState } from 'react'
import { updateProfile, resetAllUserData, type Profile } from '@/lib/supabase'
import { useGame } from '@/lib/GameContext'
import { useTheme } from '@/lib/ThemeContext'

const AVATAR_OPTIONS = ['⚔️', '🛡️', '🏹', '🪄', '🔮', '🦅', '🐉', '🌟', '⚡', '🔥', '🌊', '🌸', '🎯', '🏆', '💎', '🌙']

const DEPARTMENT_OPTIONS = [
  '行銷部', '業務部', '設計部', '工程部', '客服部', '財務部', '人資部', '管理部', '其他'
]

interface SettingsPageProps {
  profile: Profile
  onProfileUpdate: (updated: Profile) => void
}

export default function SettingsPage({ profile, onProfileUpdate }: SettingsPageProps) {
  const { state, resetState } = useGame()
  const { theme, setTheme } = useTheme()
  const [name, setName] = useState(profile.name)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [jobTitle, setJobTitle] = useState(profile.job_title)
  const [department, setDepartment] = useState(profile.department)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 重置帳號相關狀態
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0) // 0=未啟動, 1=第一次確認, 2=第二次確認
  const [resetConfirmText, setResetConfirmText] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetResult, setResetResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      setError(null)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError('儲存失敗，請再試一次')
    }
  }

  const handleResetAccount = async () => {
    setResetting(true)
    setResetResult(null)

    const result = await resetAllUserData(profile.user_id)

    if (result.success) {
      // 同步重置本地 GameContext
      resetState()
      setResetResult({ type: 'success', text: '✅ 帳號已完全重置！所有數值歸零、所有紀錄已清除。重新整理頁面後生效。' })
      setResetStep(0)
      setResetConfirmText('')
    } else {
      setResetResult({ type: 'error', text: `部分重置失敗：${result.errors.join(', ')}` })
    }

    setResetting(false)
  }

  const CONFIRM_KEYWORD = '確認重置'

  return (
    <div className="animate-fade max-w-xl mx-auto">
      {saved && (
        <div className="fixed top-20 right-4 z-50 bg-green-500/20 border border-green-500/30 text-green-400 px-4 py-3 text-sm font-medium animate-fade flex items-center gap-2 shadow-lg" style={{ borderRadius: '0' }}>
          ✅ 資料已更新
        </div>
      )}
      {error && (
        <div className="fixed top-20 right-4 z-50 bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 text-sm font-medium animate-fade flex items-center gap-2 shadow-lg" style={{ borderRadius: '0' }}>
          ❌ {error}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">⚙️</span>
        <div>
          <h2 className="text-2xl font-black">個人設定</h2>
          <p className="text-gray-400 text-sm">編輯你的角色資料</p>
        </div>
      </div>

      {resetResult && (
        <div className="p-4 mb-4 border text-sm text-center" style={{ border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)', borderColor: resetResult.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)', background: resetResult.type === 'success' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', color: resetResult.type === 'success' ? 'rgb(209, 250, 229)' : 'rgb(254, 226, 226)' }}>
          {resetResult.text}
        </div>
      )}

      {/* 頭像 + 預覽 */}
      <div className="glass p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{avatar}</div>
          <div>
            <div className="font-bold text-lg">{name || '（未命名）'}</div>
            <div className="text-sm text-gray-400">{jobTitle} · {department}</div>
            <div className="text-xs text-gray-500 mt-0.5">{profile.email}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="pt-4">
          <div className="text-sm text-gray-400 mb-3">選擇頭像</div>
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_OPTIONS.map(a => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl p-2 transition-all ${
                  avatar === a
                    ? 'bg-purple-500/30 ring-2 ring-purple-400/50 scale-110'
                    : 'hover:bg-dark-600 hover:scale-105'
                }`}
                style={{ borderRadius: '0' }}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 基本資料 */}
      <div className="glass p-6 mb-4">
        <h3 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: 'var(--rpg-gold)', textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }} className="mb-4">✏️ 基本資料</h3>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1.5 block">顯示名稱</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            placeholder="輸入你的名字"
            className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
            style={{ borderRadius: '0' }}
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
            className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
            style={{ borderRadius: '0' }}
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">部門</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            style={{ borderRadius: '0' }}
          >
            {DEPARTMENT_OPTIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 外觀設定 */}
      <div className="glass p-6 mb-4">
        <h3 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: 'var(--rpg-gold)', textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }} className="mb-4">🎨 外觀設定</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('dark')}
            className="p-4 border-2 transition-all flex flex-col items-center gap-2"
            style={{ borderRadius: '0', borderColor: theme === 'dark' ? 'rgb(168, 85, 247)' : 'rgba(255,255,255,0.1)', background: theme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : 'transparent', boxShadow: theme === 'dark' ? '0 0 20px rgba(168, 85, 247, 0.1)' : 'none' }}
          >
            <span className="text-2xl">🌙</span>
            <span className="text-sm font-medium">深色模式</span>
            {theme === 'dark' && <span className="text-[10px] text-purple-400">使用中</span>}
          </button>
          <button
            onClick={() => setTheme('light')}
            className="p-4 border-2 transition-all flex flex-col items-center gap-2"
            style={{ borderRadius: '0', borderColor: theme === 'light' ? 'rgb(168, 85, 247)' : 'rgba(255,255,255,0.1)', background: theme === 'light' ? 'rgba(168, 85, 247, 0.1)' : 'transparent', boxShadow: theme === 'light' ? '0 0 20px rgba(168, 85, 247, 0.1)' : 'none' }}
          >
            <span className="text-2xl">☀️</span>
            <span className="text-sm font-medium">淺色模式</span>
            {theme === 'light' && <span className="text-[10px] text-purple-400">使用中</span>}
          </button>
        </div>
      </div>

      {/* 唯讀資訊 */}
      <div className="glass p-6 mb-4">
        <h3 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: 'var(--text-muted)' }} className="mb-4">🔒 帳號資訊（不可修改）</h3>
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
        className={`w-full py-3.5 font-bold text-sm transition-all mb-6 ${
          hasChanges && !saving
            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/20'
            : 'bg-dark-700 text-gray-600 cursor-not-allowed'
        }`}
        style={{ borderRadius: '0', border: hasChanges && !saving ? '2px solid rgb(168, 85, 247)' : '2px solid rgba(100, 100, 100, 0.3)' }}
      >
        {saving ? '儲存中...' : hasChanges ? '💾 儲存變更' : '（尚未修改）'}
      </button>

      {/* ═══ 危險區域：帳號重置 ═══ */}
      <div className="glass p-6" style={{ border: '3px solid var(--wood-dark)', borderTopColor: 'var(--wood-mid)', borderLeftColor: 'var(--wood-mid)', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
        <h3 style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '11px', color: 'var(--rpg-gold)' }} className="mb-2">⚠️ 危險操作</h3>
        <p className="text-xs text-gray-500 mb-4">以下操作將無法復原，請謹慎操作</p>

        {/* 當前數值預覽 */}
        {resetStep > 0 && (
          <div className="p-4 mb-4 border border-red-500/10" style={{ background: 'rgba(0, 0, 0, 0.5)', borderRadius: '0' }}>
            <div className="text-xs text-gray-400 mb-2">即將清除的數據：</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-amber-400 font-bold">Lv.{state.level}</div>
                <div className="text-gray-600">等級</div>
              </div>
              <div className="text-center">
                <div className="text-blue-400 font-bold">{state.xp} XP</div>
                <div className="text-gray-600">經驗值</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-400 font-bold">{state.gold}</div>
                <div className="text-gray-600">金幣</div>
              </div>
              <div className="text-center">
                <div className="text-cyan-400 font-bold">{state.diamond}</div>
                <div className="text-gray-600">鑽石</div>
              </div>
              <div className="text-center">
                <div className="text-purple-400 font-bold">{state.sp}</div>
                <div className="text-gray-600">技能點</div>
              </div>
              <div className="text-center">
                <div className="text-orange-400 font-bold">{state.streak}</div>
                <div className="text-gray-600">連勝</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} className="mt-3 pt-3 text-xs text-red-400/80 text-center">
              + 所有日誌、任務、技能、背包、抽卡、兌換紀錄
            </div>
          </div>
        )}

        {/* Step 0：初始按鈕 */}
        {resetStep === 0 && (
          <button
            onClick={() => setResetStep(1)}
            className="w-full py-3 text-sm font-bold text-red-400/70 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10 transition-all"
            style={{ borderRadius: '0' }}
          >
            🔄 重置此帳號（歸零所有數值、清空所有紀錄）
          </button>
        )}

        {/* Step 1：第一次確認 */}
        {resetStep === 1 && (
          <div className="space-y-3">
            <div className="bg-red-500/10 border border-red-500/30 p-4 text-center" style={{ borderRadius: '0' }}>
              <div className="text-2xl mb-2">🚨</div>
              <div className="text-red-300 font-bold text-sm mb-1">你確定要重置帳號嗎？</div>
              <div className="text-xs text-red-400/60">
                此操作將清除所有等級、金幣、鑽石、日誌、任務、技能、背包、抽卡收藏、兌換紀錄
              </div>
              <div className="text-xs text-red-400 font-bold mt-2">⚠️ 此操作無法復原 ⚠️</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setResetStep(0); setResetConfirmText('') }}
                className="flex-1 py-2.5 text-sm font-bold glass text-gray-300 hover:bg-dark-600 transition-all"
                style={{ borderRadius: '0' }}
              >
                取消
              </button>
              <button
                onClick={() => setResetStep(2)}
                className="flex-1 py-2.5 text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                style={{ borderRadius: '0' }}
              >
                我確定，繼續
              </button>
            </div>
          </div>
        )}

        {/* Step 2：第二次確認（需輸入關鍵字） */}
        {resetStep === 2 && (
          <div className="space-y-3">
            <div className="bg-red-500/15 border border-red-500/40 p-4 text-center" style={{ borderRadius: '0' }}>
              <div className="text-3xl mb-2">💀</div>
              <div className="text-red-300 font-bold mb-1">最後確認！</div>
              <div className="text-xs text-red-400/70 mb-3">
                請在下方輸入「<span className="text-red-300 font-bold">{CONFIRM_KEYWORD}</span>」來執行帳號重置
              </div>
              <input
                type="text"
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                placeholder={`請輸入「${CONFIRM_KEYWORD}」`}
                className="w-full bg-dark-800 border border-red-500/30 px-4 py-2.5 text-sm text-center text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 transition-colors"
                style={{ borderRadius: '0' }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setResetStep(0); setResetConfirmText('') }}
                className="flex-1 py-2.5 text-sm font-bold glass text-gray-300 hover:bg-dark-600 transition-all"
                style={{ borderRadius: '0' }}
              >
                取消
              </button>
              <button
                onClick={handleResetAccount}
                disabled={resetConfirmText !== CONFIRM_KEYWORD || resetting}
                className={`flex-1 py-2.5 text-sm font-bold transition-all ${
                  resetConfirmText === CONFIRM_KEYWORD && !resetting
                    ? 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-500/30'
                    : 'bg-dark-700 text-gray-600 cursor-not-allowed'
                }`}
                style={{ borderRadius: '0' }}
              >
                {resetting ? '重置中...' : '💀 永久重置帳號'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
