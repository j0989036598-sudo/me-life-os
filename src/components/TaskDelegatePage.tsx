'use client'

import { useState, useEffect } from 'react'
import { useGame } from '@/lib/GameContext'
import { supabase, getAllProfiles, getAllAssignedTasks, createAssignedTask, updateAssignedTaskStatus, deleteAssignedTask, upsertGameStats, getGameStats, createNotification, type Profile, type AssignedTask } from '@/lib/supabase'

interface TaskDelegatePageProps {
  currentUserId: string
  currentUserName: string
  currentRole: string
}

export default function TaskDelegatePage({ currentUserId, currentUserName, currentRole }: TaskDelegatePageProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'assign' | 'sent' | 'received'>('assign')

  // Form states
  const [assignTo, setAssignTo] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [xpReward, setXpReward] = useState(50)
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [category, setCategory] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const CATEGORIES = ['行銷', '設計', '攝影', '剪輯', '企劃', '客服', '行政', '其他']

  const fetchData = async () => {
    setLoading(true)
    const [p, t] = await Promise.all([getAllProfiles(), getAllAssignedTasks()])
    setProfiles(p)
    setTasks(t)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const channel = supabase.channel('tasks-delegate-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assigned_tasks' }, () => {
        getAllAssignedTasks().then(setTasks)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        getAllProfiles().then(setProfiles)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Boss can assign to everyone, manager can assign to members
  const assignableProfiles = profiles.filter(p => {
    if (p.user_id === currentUserId) return false
    if (currentRole === 'boss') return true
    if (currentRole === 'manager') return p.role === 'member'
    return false
  })

  const sentTasks = tasks.filter(t => t.assigned_by === currentUserId)
  const receivedTasks = tasks.filter(t => t.assigned_to === currentUserId)

  const handleAssign = async () => {
    if (!assignTo || !title.trim()) {
      setMsg({ type: 'error', text: '請選擇指派對象並填寫任務標題' })
      return
    }
    setSubmitting(true)
    setMsg(null)
    const targetProfile = profiles.find(p => p.user_id === assignTo)
    const result = await createAssignedTask({
      assigned_by: currentUserId,
      assigned_by_name: currentUserName,
      assigned_to: assignTo,
      assigned_to_name: targetProfile?.name || '',
      title: title.trim(),
      description: desc.trim(),
      xp_reward: xpReward,
      due_date: dueDate || undefined,
      priority: priority,
      category: category || '其他',
    })
    setSubmitting(false)
    if (result) {
      // 發送通知給被指派者
      createNotification({
        user_id: assignTo,
        type: 'task_assigned',
        title: '📋 新任務指派',
        message: `${currentUserName} 指派了「${title.trim()}」給你`,
        link_to: 'task-delegate',
      })
      setMsg({ type: 'success', text: `✅ 已指派「${title}」給 ${targetProfile?.name}` })
      setTitle('')
      setDesc('')
      setAssignTo('')
      setDueDate('')
      setXpReward(50)
      setPriority('medium')
      setCategory('')
      getAllAssignedTasks().then(setTasks)
    } else {
      setMsg({ type: 'error', text: '指派失敗，請再試一次' })
    }
  }

  const handleStatusChange = async (taskId: string, status: AssignedTask['status']) => {
    await updateAssignedTaskStatus(taskId, status)
    // 完成任務時，更新被指派者的 game stats（加 XP）
    if (status === 'completed') {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        if (task.xp_reward > 0) {
          const stats = await getGameStats(task.assigned_to)
          if (stats) {
            let newXp = stats.xp + task.xp_reward
            let newLevel = stats.level
            let newXpMax = stats.xp_max
            let newSp = stats.sp
            while (newXp >= newXpMax) { newXp -= newXpMax; newLevel++; newXpMax = Math.floor(newXpMax * 1.2); newSp += 5 }
            await upsertGameStats({ ...stats, xp: newXp, level: newLevel, xp_max: newXpMax, sp: newSp, gold: stats.gold + Math.floor(task.xp_reward / 2) })
          }
        }
        // 通知指派者任務已完成
        createNotification({
          user_id: task.assigned_by,
          type: 'task_completed',
          title: '✅ 任務完成',
          message: `${task.assigned_to_name} 完成了「${task.title}」`,
          link_to: 'task-delegate',
        })
      }
    }
    getAllAssignedTasks().then(setTasks)
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('確定要刪除此任務嗎？')) return
    await deleteAssignedTask(taskId)
    getAllAssignedTasks().then(setTasks)
  }

  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId)

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    const labels: Record<string, string> = {
      pending: '⏳ 待處理', in_progress: '🔄 進行中', completed: '✅ 已完成', cancelled: '❌ 已取消'
    }
    return <span className={`text-xs px-2 py-1 rounded-full border ${map[status] || ''}`}>{labels[status] || status}</span>
  }

  const tabClass = (t: string) => `px-4 py-2 text-sm font-medium rounded-xl transition-all ${
    tab === t ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:text-gray-300'
  }`

  const renderTaskList = (taskList: AssignedTask[], showTarget: boolean) => (
    taskList.length === 0 ? (
      <div className="glass p-12 text-center text-gray-500">
        <div className="text-4xl mb-3">📋</div>
        <p>尚無任務</p>
      </div>
    ) : (
      <div className="space-y-3">
        {taskList.map(task => {
          const target = showTarget ? getProfileByUserId(task.assigned_to) : getProfileByUserId(task.assigned_by)
          return (
            <div key={task.id} className="glass p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-1">{target?.avatar || '👤'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">{task.title}</span>
                    {statusBadge(task.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {showTarget ? `指派給 ${task.assigned_to_name}` : `來自 ${task.assigned_by_name}`}
                    {task.due_date && ` · 期限 ${task.due_date}`}
                    {task.xp_reward > 0 && <span className="text-xp-400 ml-2">+{task.xp_reward} XP</span>}
                  </div>
                  {task.description && <div className="text-sm text-gray-400 mt-1">{task.description}</div>}
                </div>
                <div className="flex gap-1">
                  {showTarget && task.status !== 'completed' && task.status !== 'cancelled' && (
                    <button onClick={() => handleDelete(task.id)} className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg">✕</button>
                  )}
                  {!showTarget && task.status === 'pending' && (
                    <button onClick={() => handleStatusChange(task.id, 'in_progress')} className="text-xs text-blue-400 hover:bg-blue-500/10 px-2 py-1 rounded-lg">開始</button>
                  )}
                  {!showTarget && task.status === 'in_progress' && (
                    <button onClick={() => handleStatusChange(task.id, 'completed')} className="text-xs text-emerald-400 hover:bg-emerald-500/10 px-2 py-1 rounded-lg">完成</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  )

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📋</span>
        <div>
          <h2 className="text-2xl font-black">任務委托</h2>
          <p className="text-gray-400 text-sm">指派任務給團隊成員</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass p-6 text-center">
          <div className="text-4xl font-black text-purple-400">{sentTasks.length}</div>
          <div className="text-sm text-gray-400 mt-2">已指派任務</div>
        </div>
        <div className="glass p-6 text-center">
          <div className="text-4xl font-black text-emerald-400">{sentTasks.filter(t => t.status === 'completed').length}</div>
          <div className="text-sm text-gray-400 mt-2">已完成</div>
        </div>
        <div className="glass p-6 text-center">
          <div className="text-4xl font-black text-yellow-400">{sentTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}</div>
          <div className="text-sm text-gray-400 mt-2">進行中</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 p-1 glass w-fit">
        <button className={tabClass('assign')} onClick={() => setTab('assign')}>📝 指派任務</button>
        <button className={tabClass('sent')} onClick={() => setTab('sent')}>📤 已指派 ({sentTasks.length})</button>
        <button className={tabClass('received')} onClick={() => setTab('received')}>📥 收到的任務 ({receivedTasks.length})</button>
      </div>

      {loading ? (
        <div className="glass p-12 text-center text-gray-500">
          <div className="text-4xl mb-3 animate-pulse">⏳</div><p>載入中...</p>
        </div>
      ) : (
        <>
          {tab === 'assign' && (
            <div className="glass p-6">
              <h3 className="font-bold mb-5">📝 指派新任務</h3>
              {msg && (
                <div className={`rounded-xl p-3 mb-4 text-sm text-center ${
                  msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border border-red-500/20'
                }`}>{msg.text}</div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">指派對象 *</label>
                  <select value={assignTo} onChange={e => setAssignTo(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                    <option value="">選擇成員...</option>
                    {assignableProfiles.map(p => (
                      <option key={p.user_id} value={p.user_id}>{p.avatar} {p.name} — {p.job_title} ({p.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">任務標題 *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：完成本週社群報告"
                    className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">任務描述（選填）</label>
                  <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="更多任務細節..."
                    className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 h-24 resize-none" />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">優先度 *</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'high' as const, label: '🔴 緊急', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
                      { value: 'medium' as const, label: '🟡 一般', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
                      { value: 'low' as const, label: '🟢 低', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
                    ].map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPriority(p.value)}
                        className={`flex-1 py-2.5 text-sm font-medium border transition-all ${
                          priority === p.value ? `${p.color} ring-1 ring-offset-1` : 'glass text-gray-400 border-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">任務分類 *</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50">
                    <option value="">選擇分類...</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">XP 獎勵</label>
                    <input type="number" value={xpReward} onChange={e => setXpReward(Number(e.target.value))} min="0" max="500"
                      className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">截止日期（選填）</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                      className="w-full bg-dark-700 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50" />
                  </div>
                </div>
                <button onClick={handleAssign} disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold text-sm transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50">
                  {submitting ? '指派中...' : '📋 送出任務'}
                </button>
              </div>
            </div>
          )}
          {tab === 'sent' && renderTaskList(sentTasks, true)}
          {tab === 'received' && renderTaskList(receivedTasks, false)}
        </>
      )}
    </div>
  )
}
