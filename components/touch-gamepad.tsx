'use client';

import { useCallback } from 'react';

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
};

function dispatchKey(type: 'keydown' | 'keyup', { code, key }: KeyDef) {
  window.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true }));
}

interface TouchGamepadProps {
  gameId: string;
}

export function TouchGamepad({ gameId }: TouchGamepadProps) {
  const mapping = GAMEPAD_MAPPINGS[gameId];

  const handleTouchStart = useCallback(
    (keyDef: KeyDef) => (e: React.TouchEvent) => {
      e.preventDefault();
      dispatchKey('keydown', keyDef);
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (keyDef: KeyDef) => (e: React.TouchEvent) => {
      e.preventDefault();
      dispatchKey('keyup', keyDef);
    },
    [],
  );

  const handlePause = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    dispatchKey('keydown', { code: 'KeyP', key: 'p' });
    dispatchKey('keyup', { code: 'KeyP', key: 'p' });
  }, []);

  if (!mapping) return null;

  return (
    <div className="touch-gamepad">
      <div className="gamepad-dpad">
        <button
          className="dpad-btn dpad-up"
          onTouchStart={handleTouchStart(mapping.dpad.up)}
          onTouchEnd={handleTouchEnd(mapping.dpad.up)}
          aria-label="Up"
        >
          ▲
        </button>
        <button
          className="dpad-btn dpad-left"
          onTouchStart={handleTouchStart(mapping.dpad.left)}
          onTouchEnd={handleTouchEnd(mapping.dpad.left)}
          aria-label="Left"
        >
          ◄
        </button>
        <div className="dpad-center" />
        <button
          className="dpad-btn dpad-right"
          onTouchStart={handleTouchStart(mapping.dpad.right)}
          onTouchEnd={handleTouchEnd(mapping.dpad.right)}
          aria-label="Right"
        >
          ►
        </button>
        <button
          className="dpad-btn dpad-down"
          onTouchStart={handleTouchStart(mapping.dpad.down)}
          onTouchEnd={handleTouchEnd(mapping.dpad.down)}
          aria-label="Down"
        >
          ▼
        </button>
      </div>

      <button className="gamepad-pause-btn" onTouchStart={handlePause} aria-label="Pause">
        PAUSE
      </button>

      <div className="gamepad-actions">
        {mapping.a && (
          <button
            className="action-btn action-a"
            onTouchStart={handleTouchStart(mapping.a)}
            onTouchEnd={handleTouchEnd(mapping.a)}
            aria-label={mapping.a.label}
          >
            {mapping.a.label}
          </button>
        )}
        {mapping.b && (
          <button
            className="action-btn action-b"
            onTouchStart={handleTouchStart(mapping.b)}
            onTouchEnd={handleTouchEnd(mapping.b)}
            aria-label={mapping.b.label}
          >
            {mapping.b.label}
          </button>
        )}
      </div>
    </div>
  );
}
