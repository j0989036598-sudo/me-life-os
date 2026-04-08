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
// 俯視地圖：可行走範圍（百分比）
// 辦公室圖：桌子之間的走廊、中央空地
const OFFICE_BOUNDS = { minX: 14, maxX: 86, minY: 14, maxY: 88 }

// 休息區（海灘）圖：中央沙地、傢具間空間
const REST_BOUNDS = { minX: 22, maxX: 78, minY: 22, maxY: 84 }

// ─────────────────────────────────────────────────────────────────────────────
// 初始出現位置（對應各自地圖的桌子 / 躺椅位置）
const OFFICE_STARTS = [
  { x: 42, y: 28 }, // 上方桌排左
  { x: 62, y: 28 }, // 上方桌排右
  { x: 75, y: 55 }, // 右側桌群
  { x: 25, y: 68 }, // 左下桌
  { x: 62, y: 72 }, // 右下桌
  { x: 48, y: 82 }, // 底部走道
]

const REST_STARTS = [
  { x: 35, y: 32 }, // 上方躺椅區左
  { x: 55, y: 32 }, // 上方躺椅區右
  { x: 70, y: 32 }, // 上方躺椅區最右
  { x: 30, y: 68 }, // 餐桌區
  { x: 65, y: 70 }, // 吧台區
  { x: 50, y: 55 }, // 中央沙地
]

const STATUS_CONFIG = {
  online:  { color: '#4ade80' },
  working: { color: '#facc15' },
  idle:    { color: '#fb923c' },
  offline: { color: '#6b7280' },
}

// 移動速度：% per second
const SPEED = 10

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
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
  const [dogs, setDogs]     = useState<DogState[]>([])
  const dogsRef             = useRef<DogState[]>([])
  const timeoutsRef         = useRef<ReturnType<typeof setTimeout>[]>([])

  const isRest  = bgImage.includes('rest')
  const bounds  = isRest ? REST_BOUNDS  : OFFICE_BOUNDS
  const starts  = isRest ? REST_STARTS  : OFFICE_STARTS

  // 容器寬度偵測
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width))
    obs.observe(el)
    setContainerWidth(el.clientWidth)
    return () => obs.disconnect()
  }, [])

  // 俯視地圖：固定 sprite 大小（不需深度縮放）
  const spriteSize = Math.round(containerWidth * 0.065)

  // 初始化狗狗
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

  // 單隻狗的移動排程
  function scheduleDog(index: number, waitMs: number) {
    if (isRest) return // 休息區靜止

    const t = setTimeout(() => {
      const current = dogsRef.current[index]
      if (!current) return

      const targetX = rand(bounds.minX, bounds.maxX)
      const targetY = rand(bounds.minY, bounds.maxY)
      const dx = targetX - current.x
      const dy = targetY - current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const transitionMs = Math.max(800, Math.round((dist / SPEED) * 1000))

      const moving: DogState = {
        ...current, targetX, targetY,
        isMoving: true, facingLeft: dx < 0, transitionMs,
      }
      dogsRef.current = dogsRef.current.map((d, i) => i === index ? moving : d)
      setDogs([...dogsRef.current])

      const arrive = setTimeout(() => {
        const arrived: DogState = {
          ...dogsRef.current[index],
          x: targetX, y: targetY,
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

  // 圖片載入後啟動走動
  useEffect(() => {
    if (!imgLoaded || members.length === 0) return
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    members.forEach((_, i) => scheduleDog(i, rand(500, 3000)))
    return () => timeoutsRef.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded, members.length, isRest])

  // 俯視圖依 y 值排序（靠下的角色蓋在靠上的上面）
  const sorted = dogs
    .map((d, i) => ({ d, i, member: members[i] }))
    .filter(x => x.member)
    .sort((a, b) => a.d.y - b.d.y)

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl bg-black"
      style={{ aspectRatio: '1 / 1' }} // 這兩張圖都是正方形
    >
      {/* 背景圖 */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <img
          src={bgImage}
          alt="場景"
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* 狗狗員工 */}
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
            {/* 名字標籤 */}
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

            {/* 狗狗 Sprite */}
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

      {/* 空狀態 */}
      {imgLoaded && members.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center pb-6">
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
