'use client'

import { useState } from 'react'

export interface CharacterAppearance {
  hairStyle: number
  hairColor: number
  skinTone: number
  outfitColor: number
  accessory: number
}

export interface OfficeMember {
  id: string
  name: string
  status: 'online' | 'working' | 'idle' | 'offline'
  character: CharacterAppearance | null
}

// åº§ä½å¨åçä¸çä½ç½®ï¼ç¾åæ¯ï¼- å°æåçä¸­çæ¤å­ä½ç½®
const SEAT_POSITIONS = [
  { x: 16, y: 64 },  // å·¦æ¡åæ¤
  { x: 30, y: 72 },  // å·¦æ¡å¾æ¤
  { x: 46, y: 78 },  // ä¸­éåæ¤
  { x: 60, y: 62 },  // å³æ¡æ¤1
  { x: 72, y: 70 },  // å³æ¡æ¤2
  { x: 38, y: 56 },  // é¡å¤åº§ä½
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
      {/* çæå */}
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

      {/* è¾¦å¬å®¤å + åå­æ¨ç±¤ */}
      <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '1 / 1' }}>

        <img
          src="/office-bg.jpg"
          alt="ç©æµè¡é·èæ¬è¾¦å¬å®¤"
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          onLoad={() => setImgLoaded(true)}
        />

        {/* åå­æ¨ç±¤ */}
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
              {/* ç®­é ­ */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '5px solid rgba(10,10,20,0.78)',
              }} />
            </div>
          )
        })}

        {/* ç©ºçææç¤º */}
        {imgLoaded && members.length === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pb-8">
            <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-xs px-4 py-2 rounded-full">
              ç®åæ²æäººå¨ç·ä¸
            </span>
          </div>
        )}

        {/* è¼å¥ä¸­ */}
        {!imgLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-400 text-sm animate-pulse">è¾¦å¬å®¤è¼å¥ä¸­...</span>
          </div>
        )}
      </div>
    </div>
  )
}
