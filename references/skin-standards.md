# Skin Standards — Arcade Vault

## Overview

Todos los juegos deben soportar 3 skins que funcionen sobre fondos oscuros:

| Skin                  | Filosofia                                        | Background      |
| --------------------- | ------------------------------------------------ | --------------- |
| **clasico** (default) | Colores originales del juego preservados exactos | Oscuro original |
| **neon**              | Colores electricos vibrantes, alto contraste     | `#050510`       |
| **retro**             | Colores calidos/muted estilo CRT de los 80s      | `#0c0800`       |

---

## Paleta base — Clasico

Preserva colores hardcodeados actuales de cada juego.

| Campo     | Valor                                                                                  |
| --------- | -------------------------------------------------------------------------------------- |
| bg        | `#000000`                                                                              |
| bgAlt     | `#000000`                                                                              |
| primary   | `#ffffff`                                                                              |
| secondary | `#ffffff`                                                                              |
| accent    | `#00ffff`                                                                              |
| thrust    | `rgba(255, 130, 0, 0.85)`                                                              |
| text      | `#ffffff`                                                                              |
| textDim   | `rgba(255,255,255,0.65)`                                                               |
| grid      | `rgba(255,255,255,0.06)`                                                               |
| danger    | `#ff3333`                                                                              |
| blocks    | `#4dd0e1`, `#ffd54f`, `#ba68c8`, `#81c784`, `#e57373`, `#90caf9`, `#ffb74d`, `#9e9e9e` |

## Paleta base — Neon

| Campo     | Valor                          |
| --------- | ------------------------------ |
| bg        | `#050510`                      |
| bgAlt     | `#080818`                      |
| primary   | `#00f5ff`                      |
| secondary | `#ff006e`                      |
| accent    | `#f5ff00`                      |
| thrust    | `#ff006e`                      |
| text      | `#e0e0ff`                      |
| textDim   | `rgba(224,224,255,0.55)`       |
| grid      | `rgba(0,245,255,0.10)`         |
| danger    | `#ff2060`                      |
| blocks    | TBD — 8 colores neon vibrantes |

## Paleta base — Retro

| Campo     | Valor                         |
| --------- | ----------------------------- |
| bg        | `#0c0800`                     |
| bgAlt     | `#100c04`                     |
| primary   | `#ffb347`                     |
| secondary | `#33ff33`                     |
| accent    | `#d4a017`                     |
| thrust    | `#cc6600`                     |
| text      | `#d4c5a0`                     |
| textDim   | `rgba(212,197,160,0.55)`      |
| grid      | `rgba(255,179,71,0.08)`       |
| danger    | `#cc3300`                     |
| blocks    | TBD — 8 colores calidos muted |

---

## Overrides per-game — Clasico

| Juego | Campo     | Valor     | Razon                     |
| ----- | --------- | --------- | ------------------------- |
| snake | bg        | `#1a3a1a` | Checkerboard verde oscuro |
| snake | bgAlt     | `#1e441e` | Checkerboard verde claro  |
| snake | primary   | `#7fff00` | Cabeza serpiente          |
| snake | secondary | `#3cb043` | Cuerpo serpiente          |

---

## Notas especiales

### Arkanoid — Dual rendering

- **clasico**: sprites desde spritesheet (`/games/arkanoid/arkanoid.png`)
- **neon/retro**: rendering procedural con rectangulos coloreados
- Requiere `skinId` en Options para decidir modo de renderizado

---

## Compliance tracking

| Juego     | Infraestructura | clasico   | neon      | retro     | Wrapper   | Estado       |
| --------- | --------------- | --------- | --------- | --------- | --------- | ------------ |
| asteroids | OK              | OK        | OK        | OK        | OK        | Compliant    |
| tetris    | Pendiente       | Pendiente | Pendiente | Pendiente | Pendiente | No compliant |
| arkanoid  | Pendiente       | Pendiente | Pendiente | Pendiente | Pendiente | No compliant |
| snake     | Pendiente       | Pendiente | Pendiente | Pendiente | Pendiente | No compliant |

---

## Checklist de auditoria

Para marcar un juego como compliant:

- [ ] Engine acepta `palette?` y `skinId?` en Options
- [ ] Cero hex/rgb/hsl hardcodeados en funciones de draw
- [ ] Clasico = output identico a pre-skin
- [ ] Neon = colores vibrantes con contraste en fondo oscuro
- [ ] Retro = colores calidos con feel CRT
- [ ] Background oscuro (luminance < 20%)
- [ ] Texto legible contra background
- [ ] Wrapper pasa `skinId` al engine
- [ ] `skinId` en dependency array de useEffect
