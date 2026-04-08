'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface CharacterAppearance {
  hairStyle: number;    // 0-5
  hairColor: string;    // hex color
  skinTone: number;     // 0-3
  outfitColor: string;  // hex color
  accessory: number;    // 0-4 (none, glasses, hat, headphones, scarf)
}

export interface OfficeMember {
  id: string;
  name: string;
  status: 'online' | 'working' | 'idle' | 'offline';
  character: CharacterAppearance | null;
}

interface LayoutInfo {
  deskPositions: { gridRow: number; gridCol: number; memberIndex: number }[];
  canvasWidth: number;
  canvasHeight: number;
  originX: number;
  originY: number;
  gridWidth: number;
  gridHeight: number;
}

// ============================================================================
// COLOR PALETTE
// ============================================================================

const COLORS = {
  floorDark: '#102a38',
  floorLight: '#153848',
  floorEdge: '#0a2030',
  wallDark: '#0c2230',
  wallMid: '#122a38',
  wallLight: '#1a3a4a',
  wallTrim: '#1a5060',
  deskTop: '#5a3a28',
  deskFront: '#4a2a18',
  deskShadow: '#3a2010',
  monitorFrame: '#18182a',
  monitorScreen: '#1a4858',
  monitorGlow: '#2a6878',
  chairBack: '#2a3545',
  chairSeat: '#354555',
  plantDark: '#1a5a2a',
  plantLight: '#2a8a3a',
  plantPot: '#6a4a2a',
  lampPole: '#4a4a5a',
  lampBulb: '#e8d878',
  skinTones: ['#f5d0a0', '#e8b888', '#c89870', '#8a6048'],
  statusColors: {
    online: '#4ade80',
    working: '#facc15',
    idle: '#f97316',
    offline: '#6b7280',
  },
  background: '#0a1520',
  textColor: '#ffffff',
};

const TW = 32;  // Tile Width
const TH = 16;  // Tile Height
const DEFAULT_CHARACTER: CharacterAppearance = {
  hairStyle: 0,
  hairColor: '#4a3520',
  skinTone: 0,
  outfitColor: '#3a5a8a',
  accessory: 0,
};

// ============================================================================
// LAYOUT CALCULATION
// ============================================================================

function calculateLayout(memberCount: number): LayoutInfo {
  const count = Math.max(memberCount, 1);
  const desksPerRow = Math.min(Math.ceil(count / 2), 5);
  const totalRows = Math.ceil(count / desksPerRow);

  const deskPositions: LayoutInfo['deskPositions'] = [];
  let memberIndex = 0;

  for (let row = 0; row < totalRows; row++) {
    const desksInThisRow = Math.min(desksPerRow, count - row * desksPerRow);
    for (let col = 0; col < desksInThisRow; col++) {
      const gridCol = 2 + col * 3;
      const gridRow = 2 + row * 4;
      deskPositions.push({ gridRow, gridCol, memberIndex });
      memberIndex++;
    }
  }

  const gridWidth = 2 + desksPerRow * 3 + 2;
  const gridHeight = 2 + totalRows * 4 + 2;

  const canvasWidth = (gridWidth + 1) * TW + 20;
  const canvasHeight = (gridHeight + 1) * TH + 100;

  const originX = canvasWidth / 2;
  const originY = 60;

  return {
    deskPositions,
    canvasWidth,
    canvasHeight,
    originX,
    originY,
    gridWidth,
    gridHeight,
  };
}

// ============================================================================
// ISOMETRIC GRID CONVERSION
// ============================================================================

function gridToScreen(
  gridCol: number,
  gridRow: number,
  originX: number,
  originY: number
): [number, number] {
  const sx = originX + (gridCol - gridRow) * (TW / 2);
  const sy = originY + (gridCol + gridRow) * (TH / 2);
  return [sx, sy];
}

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================

function drawFloorTile(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + TW / 2, cy + TH / 2);
  ctx.lineTo(cx, cy + TH);
  ctx.lineTo(cx - TW / 2, cy + TH / 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COLORS.floorEdge;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawFloor(ctx: CanvasRenderingContext2D, layout: LayoutInfo) {
  for (let row = 0; row < layout.gridHeight; row++) {
    for (let col = 0; col < layout.gridWidth; col++) {
      const [sx, sy] = gridToScreen(col, row, layout.originX, layout.originY);
      const color = (col + row) % 2 === 0 ? COLORS.floorLight : COLORS.floorDark;
      drawFloorTile(ctx, sx, sy, color);
    }
  }
}

function drawWalls(ctx: CanvasRenderingContext2D, layout: LayoutInfo) {
  const wallHeight = 80;

  // Left-back wall (facing left)
  const [wallLeftX, wallLeftY] = gridToScreen(0, 0, layout.originX, layout.originY);
  ctx.fillStyle = COLORS.wallDark;
  ctx.beginPath();
  ctx.moveTo(wallLeftX, wallLeftY);
  ctx.lineTo(wallLeftX, wallLeftY - wallHeight);
  ctx.lineTo(wallLeftX - TW / 4, wallLeftY - wallHeight - TH / 2);
  ctx.lineTo(wallLeftX - TW / 4, wallLeftY - TH / 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right-back wall (facing right)
  const [wallRightX, wallRightY] = gridToScreen(
    layout.gridWidth - 1,
    0,
    layout.originX,
    layout.originY
  );
  ctx.fillStyle = COLORS.wallLight;
  ctx.beginPath();
  ctx.moveTo(wallRightX, wallRightY);
  ctx.lineTo(wallRightX, wallRightY - wallHeight);
  ctx.lineTo(wallRightX + TW / 4, wallRightY - wallHeight - TH / 2);
  ctx.lineTo(wallRightX + TW / 4, wallRightY - TH / 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = COLORS.wallTrim;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawDesk(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // Desk surface (top)
  ctx.fillStyle = COLORS.deskTop;
  ctx.fillRect(cx - 8, cy - 12, 16, 8);

  // Desk front
  ctx.fillStyle = COLORS.deskFront;
  ctx.fillRect(cx - 8, cy - 4, 16, 8);

  // Desk shadow
  ctx.fillStyle = COLORS.deskShadow;
  ctx.fillRect(cx - 8, cy + 4, 16, 3);

  // Monitor frame
  ctx.fillStyle = COLORS.monitorFrame;
  ctx.fillRect(cx - 4, cy - 18, 8, 8);

  // Monitor screen
  ctx.fillStyle = COLORS.monitorScreen;
  ctx.fillRect(cx - 3, cy - 17, 6, 6);

  // Monitor glow effect (two horizontal lines)
  ctx.strokeStyle = COLORS.monitorGlow;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 15);
  ctx.lineTo(cx + 2, cy - 15);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 13);
  ctx.lineTo(cx + 2, cy - 13);
  ctx.stroke();

  // Keyboard
  ctx.fillStyle = COLORS.deskFront;
  ctx.fillRect(cx - 6, cy - 2, 12, 3);
}

function drawChair(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // Chair back
  ctx.fillStyle = COLORS.chairBack;
  ctx.fillRect(cx - 3, cy - 18, 6, 8);

  // Chair seat
  ctx.fillStyle = COLORS.chairSeat;
  ctx.fillRect(cx - 4, cy - 10, 8, 4);

  // Chair legs
  ctx.fillStyle = COLORS.chairBack;
  ctx.fillRect(cx - 4, cy - 6, 2, 6);
  ctx.fillRect(cx + 2, cy - 6, 2, 6);
}

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  appearance: CharacterAppearance,
  status: string,
  animFrame: number
) {
  if (status === 'offline') {
    ctx.globalAlpha = 0.3;
  }

  const skinColor = COLORS.skinTones[appearance.skinTone % COLORS.skinTones.length];

  // Head
  ctx.fillStyle = skinColor;
  ctx.fillRect(cx - 3, cy - 20, 6, 6);

  // Hair (varies by hairStyle)
  ctx.fillStyle = appearance.hairColor;
  if (appearance.hairStyle === 0) {
    // Short straight
    ctx.fillRect(cx - 3, cy - 24, 6, 4);
  } else if (appearance.hairStyle === 1) {
    // Wavy
    ctx.fillRect(cx - 3, cy - 24, 2, 4);
    ctx.fillRect(cx + 1, cy - 24, 2, 4);
  } else if (appearance.hairStyle === 2) {
    // Long
    ctx.fillRect(cx - 3, cy - 26, 6, 6);
  } else if (appearance.hairStyle === 3) {
    // Curly (top peak)
    ctx.fillRect(cx - 2, cy - 25, 4, 5);
  } else if (appearance.hairStyle === 4) {
    // Ponytail (back)
    ctx.fillRect(cx + 2, cy - 22, 2, 4);
  } else {
    // Bald (no hair)
  }

  // Body
  ctx.fillStyle = appearance.outfitColor;
  ctx.fillRect(cx - 4, cy - 14, 8, 10);

  // Arms animation based on status
  const armYOffset = appearance.hairStyle === 3 ? cy - 11 : cy - 10;
  if (status === 'working') {
    // Typing motion
    const armBend = animFrame % 4 < 2 ? 2 : -2;
    ctx.fillRect(cx - 5, armYOffset, 1, 8 + armBend);
    ctx.fillRect(cx + 4, armYOffset, 1, 8 - armBend);
  } else if (status === 'online') {
    // Slight idle sway
    const sway = (animFrame % 4) % 2 === 0 ? 1 : 0;
    ctx.fillRect(cx - 5 + sway, armYOffset, 1, 8);
    ctx.fillRect(cx + 4 - sway, armYOffset, 1, 8);
  } else if (status === 'idle') {
    // Resting arms
    ctx.fillRect(cx - 5, armYOffset + 2, 1, 6);
    ctx.fillRect(cx + 4, armYOffset + 2, 1, 6);
  } else {
    // Default pose
    ctx.fillRect(cx - 5, armYOffset, 1, 8);
    ctx.fillRect(cx + 4, armYOffset, 1, 8);
  }

  // Accessory
  if (appearance.accessory === 1) {
    // Glasses
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(cx - 2, cy - 21, 1, 1);
    ctx.fillRect(cx + 1, cy - 21, 1, 1);
  } else if (appearance.accessory === 2) {
    // Hat
    ctx.fillStyle = '#6a4a3a';
    ctx.fillRect(cx - 4, cy - 26, 8, 2);
  } else if (appearance.accessory === 3) {
    // Headphones
    ctx.fillStyle = '#3a3a5a';
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 20, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 2, cy - 20, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.accessory === 4) {
    // Scarf
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(cx - 4, cy - 12, 8, 2);
  }

  ctx.globalAlpha = 1;
}

function drawNameTag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  name: string,
  status: string
) {
  const textMetrics = ctx.measureText(name);
  const textWidth = textMetrics.width;
  const padding = 4;
  const tagWidth = textWidth + padding * 2;
  const tagHeight = 12;

  const tagX = cx - tagWidth / 2;
  const tagY = cy - 35;

  // Background (70% alpha black)
  ctx.fillStyle = '#00000070';
  ctx.fillRect(tagX - 2, tagY - 1, tagWidth + 4, tagHeight + 2);

  // Status dot
  const statusColor = COLORS.statusColors[status as keyof typeof COLORS.statusColors] || COLORS.statusColors.offline;
  ctx.fillStyle = statusColor;
  ctx.beginPath();
  ctx.arc(tagX + 6, tagY + tagHeight / 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Name text
  ctx.fillStyle = COLORS.textColor;
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, cx, tagY + 10);
}

function drawPlant(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number
) {
  // Pot
  ctx.fillStyle = COLORS.plantPot;
  ctx.fillRect(cx - 4, cy - 2, 8, 6);

  // Soil
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(cx - 3, cy, 6, 2);

  // Leaves
  ctx.fillStyle = COLORS.plantDark;
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 6);
  ctx.lineTo(cx - 1, cy - 2);
  ctx.lineTo(cx, cy - 8);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 6);
  ctx.lineTo(cx + 1, cy - 2);
  ctx.lineTo(cx, cy - 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.plantLight;
  ctx.fillRect(cx - 1, cy - 4, 2, 2);
}

function drawLamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number
) {
  // Pole
  ctx.strokeStyle = COLORS.lampPole;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx, cy - 40);
  ctx.stroke();

  // Bulb
  ctx.fillStyle = COLORS.lampBulb;
  ctx.beginPath();
  ctx.arc(cx, cy - 45, 3, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  ctx.fillStyle = '#e8d87840';
  ctx.beginPath();
  ctx.arc(cx, cy - 45, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawShelf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number
) {
  // Shelf
  ctx.fillStyle = COLORS.wallMid;
  ctx.fillRect(cx - 10, cy, 20, 2);

  // Books
  const bookColors = ['#8a3a3a', '#3a6a8a', '#6a8a3a', '#8a6a3a'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = bookColors[i % bookColors.length];
    ctx.fillRect(cx - 8 + i * 4, cy - 6, 3, 6);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface OfficeCanvasProps {
  members: OfficeMember[];
}

export default function OfficeCanvas({ members }: OfficeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animFrame, setAnimFrame] = useState(0);

  const layout = useMemo(() => calculateLayout(members.length), [members.length]);

  const statusCounts = useMemo(() => {
    return {
      online: members.filter((m) => m.status === 'online').length,
      working: members.filter((m) => m.status === 'working').length,
      idle: members.filter((m) => m.status === 'idle').length,
      offline: members.filter((m) => m.status === 'offline').length,
    };
  }, [members]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = layout.canvasWidth;
    canvas.height = layout.canvasHeight;

    // Clear background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw office
    drawFloor(ctx, layout);
    drawWalls(ctx, layout);

    // Draw decorations (plants, lamps, shelves)
    const plantPositions = [
      [1, 1],
      [layout.gridWidth - 2, 1],
      [1, layout.gridHeight - 2],
      [layout.gridWidth - 2, layout.gridHeight - 2],
    ];
    for (const [col, row] of plantPositions) {
      if (col >= 0 && col < layout.gridWidth && row >= 0 && row < layout.gridHeight) {
        const [sx, sy] = gridToScreen(col, row, layout.originX, layout.originY);
        drawPlant(ctx, sx, sy);
      }
    }

    // Lamps
    for (let i = 0; i < Math.min(layout.gridWidth / 4, 3); i++) {
      const col = 3 + i * 6;
      const [sx, sy] = gridToScreen(col, 0, layout.originX, layout.originY);
      drawLamp(ctx, sx, sy - 20);
    }

    // Shelf
    const [shelfX, shelfY] = gridToScreen(
      layout.gridWidth - 2,
      layout.gridHeight / 2,
      layout.originX,
      layout.originY
    );
    drawShelf(ctx, shelfX, shelfY - 30);

    // Draw desks and characters
    for (const { gridRow, gridCol, memberIndex } of layout.deskPositions) {
      const [sx, sy] = gridToScreen(gridCol, gridRow, layout.originX, layout.originY);

      if (memberIndex < members.length) {
        drawChair(ctx, sx, sy);
        drawDesk(ctx, sx, sy);

        const member = members[memberIndex];
        const appearance = member.character || DEFAULT_CHARACTER;

        drawCharacter(ctx, sx, sy, appearance, member.status, animFrame);
        drawNameTag(ctx, sx, sy, member.name, member.status);
      }
    }
  }, [layout, members, animFrame]);

  // Animation loop
  useEffect(() => {
    let frameCount = 0;
    let lastUpdateTime = Date.now();

    const animationLoop = () => {
      const now = Date.now();
      if (now - lastUpdateTime >= 500) {
        frameCount++;
        setAnimFrame(frameCount % 4);
        lastUpdateTime = now;
      }
      requestAnimationFrame(animationLoop);
    };

    const rafId = requestAnimationFrame(animationLoop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="w-full overflow-hidden rounded-xl bg-[#0a1520]">
      {/* Status Summary Bar */}
      <div className="flex items-center justify-center gap-4 border-b border-[#1a3a4a] bg-[#0c2230] px-4 py-2 text-sm text-white">
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#4ade80]" />
          {statusCounts.online} Online
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#facc15]" />
          {statusCounts.working} Working
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#f97316]" />
          {statusCounts.idle} Idle
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[#6b7280]" />
          {statusCounts.offline} Offline
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          imageRendering: 'pixelated',
          display: 'block',
        }}
      />
    </div>
  );
}
