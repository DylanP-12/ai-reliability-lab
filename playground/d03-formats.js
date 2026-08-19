const turnRecord = {
  turn_index: 0,
  prompt_text: "",
  response_text: "",
     usage : {
        tokenCounts: ""
    },
request_ts: new Date().toISOString()
}

const pretty = JSON.stringify(turnRecord, null, 5);
console.log(pretty);

const parsed = JSON.parse(pretty);
console.log(parsed.usage.tokenCounts === turnRecord.usage.tokenCounts);

const dateTest = { at: new Date() };
console.log(typeof dateTest.at);

const dateTestParsed = JSON.parse(JSON.stringify(dateTest));
console.log(typeof dateTestParsed.at);
console.log(dateTestParsed.at);

// Finding: JSON.stringify silently converts Date → ISO string.
// JSON.parse does NOT convert it back — it stays a string.
// That's why we store timestamps as strings from the start (request_ts).
const records = [
  { turn_index: 0, prompt_text: "I played soccer today", response_text: "thats great" },
  { turn_index: 1, prompt_text: "what is 5+5", response_text: "10" },
  { turn_index: 2, prompt_text: "when does school start", response_text: "around september" },
];



const jsonlText = records.map(r => JSON.stringify(r)).join('\n') + '\n';
console.log(jsonlText);

const parsedRecords = jsonlText.split('\n').filter(line => line.trim() !== '')
                                .map(line => JSON.parse(line));

console.log(records.length, '→', parsedRecords.length);

const record4 = { turn_index: 3, prompt_text: "hi", response_text: "how are you" };
const appendedJsonl = jsonlText + JSON.stringify(record4) + '\n';
console.log(appendedJsonl)

// With JSONL, appending record 4 only costs the size of one record.
// With a JSON array, appending would cost the size of the whole file,
// because you'd have to reload, reparse, and rewrite everything.

// --- CSV traps (hand-parsed, no code) ---

// Row 1: C001,1,"Never suggest peanuts, ever",,safety
// Fields: C001 | 1 | Never suggest peanuts, ever | (empty) | safety
// Trap: comma inside quotes is part of the data, not a separator

// Row 2: C002,2,"This is a
// multi-line prompt",,tone
// Fields: C002 | 2 | This is a\nmulti-line prompt | (empty) | tone
// Trap: newline inside quotes is part of the data — can't split by newline first

// Row 3: C003,3,"she said ""stop""",,safety
// Fields: C003 | 3 | she said "stop" | (empty) | safety
// Trap: doubled "" inside quotes collapses to one literal " character


// --- Format-to-file map ---
// scenarios.csv              → CSV   → researchers author scenarios in a spreadsheet
// responses.jsonl            → JSONL → appended one record at a time as the Lab runs; crash-safe
// evaluations.jsonl          → JSONL → same reason — appended one eval record at a time
// config/models.json         → JSON  → a human edits it directly, so it's pretty-printed/readable
// app/public/data/index.json → JSON  → browser parses it natively at startup, no CSV traps