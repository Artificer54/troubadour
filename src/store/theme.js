// ── Color helpers ──────────────────────────────────────────────
export function hexToSpacedRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r} ${g} ${b}`
}

export function rgbArrayToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
}

// ── Environment palette (cycled when creating new environments) ─
export const ENV_COLORS = [
  '#7c9885', // sage green
  '#7b8fa1', // slate blue
  '#a18f6f', // warm sand
  '#9b7ea1', // dusty purple
  '#7a9e9f', // teal
  '#a17a7a', // muted rose
  '#8f9e7a', // olive
  '#7a8fa1', // steel blue
]

// ── Intensity colors ───────────────────────────────────────────
export const DEFAULT_INTENSITY_COLORS = ['#60a5fa', '#facc15', '#fb923c', '#f87171', '#c084fc']

export function applyIntensityColors(colors) {
  if (typeof document === 'undefined') return
  let el = document.getElementById('troubadour-intensity-css')
  if (!el) {
    el = document.createElement('style')
    el.id = 'troubadour-intensity-css'
    document.head.appendChild(el)
  }
  const toRgba = (hex, a) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  el.textContent = colors.map((hex, i) => `
    .intensity-${i} { color: ${hex} !important; border-color: ${hex} !important; }
    .intensity-${i}-glow { box-shadow: 0 0 14px 3px ${toRgba(hex, 0.55)} !important; }
    .intensity-${i}-ring { box-shadow: 0 0 0 2px ${hex} !important; }
    .intensity-${i}-bg-dot { background: ${hex} !important; }
  `).join('\n')
}

// ── Theme ──────────────────────────────────────────────────────
export const DEFAULT_CUSTOM_COLORS = {
  accent:   '#d4af37',
  ember:    '#c0392b',
  darkbg:   '#111827',
  midnight: '#0d0d1a',
  panel:    '#1a1f2e',
  border:   '#2d3348',
}

export const PRESET_THEMES = {
  darkfantasy: { label: 'Dark Fantasy' },
  arcane:      { label: 'Arcane' },
  battlefield: { label: 'Battlefield' },
  celestial:   { label: 'Celestial' },
  bloodmoon:   { label: 'Blood Moon' },
  deepsea:     { label: 'Deep Sea' },
  sunset:      { label: 'Sunset' },
  neonvoid:    { label: 'Neon Void' },
}

export const THEMES = PRESET_THEMES

const THEME_VARS = {
  darkfantasy: { accent:'212 175 55', darkbg:'17 24 39', midnight:'13 13 26', panel:'26 31 46', border:'45 51 72', ember:'192 57 43' },
  arcane:      { accent:'168 85 247', darkbg:'13 8 24',  midnight:'10 5 20',  panel:'22 13 38', border:'42 29 69', ember:'124 58 237' },
  battlefield: { accent:'132 204 22', darkbg:'15 26 10', midnight:'9 15 5',   panel:'20 31 14', border:'37 48 22', ember:'180 83 9' },
  celestial:   { accent:'147 197 253',darkbg:'10 15 30', midnight:'6 11 24',  panel:'15 22 40', border:'30 45 74', ember:'96 165 250' },
  bloodmoon:   { accent:'220 38 38',  darkbg:'18 5 5',   midnight:'12 3 3',   panel:'28 8 8',   border:'65 18 18', ember:'249 115 22' },
  deepsea:     { accent:'34 211 238', darkbg:'5 18 22',  midnight:'3 12 15',  panel:'8 28 36',  border:'15 55 70', ember:'52 211 153' },
  sunset:      { accent:'251 146 60', darkbg:'20 10 5',  midnight:'14 7 3',   panel:'30 15 8',  border:'70 35 15', ember:'239 68 68' },
  neonvoid:    { accent:'0 255 200',  darkbg:'4 4 8',    midnight:'2 2 5',    panel:'8 8 14',   border:'22 22 38', ember:'180 0 255' },
}

// Apply stored intensity colors at module load so they're ready before first paint
if (typeof window !== 'undefined') {
  try {
    const stored = JSON.parse(localStorage.getItem('troubadour-intensity-colors') ?? 'null')
    if (stored) applyIntensityColors(stored)
  } catch {}
}

export function applyTheme(name, customOverride) {
  const root = document.documentElement
  root.setAttribute('data-theme', name)

  if (name !== 'custom') {
    const vars = THEME_VARS[name] ?? THEME_VARS.darkfantasy
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(`--color-${k}`, v))
  } else {
    const colors = customOverride ?? DEFAULT_CUSTOM_COLORS
    Object.entries(colors).forEach(([k, hex]) => root.style.setProperty(`--color-${k}`, hexToSpacedRgb(hex)))
  }
}
