export function mulberry32(seed) {
  let a = seed >>> 0;                      // normalize seed
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;            // advance state
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);  // scramble
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;   // map to [0, 1)
  };
}

export function shuffle(array, seed) {
  const out = [...array];
  const rand = mulberry32(seed);

  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
}
