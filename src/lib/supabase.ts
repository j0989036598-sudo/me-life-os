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

export interface DailyLog {
  id: string
  user_id: string
  email: string
  date: string
  mood: string
  energy: number
  highlight: string
  quest: string
  wins: string
  blocks: string
  reflection: string
  created_at: string
}

export interface AssignedTask {
  id: string
  assigned_by: string
  assigned_by_name: string
  assigned_to: string
  assigned_to_name: string
  title: string
  description: string
  xp_reward: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  due_date: string | null
  created_at: string
  completed_at: string | null
}

// ─── Profile CRUD ────────────────────────────────────────────────────

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

export async function deleteProfile(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('user_id', userId)
  if (error) {
    console.error('deleteProfile error:', error)
    return false
  }
  return true
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

export async function removeInvitedByEmail(email: string): Promise<boolean> {
  const { error } = await supabase
    .from('invited_users')
    .delete()
    .ilike('email', email)
  if (error) {
    console.error('removeInvitedByEmail error:', error)
    return false
  }
  return true
}

// ─── DailyLog CRUD ────────────────────────────────────────────────

export async function createDailyLog(log: {
  user_id: string
  email: string
  date: string
  mood?: string
  energy?: number
  highlight?: string
  quest?: string
  wins?: string
  blocks?: string
  reflection?: string
}): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert([log], { onConflict: 'user_id,date' })
    .select()
    .single()
  if (error) {
    console.error('createDailyLog error:', error)
    return null
  }
  return data as DailyLog
}

export async function getDailyLogsByDate(date: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getDailyLogsByDate error:', error)
    return []
  }
  return data as DailyLog[]
}

export async function getAllDailyLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAllDailyLogs error:', error)
    return []
  }
  return data as DailyLog[]
}

export async function getUserDailyLogs(userId: string): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
  if (error) {
    console.error('getUserDailyLogs error:', error)
    return []
  }
  return data as DailyLog[]
}

// ─── AssignedTask CRUD ────────────────────────────────────────────

export async function createAssignedTask(task: {
  assigned_by: string
  assigned_by_name: string
  assigned_to: string
  assigned_to_name: string
  title: string
  description?: string
  xp_reward?: number
  due_date?: string | null
}): Promise<AssignedTask | null> {
  const { data, error } = await supabase
    .from('assigned_tasks')
    .insert([{
      ...task,
      description: task.description || '',
      xp_reward: task.xp_reward || 0,
      due_date: task.due_date || null,
    }])
    .select()
    .single()
  if (error) {
    console.error('createAssignedTask error:', error)
    return null
  }
  return data as AssignedTask
}

export async function getAssignedTasksForUser(userId: string): Promise<AssignedTask[]> {
  const { data, error } = await supabase
    .from('assigned_tasks')
    .select('*')
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAssignedTasksForUser error:', error)
    return []
  }
  return data as AssignedTask[]
}

export async function getAssignedTasksByAssigner(userId: string): Promise<AssignedTask[]> {
  const { data, error } = await supabase
    .from('assigned_tasks')
    .select('*')
    .eq('assigned_by', userId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAssignedTasksByAssigner error:', error)
    return []
  }
  return data as AssignedTask[]
}

export async function getAllAssignedTasks(): Promise<AssignedTask[]> {
  const { data, error } = await supabase
    .from('assigned_tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getAllAssignedTasks error:', error)
    return []
  }
  return data as AssignedTask[]
}

export async function updateAssignedTaskStatus(
  taskId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
): Promise<boolean> {
  const updates: Record<string, unknown> = { status }
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }
  const { error } = await supabase
    .from('assigned_tasks')
    .update(updates)
    .eq('id', taskId)
  if (error) {
    console.error('updateAssignedTaskStatus error:', error)
    return false
  }
  return true
}

export async function deleteAssignedTask(taskId: string): Promise<boolean> {
  const { error } = await supabase
    .from('assigned_tasks')
    .delete()
    .eq('id', taskId)
  if (error) {
    console.error('deleteAssignedTask error:', error)
    return false
  }
  return true
}
