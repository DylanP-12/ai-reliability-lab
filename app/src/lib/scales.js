// L055: scale functions. Map a data domain onto a pixel range.
// Pure: no DOM, no React, so it can be tested in Node.
export function linearScale({ domain: [d0, d1], range: [r0, r1] }) {
  if (![d0, d1, r0, r1].every(Number.isFinite)) {
    throw new Error(`linearScale: non-numeric domain or range`);
  }
  if (d1 === d0) throw new Error(`linearScale: empty domain [${d0}, ${d1}]`);
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}