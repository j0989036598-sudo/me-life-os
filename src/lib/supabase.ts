import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Profile 型別定義
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

// 讀取目前登入用戶的 profile
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

// 建立新 profile（第一次登入時）
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

// 更新 profile（自己的個人資料）
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

// 老闆專用：更新某員工的 role
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

// 讀取所有員工列表（老闆/主管用）
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
