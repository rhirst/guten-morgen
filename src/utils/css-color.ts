/**
 * Convert modern CSS colors (oklch) to hex/rgba for older Android WebViews
 * that ignore oklch() and drop the entire background declaration.
 */

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function toGamma(c: number) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055
}

function oklchToRgb(L: number, C: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  return [
    Math.round(clamp01(toGamma(rLin)) * 255),
    Math.round(clamp01(toGamma(gLin)) * 255),
    Math.round(clamp01(toGamma(bLin)) * 255),
  ]
}

function formatRgb([r, g, b]: [number, number, number], alpha?: number) {
  if (alpha != null && alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`
}

const OKLCH_RE =
  /^oklch\(\s*([0-9.]+%?)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?\s*(?:\/\s*([0-9.]+%?))?\s*\)$/i

function parseOklchComponent(raw: string, isLightness: boolean): number {
  if (raw.endsWith("%")) {
    const pct = parseFloat(raw) / 100
    return isLightness ? pct : pct
  }
  return parseFloat(raw)
}

function parseAlpha(raw: string | undefined): number | undefined {
  if (raw == null) return undefined
  if (raw.endsWith("%")) return parseFloat(raw) / 100
  return parseFloat(raw)
}

/** Return hex/rgba when given oklch(); otherwise return the value unchanged. */
export function toCompatibleCssColor(value: string): string {
  const trimmed = value.trim()
  const match = OKLCH_RE.exec(trimmed)
  if (!match) return value

  const L = parseOklchComponent(match[1], true)
  const C = parseOklchComponent(match[2], false)
  const h = parseFloat(match[3])
  const alpha = parseAlpha(match[4])

  return formatRgb(oklchToRgb(L, C, h), alpha)
}
