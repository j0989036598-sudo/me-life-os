import { UserRole } from '@/components/LoginPage'

// Gmail → 可使用的角色列表
// 同一個 email 有多個角色時，登入後會出現角色選擇
export const EMAIL_ROLES: Record<string, UserRole[]> = {
    'j0989036598@gmail.com': ['boss', 'manager', 'member'],
  }

export function getRolesForEmail(email: string): UserRole[] {
    return EMAIL_ROLES[email.toLowerCase()] || []
  }

export function isEmailAllowed(email: string): boolean {
    return getRolesForEmail(email).length > 0
  }
