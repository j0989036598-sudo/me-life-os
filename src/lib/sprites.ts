// ─────────────────────────────────────────────────────────────────────────────
// 角色 Sprite 清單
// 新增角色：把 GIF 放進 public/sprites/，在下方加一筆即可
// ─────────────────────────────────────────────────────────────────────────────

export interface SpriteDefinition {
  id: string
  name: string
  description: string
  idleGif: string    // 待機動作
  walkGif: string    // 走路動作
  restGif: string    // 休息區動作
}

export const SPRITE_REGISTRY: SpriteDefinition[] = [
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
  // ── 新角色（上傳 PNG 後解開註解）────────────────────────────────────────────
  // {
  //   id: 'char-blue',
  //   name: '藍甲角色',
  //   description: '你上傳的角色 1',
  //   idleGif: '/sprites/char-blue-idle.gif',
  //   walkGif: '/sprites/char-blue-walk.gif',
  //   restGif: '/sprites/char-blue-idle.gif',
  // },
  // {
  //   id: 'char-muscle',
  //   name: '壯漢',
  //   description: '你上傳的角色 2',
  //   idleGif: '/sprites/char-muscle-idle.gif',
  //   walkGif: '/sprites/char-muscle-walk.gif',
  //   restGif: '/sprites/char-muscle-idle.gif',
  // },
  // {
  //   id: 'char-bluehair',
  //   name: '藍髮角色',
  //   description: '你上傳的角色 3',
  //   idleGif: '/sprites/char-bluehair-idle.gif',
  //   walkGif: '/sprites/char-bluehair-walk.gif',
  //   restGif: '/sprites/char-bluehair-idle.gif',
  // },
]

/** 根據 ID 取得 sprite，找不到時回傳第一個 */
export function getSpriteById(id?: string | null): SpriteDefinition {
  if (!id) return SPRITE_REGISTRY[0]
  return SPRITE_REGISTRY.find(s => s.id === id) ?? SPRITE_REGISTRY[0]
}
