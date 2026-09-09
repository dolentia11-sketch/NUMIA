'use strict';
// Uses an isolated agent-browser session and synthetic data only. No source edits.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {evaluate} = require('./html_oracle.cjs');
const root = path.resolve(__dirname, '..');
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'backend/tests/fixtures/golden_turn.json')));
const html = fs.readFileSync(path.join(root, 'reference', 'index.html'), 'utf8');
const executable = process.argv[2];
const session = process.argv[3] || 'numia-parity-final';
assert.ok(executable, 'Pass the agent-browser executable path and optional session.');
function block(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a);
  assert.ok(a >= 0 && b > a);
  return html.slice(a, b);
}
const referenceFunctions = [
  block('function scoreBarthel', 'function render()'),
  block('function auxiliaryRecommendation', 'function renderAuxiliaries'),
  block('function labelStatus', 'function renderBroncoControls'),
  block('function drawWrappedText', 'function canvasToJpegBytes'),
  block('function roundRect', 'function animateMatchfield'),
].join('\n');
const expected = evaluate(fixture.sample_turn);
const expression = `(async () => {
  const checks = [];
  function check(ok, message) { if (!ok) throw new Error(message); checks.push(message); }
  function same(a,b,message) {
    const canonical = v => v && typeof v === 'object' ? (Array.isArray(v) ? v.map(canonical) : Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]))) : v;
    check(JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)), message);
  }
  const fixture = ${JSON.stringify(fixture)};
  const expected = ${JSON.stringify(expected)};
  const originalConfirm = window.confirm, originalFetch = window.fetch;
  const originalFill = CanvasRenderingContext2D.prototype.fillText;
  const errors = [];
  const onError = e => errors.push(e.message);
  window.addEventListener('error', onError);
  window.confirm = () => true;
  try {
    setModalState('onboarding', false);
    clearData();
    check(document.querySelector('#kpi-balance').textContent === '0%', 'empty metrics are zero');
    openPatientModal();
    const fill = (id, value) => document.querySelector('#'+id).value = String(value);
    fill('p-name', 'Auditoria sintetica'); fill('p-weight', 70); fill('p-barthel', 50); fill('p-braden', 14);
    await updatePatientPreview();
    check(document.querySelector('#prev-score').textContent === '9', 'patient preview score=9');
    check(document.querySelector('#prev-aux').textContent === 'Tipo 2+', 'minimum auxiliary type restored');
    check(document.querySelector('#prev-explain').textContent.includes('3+2+1+3 = 9'), 'preview shows mathematical breakdown');
    await savePatient();
    check(STATE.patients.length === 1 && document.querySelector('#patient-modal').hidden, 'save patient closes modal');
    check(LAST_EVALUATION.metrics.unassigned === 1 && document.querySelector('#patient-list').textContent.includes('puntaje 9'), 'saved patient calculated and rendered');
    openAuxModal();
    check(document.querySelector('#a-id').value === 'aux1', 'next auxiliary identifier works');
    fill('a-name','Equipo sintetico'); fill('a-weight',75);
    await updateAuxPreview();
    check(document.querySelector('#prev-type').textContent === 'Tipo 3' && document.querySelector('#prev-cap10').textContent === '82.5', 'auxiliary preview matches monolith');
    await saveAux();
    check(STATE.auxiliaries.length === 1 && document.querySelector('#aux-modal').hidden, 'save auxiliary closes modal');
    check(await autoBalance(), 'balance adapter resolves successfully');
    same(STATE.assignments, {'101':'aux1'}, 'one patient assigned');
    await removePatient(101);
    check(LAST_EVALUATION.metrics.totalAssigned === 0, 'delete recalculates metrics');
    await removeAux('aux1');
    clearData();
    await finishOnboarding(true);
    same(STATE.assignments, expected.assignments, 'onboarding sample assignments match monolith');
    same(LAST_EVALUATION.metrics, expected.metrics, 'onboarding sample metrics match monolith');
    same(LAST_EVALUATION.patient_scores, expected.patient_scores, 'onboarding sample scores match monolith');
    const snapshot = structuredClone(STATE);
    function capture(fn) {
      const text = [];
      CanvasRenderingContext2D.prototype.fillText = function(value,x,y,...rest) {
        // The generation timestamp is the only volatile report field.
        text.push([y === 158 ? '<timestamp>' : String(value),x,y]);
        return originalFill.call(this,value,x,y,...rest);
      };
      try { const pages=fn(); return {text, pages:pages.length}; }
      finally { CanvasRenderingContext2D.prototype.fillText=originalFill; }
    }
    const actualPDF = capture(createReportPages);
    const referencePDF = (() => {
      const STATE = snapshot;
      function render() {} function toast() {}
      ${referenceFunctions}
      return capture(createReportPages);
    })();
    same(actualPDF, referencePDF, 'PDF text and numeric positions match monolith');
    const pdf = makePdfFromCanvases(createReportPages());
    check((await pdf.slice(0,5).text()) === '%PDF-', 'valid PDF generated');
    // Export must wait for the API before reading numerical report data.
    STATE.assignments={}; STATE.hasBalanced=false;
    const originalCreate=createReportPages, originalClick=HTMLAnchorElement.prototype.click;
    let reportRead=false;
    createReportPages = () => {
      same(STATE.assignments,expected.assignments,'export waits for balanced assignments');
      same(LAST_EVALUATION.metrics,expected.metrics,'export waits for balanced metrics');
      reportRead=true; return originalCreate();
    };
    HTMLAnchorElement.prototype.click=()=>{};
    try { await exportReportPdf(); check(reportRead,'export creates report after evaluation'); }
    finally { createReportPages=originalCreate; HTMLAnchorElement.prototype.click=originalClick; }
    // Prove out-of-order previews cannot replace a newer score.
    openPatientModal(); fill('p-weight',70); fill('p-barthel',50); fill('p-braden',14);
    window.fetch = async (url, options) => {
      const body=JSON.parse(options.body);
      if (body.patients?.[0]?.weight === 70) await new Promise(r=>setTimeout(r,160));
      return originalFetch(url,options);
    };
    const oldPreview=updatePatientPreview(); fill('p-weight',90);
    await updatePatientPreview(); await oldPreview;
    check(document.querySelector('#prev-score').textContent === '12', 'latest patient preview wins');
    // Simulated network failure must preserve the previous confirmed turn.
    fill('p-name','No guardar sin calcular');
    window.fetch = async () => { throw new TypeError('Synthetic offline test'); };
    await savePatient();
    check(STATE.patients.length === 8 && !document.querySelector('#patient-modal').hidden, 'failed save retains form and confirmed state');
    same(STATE.assignments, snapshot.assignments, 'failed save preserves assignments');
    window.fetch = originalFetch;
    const slowFetch=window.fetch;
    window.fetch=async(...args)=>{await new Promise(r=>setTimeout(r,100));return slowFetch(...args);};
    const retry=savePatient();
    clearData();
    await retry;
    check(STATE.patients.length === 9, 'clear cannot invalidate an in-flight save');
    check(document.querySelector('#patient-modal').hidden,'retry saves successfully');
    window.fetch=originalFetch;
    await removePatient(109);
    same(STATE.assignments, snapshot.assignments,'automatic rebalance after deletion matches monolith');
    closeModal('patient-modal');
    STATE.patients=structuredClone(fixture.overload_turn.patients);
    STATE.auxiliaries=structuredClone(fixture.overload_turn.auxiliaries);
    STATE.assignments={};
    check(await autoBalance({silent:true}), 'overload evaluation succeeds');
    check(LAST_EVALUATION.metrics.overloaded === 1, '18/17 overload alert preserved');
    clearData();
    check(document.querySelector('#kpi-risk').textContent === '0' && document.querySelector('#kpi-balance').textContent === '0%', 'clear resets stale metrics');
    same(errors, [], 'no browser runtime errors');
    return {passed:true, checks, pdfPages:actualPDF.pages};
  } finally {
    window.fetch=originalFetch; window.confirm=originalConfirm;
    CanvasRenderingContext2D.prototype.fillText=originalFill;
    window.removeEventListener('error',onError);
  }
})()`;
const output = execFileSync(executable, ['--session', session, 'eval', '--stdin'], {
  input: expression, encoding: 'utf8', timeout: 60000, maxBuffer: 1024*1024
});
console.log(output.trim());
const result = JSON.parse(output);
assert.equal(result.passed,true);
