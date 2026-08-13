const key = process.env.OPENROUTER_API_KEY;

if (!key) {
  console.log('No key found. Did you run with --env-file=.env ?');
} else {
  console.log(`Key loaded. Length: ${key.length}. First 4 chars: ${key.slice(0, 4)}...`);
}