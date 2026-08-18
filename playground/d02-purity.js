import { mean, clamp, weightedScore } from './labmath.js';



console.log(mean([1, 2, 3]));
console.log(clamp(15, 0, 10));
console.log(weightedScore([1, 2, 3], [0.5, 0.3, 0.2]));




// PURE — moved to labmath.js, imported below
// (import added once labmath.js exports it)

// IMPURE: condition 1 fails — same input (5) gives a different output each call, because it reads/mutates external state (total)
let total = 0;
function addToTotal(x) { total += x; return total; }

// IMPURE: fails both conditions — Date.now() changes each call, and it mutates the caller's record object directly
function stamp(record) { record.at = Date.now(); return record; }

// IMPURE: condition 1 fails — Math.random() means same arr can return a different element each call
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// PURE — returns a new object, timestamp passed in rather than read from the clock
// (real code: the caller supplies `at`, e.g. Date.now() called at the call site, not inside here)
function stamped(record, at) {
  return { ...record, at };
}

function makeCounter() {
  let n = 0;
  return () => ++n;
}

const a = makeCounter();
const b = makeCounter();

console.log(a());
console.log(a());
console.log(a());
console.log(b());