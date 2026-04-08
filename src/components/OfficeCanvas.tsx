'use client'

import { useState, useEffect, useRef } from 'react'

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

// ─────────────────────────────────────────────────────────────────────────────
// 辦公室安全走道點（只在空曠地板上）
// 對應俯視辦公室地圖的走廊和桌子間隙
const OFFICE_WAYPOINTS = [
  { x: 36, y: 48 }, // 上方桌排下方走道左
  { x: 50, y: 48 }, // 上方桌排下方走道中
  { x: 60, y: 48 }, // 上方桌排下方走道右
  { x: 36, y: 60 }, // 中央走道左
  { x: 50, y: 60 }, // 中央走道中
  { x: 62, y: 60 }, // 中央走道右
  { x: 36, y: 72 }, // 下方走道左
  { x: 50, y: 72 }, // 下方走道中
  { x: 62, y: 72 }, // 下方走道右
  { x: 44, y: 82 }, // 入口走道左
  { x: 56, y: 82 }, // 入口走道右
]

// 休息區（海灘）安全走道點（只在沙地上）
const REST_WAYPOINTS = [
  { x: 38, y: 44 }, // 上方沙地左
  { x: 52, y: 44 }, // 上方沙地中
  { x: 62, y: 44 }, // 上方沙地右
  { x: 36, y: 55 }, // 中央沙地左
  { x: 50, y: 55 }, // 中央沙地中
  { x: 62, y: 55 }, // 中央沙地右
  { x: 40, y: 66 }, // 下方沙地左
  { x: 54, y: 66 }, // 下方沙地中
  { x: 50, y: 76 }, // 木棧道旁
]

// 初始出現位置（接近各自地圖的桌子/躺椅）
const OFFICE_STARTS = [
  { x: 36, y: 48 }, { x: 50, y: 48 }, { x: 60, y: 60 },
  { x: 36, y: 72 }, { x: 62, y: 72 }, { x: 50, y: 82 },
]
const REST_STARTS = [
  { x: 38, y: 44 }, { x: 52, y: 44 }, { x: 62, y: 44 },
  { x: 36, y: 55 }, { x: 62, y: 66 }, { x: 50, y: 76 },
]

const STATUS_CONFIG = {
  online:  { color: '#4ade80' },
  working: { color: '#facc15' },
  idle:    { color: '#fb923c' },
  offline: { color: '#6b7280' },
}

const SPEED = 10 // % per second

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pickWaypoint(
  waypoints: { x: number; y: number }[],
  current: { x: number; y: number }
) {
  // 避免選到目前所在的同一個點
  const others = waypoints.filter(
    w => Math.abs(w.x - current.x) > 3 || Math.abs(w.y - current.y) > 3
  )
  const pool = others.length > 0 ? others : waypoints
  return pool[Math.floor(Math.random() * pool.length)]
}

interface DogState {
  x: number
  y: number
  targetX: number
  targetY: number
  isMoving: boolean
  facingLeft: boolean
  transitionMs: number
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
  const [imgLoaded, setImgLoaded]           = useState(false)
  const [containerWidth, setContainerWidth] = useState(400)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dogs, setDogs]   = useState<DogState[]>([])
  const dogsRef           = useRef<DogState[]>([])
  const timeoutsRef       = useRef<ReturnType<typeof setTimeout>[]>([])

  const isRest    = bgImage.includes('rest')
  const waypoints = isRest ? REST_WAYPOINTS : OFFICE_WAYPOINTS
  const starts    = isRest ? REST_STARTS    : OFFICE_STARTS

  // 容器寬度偵測
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width))
    obs.observe(el)
    setContainerWidth(el.clientWidth)
    return () => obs.disconnect()
  }, [])

  const spriteSize = Math.round(containerWidth * 0.065)

  // 初始化
  useEffect(() => {
    const initial: DogState[] = members.map((_, i) => {
      const s = starts[i % starts.length]
      return { x: s.x, y: s.y, targetX: s.x, targetY: s.y,
               isMoving: false, facingLeft: false, transitionMs: 0 }
    })
    dogsRef.current = initial
    setDogs(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length, isRest])

  // 移動排程（只走 waypoints 之間）
  function scheduleDog(index: number, waitMs: number) {
    if (isRest) return

    const t = setTimeout(() => {
      const current = dogsRef.current[index]
      if (!current) return

      const wp = pickWaypoint(waypoints, { x: current.x, y: current.y })
      const dx = wp.x - current.x
      const dy = wp.y - current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const transitionMs = Math.max(800, Math.round((dist / SPEED) * 1000))

      const moving: DogState = {
        ...current,
        targetX: wp.x, targetY: wp.y,
        isMoving: true, facingLeft: dx < 0, transitionMs,
      }
      dogsRef.current = dogsRef.current.map((d, i) => i === index ? moving : d)
      setDogs([...dogsRef.current])

      const arrive = setTimeout(() => {
        const arrived: DogState = {
          ...dogsRef.current[index],
          x: wp.x, y: wp.y,
          isMoving: false, transitionMs: 0,
        }
        dogsRef.current = dogsRef.current.map((d, i) => i === index ? arrived : d)
        setDogs([...dogsRef.current])
        scheduleDog(index, rand(2000, 5000))
      }, transitionMs + 200)

      timeoutsRef.current.push(arrive)
    }, waitMs)

    timeoutsRef.current.push(t)
  }

  useEffect(() => {
    if (!imgLoaded || members.length === 0) return
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    members.forEach((_, i) => scheduleDog(i, rand(500, 3000)))
    return () => timeoutsRef.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded, members.length, isRest])

  const sorted = dogs
    .map((d, i) => ({ d, i, member: members[i] }))
    .filter(x => x.member)
    .sort((a, b) => a.d.y - b.d.y)

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl bg-black"
      style={{ aspectRatio: '1 / 1' }}
    >
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <img
          src={bgImage}
          alt="場景"
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {imgLoaded && sorted.map(({ d, member }, renderIdx) => {
        const cfg    = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.offline
        const sprite = isRest
          ? '/sprites/dog-rest.gif'
          : d.isMoving ? '/sprites/dog-walk.gif' : '/sprites/dog-idle.gif'

        return (
          <div
            key={member.id}
            className="absolute flex flex-col items-center select-none"
            style={{
              left: `${d.isMoving ? d.targetX : d.x}%`,
              top:  `${d.isMoving ? d.targetY : d.y}%`,
              transform: 'translate(-50%, -100%)',
              transition: d.isMoving
                ? `left ${d.transitionMs}ms linear, top ${d.transitionMs}ms linear`
                : 'none',
              pointerEvents: 'none',
              zIndex: 10 + renderIdx,
            }}
          >
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-white font-semibold whitespace-nowrap shadow-lg mb-0.5"
              style={{
                background: 'rgba(10,10,20,0.85)',
                backdropFilter: 'blur(6px)',
                border: `1.5px solid ${cfg.color}66`,
                fontSize: `${Math.max(9, spriteSize * 0.27)}px`,
              }}
            >
              <span
                className="rounded-full flex-shrink-0"
                style={{
                  width:  `${Math.max(5, spriteSize * 0.12)}px`,
                  height: `${Math.max(5, spriteSize * 0.12)}px`,
                  background: cfg.color,
                  boxShadow: `0 0 4px ${cfg.color}`,
                }}
              />
              {member.name}
            </div>

            <img
              src={sprite}
              alt={member.name}
              style={{
                width:  `${spriteSize}px`,
                height: `${spriteSize}px`,
                imageRendering: 'pixelated',
                transform: d.facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
              }}
            />
          </div>
        )
      })}

      {imgLoaded && members.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-6">
          <span className="bg-black/60 backdrop-blur-sm text-gray-300 text-xs px-4 py-2 rounded-full">
            {emptyText}
          </span>
        </div>
      )}

      {!imgLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-sm animate-pulse">載入中...</span>
        </div>
      )}
    </div>
  )
}
