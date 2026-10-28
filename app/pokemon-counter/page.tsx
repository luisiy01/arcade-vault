'use client';

import { useState } from 'react';

const MAX_POKEMON = 1025;
const toId = (n: number) => ((n - 1) % MAX_POKEMON) + 1;

interface Pokemon {
  name: string;
  sprite: string;
}

async function fetchPokemon(id: number): Promise<Pokemon> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  if (!res.ok) throw new Error('fetch failed');
  const data = await res.json();
  return {
    name: data.name,
    sprite:
      data.sprites.other?.['official-artwork']?.front_default || data.sprites.front_default || '',
  };
}

export default function PokemonCounterPage() {
  const [count, setCount] = useState(0);
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(false);

  async function increment() {
    const next = count + 1;
    setCount(next);
    setLoading(true);
    try {
      setPokemon(await fetchPokemon(toId(next)));
    } catch {
      setPokemon({ name: `#${toId(next)}`, sprite: '' });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setCount(0);
    setPokemon(null);
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8 text-center">
      <h1 className="font-pixel text-[clamp(1rem,4vw,1.5rem)] text-magenta [text-shadow:0_0_20px_rgba(255,0,110,0.4)]">
        Pokémon Counter
      </h1>

      <div className="font-pixel text-[clamp(3rem,12vw,6rem)] text-cyan leading-none select-none tabular-nums [text-shadow:0_0_30px_rgba(0,245,255,0.5)]">
        {count}
      </div>

      <div
        className="w-[min(280px,70vw)] aspect-square bg-bg-2 rounded-2xl flex items-center justify-center overflow-hidden transition-colors"
        style={{ border: `3px solid var(--${count > 0 ? 'magenta' : 'line'})` }}
      >
        {!pokemon ? (
          <span className="text-ink-faint text-sm">Click para ver un Pokémon</span>
        ) : pokemon.sprite ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            className="w-4/5 h-4/5 object-contain transition-opacity"
            style={{ opacity: loading ? 0.3 : 1 }}
          />
        ) : (
          <span className="text-ink-dim font-pixel text-xs">{loading ? 'Cargando...' : '???'}</span>
        )}
      </div>

      {pokemon && count > 0 && (
        <div className="font-pixel text-[clamp(0.65rem,2.5vw,0.9rem)] capitalize">
          {pokemon.name} <span className="text-sm text-ink-faint">#{toId(count)}</span>
        </div>
      )}

      <button
        onClick={increment}
        className="font-pixel text-[clamp(0.7rem,2.5vw,1rem)] bg-magenta text-white border-none py-4 px-10 rounded-full cursor-pointer shadow-[0_4px_20px_rgba(255,0,110,0.4)] hover:scale-105 active:scale-95 transition-transform"
      >
        ¡Atrapar!
      </button>

      <button
        onClick={reset}
        className="font-mono text-xs bg-transparent text-ink-faint border border-line py-1.5 px-4 rounded-md cursor-pointer hover:text-ink hover:border-ink-faint transition-colors"
      >
        Reset
      </button>

      <p className="text-xs text-ink-faint">Hay 1025 Pokémon. ¿Cuántos puedes ver?</p>
    </div>
  );
}
