// core/buildJudgePacket.js
// Env-neutral: runs in score.js (Node), the Scoring screen and the human export (browser).
export function buildJudgePacket({ rubric, conversationRecord, turn_index, evaluation_note }) {
  // Piece 1: keep only the checkpoint turn
  const turns = conversationRecord.turns.filter(t => t.turn_index === turn_index);

  // Piece 2: two generic entries, read from named fields only
  const transcript = [];
  for (const t of turns) {
    transcript.push({ role: 'User', text: t.prompt_text });
    transcript.push({ role: 'Assistant', text: t.response_text });
  }

  // Piece 3: note rule
  const note = (evaluation_note || '').trim();
  const private_note = (note === '' || note === 'SCORE') ? null : note;

  // Piece 4: allowlist
  return { rubric, private_note, transcript, grade_turn_index: turn_index };
}