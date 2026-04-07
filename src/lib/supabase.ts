import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── 型別定義 ──────────────────────────────────────────────────────
export type UserRole = 'boss' | 'manager' | 'member'

export interface Profile {
  id: string
  user_id: string
  email: string
  name: string
  job_title: string
  department: string
  avatar: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface InvitedUser {
  id: string
  email: string
  job_title: string
  department: string
  role: UserRole
  invited_by: string
  note: string
  created_at: string
}

// ─── Profile CRUD ──────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) {
    console.error('getProfile error:', error)
    return null
  }
  return data as Profile
}

export async function createProfile(profile: {
  user_id: string
  email: string
  name: string
  job_title: string
  department: string
  avatar: string
  role: UserRole
}): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .insert([profile])
    .select()
    .single()
  if (error) {
    console.error('createProfile error:', error)
    return null
  }
  return data as Profile
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()
  if (error) {
    console.error('updateProfile error:', error)
    return null
  }
  return data as Profile
}

export async function updateUserRole(targetUserId: string, newRole: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('user_id', targetUserId)
  if (error) {
    console.error('updateUserRole error:', error)
    return false
  }
  return true
}

export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.error('getAllProfiles error:', error)
    return []
  }
  return data as Profile[]
}

// ─── InvitedUser CRUD ─────────────────────────────────────────────

export async function checkInvited(email: string): Promise<InvitedUser | null> {
  const { data, error } = await supabase
    .from('invited_users')
    .select('*')
    .ilike('email', email)
    .maybeSingle()
  if (error) return null
  return data as InvitedUser | null
}

export async function inviteUser(invite: {
  email: string
  job_title: string
  department: string
  role: UserRole
  invited_by: string
  note?: string
}): Promise<InvitedUser | null> {
  const { data, error } = await supabase
    .from('invited_users')
    .upsert([{ ...invite, note: invite.note || '' }], { onConflict: 'email' })
    .select()
    .single()
  if (error) {
    console.error('inviteUser error:', error)
    return null
  }
  return data as InvitedUser
}

export async function getAllInvited(): Promise<InvitedUser[]> {
  const { data, error } = await supabase
    .from('invited_users')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data as InvitedUser[]
}

export async function removeInvited(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('invited_users')
    .delete()
    .eq('id', id)
  if (error) {
    console.error('removeInvited error:', error)
    return false
  }
  return true
}
