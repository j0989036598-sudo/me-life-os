'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CharacterAppearance } from './OfficeCanvas'

const HAIR_STYLES = [
  { id: 0, name: '短髮', label: 'Short' },
  { id: 1, name: '刺蝟頭', label: 'Spiky' },
  { id: 2, name: '長髮', label: 'Long' },
  { id: 3, name: '馬尾', label: 'Ponytail' },
  { id: 4, name: '捲髮', label: 'Curly' },
  { id: 5, name: '光頭', label: 'Bald' },
]

const HAIR_COLORS = ['#1a1a2a', '#4a3520', '#8a5a30', '#c89840', '#d44a20', '#6a2a5a', '#2a4a6a', '#e8e0d0']

const SKIN_TONES = ['#f5d0a0', '#e8b888', '#c89870', '#8a6048']

const OUTFIT_COLORS = ['#3a5a8a', '#8a3a3a', '#3a8a5a', '#8a7a3a', '#6a3a8a', '#3a7a8a', '#8a5a3a', '#5a5a6a']

const ACCESSORIES = [
  { id: 0, name: '無', emoji: 'ø' },
  { id: 1, name: '眼鏡', emoji: '👓' },
  { id: 2, name: '帽子', emoji: '🎩' },
  { id: 3, name: '耳機', emoji: '🎧' },
  { id: 4, name: '圍巾', emoji: '🧣' },
]

interface CharacterCreatorProps {
  initialCharacter?: CharacterAppearance
  onSave: (character: CharacterAppearance) => void
  onCancel?: () => void
  isNewUser?: boolean
}

function drawCharacterPreview(
  canvas: HTMLCanvasElement,
  character: CharacterAppearance
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const scale = 4 // 4px per "pixel" unit
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2 - 20

  // Clear with dark background
  ctx.fillStyle = '#1a1a2a'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Draw head (10x10 units = 40x40 pixels)
  ctx.fillStyle = SKIN_TONES[character.skinTone]
  ctx.fillRect((centerX - 20) * scale / 4, (centerY - 40) * scale / 4, 10 * scale, 10 * scale)

  // Draw simple eyes
  ctx.fillStyle = '#000000'
  ctx.fillRect((centerX - 15) * scale / 4, (centerY - 32) * scale / 4, 2 * scale, 2 * scale)
  ctx.fillRect((centerX - 8) * scale / 4, (centerY - 32) * scale / 4, 2 * scale, 2 * scale)

  // Draw hair based on style
  ctx.fillStyle = character.hairColor
  const hs = character.hairStyle

  if (hs === 0) {
    // Short hair - top only
    for (let x = -10; x < 10; x += 4) {
      ctx.fillRect((centerX + x) * scale / 4, (centerY - 48) * scale / 4, 3 * scale, 4 * scale)
    }
  } else if (hs === 1) {
    // Spiky - pointy bits
    for (let x = -8; x < 8; x += 6) {
      ctx.fillRect((centerX + x) * scale / 4, (centerY - 52) * scale / 4, 4 * scale, 5 * scale)
    }
  } else if (hs === 2) {
    // Long hair - full sides and back
    for (let x = -12; x < 12; x += 4) {
      ctx.fillRect((centerX + x) * scale / 4, (centerY - 50) * scale / 4, 4 * scale, 18 * scale)
    }
  } else if (hs === 3) {
    // Ponytail - top only, with tail
    for (let x = -10; x < 10; x += 4) {
      ctx.fillRect((centerX + x) * scale / 4, (centerY - 48) * scale / 4, 3 * scale, 4 * scale)
    }
    // Tail in back
    ctx.fillRect((centerX + 8) * scale / 4, (centerY - 20) * scale / 4, 3 * scale, 12 * scale)
  } else if (hs === 4) {
    // Curly - fluffy sides
    for (let x = -12; x < 12; x += 3) {
      for (let y = -10; y < 10; y += 3) {
        if (Math.random() > 0.3) {
          ctx.fillRect((centerX + x) * scale / 4, (centerY - 40 + y) * scale / 4, 2 * scale, 2 * scale)
        }
      }
    }
  }
  // hs === 5 is bald, no hair drawn

  // Draw body (8x12 units = 32x48 pixels)
  ctx.fillStyle = character.outfitColor
  ctx.fillRect((centerX - 16) * scale / 4, (centerY - 20) * scale / 4, 8 * scale, 12 * scale)

  // Draw arms (4x2 units each)
  ctx.fillRect((centerX - 24) * scale / 4, (centerY - 16) * scale / 4, 4 * scale, 2 * scale)
  ctx.fillRect((centerX + 20) * scale / 4, (centerY - 16) * scale / 4, 4 * scale, 2 * scale)

  // Draw legs (3x8 units each)
  ctx.fillRect((centerX - 12) * scale / 4, (centerY + 8) * scale / 4, 3 * scale, 8 * scale)
  ctx.fillRect((centerX + 9) * scale / 4, (centerY + 8) * scale / 4, 3 * scale, 8 * scale)

  // Draw accessories
  if (character.accessory === 1) {
    // Glasses
    ctx.strokeStyle = '#4a3520'
    ctx.lineWidth = 2
    ctx.strokeRect((centerX - 18) * scale / 4, (centerY - 34) * scale / 4, 4 * scale, 4 * scale)
    ctx.strokeRect((centerX - 10) * scale / 4, (centerY - 34) * scale / 4, 4 * scale, 4 * scale)
  } else if (character.accessory === 2) {
    // Hat - triangle on top
    ctx.fillStyle = '#8a3a3a'
    ctx.fillRect((centerX - 12) * scale / 4, (centerY - 52) * scale / 4, 8 * scale, 4 * scale)
    ctx.fillRect((centerX - 14) * scale / 4, (centerY - 48) * scale / 4, 12 * scale, 2 * scale)
  } else if (character.accessory === 3) {
    // Headphones
    ctx.strokeStyle = '#d44a20'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc((centerX - 18) * scale / 4, (centerY - 38) * scale / 4, 4 * scale, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc((centerX + 14) * scale / 4, (centerY - 38) * scale / 4, 4 * scale, 0, Math.PI * 2)
    ctx.stroke()
  } else if (character.accessory === 4) {
    // Scarf
    ctx.fillStyle = '#c89840'
    ctx.fillRect((centerX - 20) * scale / 4, (centerY - 18) * scale / 4, 8 * scale, 3 * scale)
    ctx.fillRect((centerX + 12) * scale / 4, (centerY - 18) * scale / 4, 8 * scale, 3 * scale)
  }
}

export default function CharacterCreator({
  initialCharacter,
  onSave,
  onCancel,
  isNewUser = false,
}: CharacterCreatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [character, setCharacter] = useState<CharacterAppearance>(
    initialCharacter || {
      hairStyle: 0,
      hairColor: '#4a3520',
      skinTone: 0,
      outfitColor: '#3a5a8a',
      accessory: 0,
    }
  )

  useEffect(() => {
    if (canvasRef.current) {
      drawCharacterPreview(canvasRef.current, character)
    }
  }, [character])

  const handleSave = () => {
    onSave(character)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-dark-800 border border-white/10 rounded-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            創建你的角色 ✨
          </h2>
          <p className="text-white/60 text-sm">
            選擇你在辦公室裡的像素角色外觀
          </p>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Preview */}
            <div className="flex flex-col items-center justify-center">
              <div className="bg-dark-900 border border-white/10 rounded-sm p-4">
                <canvas
                  ref={canvasRef}
                  width={160}
                  height={240}
                  className="w-40 h-60 border border-white/5"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-white/60 text-xs mt-4">角色預覽</p>
            </div>

            {/* Right: Customization */}
            <div className="space-y-6">
              {/* Hair Style */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm">
                  髮型 Hair Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {HAIR_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setCharacter({ ...character, hairStyle: style.id })}
                      className={`p-2 rounded-none border transition-all ${
                        character.hairStyle === style.id
                          ? 'border-purple-400 ring-2 ring-purple-400 bg-purple-900/20'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs text-white font-medium">{style.name}</div>
                      <div className="text-xs text-white/60">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm">
                  髮色 Hair Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCharacter({ ...character, hairColor: color })}
                      className={`w-8 h-8 rounded-none border transition-all ${
                        character.hairColor === color
                          ? 'ring-2 ring-purple-400'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Skin Tone */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm">
                  膚色 Skin Tone
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SKIN_TONES.map((tone, idx) => (
                    <button
                      key={tone}
                      onClick={() => setCharacter({ ...character, skinTone: idx })}
                      className={`w-8 h-8 rounded-none border transition-all ${
                        character.skinTone === idx
                          ? 'ring-2 ring-purple-400'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{ backgroundColor: tone }}
                    />
                  ))}
                </div>
              </div>

              {/* Outfit Color */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm">
                  服裝顏色 Outfit Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {OUTFIT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCharacter({ ...character, outfitColor: color })}
                      className={`w-8 h-8 rounded-none border transition-all ${
                        character.outfitColor === color
                          ? 'ring-2 ring-purple-400'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Accessory */}
              <div>
                <label className="block text-white font-semibold mb-3 text-sm">
                  配件 Accessory
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {ACCESSORIES.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setCharacter({ ...character, accessory: acc.id })}
                      className={`p-2 rounded-none border transition-all text-2xl ${
                        character.accessory === acc.id
                          ? 'border-purple-400 ring-2 ring-purple-400 bg-purple-900/20'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {acc.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 flex justify-end gap-3">
          {!isNewUser && (
            <button
              onClick={onCancel}
              className="px-6 py-2 rounded-none border border-white/20 text-white hover:bg-white/5 transition-colors font-medium"
            >
              取消
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-none bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium"
          >
            ✅ 確認創建
          </button>
        </div>
      </div>
    </div>
  )
}
