/**
 * Deterministic "torn/deckled paper" clip-path generator. Seeded (not Math.random) so the
 * edge is identical on every render and never causes layout or hydration churn.
 */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param seed      any integer; different seeds give different edges
 * @param depth     how far (in %) the tears bite into the sheet
 * @param steps     points per edge — more = finer fibres
 */
export function deckleClipPath(seed: number, depth = 1.4, steps = 28): string {
  const rand = mulberry32(seed);
  const jitter = () => (rand() * depth).toFixed(2);
  const pts: string[] = [];

  for (let i = 0; i <= steps; i++) pts.push(`${((i / steps) * 100).toFixed(2)}% ${jitter()}%`);
  for (let i = 1; i <= steps; i++) pts.push(`${(100 - Number(jitter())).toFixed(2)}% ${((i / steps) * 100).toFixed(2)}%`);
  for (let i = steps - 1; i >= 0; i--) pts.push(`${((i / steps) * 100).toFixed(2)}% ${(100 - Number(jitter())).toFixed(2)}%`);
  for (let i = steps - 1; i >= 1; i--) pts.push(`${jitter()}% ${((i / steps) * 100).toFixed(2)}%`);

  return `polygon(${pts.join(', ')})`;
}
