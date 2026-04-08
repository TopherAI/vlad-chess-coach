const fs = require('fs');
const path = require('path');

const issueTitle = process.env.ISSUE_TITLE || '';
const issueBody = process.env.ISSUE_BODY || '';
const issueNumber = process.env.ISSUE_NUMBER || '?';

const today = new Date().toISOString().split('T')[0];

const sessionMatch = issueTitle.match(/\[SESSION\]\s*(.*)/);
const sessionTitle = sessionMatch ? sessionMatch[1].trim() : `Session update ${today}`;

const newEntry = `\n## ${sessionTitle} — ${today}\n\n${issueBody}\n\n---\n`;

const logPath = path.join(process.cwd(), 'SESSION-LOG.md');
let existing = '';
if (fs.existsSync(logPath)) {
  existing = fs.readFileSync(logPath, 'utf8');
} else {
  existing = '# SESSION LOG — vlad-chess-coach\n\n';
}

const lines = existing.split('\n');
const titleLine = lines[0];
const rest = lines.slice(1).join('\n');

const updated = `${titleLine}\n${newEntry}${rest}`;

fs.writeFileSync(logPath, updated, 'utf8');

console.log(`Session log updated: ${sessionTitle}`);
