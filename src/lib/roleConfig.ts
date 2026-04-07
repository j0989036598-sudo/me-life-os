import { UserRole } from '@/components/LoginPage'

export const EMAIL_ROLES: Record<string, UserRole[]> = {
  'j0989036598@gmail.com': ['boss', 'manager', 'member'],
  'tombbb14413@gmail.com': ['boss', 'manager', 'member'],
}

export function getRolesForEmail(email: string): UserRole[] {
  return EMAIL_ROLES[email.toLowerCase()] || []
}

export function isEmailAllowed(email: string): boolean {
  return getRolesForEmail(email).length > 0
}
