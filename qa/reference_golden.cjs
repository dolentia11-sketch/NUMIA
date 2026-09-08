/* Verifies the immutable HTML reference before a Python engine exists. */
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const referencePath = path.join(root, 'reference', 'index.html');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'backend', 'tests', 'fixtures', 'golden_turn.json'), 'utf8'));
const raw = fs.readFileSync(referencePath, 'utf8');
const hash = crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
assert.equal(hash, fixture.reference_sha256, 'La referencia no coincide con la huella congelada.');

const start = raw.indexOf('function scoreBarthel');
const end = raw.indexOf('function render()');
assert.ok(start >= 0 && end > start, 'No se encontró el motor en la referencia.');
const engine = raw.slice(start, end);

function evaluate(turn) {
  const program = `
    const STATE = { patients: ${JSON.stringify(turn.patients)}, auxiliaries: ${JSON.stringify(turn.auxiliaries)}, assignments: {}, hasBalanced: false };
    const $ = () => ({ classList: { add() {}, remove() {} } });
    function toast() {}
    function render() {}
    ${engine}
    autoBalance({ silent: true });
    return { assignments: STATE.assignments, metrics: getMetrics(), scores: STATE.patients.map(patient => [patient.id, patientScore(patient).total, patientScore(patient).risk, careUnitsForPatient(patient)]) };
  `;
  return new Function(program)();
}

const sample = evaluate(fixture.sample_turn);
assert.deepEqual(sample.assignments, fixture.expected.assignments);
assert.deepEqual(Object.fromEntries(sample.scores.map(([id, total, risk, units]) => [id, [total, risk, units]])), fixture.expected.scores);
for (const [key, value] of Object.entries(fixture.expected.summary)) assert.equal(sample.metrics[key], value, `sample.${key}`);

const overload = evaluate(fixture.overload_turn);
assert.deepEqual(overload.assignments, fixture.overload_expected.assignments);
assert.equal(overload.metrics.loads.aux3.careUnits, fixture.overload_expected.care_units);
assert.equal(overload.metrics.loads.aux3.careCapacity, fixture.overload_expected.care_capacity);
assert.equal(overload.metrics.overloaded, fixture.overload_expected.overloaded);
assert.equal(overload.metrics.alerts, fixture.overload_expected.alerts);

console.log('MIG-000 reference golden: PASS');
