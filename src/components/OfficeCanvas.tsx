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
// 導航圖：節點 + 連線（只能在已連接的節點之間移動，不會穿越家具）
// adj = 可以直接走過去的相鄰節點 index
// ─────────────────────────────────────────────────────────────────────────────

interface NavNode { x: number; y: number; adj: number[] }

// 辦公室走廊網格
// 形狀：
//  A - B - C    ← 主走廊（上方桌排下面）
//      |
//      D         ← 中央走廊（兩組下方桌之間）
//      |
//      E         ← 底部區域
//
const OFFICE_NAV: NavNode[] = [
  { x: 36, y: 50, adj: [1]       }, // 0: A 主走廊左
  { x: 50, y: 50, adj: [0, 2, 3] }, // 1: B 主走廊中（十字路口）
  { x: 66, y: 50, adj: [1]       }, // 2: C 主走廊右
  { x: 50, y: 63, adj: [1, 4]    }, // 3: D 中央走廊中
  { x: 50, y: 76, adj: [3]       }, // 4: E 底部中央
]

// 休息區（海灘）沙地網格
// 形狀：
//  F - G - H    ← 上方沙地（躺椅前方）
//  |   |
//  I - J        ← 中央沙地
//
const REST_NAV: NavNode[] = [
  { x: 36, y: 48, adj: [1, 3]    }, // 0: F 上方沙地左
  { x: 50, y: 48, adj: [0, 2, 4] }, // 1: G 上方沙地中（路口）
  { x: 62, y: 48, adj: [1]       }, // 2: H 上方沙地右
  { x: 36, y: 60, adj: [0, 4]    }, // 3: I 中央沙地左
  { x: 50, y: 60, adj: [1, 3]    }, // 4: J 中央沙地中
]

// 初始位置（對齊導航圖節點）
const OFFICE_STARTS = [0, 1, 2, 3, 4, 1] // 節點 index
const REST_STARTS   = [0, 1, 2, 3, 4, 1]

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

interface DogState {
  nodeIndex: number   // 目前在哪個節點
  x: number
  y: number
  targetNodeIndex: number
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
  const nav     = isRest ? REST_NAV     : OFFICE_NAV
  const starts  = isRest ? REST_STARTS  : OFFICE_STARTS

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
        nodeIndex: nodeIdx, x: node.x, y: node.y,
        targetNodeIndex: nodeIdx, targetX: node.x, targetY: node.y,
        isMoving: false, facingLeft: false, transitionMs: 0,
      }
    })
    dogsRef.current = initial
    setDogs(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length, isRest])

  // 沿著導航圖走到相鄰節點
  function scheduleDog(index: number, waitMs: number) {
    if (isRest) return

    const t = setTimeout(() => {
      const dog = dogsRef.current[index]
      if (!dog) return

      const currentNode = nav[dog.nodeIndex]
      if (!currentNode || currentNode.adj.length === 0) return

      // 隨機選一個相鄰節點
      const nextNodeIdx = currentNode.adj[Math.floor(Math.random() * currentNode.adj.length)]
      const nextNode    = nav[nextNodeIdx]

      const dx = nextNode.x - dog.x
      const dy = nextNode.y - dog.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const transitionMs = Math.max(600, Math.round((dist / SPEED) * 1000))

      const moving: DogState = {
        ...dog,
        targetNodeIndex: nextNodeIdx,
        targetX: nextNode.x, targetY: nextNode.y,
        isMoving: true, facingLeft: dx < 0, transitionMs,
      }
      dogsRef.current = dogsRef.current.map((d, i) => i === index ? moving : d)
      setDogs([...dogsRef.current])

      const arrive = setTimeout(() => {
        const arrived: DogState = {
          ...dogsRef.current[index],
          nodeIndex: nextNodeIdx,
          x: nextNode.x, y: nextNode.y,
          isMoving: false, transitionMs: 0,
        }
        dogsRef.current = dogsRef.current.map((d, i) => i === index ? arrived : d)
        setDogs([...dogsRef.current])
        scheduleDog(index, rand(1500, 4500))
      }, transitionMs + 150)

      timeoutsRef.current.push(arrive)
    }, waitMs)

    timeoutsRef.current.push(t)
  }

  useEffect(() => {
    if (!imgLoaded || members.length === 0) return
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    members.forEach((_, i) => scheduleDog(i, rand(500, 2500)))
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
