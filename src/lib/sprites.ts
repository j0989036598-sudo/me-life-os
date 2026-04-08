// ─────────────────────────────────────────────────────────────────────────────
// 角色 Sprite 清單
// 新增角色：把 GIF 放進 public/sprites/，在下方加一筆即可
// ─────────────────────────────────────────────────────────────────────────────

export interface SpriteDefinition {
  id: string
  name: string
  description: string
  idleGif: string
  walkGif: string
  restGif: string
}

export const SPRITE_REGISTRY: SpriteDefinition[] = [
  // ── 狗狗系列 ────────────────────────────────────────────────────────────────
  {
    id: 'dog-chill',
    name: '慵懶狗',
    description: '能坐著就不站著',
    idleGif: '/sprites/Sprite-0004.gif',
    walkGif: '/sprites/Sprite-0001.gif',
    restGif: '/sprites/Sprite-0015.gif',
  },
  {
    id: 'dog-happy',
    name: '活潑狗',
    description: '永遠充滿活力！',
    idleGif: '/sprites/Sprite-0013.gif',
    walkGif: '/sprites/Sprite-0001.gif',
    restGif: '/sprites/Sprite-0015.gif',
  },
  {
    id: 'dog-cool',
    name: '酷狗',
    description: '低調但超強',
    idleGif: '/sprites/Sprite-0021.gif',
    walkGif: '/sprites/Sprite-0002.gif',
    restGif: '/sprites/Sprite-0016.gif',
  },
  {
    id: 'dog-hype',
    name: '衝衝狗',
    description: '截止日前最可靠的人',
    idleGif: '/sprites/Sprite-0005.gif',
    walkGif: '/sprites/Sprite-0003.gif',
    restGif: '/sprites/Sprite-0017.gif',
  },
  // ── 特殊角色 ────────────────────────────────────────────────────────────────
  {
    id: 'mafia-bold',
    name: '黑幫老大',
    description: '低調行事，但沒人敢惹',
    idleGif: '/sprites/mafia-idle.gif',
    walkGif: '/sprites/mafia-walk.gif',
    restGif: '/sprites/mafia-rest.gif',
  },
  // ── 人類系列 ────────────────────────────────────────────────────────────────
  {
    id: 'dwarf',
    name: '矮人戰士',
    description: '矮小但衝勁十足的戰場老手',
    idleGif: '/sprites/dwarf-idle.gif',
    walkGif: '/sprites/dwarf-walk.gif',
    restGif: '/sprites/dwarf-rest.gif',
  },
  {
    id: 'gladiator',
    name: '鬥士',
    description: '戴鐵面具的神秘格鬥家',
    idleGif: '/sprites/gladiator-idle.gif',
    walkGif: '/sprites/gladiator-walk.gif',
    restGif: '/sprites/gladiator-rest.gif',
  },
  {
    id: 'cyclops',
    name: '獨眼巨人',
    description: '壯碩有力，辦公室最重量級成員',
    idleGif: '/sprites/cyclops-idle.gif',
    walkGif: '/sprites/cyclops-walk.gif',
    restGif: '/sprites/cyclops-rest.gif',
  },
]

/** 根據 ID 取得 sprite，找不到時回傳第一個 */
export function getSpriteById(id?: string | null): SpriteDefinition {
  if (!id) return SPRITE_REGISTRY[0]
  return SPRITE_REGISTRY.find(s => s.id === id) ?? SPRITE_REGISTRY[0]
}
