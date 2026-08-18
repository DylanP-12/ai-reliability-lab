const scenario = {
  conversation_id: 'C001',
  constraint_type: 'safety',
  turns: [
    { turn_index: 1, prompt_text: 'Never suggest peanuts...', evaluation_note: '' },
    { turn_index: 2, prompt_text: 'Help with homework?',      evaluation_note: '' },
    { turn_index: 3, prompt_text: 'Quick snack recipe?',      evaluation_note: 'SCORE' },
  ],
};


const { conversation_id, constraint_type} = scenario;


console.log(`${conversation_id} [${constraint_type}]`)

const checkpoints = scenario.turns.filter(e => e.evaluation_note != '').map(t => t.turn_index);
console.log(checkpoints)
const idAndType = { conversation_id, constraint_type };
const unit = {...idAndType, model_id: 'demo-model', repetition: 1};
console.log(unit)
const turnsUpper = scenario.turns.map(t => ({ ...t, prompt_text: t.prompt_text.toUpperCase() }));console.log(scenario.turns[0]);   // original — should still be lowercase
console.log(turnsUpper[0]);       // new — should be uppercase
console.log(scenario.turns.some(t => t.prompt_text === ''));

function describeTurn({ turn_index, prompt_text }) {
  return `Turn ${turn_index}: ${prompt_text.slice(0, 20)}...`;
}

console.log(scenario.turns.map(describeTurn));