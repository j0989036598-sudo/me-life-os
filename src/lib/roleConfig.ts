// 老闆的 email 列表 — 這些帳號登入後自動取得 boss 權限
// 其他所有人預設為 member，老闆可在後台將員工升級為 manager
export const BOSS_EMAILS: string[] = [
  'j0989036598@gmail.com',
  'tombbb14413@gmail.com',
]

export function isBossEmail(email: string): boolean {
  return BOSS_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase())
}
