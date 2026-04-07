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
  priority: 'high' | 'medium' | 'low'
  category: string
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
    .insert([log])
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
  priority?: 'high' | 'medium' | 'low'
  category?: string
}): Promise<AssignedTask | null> {
  const { data, error } = await supabase
    .from('assigned_tasks')
    .insert([{
      ...task,
      description: task.description || '',
      xp_reward: task.xp_reward || 0,
      due_date: task.due_date || null,
      priority: task.priority || 'medium',
      category: task.category || '',
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

// ─── UserGameStats CRUD ──────────────────────────────────────────

export interface UserGameStats {
  user_id: string
  xp: number
  xp_max: number
  sp: number
  gold: number
  diamond: number
  level: number
  streak: number
  streak_last_date: string | null
  season_tier: number
  season_xp: number
}

export async function getGameStats(userId: string): Promise<UserGameStats | null> {
  const { data, error } = await supabase
    .from('user_game_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.error('getGameStats error:', error)
    return null
  }
  return data as UserGameStats | null
}

export async function upsertGameStats(stats: Partial<UserGameStats> & { user_id: string }): Promise<UserGameStats | null> {
  const { data, error } = await supabase
    .from('user_game_stats')
    .upsert([stats], { onConflict: 'user_id' })
    .select()
    .single()
  if (error) {
    console.error('upsertGameStats error:', error)
    return null
  }
  return data as UserGameStats
}

export async function getAllGameStats(): Promise<UserGameStats[]> {
  const { data, error } = await supabase
    .from('user_game_stats')
    .select('*')
    .order('xp', { ascending: false })
  if (error) { console.error('getAllGameStats error:', error); return [] }
  return data as UserGameStats[]
}

// ─── RecurringTask（節拍器）CRUD ─────────────────────────────

export interface RecurringTask {
  id: string
  user_id: string
  name: string
  icon: string
  description: string
  period: 'weekly' | 'monthly' | 'quarterly'
  due_label: string
  xp_reward: number
  streak: number
  done_this_period: boolean
  last_completed_at: string | null
  created_at: string
}

export async function getUserRecurringTasks(userId: string): Promise<RecurringTask[]> {
  const { data, error } = await supabase
    .from('user_recurring_tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) { console.error('getUserRecurringTasks error:', error); return [] }
  return data as RecurringTask[]
}

export async function insertRecurringTasks(tasks: Array<Omit<RecurringTask, 'id' | 'created_at'>>): Promise<boolean> {
  const { error } = await supabase.from('user_recurring_tasks').insert(tasks)
  if (error) { console.error('insertRecurringTasks error:', error); return false }
  return true
}

export async function updateRecurringTask(taskId: string, updates: Partial<RecurringTask>): Promise<boolean> {
  const { error } = await supabase
    .from('user_recurring_tasks')
    .update(updates)
    .eq('id', taskId)
  if (error) { console.error('updateRecurringTask error:', error); return false }
  return true
}

// ─── UserSkill（技能樹）CRUD ────────────────────────────────

export interface UserSkill {
  id: string
  user_id: string
  name: string
  icon: string
  description: string
  category: string
  tier: number
  level: number
  max_level: number
  sp_cost: number
  unlocked: boolean
  created_at: string
}

export async function getUserSkills(userId: string): Promise<UserSkill[]> {
  const { data, error } = await supabase
    .from('user_skills')
    .select('*')
    .eq('user_id', userId)
    .order('tier', { ascending: true })
  if (error) { console.error('getUserSkills error:', error); return [] }
  return data as UserSkill[]
}

export async function insertUserSkills(skills: Array<Omit<UserSkill, 'id' | 'created_at'>>): Promise<boolean> {
  const { error } = await supabase.from('user_skills').insert(skills)
  if (error) { console.error('insertUserSkills error:', error); return false }
  return true
}

export async function updateUserSkill(skillId: string, updates: Partial<UserSkill>): Promise<boolean> {
  const { error } = await supabase
    .from('user_skills')
    .update(updates)
    .eq('id', skillId)
  if (error) { console.error('updateUserSkill error:', error); return false }
  return true
}

// ─── UserInventory（背包）CRUD ──────────────────────────────

export interface UserInventoryItem {
  id: string
  user_id: string
  item_name: string
  item_icon: string
  quantity: number
  purchased_at: string
}

export async function getUserInventory(userId: string): Promise<UserInventoryItem[]> {
  const { data, error } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false })
  if (error) { console.error('getUserInventory error:', error); return [] }
  return data as UserInventoryItem[]
}

export async function addToInventory(item: { user_id: string; item_name: string; item_icon: string }): Promise<boolean> {
  const { error } = await supabase.from('user_inventory').insert([{ ...item, quantity: 1 }])
  if (error) { console.error('addToInventory error:', error); return false }
  return true
}

// ─── UserGachaCollection（抽卡收藏）CRUD ────────────────────

export interface UserGachaCard {
  id: string
  user_id: string
  card_name: string
  card_icon: string
  card_rarity: string
  card_desc: string
  obtained_at: string
}

export async function getUserGachaCollection(userId: string): Promise<UserGachaCard[]> {
  const { data, error } = await supabase
    .from('user_gacha_collection')
    .select('*')
    .eq('user_id', userId)
    .order('obtained_at', { ascending: false })
  if (error) { console.error('getUserGachaCollection error:', error); return [] }
  return data as UserGachaCard[]
}

export async function addGachaCard(card: { user_id: string; card_name: string; card_icon: string; card_rarity: string; card_desc: string }): Promise<boolean> {
  const { error } = await supabase
    .from('user_gacha_collection')
    .upsert([card], { onConflict: 'user_id,card_name' })
  if (error) { console.error('addGachaCard error:', error); return false }
  return true
}

// ─── Reward Redemption 獎勵兌換 ──────────────────────────────────────

export interface RewardItem {
  id: string
  name: string
  description: string
  icon: string
  cost_gold: number
  cost_diamond: number
  category: 'leave' | 'bonus' | 'gift' | 'custom'
  active: boolean
  created_by: string
  created_at: string
}

export interface RewardRedemption {
  id: string
  user_id: string
  user_name: string
  reward_id: string
  reward_name: string
  reward_icon: string
  cost_gold: number
  cost_diamond: number
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  note: string
  created_at: string
}

export async function getRewardItems(): Promise<RewardItem[]> {
  const { data, error } = await supabase.from('reward_items').select('*').eq('active', true).order('cost_gold', { ascending: true })
  if (error) { console.error('getRewardItems error:', error); return [] }
  return data as RewardItem[]
}

export async function createRewardItem(item: Omit<RewardItem, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase.from('reward_items').insert([item])
  if (error) { console.error('createRewardItem error:', error); return false }
  return true
}

export async function updateRewardItem(id: string, updates: Partial<RewardItem>): Promise<boolean> {
  const { error } = await supabase.from('reward_items').update(updates).eq('id', id)
  if (error) { console.error('updateRewardItem error:', error); return false }
  return true
}

export async function deleteRewardItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('reward_items').delete().eq('id', id)
  if (error) { console.error('deleteRewardItem error:', error); return false }
  return true
}

export async function getRedemptions(filters?: { user_id?: string; status?: string }): Promise<RewardRedemption[]> {
  let query = supabase.from('reward_redemptions').select('*').order('created_at', { ascending: false })
  if (filters?.user_id) query = query.eq('user_id', filters.user_id)
  if (filters?.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) { console.error('getRedemptions error:', error); return [] }
  return data as RewardRedemption[]
}

export async function createRedemption(redemption: Omit<RewardRedemption, 'id' | 'created_at' | 'reviewed_by' | 'reviewed_at'>): Promise<boolean> {
  const { error } = await supabase.from('reward_redemptions').insert([redemption])
  if (error) { console.error('createRedemption error:', error); return false }
  return true
}

export async function reviewRedemption(id: string, status: 'approved' | 'rejected', reviewedBy: string): Promise<boolean> {
  const { error } = await supabase.from('reward_redemptions').update({ status, reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) { console.error('reviewRedemption error:', error); return false }
  return true
}

// ─── Task Comments 任務留言 ──────────────────────────────────────

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  user_name: string
  user_avatar: string
  content: string
  created_at: string
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true })
  if (error) { console.error('getTaskComments error:', error); return [] }
  return data as TaskComment[]
}

export async function addTaskComment(comment: Omit<TaskComment, 'id' | 'created_at'>): Promise<boolean> {
  const { error } = await supabase.from('task_comments').insert([comment])
  if (error) { console.error('addTaskComment error:', error); return false }
  return true
}
