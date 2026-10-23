'use client';

import { useState, useCallback, useEffect } from 'react';
import type { SkinId } from '@/lib/games/skins';
import { DEFAULT_SKIN, SKIN_IDS } from '@/lib/games/skins';

const STORAGE_KEY = 'arcade-vault-skin';

function readSkin(): SkinId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SKIN_IDS.includes(stored as SkinId)) {
      return stored as SkinId;
    }
  } catch {
    /* localStorage may be unavailable */
  }
  return DEFAULT_SKIN;
}

export function useSkin(): [SkinId, (id: SkinId) => void] {
  const [skin, setSkinState] = useState<SkinId>(DEFAULT_SKIN);

  useEffect(() => {
    setSkinState(readSkin());
  }, []);

  const setSkin = useCallback((id: SkinId) => {
    setSkinState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* localStorage may be unavailable */
    }
  }, []);

  return [skin, setSkin];
}
