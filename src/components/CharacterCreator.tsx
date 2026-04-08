'use client'

import React, { useState } from 'react'
import { CharacterAppearance } from './OfficeCanvas'
import { SPRITE_REGISTRY, getSpriteById } from '@/lib/sprites'

interface CharacterCreatorProps {
  initialCharacter?: CharacterAppearance
  onSave: (character: CharacterAppearance) => void
  onCancel?: () => void
  isNewUser?: boolean
}

export default function CharacterCreator({
  initialCharacter,
  onSave,
  onCancel,
  isNewUser = false,
}: CharacterCreatorProps) {
  const [selectedId, setSelectedId] = useState<string>(
    initialCharacter?.spriteId ?? SPRITE_REGISTRY[0].id
  )

  const selected = getSpriteById(selectedId)

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div
        className="border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'rgba(18,18,30,0.97)', backdropFilter: 'blur(16px)' }}
      >
        {/* Header */}
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-bold text-white">選擇你的角色 🐾</h2>
          <p className="text-white/50 text-sm mt-1">選一個陪你在辦公室打拼的夥伴</p>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* 預覽區 */}
          <div className="flex items-center gap-5 bg-white/5 rounded-xl p-4 border border-white/10">
            {/* 動態預覽 */}
            <div
              className="w-24 h-24 flex items-center justify-center rounded-xl border border-white/10 flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <img
                src={selected.idleGif}
                alt={selected.name}
                style={{ width: '64px', height: '64px', imageRendering: 'pixelated' }}
              />
            </div>
            {/* 角色說明 */}
            <div>
              <div className="text-white font-bold text-lg">{selected.name}</div>
              <div className="text-white/50 text-sm mt-1">{selected.description}</div>
              <div className="flex gap-2 mt-3">
                <img
                  src={selected.walkGif}
                  alt="走路"
                  style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }}
                  title="走路動作"
                />
                <img
                  src={selected.restGif}
                  alt="休息"
                  style={{ width: '32px', height: '32px', imageRendering: 'pixelated' }}
                  title="休息動作"
                />
                <span className="text-white/30 text-xs self-center ml-1">待機 / 走路 / 休息</span>
              </div>
            </div>
          </div>

          {/* 角色選擇格子 */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
              所有角色
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {SPRITE_REGISTRY.map(sprite => (
                <button
                  key={sprite.id}
                  onClick={() => setSelectedId(sprite.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all"
                  style={{
                    border: selectedId === sprite.id
                      ? '2px solid #a855f7'
                      : '2px solid rgba(255,255,255,0.08)',
                    background: selectedId === sprite.id
                      ? 'rgba(168,85,247,0.15)'
                      : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <img
                    src={sprite.idleGif}
                    alt={sprite.name}
                    style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }}
                  />
                  <span className="text-white text-xs font-medium">{sprite.name}</span>
                </button>
              ))}

              {/* 即將推出 */}
              <div
                className="flex flex-col items-center gap-2 p-3 rounded-xl border opacity-40 cursor-not-allowed"
                style={{ border: '2px dashed rgba(255,255,255,0.15)' }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  ＋
                </div>
                <span className="text-white/60 text-xs">即將推出</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end gap-3">
          {!isNewUser && onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              取消
            </button>
          )}
          <button
            onClick={() => onSave({ spriteId: selectedId })}
            className="px-6 py-2 rounded-xl text-white text-sm font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
          >
            確認選擇 ✅
          </button>
        </div>
      </div>
    </div>
  )
}
