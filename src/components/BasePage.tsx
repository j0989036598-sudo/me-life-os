'use client'

import { useState } from 'react'
import { MOCK_BASE } from '@/lib/mockData'

export default function BasePage() {
  const [tab, setTab] = useState<'character' | 'room'>('character')
  const [char, setChar] = useState(MOCK_BASE.character)
  const [room, setRoom] = useState(MOCK_BASE.room)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  const updateChar = (key: string, value: number) => {
    setChar(prev => ({ ...prev, [key]: value }))
  }

  const placeItem = (row: number, col: number) => {
    if (!selectedItem) return
    setRoom(prev => {
      const newRoom = prev.map(r => [...r])
      newRoom[row][col] = selectedItem
      return newRoom
    })
    setSelectedItem(null)
  }

  const removeItem = (row: number, col: number) => {
    setRoom(prev => {
      const newRoom = prev.map(r => [...r])
      newRoom[row][col] = null
      return newRoom
    })
  }

  return (
    <div className="animate-fade">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏰</span>
        <div>
          <h2 className="text-2xl font-black">基地</h2>
          <p className="text-gray-400 text-sm">打造你的角色和專屬空間</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('character')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'character' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30' : 'glass text-gray-400'
          }`}>
          👤 角色編輯
        </button>
        <button onClick={() => setTab('room')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'room' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30' : 'glass text-gray-400'
          }`}>
          🏠 房間佈置
        </button>
      </div>

      {tab === 'character' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/30 to-amber-500/30 flex items-center justify-center text-7xl border-2 border-white/10 mb-4">
              {char.skinOptions[char.skin]}
            </div>
            <h3 className="text-xl font-black">{char.title}</h3>
            <div className="flex gap-2 mt-2 text-xs text-gray-400">
              <span>髮型：{char.hairOptions[char.hair]}</span>
              <span>·</span>
              <span>髮色：{char.hairColorOptions[char.hairColor]}</span>
              <span>·</span>
              <span>配件：{char.accessoryOptions[char.accessory]}</span>
            </div>
          </div>

          {/* Editor */}
          <div className="space-y-4">
            {[
              { label: '膚色', key: 'skin', options: char.skinOptions },
              { label: '髮型', key: 'hair', options: char.hairOptions },
              { label: '髮色', key: 'hairColor', options: char.hairColorOptions },
              { label: '眼型', key: 'eyes', options: char.eyeOptions },
              { label: '配件', key: 'accessory', options: char.accessoryOptions },
            ].map(section => (
              <div key={section.key} className="glass rounded-xl p-4">
                <label className="block text-xs font-bold text-gray-400 mb-2">{section.label}</label>
                <div className="flex gap-2 flex-wrap">
                  {section.options.map((opt, i) => (
                    <button key={i}
                      onClick={() => updateChar(section.key, i)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${
                        (char as any)[section.key] === i
                          ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30'
                          : 'bg-dark-700/50 text-gray-400 hover:text-white'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'room' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room Grid */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4 text-gray-400">🏠 你的房間（點擊空格放置家具）</h3>
            <div className="grid grid-cols-4 gap-3">
              {room.map((row, ri) =>
                row.map((cell, ci) => {
                  const item = cell ? MOCK_BASE.roomItems[cell] : null
                  return (
                    <div key={`${ri}-${ci}`}
                      onClick={() => cell ? removeItem(ri, ci) : placeItem(ri, ci)}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                        item ? 'bg-dark-700/80 border border-white/10 hover:border-red-400/30' :
                        selectedItem ? 'bg-purple-500/10 border-2 border-dashed border-purple-400/30 hover:bg-purple-500/20' :
                        'bg-dark-700/30 border border-dashed border-white/5'
                      }`}>
                      {item ? (
                        <>
                          <span className="text-3xl">{item.icon}</span>
                          <span className="text-[10px] text-gray-500 mt-1">{item.name}</span>
                        </>
                      ) : (
                        selectedItem && <span className="text-xs text-purple-400/50">+</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            {selectedItem && (
              <p className="text-xs text-purple-400 mt-3 text-center">點擊空格放置 {MOCK_BASE.roomItems[selectedItem]?.name}</p>
            )}
          </div>

          {/* Item Palette */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4 text-gray-400">🎒 家具倉庫</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MOCK_BASE.roomItems).map(([key, item]) => (
                <button key={key}
                  onClick={() => setSelectedItem(selectedItem === key ? null : key)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedItem === key ? 'bg-purple-500/20 ring-1 ring-purple-400/30' : 'bg-dark-700/50 hover:bg-dark-600'
                  }`}>
                  <div className="text-2xl">{item.icon}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{item.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
