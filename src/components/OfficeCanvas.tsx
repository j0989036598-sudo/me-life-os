'use client'

import { useState } from 'react'

export interface CharacterAppearance {
  hairStyle: number
  hairColor: string
  skinTone: number
  outfitColor: string
  accessory: number
}

export interface OfficeMember {
  id: string
  name: string
  status: 'online' | 'working' | 'idle' | 'offline'
  character: CharacterAppearance | null
}

// 座位在圖片上的位置（百分比）- 對應圖片中的椅子位置
const SEAT_POSITIONS = [
  { x: 16, y: 64 },  // 左桌前椅
  { x: 30, y: 72 },  // 左桌後椅
  { x: 46, y: 78 },  // 中間前椅
  { x: 60, y: 62 },  // 右桌椅1
  { x: 72, y: 70 },  // 右桌椅2
  { x: 38, y: 56 },  // 額外座位
]

const STATUS_CONFIG = {
  online:  { color: '#4ade80', label: 'Online'  },
  working: { color: '#facc15', label: 'Working' },
  idle:    { color: '#fb923c', label: 'Idle'    },
  offline: { color: '#6b7280', label: 'Offline' },
}

interface OfficeCanvasProps {
  members: OfficeMember[]
}

export default function OfficeCanvas({ members }: OfficeCanvasProps) {
  const [imgLoaded, setImgLoaded] = useState(false)

  const counts = {
    online:  members.filter(m => m.status === 'online').length,
    working: members.filter(m => m.status === 'working').length,
    idle:    members.filter(m => m.status === 'idle').length,
    offline: members.filter(m => m.status === 'offline').length,
  }

  return (
    <div className="w-full space-y-2">
      {/* 狀態列 */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {(Object.entries(counts) as [keyof typeof counts, number][]).map(([status, count]) =>
          count > 0 ? (
            <span key={status} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: STATUS_CONFIG[status].color }} />
              {count} {STATUS_CONFIG[status].label}
            </span>
          ) : null
        )}
      </div>

      {/* 辦公室圖 + 名字標籤 */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ height: '240px' }}>

        <img
          src="/office-bg.jpg"
          alt="穎流行銷虛擬辦公室"
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          onLoad={() => setImgLoaded(true)}
        />

        {/* 名字標籤 */}
        {imgLoaded && members.map((member, i) => {
          const seat = SEAT_POSITIONS[i % SEAT_POSITIONS.length]
          const cfg  = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.offline

          return (
            <div
              key={member.id}
              className="absolute flex flex-col items-center select-none"
              style={{
                left: `${seat.x}%`,
                top: `${seat.y}%`,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
              }}
            >
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-xs font-semibold whitespace-nowrap shadow-lg"
                style={{
                  background: 'rgba(10, 10, 20, 0.78)',
                  backdropFilter: 'blur(6px)',
                  border: `1.5px solid ${cfg.color}55`,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
                  style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }}
                />
                {member.name}
              </div>
              {/* 箭頭 */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '5px solid rgba(10,10,20,0.78)',
              }} />
            </div>
          )
        })}

        {/* 空狀態提示 */}
        {imgLoaded && members.length === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pb-8">
            <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-xs px-4 py-2 rounded-full">
              目前沒有人在線上
            </span>
          </div>
        )}

        {/* 載入中 */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400 text-sm animate-pulse">辦公室載入中...</span>
          </div>
        )}
      </div>
    </div>
  )
}
