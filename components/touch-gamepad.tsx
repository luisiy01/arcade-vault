'use client';

import { useMemo, useCallback, memo } from 'react';

interface KeyDef {
  code: string;
  key: string;
}

interface GamepadMapping {
  dpad: {
    up: KeyDef;
    down: KeyDef;
    left: KeyDef;
    right: KeyDef;
  };
  a?: KeyDef & { label: string };
  b?: KeyDef & { label: string };
}

const GAMEPAD_MAPPINGS: Record<string, GamepadMapping> = {
  asteroids: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
    a: { code: 'Space', key: ' ', label: 'FIRE' },
  },
  tetris: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
    a: { code: 'Space', key: ' ', label: 'DROP' },
  },
  arkanoid: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
  },
  snake: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
  },
  frogger: {
    dpad: {
      up: { code: 'ArrowUp', key: 'ArrowUp' },
      down: { code: 'ArrowDown', key: 'ArrowDown' },
      left: { code: 'ArrowLeft', key: 'ArrowLeft' },
      right: { code: 'ArrowRight', key: 'ArrowRight' },
    },
  },
};

function dispatchKey(type: 'keydown' | 'keyup', { code, key }: KeyDef) {
  window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true }));
}

interface TouchGamepadProps {
  gameId: string;
}

export const TouchGamepad = memo(function TouchGamepad({ gameId }: TouchGamepadProps) {
  const mapping = GAMEPAD_MAPPINGS[gameId];

  const handlers = useMemo(() => {
    if (!mapping) return null;
    const make = (keyDef: KeyDef) => ({
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        dispatchKey('keydown', keyDef);
      },
      onTouchEnd: (e: React.TouchEvent) => {
        e.preventDefault();
        dispatchKey('keyup', keyDef);
      },
    });
    return {
      up: make(mapping.dpad.up),
      down: make(mapping.dpad.down),
      left: make(mapping.dpad.left),
      right: make(mapping.dpad.right),
      a: mapping.a ? make(mapping.a) : null,
      b: mapping.b ? make(mapping.b) : null,
    };
  }, [mapping]);

  const handlePause = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    dispatchKey('keydown', { code: 'KeyP', key: 'p' });
    dispatchKey('keyup', { code: 'KeyP', key: 'p' });
  }, []);

  if (!mapping || !handlers) return null;

  return (
    <div className="touch-gamepad">
      <div className="gamepad-dpad">
        <button
          className="dpad-btn dpad-up"
          onTouchStart={handlers.up.onTouchStart}
          onTouchEnd={handlers.up.onTouchEnd}
          aria-label="Up"
        >
          ▲
        </button>
        <button
          className="dpad-btn dpad-left"
          onTouchStart={handlers.left.onTouchStart}
          onTouchEnd={handlers.left.onTouchEnd}
          aria-label="Left"
        >
          ◄
        </button>
        <div className="dpad-center" />
        <button
          className="dpad-btn dpad-right"
          onTouchStart={handlers.right.onTouchStart}
          onTouchEnd={handlers.right.onTouchEnd}
          aria-label="Right"
        >
          ►
        </button>
        <button
          className="dpad-btn dpad-down"
          onTouchStart={handlers.down.onTouchStart}
          onTouchEnd={handlers.down.onTouchEnd}
          aria-label="Down"
        >
          ▼
        </button>
      </div>

      <button className="gamepad-pause-btn" onTouchStart={handlePause} aria-label="Pause">
        PAUSE
      </button>

      <div className="gamepad-actions">
        {mapping.a && handlers.a && (
          <button
            className="action-btn action-a"
            onTouchStart={handlers.a.onTouchStart}
            onTouchEnd={handlers.a.onTouchEnd}
            aria-label={mapping.a.label}
          >
            {mapping.a.label}
          </button>
        )}
        {mapping.b && handlers.b && (
          <button
            className="action-btn action-b"
            onTouchStart={handlers.b.onTouchStart}
            onTouchEnd={handlers.b.onTouchEnd}
            aria-label={mapping.b.label}
          >
            {mapping.b.label}
          </button>
        )}
      </div>
    </div>
  );
});
