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
// 導航圖：節點 + 連線
// adj = 可以直接走過去的相鄰節點 index（只走已連接的路，不穿家具）
// ─────────────────────────────────────────────────────────────────────────────

interface NavNode { x: number; y: number; adj: number[] }

// 辦公室走廊（擴充版）
//
//  0 - 1 - 2 - 3    ← 主橫向走廊（上方桌排下方）
//      |   |
//      4 - 5        ← 中段走廊（下方桌群之間）
//      |   |
//      6   7        ← 底部
//
const OFFICE_NAV: NavNode[] = [
  { x: 30, y: 50, adj: [1]          }, // 0 主走廊最左
  { x: 42, y: 50, adj: [0, 2, 4]   }, // 1 主走廊左中（十字口）
  { x: 54, y: 50, adj: [1, 3, 5]   }, // 2 主走廊右中（十字口）
  { x: 66, y: 50, adj: [2]          }, // 3 主走廊最右
  { x: 42, y: 62, adj: [1, 5, 6]   }, // 4 中段左
  { x: 54, y: 62, adj: [2, 4, 7]   }, // 5 中段右
  { x: 42, y: 74, adj: [4]          }, // 6 底部左
  { x: 54, y: 74, adj: [5]          }, // 7 底部右
]

// 休息區（海灘）沙地（擴充版）
//
//  0 - 1 - 2        ← 上方沙地（躺椅前）
//  |   |   |
//  3 - 4 - 5        ← 中央沙地
//      |
//      6            ← 下方走道
//
const REST_NAV: NavNode[] = [
  { x: 34, y: 47, adj: [1, 3]       }, // 0 上方左
  { x: 48, y: 47, adj: [0, 2, 4]   }, // 1 上方中（路口）
  { x: 62, y: 47, adj: [1, 5]       }, // 2 上方右
  { x: 34, y: 59, adj: [0, 4]       }, // 3 中央左
  { x: 48, y: 59, adj: [1, 3, 5, 6] }, // 4 中央中（路口）
  { x: 62, y: 59, adj: [2, 4]       }, // 5 中央右
  { x: 48, y: 70, adj: [4]           }, // 6 下方中
]

// 初始節點（分散各自出現在不同位置）
const OFFICE_STARTS = [0, 1, 2, 3, 4, 5]
const REST_STARTS   = [0, 1, 2, 3, 4, 5]

const STATUS_CONFIG = {
  online:  { color: '#4ade80' },
  working: { color: '#facc15' },
  idle:    { color: '#fb923c' },
  offline: { color: '#6b7280' },
}

const SPEED    = 10  // % per second
const JITTER   = 2.5 // 每次到達目標點時，在 ±2.5% 內隨機偏移，讓站位不那麼死板

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function jitter(val: number): number {
  return val + (Math.random() - 0.5) * JITTER * 2
}

interface DogState {
  nodeIndex: number
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

  const isRest  = bgImage.includes('rest')
  const nav     = isRest ? REST_NAV    : OFFICE_NAV
  const starts  = isRest ? REST_STARTS : OFFICE_STARTS

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
      const nodeIdx = starts[i % starts.length]
      const node = nav[nodeIdx]
      return {
        nodeIndex: nodeIdx,
        x: jitter(node.x), y: jitter(node.y),
        targetX: node.x, targetY: node.y,
        isMoving: false, facingLeft: false, transitionMs: 0,
      }
    })
    dogsRef.current = initial
    setDogs(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length, isRest])

  // 移動排程：沿導航圖走到相鄰節點，並在目標點加入隨機抖動
  function scheduleDog(index: number, waitMs: number) {
    if (isRest) return

    const t = setTimeout(() => {
      const dog = dogsRef.current[index]
      if (!dog) return

      const currentNode = nav[dog.nodeIndex]
      if (!currentNode || currentNode.adj.length === 0) return

      // 隨機選相鄰節點
      const nextNodeIdx = currentNode.adj[
        Math.floor(Math.random() * currentNode.adj.length)
      ]
      const nextNode = nav[nextNodeIdx]

      // 目標位置 = 節點座標 + 隨機抖動（讓每次站的地方不完全一樣）
      const targetX = jitter(nextNode.x)
      const targetY = jitter(nextNode.y)

      const dx = targetX - dog.x
      const dy = targetY - dog.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const transitionMs = Math.max(600, Math.round((dist / SPEED) * 1000))

      const moving: DogState = {
        ...dog,
        nodeIndex: dog.nodeIndex, // 到達後才更新
        targetX, targetY,
        isMoving: true,
        facingLeft: dx < 0,
        transitionMs,
      }
      dogsRef.current = dogsRef.current.map((d, i) => i === index ? moving : d)
      setDogs([...dogsRef.current])

      const arrive = setTimeout(() => {
        const arrived: DogState = {
          ...dogsRef.current[index],
          nodeIndex: nextNodeIdx,  // 更新當前節點
          x: targetX, y: targetY,
          isMoving: false, transitionMs: 0,
        }
        dogsRef.current = dogsRef.current.map((d, i) => i === index ? arrived : d)
        setDogs([...dogsRef.current])

        // 隨機等待後繼續走：30% 機率停久一點（在原地待久些）
        const pause = Math.random() < 0.3
          ? rand(3000, 6000)   // 偶爾長待
          : rand(800, 2500)    // 通常短停
        scheduleDog(index, pause)
      }, transitionMs + 150)

      timeoutsRef.current.push(arrive)
    }, waitMs)

    timeoutsRef.current.push(t)
  }

  useEffect(() => {
    if (!imgLoaded || members.length === 0) return
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    // 各狗狗錯開啟動時間，避免全部同步移動
    members.forEach((_, i) => scheduleDog(i, rand(300, 2000)))
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
