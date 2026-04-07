export const MOCK_USER = {
  name: '澤昊',
  role: 'ME（管理者）',
  avatar: '👑',
  level: 12,
  title: '穎流指揮官',
  xp: 2450,
  xpMax: 3000,
  sp: 180,
  gold: 3200,
  diamond: 45,
  streak: 7,
  joinDate: '2025-12-01',
}

export const MOCK_MEMBERS = [
  { name: '澤昊', role: 'ME', avatar: '👑', level: 12, xp: 2450, streak: 7, todayDone: true, dailyLog: true, monthXp: 820 },
  { name: '品萱', role: '企劃', avatar: '💡', level: 11, xp: 2300, streak: 8, todayDone: true, dailyLog: true, monthXp: 780 },
  { name: '芸柔', role: '設計師', avatar: '🎨', level: 10, xp: 2100, streak: 5, todayDone: true, dailyLog: true, monthXp: 650 },
  { name: '小佑', role: '攝影師', avatar: '📸', level: 9, xp: 1850, streak: 3, todayDone: false, dailyLog: false, monthXp: 520 },
  { name: '思妤', role: '社群小編', avatar: '✍️', level: 8, xp: 1600, streak: 6, todayDone: true, dailyLog: true, monthXp: 480 },
  { name: 'Jeffery', role: '影像剪輯', avatar: '🎬', level: 7, xp: 1350, streak: 2, todayDone: false, dailyLog: false, monthXp: 350 },
  { name: '宇翔', role: '攝影助理', avatar: '🔧', level: 6, xp: 1100, streak: 1, todayDone: false, dailyLog: false, monthXp: 280 },
  { name: '雅婷', role: '行政', avatar: '📋', level: 8, xp: 1700, streak: 4, todayDone: true, dailyLog: true, monthXp: 420 },
]

export const MOCK_TASKS = [
  { id: 1, title: '完成本週 Reels 腳本', xp: 50, gold: 30, done: true, category: '內容', type: 'main' as const },
  { id: 2, title: '客戶拍攝 — 美式餐廳', xp: 80, gold: 50, done: true, category: '拍攝', type: 'main' as const },
  { id: 3, title: '修圖交付：婚紗照 20 張', xp: 60, gold: 40, done: false, category: '後製', type: 'main' as const },
  { id: 4, title: '社群週報分析', xp: 40, gold: 20, done: false, category: '分析', type: 'main' as const },
  { id: 5, title: '週會簡報準備', xp: 30, gold: 15, done: true, category: '會議', type: 'side' as const },
  { id: 6, title: 'TikTok 趨勢研究', xp: 35, gold: 25, done: false, category: '研究', type: 'side' as const },
]

export const MOCK_SKILLS = [
  { name: '市場直覺', icon: '📊', level: 3, maxLevel: 5, unlocked: true, desc: '洞察市場趨勢的能力', category: '商業', tier: 1, spCost: 10 },
  { name: '第一性原理', icon: '🧠', level: 2, maxLevel: 5, unlocked: true, desc: '從根本思考問題的能力', category: '商業', tier: 2, spCost: 20 },
  { name: '攝影大師', icon: '📷', level: 4, maxLevel: 5, unlocked: true, desc: '完成 50 場拍攝任務', category: '技術', tier: 1, spCost: 10 },
  { name: '剪輯達人', icon: '✂️', level: 2, maxLevel: 5, unlocked: true, desc: '剪輯 30 支影片', category: '技術', tier: 1, spCost: 10 },
  { name: '社群操盤手', icon: '📱', level: 4, maxLevel: 5, unlocked: true, desc: '發布 100 則貼文', category: '技術', tier: 2, spCost: 20 },
  { name: '鋼鐵意志', icon: '💪', level: 1, maxLevel: 5, unlocked: true, desc: '連續打卡 30 天', category: '心理', tier: 1, spCost: 10 },
  { name: '客戶耳語者', icon: '🤝', level: 1, maxLevel: 5, unlocked: true, desc: '完成 10 次客戶提案', category: '商業', tier: 2, spCost: 20 },
  { name: 'AI 先鋒', icon: '🤖', level: 1, maxLevel: 5, unlocked: true, desc: '使用 AI 工具完成 20 個任務', category: '技術', tier: 2, spCost: 20 },
  { name: '數據分析師', icon: '📈', level: 0, maxLevel: 5, unlocked: false, desc: '完成 20 份數據報告', category: '商業', tier: 3, spCost: 35 },
  { name: '創意總監', icon: '🌟', level: 0, maxLevel: 5, unlocked: false, desc: '達到 Lv.15 解鎖', category: '傳說', tier: 4, spCost: 50 },
  { name: '團隊導師', icon: '🧭', level: 2, maxLevel: 5, unlocked: true, desc: '指導夥伴完成 15 項任務', category: '心理', tier: 2, spCost: 20 },
  { name: '時間領主', icon: '⏰', level: 0, maxLevel: 5, unlocked: false, desc: '連續 60 天零遲到', category: '傳說', tier: 4, spCost: 50 },
]

export const MOCK_DAILY_LOGS = [
  { date: '04/07', mood: '🔥', energy: 4, highlight: '完成客戶提案', quest: '拿下新客戶', wins: '提案一次過', blocks: '無', reflection: '今天效率很高' },
  { date: '04/06', mood: '😊', energy: 3, highlight: '拍攝順利完成', quest: '美式餐廳拍攝', wins: '光線抓得好', blocks: '場地有點小', reflection: '天氣超好' },
  { date: '04/05', mood: '💪', energy: 5, highlight: '學會新剪輯技巧', quest: '學習 After Effects', wins: '掌握關鍵幀', blocks: '無', reflection: '很有成就感' },
  { date: '04/04', mood: '😴', energy: 2, highlight: '整理素材庫', quest: '素材整理', wins: '分類完成', blocks: '太多雜檔', reflection: '有點累' },
  { date: '04/03', mood: '🎯', energy: 4, highlight: '週報做完了', quest: '週報分析', wins: '數據成長 15%', blocks: '無', reflection: '提早交差' },
]

export const MOCK_METRONOME = {
  weekly: [
    { name: '週靈魂報告', icon: '📜', desc: '每週一繳交上週工作回顧', due: '每週一', done: true, xp: 40, streak: 12 },
    { name: '將帥議事', icon: '⚔️', desc: '管理層週會', due: '每週二', done: true, xp: 30, streak: 8 },
    { name: '操盤圓桌', icon: '🎯', desc: '行銷策略討論會', due: '每週三', done: false, xp: 35, streak: 5 },
  ],
  monthly: [
    { name: '月之封印', icon: '🌙', desc: '每月月底繳交月報', due: '每月30日', done: false, xp: 100, streak: 3 },
    { name: 'IP 煉金術', icon: '✨', desc: 'IP 經營月度檢討', due: '每月15日', done: true, xp: 80, streak: 4 },
    { name: '金庫議事', icon: '💰', desc: '財務月度審查', due: '每月5日', done: true, xp: 60, streak: 6 },
  ],
  quarterly: [
    { name: '季度神諭', icon: '🔮', desc: '季度目標檢討與下季規劃', due: '每季末', done: false, xp: 200, streak: 2 },
  ],
}

export const MOCK_MARKET_ITEMS = [
  { id: 1, name: 'SP 加倍符', icon: '🔮', desc: '下次技能升級 SP 消耗減半', price: 500, currency: 'gold' as const, rarity: '普通' },
  { id: 2, name: 'XP 爆發藥水', icon: '⚡', desc: '今日所有任務 XP 雙倍', price: 800, currency: 'gold' as const, rarity: '稀有' },
  { id: 3, name: '高級洞見', icon: '💡', desc: '獲得一條隨機商業洞見', price: 300, currency: 'gold' as const, rarity: '普通' },
  { id: 4, name: '境界跳升', icon: '🚀', desc: '直接獲得 500 XP', price: 15, currency: 'diamond' as const, rarity: '史詩' },
  { id: 5, name: '連勝護盾', icon: '🛡️', desc: '保護連續打卡天數一次', price: 1200, currency: 'gold' as const, rarity: '稀有' },
  { id: 6, name: '命運轉盤券', icon: '🎰', desc: '免費使用一次洞見抽卡', price: 10, currency: 'diamond' as const, rarity: '史詩' },
]

export const MOCK_GACHA_POOL = [
  { name: '市場洞察：短影音紅利期', rarity: 'R', icon: '📊', desc: '短影音平台的流量紅利預計持續到 2027 年' },
  { name: '心理洞察：峰終定律', rarity: 'SR', icon: '🧠', desc: '人們記住的是體驗的高峰和結尾' },
  { name: '技術洞察：AI 工作流', rarity: 'SR', icon: '🤖', desc: '善用 AI 工具的人效率提升 10 倍' },
  { name: '傳說洞察：第一性原理', rarity: 'SSR', icon: '⭐', desc: '把問題拆解到最基本的事實，從零推理' },
  { name: '商業洞察：飛輪效應', rarity: 'R', icon: '💼', desc: '好的商業模式會形成正向循環' },
  { name: '傳說洞察：複利思維', rarity: 'SSR', icon: '🌟', desc: '每天進步 1%，一年後你會強 37 倍' },
]

export const MOCK_EXPLORE_REGIONS = [
  { id: 'silicon', name: '矽谷戰場', icon: '💻', desc: '科技創新的前線', level: 5, unlocked: true, progress: 65, quests: 3, color: '#8b5cf6' },
  { id: 'wallstreet', name: '華爾街深淵', icon: '📈', desc: '金融與商業的核心', level: 8, unlocked: true, progress: 30, quests: 2, color: '#f59e0b' },
  { id: 'space', name: '太空邊疆', icon: '🚀', desc: '突破極限的未知領域', level: 12, unlocked: false, progress: 0, quests: 0, color: '#3b82f6' },
  { id: 'ev', name: '電動車地獄', icon: '⚡', desc: '新能源革命的戰場', level: 10, unlocked: false, progress: 0, quests: 0, color: '#10b981' },
  { id: 'media', name: '輿論戰場', icon: '📡', desc: '社群媒體的攻防戰', level: 3, unlocked: true, progress: 80, quests: 1, color: '#ef4444' },
  { id: 'mars', name: '火星殖民地', icon: '🔴', desc: '終極挑戰之地', level: 20, unlocked: false, progress: 0, quests: 0, color: '#f97316' },
]

export const MOCK_BASE = {
  character: {
    skin: 0, hair: 2, hairColor: 1, eyes: 0, accessory: 1, title: '穎流指揮官',
    skinOptions: ['🧑🏻', '🧑🏼', '🧑🏽', '🧑🏾', '🧑🏿'],
    hairOptions: ['短髮', '中長', '長髮', '捲髮', '平頭'],
    hairColorOptions: ['黑色', '棕色', '金色', '紅色', '藍色'],
    eyeOptions: ['標準', '銳利', '溫柔', '酷帥'],
    accessoryOptions: ['無', '眼鏡', '帽子', '耳環', '項鍊'],
  },
  room: [
    [null, 'desk', null, 'plant'],
    ['bookshelf', null, null, null],
    [null, null, 'chair', null],
    ['lamp', null, null, 'trophy'],
  ] as (string | null)[][],
  roomItems: {
    desk: { name: '工作桌', icon: '🖥️' },
    plant: { name: '盆栽', icon: '🌱' },
    bookshelf: { name: '書架', icon: '📚' },
    chair: { name: '椅子', icon: '🪑' },
    lamp: { name: '檯燈', icon: '💡' },
    trophy: { name: '獎盃', icon: '🏆' },
    camera: { name: '相機', icon: '📷' },
    poster: { name: '海報', icon: '🖼️' },
  } as Record<string, { name: string; icon: string }>,
}

export const SEASON_PASS = {
  season: 'S1',
  name: '開拓者賽季',
  tiers: [
    { tier: 1, xpReq: 0, reward: '🎫 賽季徽章', claimed: true },
    { tier: 2, xpReq: 500, reward: '🪙 200 Gold', claimed: true },
    { tier: 3, xpReq: 1000, reward: '🔮 30 SP', claimed: true },
    { tier: 4, xpReq: 1500, reward: '⚡ XP 爆發藥水', claimed: false },
    { tier: 5, xpReq: 2000, reward: '💎 10 鑽石', claimed: false },
    { tier: 6, xpReq: 2500, reward: '🌟 傳說稱號', claimed: false },
  ],
}
