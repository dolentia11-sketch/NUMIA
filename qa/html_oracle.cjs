'use strict';
// QA only: execute the pinned local reference, never source supplied by a caller.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const HASH = '64423D796D467DD7ACB7784D522BBD5E45392BD6CE40BA80D3F714F3D0BC9BC6';
const bytes = fs.readFileSync(path.join(ROOT, 'reference', 'index.html'));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(), HASH);
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
