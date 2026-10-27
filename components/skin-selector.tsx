'use client';

import { memo } from 'react';
import type { SkinId } from '@/lib/games/skins';
import { SKIN_IDS, SKIN_LABELS } from '@/lib/games/skins';

const GLOW_COLORS: Record<SkinId, string> = {
  clasico: 'rgba(255,255,255,0.45)',
  neon: 'rgba(0,245,255,0.55)',
  retro: 'rgba(255,207,58,0.55)',
};

const ACTIVE_BORDER: Record<SkinId, string> = {
  clasico: 'rgba(255,255,255,0.6)',
  neon: '#00f5ff',
  retro: '#ffcf3a',
};

const ACTIVE_TEXT: Record<SkinId, string> = {
  clasico: '#ffffff',
  neon: '#00f5ff',
  retro: '#ffcf3a',
};

export const SkinSelector = memo(function SkinSelector({
  skin,
  onSkinChange,
}: {
  skin: SkinId;
  onSkinChange: (id: SkinId) => void;
}) {
  return (
    <div className="skin-selector">
      {SKIN_IDS.map((id) => {
        const active = id === skin;
        return (
          <button
            key={id}
            className={`skin-chip${active ? ' active' : ''}`}
            style={
              active
                ? {
                    color: ACTIVE_TEXT[id],
                    borderColor: ACTIVE_BORDER[id],
                    boxShadow: `0 0 10px ${GLOW_COLORS[id]}`,
                  }
                : undefined
            }
            onClick={() => onSkinChange(id)}
          >
            {SKIN_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
});
