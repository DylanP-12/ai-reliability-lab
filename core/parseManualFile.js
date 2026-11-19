// core/parseManualFile.js (pure: no fs, no process)

export function parseManualFilename(name) {
  const bad = () => new Error(`bad manual filename "${name}": expected <conversation_id>__<model_id>__r<NN>.txt`);
  if (!name.endsWith('.txt')) throw bad();
  const parts = name.slice(0, -4).split('__');
  if (parts.length !== 3) throw bad();
  const [conversationId, modelId, rep] = parts;
  const m = /^r(\d+)$/.exec(rep);
  if (!conversationId || !modelId || !m) throw bad();
  return { conversationId, modelId, repetition: Number(m[1]) };
}

export function splitResponses(rawText, fileName = 'file') {
  const lines = rawText.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const m = /^--- RESPONSE (\d+) ---$/.exec(line);
    if (m) {
      if (Number(m[1]) !== blocks.length + 1) {
        throw new Error(`${fileName}: expected RESPONSE ${blocks.length + 1}, found RESPONSE ${m[1]}`);
      }
      current = [];
      blocks.push(current);
    } else if (current) {
      current.push(line);
    } else if (line.trim() !== '') {
      throw new Error(`${fileName}: text before the first RESPONSE marker`);
    }
  }
  if (blocks.length === 0) throw new Error(`${fileName}: no RESPONSE blocks found`);
  return blocks.map((ls, i) => {
    // The file's final newline is a split artifact, not part of the last response.
    const isLast = i === blocks.length - 1;
    const kept = isLast && ls[ls.length - 1] === '' ? ls.slice(0, -1) : ls;
    const text = kept.join('\n');
    if (text.trim() === '') throw new Error(`${fileName}: RESPONSE ${i + 1} is blank`);
    return text;
  });
}