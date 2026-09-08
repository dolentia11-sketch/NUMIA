'use strict';
// Read the existing app's PDF generator from our isolated QA browser session.
// Does not modify HTML or reimplement/reformat the PDF.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const executable = process.argv[2];
assert.ok(executable && fs.existsSync(executable), 'Pass the absolute agent-browser executable path.');
const expression = `(async () => {
  if (STATE.patients.length !== 8 || STATE.auxiliaries.length !== 5 || getMetrics().balance !== 100)
    throw new Error('Load and balance the eight-patient sample before capturing PDF evidence.');
  const pages = createReportPages();
  const blob = makePdfFromCanvases(pages);
  const encoded = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
  return {pages: pages.length, encoded};
})()`;
const stdout = execFileSync(executable, [
  '--session', 'numia-audit-20260908', 'eval', '-b', Buffer.from(expression).toString('base64'),
], {encoding: 'utf8', timeout: 60000, maxBuffer: 10 * 1024 * 1024});
const result = JSON.parse(stdout);
const bytes = Buffer.from(result.encoded, 'base64');
assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-');
const output = path.resolve(__dirname, '..', 'plan paso a paso numia', 'evidence', 'AUDIT-100_sample.pdf');
fs.writeFileSync(output, bytes);
console.log(JSON.stringify({output, pages: result.pages, bytes: bytes.length}));
