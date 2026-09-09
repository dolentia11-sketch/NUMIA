'use strict';
// QA only: execute the pinned local reference, never source supplied by a caller.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
// Pin exact UTF-8 content with CRLF represented as LF, as Git stores it.
// No trimming, whitespace folding, or clinical-source rewriting is allowed.
const HASH = 'B78ADB9EBCE27AA7FB0100E9EDF72F9F00C704953E9AA7AE7C47EBC71F5BC120';
const bytes = fs.readFileSync(path.join(ROOT, 'reference', 'index.html'));
assert.equal(crypto.createHash('sha256').update(bytes.toString('utf8').replace(/\r\n/g, '\n')).digest('hex').toUpperCase(), HASH);
const html = bytes.toString('utf8');
function block(startAnchor, endAnchor) {
  const start = html.indexOf(startAnchor);
  const end = html.indexOf(endAnchor, start);
  assert.ok(start >= 0 && end > start, `Missing anchors: ${startAnchor}`);
  return html.slice(start, end);
}
const script = new vm.Script(`
  const STATE = {patients: input.patients, auxiliaries: input.auxiliaries,
                 assignments: input.assignments || {}, hasBalanced: false};
  function render() {}
  function toast() {}
  ${block('function scoreBarthel', 'function render()')}
  if ((input.action || 'balance') === 'balance') autoBalance({silent: true});
  JSON.stringify({
    assignments: STATE.assignments,
    metrics: getMetrics(),
    patient_scores: Object.fromEntries(STATE.patients.map(p => [String(p.id), patientScore(p)])),
    engine_version: 'parity-1',
    units: STATE.patients.map(p => careUnitsForPatient(p)),
    profiles: STATE.auxiliaries.map(a => auxiliaryProfile(a.weight)),
    eligibility: STATE.patients.map(p => STATE.auxiliaries.map(a => isEligible(p, a)))
  });
`, {filename: 'pinned-numia-reference.js'});

function evaluate(input) {
  // JSON copy separates data from executable source and isolates every turn.
  return JSON.parse(script.runInNewContext({input: structuredClone(input)}, {timeout: 10000}));
}

if (require.main === module) {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  process.stdout.write(JSON.stringify(input.map(evaluate)));
}
module.exports = {evaluate, HASH};
