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

// 辦公室座位位置（百分比）
const OFFICE_SEATS = [
  { x: 16, y: 64 },
  { x: 30, y: 72 },
  { x: 46, y: 78 },
  { x: 60, y: 62 },
  { x: 72, y: 70 },
  { x: 38, y: 56 },
]

// 休息區位置（臥室）
const REST_SEATS = [
  { x: 38, y: 60 },
  { x: 52, y: 56 },
  { x: 65, y: 62 },
  { x: 22, y: 72 },
  { x: 48, y: 72 },
  { x: 68, y: 74 },
]

const STATUS_CONFIG = {
  online:  { color: '#4ade80', label: 'Online'  },
  working: { color: '#facc15', label: 'Working' },
  idle:    { color: '#fb923c', label: 'Idle'    },
  offline: { color: '#6b7280', label: 'Offline' },
}

// 根據狀態選狗狗動作
function getSpriteForStatus(status: OfficeMember['status'], isRest: boolean) {
  if (isRest) return '/sprites/dog-rest.gif'
  if (status === 'working') return '/sprites/dog-walk.gif'
  return '/sprites/dog-idle.gif'
}

interface OfficeCanvasProps {
  members: OfficeMember[]
  bgImage?: string
  emptyText?: string
}

export default function OfficeCanvas({
  members,
  bgImage = '/office-bg.jpg',
  emptyText = '目前沒有人在這裡',
}: OfficeCanvasProps) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const isRest = bgImage.includes('rest')
  const seats = isRest ? REST_SEATS : OFFICE_SEATS

  return (
    // 外層：不加 overflow-hidden，讓狗狗不被裁切
    <div
      className="relative w-full rounded-xl bg-black"
      style={{ aspectRatio: '1 / 1' }}
    >
      {/* 背景圖層：單獨加 overflow-hidden 維持圓角裁切 */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <img
          src={bgImage}
          alt="場景"
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* 狗狗員工層：在背景之上，不受 overflow-hidden 限制 */}
      {imgLoaded && members.map((member, i) => {
        const seat = seats[i % seats.length]
        const cfg = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.offline
        const sprite = getSpriteForStatus(member.status, isRest)

        return (
          <div
            key={member.id}
            className="absolute flex flex-col items-center select-none"
            style={{
              left: `${seat.x}%`,
              top: `${seat.y}%`,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {/* 名字標籤 */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-white text-xs font-semibold whitespace-nowrap shadow-lg mb-1"
              style={{
                background: 'rgba(10, 10, 20, 0.82)',
                backdropFilter: 'blur(6px)',
                border: `1.5px solid ${cfg.color}55`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }}
              />
              {member.name}
            </div>

            {/* 狗狗 Sprite — 直接顯示 GIF，不用 objectFit */}
            <img
              src={sprite}
              alt={member.name}
              style={{
                width: '56px',
                height: '56px',
                imageRendering: 'pixelated',
              }}
            />
          </div>
        )
      })}

      {/* 空狀態 */}
      {imgLoaded && members.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-xs px-4 py-2 rounded-full">
            {emptyText}
          </span>
        </div>
      )}

      {/* 載入中 */}
      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-sm animate-pulse">載入中...</span>
        </div>
      )}
    </div>
  )
}
