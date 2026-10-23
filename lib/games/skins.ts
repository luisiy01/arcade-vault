// ── Skin System — Source of Truth ────────────────────────────────────────────

export type SkinId = 'clasico' | 'neon' | 'retro';

export interface GamePalette {
  bg: string;
  bgAlt: string;
  primary: string;
  secondary: string;
  accent: string;
  thrust: string;
  text: string;
  textDim: string;
  grid: string;
  danger: string;
  blocks: string[];
}

// ── Base palettes ───────────────────────────────────────────────────────────

const BASE_PALETTES: Record<SkinId, GamePalette> = {
  clasico: {
    bg: '#000000',
    bgAlt: '#000000',
    primary: '#ffffff',
    secondary: '#ffffff',
    accent: '#00ffff',
    thrust: 'rgba(255,130,0,0.85)',
    text: '#ffffff',
    textDim: 'rgba(255,255,255,0.65)',
    grid: 'rgba(255,255,255,0.06)',
    danger: '#ff3333',
    blocks: [
      '#4dd0e1',
      '#ffd54f',
      '#ba68c8',
      '#81c784',
      '#e57373',
      '#90caf9',
      '#ffb74d',
      '#9e9e9e',
    ],
  },
  neon: {
    bg: '#050510',
    bgAlt: '#080818',
    primary: '#00f5ff',
    secondary: '#ff006e',
    accent: '#f5ff00',
    thrust: '#ff006e',
    text: '#e0e0ff',
    textDim: 'rgba(224,224,255,0.55)',
    grid: 'rgba(0,245,255,0.10)',
    danger: '#ff2060',
    blocks: [
      '#00d4ff',
      '#ff1493',
      '#39ff14',
      '#ff6600',
      '#8b00ff',
      '#7fff00',
      '#ff0040',
      '#e0e0ff',
    ],
  },
  retro: {
    bg: '#0c0800',
    bgAlt: '#100c04',
    primary: '#ffb347',
    secondary: '#33ff33',
    accent: '#d4a017',
    thrust: '#cc6600',
    text: '#d4c5a0',
    textDim: 'rgba(212,197,160,0.55)',
    grid: 'rgba(255,179,71,0.08)',
    danger: '#cc3300',
    blocks: [
      '#c1440e',
      '#c49102',
      '#6b8e23',
      '#8b4513',
      '#708238',
      '#c9b97a',
      '#b87333',
      '#6e7783',
    ],
  },
};

// ── Per-game overrides ──────────────────────────────────────────────────────

const GAME_OVERRIDES: Record<string, Partial<Record<SkinId, Partial<GamePalette>>>> = {
  snake: {
    clasico: {
      bg: '#1a3a1a',
      bgAlt: '#1e441e',
      primary: '#7fff00',
      secondary: '#3cb043',
    },
  },
};

// ── Palette resolver ────────────────────────────────────────────────────────

export function getGamePalette(skinId: SkinId, gameId?: string): GamePalette {
  const base = { ...BASE_PALETTES[skinId] };
  if (gameId && GAME_OVERRIDES[gameId]?.[skinId]) {
    Object.assign(base, GAME_OVERRIDES[gameId][skinId]);
  }
  return base;
}

// ── Color utilities ─────────────────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const match = hex.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]},${match[2]},${match[3]},${alpha.toFixed(2)})`;
    }
    return hex;
  }
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const SKIN_IDS: SkinId[] = ['clasico', 'neon', 'retro'];

export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: 'CLASICO',
  neon: 'NEON',
  retro: 'RETRO',
};

export const DEFAULT_SKIN: SkinId = 'clasico';
