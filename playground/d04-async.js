const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log('A');
sleep(0).then(() => console.log('B'));
console.log('C');

async function fakeModelCall(prompt) {
  await sleep(300 + Math.random() * 400);
  const roll = Math.random();
  if (roll < 0.15) { const e = new Error('rate limited'); e.status = 429; throw e; }
  if (roll < 0.25) { const e = new Error('server error'); e.status = 503; throw e; }
  return { text: `echo: ${prompt}`, latency_hint: 'fake' };
}

const prompts = ['t1', 't2', 't3', 't4', 't5'];

const start = Date.now();

for (const prompt of prompts) {        // loop starts
  try {                                 // ← try starts HERE, inside the loop
    const result = await fakeModelCall(prompt);
    console.log(result.text);
  } catch (err) {                       // ← catch immediately follows try's closing brace
    console.log('failed:', err.message);
  }                                      // ← catch ends HERE
  await sleep(200);                     // spacing between calls
}                                        // loop ends

const elapsed = Date.now() - start;
console.log(`batch took ${elapsed}ms`);

const res = await fetch('https://api.github.com/zen');
console.log(res.status, res.ok);
console.log(await res.text());


const res2 = await fetch('https://api.github.com/definitely-not-real');
console.log(res2.status, res2.ok);

// fetch does not throw on 404/500 - it only throws on network failure. checking res.ok/status is my job.