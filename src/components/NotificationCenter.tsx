'use client'

import { useState, useEffect, useRef } from 'react'
import {
  supabase,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '@/lib/supabase'

const TYPE_CONFIG: Record<Notification['type'], { icon: string; color: string }> = {
  task_assigned: { icon: '⚡', color: 'text-blue-400' },
  task_completed: { icon: '✅', color: 'text-green-400' },
  redemption_request: { icon: '🎁', color: 'text-amber-400' },
  redemption_approved: { icon: '🎉', color: 'text-green-400' },
  redemption_rejected: { icon: '❌', color: 'text-red-400' },
  daily_reminder: { icon: '📖', color: 'text-purple-400' },
  system: { icon: '🔔', color: 'text-gray-400' },
}

export default function NotificationCenter({ userId, onNavigate }: {
  userId: string
  onNavigate?: (page: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // 載入未讀數
  useEffect(() => {
    if (!userId) return
    loadUnreadCount()

    // Realtime 訂閱新通知
    const channel = supabase.channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        loadUnreadCount()
        if (open) loadNotifications()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        loadUnreadCount()
        if (open) loadNotifications()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, open])

  // 點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const loadUnreadCount = async () => {
    const count = await getUnreadCount(userId)
    setUnreadCount(count)
  }

  const loadNotifications = async () => {
    setLoading(true)
    const data = await getNotifications(userId)
    setNotifications(data)
    setLoading(false)
  }

  const handleToggle = () => {
    if (!open) loadNotifications()
    setOpen(!open)
  }

  const handleRead = async (n: Notification) => {
    if (!n.read) {
      await markNotificationRead(n.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev => prev.map(item =>
        item.id === n.id ? { ...item, read: true } : item
      ))
    }
    // 導航到相關頁面
    if (n.link_to && onNavigate) {
      onNavigate(n.link_to)
      setOpen(false)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(userId)
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return '剛剛'
    if (mins < 60) return `${mins} 分鐘前`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} 小時前`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} 天前`
    return dateStr.slice(0, 10)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* 鈴鐺按鈕 */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl hover:bg-white/10 transition-all"
        title="通知"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade">
          {/* 標題列 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="font-bold text-sm flex items-center gap-2">
              🔔 通知中心
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{unreadCount} 未讀</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-purple-400 hover:text-purple-300 transition-all"
              >
                全部已讀
              </button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="overflow-y-auto max-h-[55vh]">
            {loading ? (
              <div className="text-center py-8 text-gray-500 animate-pulse">載入中...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-2">🔕</span>
                <span className="text-gray-500 text-sm">暫無通知</span>
              </div>
            ) : (
              notifications.map(n => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
                return (
                  <button
                    key={n.id}
                    onClick={() => handleRead(n)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-all flex gap-3 ${
                      !n.read ? 'bg-purple-500/5' : ''
                    }`}
                  >
                    <span className={`text-xl mt-0.5 ${config.color}`}>{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${!n.read ? 'text-white' : 'text-gray-300'}`}>
                          {n.title}
                        </span>
                        {!n.read && <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-gray-500 mt-1 block">{timeAgo(n.created_at)}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
