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

// ── 可行走地板範圍（等距視角，百分比）────────────────────────────────────
const OFFICE_BOUNDS = { minX: 15, maxX: 74, minY: 54, maxY: 77 }
const REST_BOUNDS   = { minX: 15, maxX: 74, minY: 50, maxY: 75 }

// ── 初始出現位置 ──────────────────────────────────────────────────────────
const OFFICE_STARTS = [
  { x: 27, y: 70 }, { x: 42, y: 64 }, { x: 57, y: 68 },
  { x: 65, y: 58 }, { x: 34, y: 57 }, { x: 60, y: 56 },
]
const REST_STARTS = [
  { x: 35, y: 65 }, { x: 52, y: 60 }, { x: 65, y: 65 },
  { x: 24, y: 72 }, { x: 50, y: 72 }, { x: 68, y: 72 },
]

const STATUS_CONFIG = {
  online:  { color: '#4ade80' },
  working: { color: '#facc15' },
  idle:    { color: '#fb923c' },
  offline: { color: '#6b7280' },
}

// 狗狗移動速度：% / 秒
const SPEED = 10

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

interface DogState {
  x: number         // 當前位置（或起點）
  y: number
  targetX: number   // 目標位置
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
  const [imgLoaded, setImgLoaded]     = useState(false)
  const [containerWidth, setContainerWidth] = useState(400)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dogs, setDogs]               = useState<DogState[]>([])
  const dogsRef                       = useRef<DogState[]>([])   // 讓 timeout 讀到最新位置
  const timeoutsRef                   = useRef<ReturnType<typeof setTimeout>[]>([])

  const isRest = bgImage.includes('rest')
  const bounds = isRest ? REST_BOUNDS : OFFICE_BOUNDS
  const starts = isRest ? REST_STARTS : OFFICE_STARTS

  // 容器寬度偵測
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(e => setContainerWidth(e[0].contentRect.width))
    obs.observe(el)
    setContainerWidth(el.clientWidth)
    return () => obs.disconnect()
  }, [])

  const spriteSize = Math.round(containerWidth * 0.07)

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

  // 讓單隻狗移動 → 等待 → 再移動
  function scheduleDog(index: number, waitMs: number) {
    if (isRest) return  // 休息區不走動

    const t = setTimeout(() => {
      const current = dogsRef.current[index]
      if (!current) return

      // 計算目標 & 距離
      const targetX = rand(bounds.minX, bounds.maxX)
      const targetY = rand(bounds.minY, bounds.maxY)
      const dx = targetX - current.x
      const dy = targetY - current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const transitionMs = Math.max(800, Math.round((dist / SPEED) * 1000))

      // 更新到移動狀態
      const moving: DogState = {
        ...current,
        targetX, targetY,
        isMoving: true,
        facingLeft: dx < 0,
        transitionMs,
      }
      dogsRef.current = dogsRef.current.map((d, i) => i === index ? moving : d)
      setDogs([...dogsRef.current])

      // transition 結束後切回 idle，並排下一次
      const arrive = setTimeout(() => {
        const arrived: DogState = {
          ...dogsRef.current[index],
          x: targetX,
          y: targetY,
          isMoving: false,
          transitionMs: 0,
        }
        dogsRef.current = dogsRef.current.map((d, i) => i === index ? arrived : d)
        setDogs([...dogsRef.current])
        scheduleDog(index, rand(2000, 5000))
      }, transitionMs + 200)

      timeoutsRef.current.push(arrive)
    }, waitMs)

    timeoutsRef.current.push(t)
  }

  // 圖片載入後啟動
  useEffect(() => {
    if (!imgLoaded || members.length === 0) return
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    members.forEach((_, i) => scheduleDog(i, rand(500, 3000)))
    return () => timeoutsRef.current.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgLoaded, members.length, isRest])

  // 深度排序（靠前的蓋在後面角色上）
  const sorted = dogs
    .map((d, i) => ({ d, i, member: members[i] }))
    .filter(x => x.member)
    .sort((a, b) => a.d.y - b.d.y)

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl bg-black"
      style={{ aspectRatio: '4 / 3' }}
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
        const cfg = STATUS_CONFIG[member.status] ?? STATUS_CONFIG.offline
        const sprite = isRest
          ? '/sprites/dog-rest.gif'
          : d.isMoving ? '/sprites/dog-walk.gif' : '/sprites/dog-idle.gif'

        return (
          <div
            key={member.id}
            className="absolute flex flex-col items-center select-none"
            style={{
              // 移動中：目標位置（CSS transition 負責平滑過渡）
              // 停止時：當前位置
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

            {/* 狗狗 Sprite（依移動方向水平翻轉）*/}
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
