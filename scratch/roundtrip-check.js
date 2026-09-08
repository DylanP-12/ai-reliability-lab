import { parseScenarios, serializeScenarios } from '../core/parseScenarios.js';

const csv = `conversation_id,turn_index,prompt_text,evaluation_note,category
C001,1,Hello there,SCORE,demo
`;

const scenarios = parseScenarios(csv);
console.log(serializeScenarios(scenarios));