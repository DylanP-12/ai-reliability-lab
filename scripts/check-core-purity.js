import fs from 'node:fs';
import path from 'node:path';

const CORE_DIR = 'core';
const BANNED_PATTERNS = [
  { pattern: /require\(/, label: 'require(' },
  { pattern: /from\s+['"](node:)?fs['"]/, label: "import from 'fs'" },
  { pattern: /from\s+['"](node:)?path['"]/, label: "import from 'path'" },
  { pattern: /from\s+['"](node:)?process['"]/, label: "import from 'process'" },
  { pattern: /from\s+['"](node:)?os['"]/, label: "import from 'os'" },
  { pattern: /from\s+['"](node:)?child_process['"]/, label: "import from 'child_process'" },
];
const files = fs.readdirSync(CORE_DIR);
let violationFound = false;

for (const filename of files) {
  const filePath = path.join(CORE_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');

  for (const { pattern, label } of BANNED_PATTERNS) {
    if (pattern.test(content)) {
      console.log(`❌ ${filePath}: forbidden — ${label}`);
      violationFound = true;
    }
  }
}

if (violationFound) {
  console.log('Core purity check failed.');
  process.exit(1);
} else {
  console.log('✅ Core purity check passed — no Node-only imports found.');
  process.exit(0);
}