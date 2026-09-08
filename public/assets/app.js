
    const STATE = {
      patients: [],
      auxiliaries: [],
      assignments: {},
      nextPatientId: 101,
      formBroncoFlags: [false, false, false, false, false],
      hasBalanced: false,
    };

    const ONBOARDING_STATE = {
      consent: { c1: false, c2: false },
      acceptedAt: null,
    };

    const BRONCO_ITEMS = [
      {
        title: "¿Tiene alteración del nivel de conciencia o deterioro neurológico?",
        hint: "Glasgow < 15, sedación, demencia avanzada o ECV.",
        icon: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
      },
      {
        title: "¿Presenta disfagia, tos o voz húmeda al deglutir?",
        hint: "Episodios previos de atragantamiento o aspiración.",
        icon: '<path d="M3 12a9 9 0 0 1 18 0"/><path d="M12 3v9l4 2"/>',
      },
      {
        title: "¿Usa sonda nasogástrica, traqueostomía o vía aérea artificial?",
        hint: "Nutrición enteral, intubación reciente o traqueostomía.",
        icon: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6v6H9z"/>',
      },
      {
        title: "¿Edad > 65 años o postoperatorio de cabeza, cuello o digestivo?",
        hint: "Cirugía mayor reciente o ERGE conocido.",
        icon: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
      },
      {
        title: "¿Movilidad reducida o no puede mantener cabecera > 30°?",
        hint: "Encamamiento o restricción de decúbito.",
        icon: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>',
      },
    ];

    const SAMPLE_PATIENTS = [
      { id: 101, name: "Sofía Ramírez", weight: 67, barthel: 96, braden: 22, broncoFlags: [false, false, false, false, false] },
      { id: 102, name: "Valentina López", weight: 42, barthel: 83, braden: 21, broncoFlags: [false, false, false, false, false] },
      { id: 103, name: "Isabella Mora", weight: 51, barthel: 88, braden: 21, broncoFlags: [false, false, false, false, false] },
      { id: 104, name: "Camila Torres", weight: 71, barthel: 90, braden: 23, broncoFlags: [false, false, false, false, false] },
      { id: 105, name: "Daniela Vargas", weight: 69, barthel: 35, braden: 14, broncoFlags: [true, true, false, false, false] },
      { id: 106, name: "Lucía Herrera", weight: 88, barthel: 18, braden: 11, broncoFlags: [true, true, true, true, true] },
      { id: 107, name: "Mariana Ríos", weight: 67, barthel: 87, braden: 16, broncoFlags: [false, false, false, false, false] },
      { id: 108, name: "Andrea Gómez", weight: 72, barthel: 78, braden: 21, broncoFlags: [false, false, false, true, false] },
    ];

    const SAMPLE_AUX = [
      { id: "aux1", name: "Jorge Salazar", weight: 70 },
      { id: "aux2", name: "Sebastián Niño", weight: 50 },
      { id: "aux3", name: "Lorena Cárdenas", weight: 85 },
      { id: "aux4", name: "Karen Tovar", weight: 73 },
      { id: "aux5", name: "Juan Mora", weight: 94 },
    ];

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char]);
    }


const API_BASE = "/api/v1";
let LAST_EVALUATION = {
    assignments: {},
    metrics: { loads: {}, unassigned: 0, overloaded: 0 },
    patient_scores: {},
    auxiliary_profiles: {},
    auxiliary_recommendations: {}
};

async function fetchEvaluation(action) {
  const response = await fetch(`${API_BASE}/turn/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patients: STATE.patients,
      auxiliaries: STATE.auxiliaries,
      assignments: STATE.assignments,
      action: action
    })
  });
  if (!response.ok) throw new Error('API Error');
  return await response.json();
}

async function previewTurn() {
  const pWeight = parseFloat(document.querySelector('#p-weight')?.value);
  const patient = {
    id: STATE.nextPatientId,
    name: document.querySelector('#p-name')?.value || 'Borrador',
    weight: isNaN(pWeight) ? null : pWeight,
    barthel: parseInt(document.querySelector('#p-barthel')?.value),
    braden: parseInt(document.querySelector('#p-braden')?.value),
    broncoFlags: STATE.formBroncoFlags
  };
  const aWeight = parseFloat(document.querySelector('#a-weight')?.value);
  const aux = {
    id: document.querySelector('#a-id')?.value || 'temp',
    name: document.querySelector('#a-name')?.value || 'Borrador',
    weight: isNaN(aWeight) ? null : aWeight
  };
  
  const response = await fetch(`${API_BASE}/turn/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patients: [patient],
      auxiliaries: [aux]
    })
  });
  if (!response.ok) {
    if (response.status === 422) {
      const err = await response.json();
      console.warn("Validation error in preview", err);
    }
    throw new Error('Preview Error');
  }
  return await response.json();
}

async function runEvaluate(action = 'metrics', silent = false) {
  try {
    if (action === 'balance') {
      const progressBar = document.querySelector("#progress-bar");
      if (progressBar) progressBar.classList.add("active");
    }
    
    const result = await fetchEvaluation(action);
    if (action === 'balance') {
      STATE.assignments = result.assignments || {};
      STATE.hasBalanced = true;
    }
    LAST_EVALUATION = result;
    render();
    
    if (action === 'balance' && !silent) {
      toast("Balanceo completado", "Turno asignado de forma óptima.", "success");
    }
  } catch(e) {
    console.error(e);
    toast("Error", "Fallo de conexión con el servidor (ver consola).", "warn");
  } finally {
    const progressBar = document.querySelector("#progress-bar");
    if (progressBar) progressBar.classList.remove("active");
  }
}


    function render() {
      const metrics = LAST_EVALUATION.metrics || { unassigned: 0, overloaded: 0, loads: {} };

      $("#kpi-patients").textContent = STATE.patients.length;
      const patientTrend = $("#kpi-patients-trend");
      if (STATE.patients.length === 0) {
        patientTrend.textContent = "sin datos";
        patientTrend.className = "kpi-pip pip-neutral";
      } else {
        patientTrend.textContent = metrics.unassigned > 0 ? `${metrics.unassigned} sin asignar` : "todos asignados";
        patientTrend.className = `kpi-pip ${metrics.unassigned > 0 ? "pip-bad" : "pip-good"}`;
      }

      $("#kpi-aux").textContent = STATE.auxiliaries.length;
      const free = Object.values(metrics.loads).filter(load => load.status === "libre").length;
      $("#kpi-aux-trend").textContent = `${free} disponibles`;
      $("#kpi-balance").textContent = `${metrics.balance}%`;
      $("#kpi-balance-meta").textContent = STATE.patients.length === 0 ? "sin datos" : metrics.balance === 100 ? (metrics.overloaded > 0 ? "cobertura total con alerta" : "distribución óptima") : "balanceo requerido";
      $("#kpi-risk").textContent = metrics.alerts;
      const riskTrend = $("#kpi-risk-trend");
      if (metrics.alerts > 0) {
        riskTrend.textContent = metrics.overloaded > 0 ? "sobrecarga activa" : `${metrics.unassigned} sin asignar`;
        riskTrend.className = "kpi-pip pip-bad";
      } else if (metrics.full > 0) {
        riskTrend.textContent = `${metrics.full} al límite`;
        riskTrend.className = "kpi-pip pip-neutral";
      } else {
        riskTrend.textContent = "sin alertas";
        riskTrend.className = "kpi-pip pip-good";
      }

      renderPatients();
      renderAuxiliaries(metrics);

      const summaryEl = $("#matchfield-a11y-summary");
      if (summaryEl) {
        if (STATE.patients.length === 0) {
          summaryEl.textContent = "Campo de coincidencia vacío, sin pacientes registrados.";
        } else {
          let txt = `Visualización de asignaciones: ${STATE.patients.length} pacientes y ${STATE.auxiliaries.length} auxiliares. `;
          txt += `${metrics.unassigned > 0 ? metrics.unassigned + ' pacientes sin asignar' : 'Todos los pacientes asignados'}. `;
          if (metrics.overloaded > 0) {
            txt += `${metrics.overloaded} alertas de sobrecarga de capacidad detectadas. `;
          } else {
            txt += "Sin alertas de capacidad.";
          }
          summaryEl.textContent = txt;
        }
      }

      rebuildMatchfieldNodes();
    }

    function renderPatients() {
      $("#patient-count").textContent = STATE.patients.length;
      const list = $("#patient-list");
      if (STATE.patients.length === 0) {
        list.innerHTML = `
          <div class="empty">
            <div class="empty-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4v16M22 4v16M2 8h20M2 16h20M6 12h12"/></svg></div>
            <div class="empty-title">Sin pacientes</div>
            <div class="empty-msg" style="margin-bottom:1rem">Registra el primer paciente para comenzar.</div>
            <button class="btn btn-tinted" type="button" onclick="openPatientModal()">Añadir paciente</button>
          </div>`;
        return;
      }

      list.innerHTML = STATE.patients.map(patient => {
        const score = LAST_EVALUATION.patient_scores[patient.id] || { risk: "INCOMPLETO", total: "-" };
        const auxiliaryId = STATE.assignments[patient.id];
        const auxiliary = auxiliaryId ? STATE.auxiliaries.find(item => item.id === auxiliaryId) : null;
        const riskClass = score.risk === "SEVERO" ? "severe" : score.risk === "MODERADO" ? "moderate" : score.risk === "LEVE" ? "mild" : "out";
        const broncoCount = (patient.broncoFlags || []).filter(Boolean).length;
        const broncoTag = broncoCount >= 3 ? `<span class="tag tag-bronco">EED ${broncoCount}/5</span>` : "";

        return `
          <div class="data-row risk-${riskClass}">
            <div class="row-marker">${escapeHtml(patient.id)}</div>
            <div class="row-content">
              <div class="row-title">${escapeHtml(patient.name)}</div>
              <div class="row-meta">
                <span class="mono">${escapeHtml(patient.weight)} kg</span>
                <span class="meta-dot"></span>
                <span class="mono">puntaje ${score.total ?? "—"}</span>
                <span class="meta-dot"></span>
                <span class="tag tag-${riskClass}">${score.risk}</span>
                ${broncoTag}
              </div>
            </div>
            <div class="row-action">
              ${auxiliary ? `<span class="row-link">${escapeHtml(auxiliary.name.split(" ")[0])}</span>` : `<span class="row-link unassigned">Sin asignar</span>`}
              <button class="btn btn-ghost btn-icon" type="button" onclick="removePatient(${Number(patient.id)})" title="Eliminar paciente" aria-label="Eliminar paciente ${escapeHtml(patient.name)}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </div>`;
      }).join("");
    }

    function renderAuxiliaries(metrics) {
      $("#aux-count").textContent = STATE.auxiliaries.length;
      const list = $("#aux-list");
      if (STATE.auxiliaries.length === 0) {
        list.innerHTML = `
          <div class="empty">
            <div class="empty-icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
            <div class="empty-title">Sin auxiliares</div>
            <div class="empty-msg" style="margin-bottom:1rem">Registra el primer auxiliar de enfermería.</div>
            <button class="btn btn-tinted" type="button" onclick="openAuxModal()">Añadir auxiliar</button>
          </div>`;
        return;
      }

      list.innerHTML = STATE.auxiliaries.map(auxiliary => {
        const profile = LAST_EVALUATION.auxiliary_profiles[auxiliary.id] || { type: "Desconocido", cap10: 0 };
          const load = metrics.loads[auxiliary.id] || { capacity: 0, count: 0, carePct: 0, status: 'libre', severe: 0, moderate: 0, mild: 0, heaviest: 0 };
          const pct = load.capacity > 0 ? Math.round((load.count / load.capacity) * 100) : 0;
          const carePct = Math.round((load.carePct || 0) * 100);
          const displayPct = Math.max(pct, carePct);
          const assigned = Object.entries(STATE.assignments)
            .filter(([, auxId]) => auxId === auxiliary.id)
            .map(([patientId]) => STATE.patients.find(patient => String(patient.id) === String(patientId)))
            .filter(Boolean);
          const initials = auxiliary.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase();
          const recommendation = LAST_EVALUATION.auxiliary_recommendations[auxiliary.id] || { tone: "good", title: "", text: "" };
        const severitySummary = `${load.severe}S · ${load.moderate}M · ${load.mild}L`;
        const heaviest = load.heaviest > 0 ? `${load.heaviest} kg` : "—";

        return `
          <div class="aux-card status-${load.status}">
            <div class="aux-header">
              <div class="aux-identity">
                <div class="aux-avatar">${escapeHtml(initials || "AX")}</div>
                <div style="min-width:0">
                  <div class="aux-name">${escapeHtml(auxiliary.name)}</div>
                  <div class="aux-spec">${profile.type} · ${escapeHtml(auxiliary.weight)} kg · cap ${profile.cap10.toFixed(1)} kg</div>
                </div>
              </div>
              <span class="status-pill status-${load.status}">${labelStatus(load.status)}</span>
            </div>
            <div class="capacity-meta">
              <span>Carga actual</span>
              <span><strong>${load.count}</strong> / ${load.capacity} · clínica ${carePct}%</span>
            </div>
            <div class="capacity-track"><div class="capacity-fill fill-${load.status}" style="width:${Math.min(100, displayPct)}%"></div></div>
            <div class="aux-insights">
              <div class="aux-insight">
                <span>Demanda</span>
                <strong>${escapeHtml(severitySummary)}</strong>
              </div>
              <div class="aux-insight">
                <span>Carga clínica</span>
                <strong>${load.careUnits.toFixed(1)} / ${load.careCapacity.toFixed(1)}</strong>
              </div>
              <div class="aux-insight">
                <span>Mayor peso</span>
                <strong>${escapeHtml(heaviest)}</strong>
              </div>
            </div>
            <div class="aux-recommendation ${recommendation.tone}">
              <strong>${escapeHtml(recommendation.title)}</strong>
              <span>${escapeHtml(recommendation.text)}</span>
            </div>
            <div class="assigned-list">
              ${assigned.length > 0 ? assigned.map(patient => `<span class="assigned-pill"><span class="dot"></span>${escapeHtml(patient.name.split(" ")[0])}</span>`).join("") : `<span class="empty-list">Sin pacientes asignados</span>`}
              <button class="btn btn-ghost btn-icon" style="margin-left:auto" type="button" data-remove-aux="${escapeHtml(auxiliary.id)}" title="Eliminar auxiliar" aria-label="Eliminar auxiliar ${escapeHtml(auxiliary.name)}">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </div>`;
      }).join("");
    }

    function labelStatus(status) {
      return { libre: "Libre", ok: "Activo", full: "Al límite", overload: "Sobrecarga" }[status] || status;
    }

    function renderBroncoControls() {
      $("#bronco-container").innerHTML = `
        <fieldset style="border: none; padding: 0; margin: 0;">
          <legend class="sr-only">Evaluación Estándar de Disfagia (EED)</legend>
          ${BRONCO_ITEMS.map((item, index) => `
          <label class="bronco-row" id="b-row-${index}">
            <input type="checkbox" id="b-check-${index}" onchange="toggleBronco(${index})" style="position: absolute; opacity: 0; pointer-events: none;">
            <div class="bronco-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>
            </div>
            <div class="bronco-info">
              <strong>${escapeHtml(item.title)}</strong>
              <span>${escapeHtml(item.hint)}</span>
            </div>
            <div class="toggle" id="b-tog-${index}"></div>
          </label>`).join("")}
        </fieldset>
      `;
    }

    let lastActiveTrigger = null;

    function activeDialog() {
      return $(".modal-backdrop.active") || ($("#onboarding").hidden ? null : $("#onboarding"));
    }

    function dialogFocusable(dialog) {
      return Array.from(dialog.querySelectorAll('a[href], button, input, textarea, select, [tabindex]'))
        .filter(element => element.tabIndex >= 0 && !element.disabled && !element.closest('[hidden], [inert]')
          && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden");
    }

    function focusDialog(dialog) {
      const initial = dialog.id === "patient-modal" ? $("#p-name")
        : dialog.id === "aux-modal" ? $("#a-name") : dialogFocusable(dialog)[0];
      (initial || dialog).focus();
    }

    function setModalState(modalId, isOpen) {
      const modal = $(`#${modalId}`);
      const app = $(".app");
      const skip = $(".skip-link");

      if (isOpen) {
        if (!modal.classList.contains("active")) lastActiveTrigger = document.activeElement;
        modal.hidden = false;
        modal.removeAttribute("inert");
        modal.removeAttribute("aria-hidden");
        modal.classList.add("active");
        if (modalId === "onboarding") modal.classList.remove("hidden");
        focusDialog(modal);
        app.setAttribute("inert", "true");
        app.setAttribute("aria-hidden", "true");
        skip.inert = true;
      } else {
        const wasOpen = !modal.hidden;
        app.removeAttribute("inert");
        app.removeAttribute("aria-hidden");
        skip.inert = false;
        if (wasOpen) {
          const trigger = lastActiveTrigger;
          lastActiveTrigger = null;
          const restoreFocus = () => {
            const target = trigger && trigger.isConnected && !trigger.closest('[hidden], [inert]')
              && trigger.getClientRects().length ? trigger : $("#main-content");
            target.focus();
          };
          restoreFocus();
          queueMicrotask(() => { if (!activeDialog() && (!trigger || !trigger.isConnected)) restoreFocus(); });
        }
        modal.hidden = true;
        modal.setAttribute("inert", "true");
        modal.setAttribute("aria-hidden", "true");
        modal.classList.remove("active");
        if (modalId === "onboarding") modal.classList.add("hidden");
        if (activeDialog()) {
          app.inert = true;
          app.setAttribute("aria-hidden", "true");
          skip.inert = true;
        }
      }
    }

    function openPatientModal() {
      ["p-bed", "p-name", "p-weight", "p-barthel", "p-braden"].forEach(id => {
        $(`#${id}`).value = "";
      });
      $("#p-bed").value = STATE.nextPatientId;
      STATE.formBroncoFlags = [false, false, false, false, false];
      for (let index = 0; index < 5; index += 1) {
        const check = $(`#b-check-${index}`);
        if (check) check.checked = false;
        $(`#b-tog-${index}`).classList.remove("on");
        $(`#b-row-${index}`).classList.remove("active");
      }
      $("#row-barthel").classList.remove("complete");
      $("#row-braden").classList.remove("complete");
      updatePatientPreview();
      setModalState("patient-modal", true);
    }

    function openAuxModal() {
      ["a-id", "a-name", "a-weight"].forEach(id => {
        $(`#${id}`).value = "";
      });
      $("#a-id").value = nextAuxiliaryId();
      updateAuxPreview();
      setModalState("aux-modal", true);
    }

    function closeModal(id) {
      setModalState(id, false);
    }

    function toggleBronco(index) {
      const check = $(`#b-check-${index}`);
      STATE.formBroncoFlags[index] = check.checked;
      $(`#b-tog-${index}`).classList.toggle("on", STATE.formBroncoFlags[index]);
      $(`#b-row-${index}`).classList.toggle("active", STATE.formBroncoFlags[index]);
      updatePatientPreview();
    }

    
    async function updatePatientPreview() {
      const prevScore = document.querySelector("#prev-score");
      const prevRisk = document.querySelector("#prev-risk");
      const prevAux = document.querySelector("#prev-aux");
      const prevExplain = document.querySelector("#prev-explain");

      if (!prevScore || !prevRisk || !prevAux || !prevExplain) return;

      try {
        const result = await previewTurn();
        const score = Object.values(result.patient_scores)[0];
        
        if (score && score.riskValue > 0) {
          prevScore.textContent = score.total;
          prevRisk.textContent = score.risk;
          prevAux.textContent = `Tipo ${score.riskValue}`;
          
          prevExplain.innerHTML = `El puntaje de <strong>${score.total}</strong> clasifica al paciente en demanda <strong>${score.risk}</strong>. Se requiere un auxiliar mínimo <strong>Tipo ${score.riskValue}</strong> o superior para atenderlo de forma segura.`;
          prevExplain.classList.add("show");
        } else {
          prevScore.textContent = "—";
          prevRisk.textContent = "—";
          prevAux.textContent = "—";
          prevExplain.classList.remove("show");
        }
      } catch (e) {
        prevScore.textContent = "—";
        prevRisk.textContent = "—";
        prevAux.textContent = "—";
        prevExplain.classList.remove("show");
      }
    }

    async 
      const prevType = document.querySelector("#prev-type");
      const prevCap10 = document.querySelector("#prev-cap10");
      const prevMaxp = document.querySelector("#prev-maxp");
      const prevExplain = document.querySelector("#prev-aux-explain");

      if (!prevType || !prevCap10 || !prevMaxp || !prevExplain) return;

      try {
        const result = await previewTurn();
        const profile = Object.values(result.auxiliary_profiles)[0];

        if (profile && profile.typeValue > 0) {
          prevType.textContent = profile.type;
          prevCap10.textContent = `${Math.round(profile.cap10)} kg`;
          prevMaxp.textContent = profile.maxPatients;
          
          prevExplain.innerHTML = `Clasificación <strong>${profile.type}</strong>. Puede movilizar de forma segura hasta <strong>${Math.round(profile.cap10)} kg</strong> (extendible a ${Math.round(profile.cap20)} kg en equipo). Capacidad máxima sugerida: <strong>${profile.maxPatients} pacientes</strong>.`;
          prevExplain.classList.add("show");
        } else {
          prevType.textContent = "—";
          prevCap10.textContent = "—";
          prevMaxp.textContent = "—";
          prevExplain.classList.remove("show");
        }
      } catch(e) {
        prevType.textContent = "—";
        prevCap10.textContent = "—";
        prevMaxp.textContent = "—";
        prevExplain.classList.remove("show");
      }
    }

    async async function savePatient() {
      const id = Number($("#p-bed").value);
      const name = $("#p-name").value.trim();
      const weight = Number($("#p-weight").value);
      const barthel = Number($("#p-barthel").value);
      const braden = Number($("#p-braden").value);

      if (!id || id <= 0 || !Number.isInteger(id)) {
        toast("Datos inválidos", "La cama debe ser un número entero mayor a 0.", "warn");
        return $("#p-bed").focus();
      }
      if (!name) {
        toast("Datos inválidos", "El nombre es obligatorio.", "warn");
        return $("#p-name").focus();
      }
      if (!Number.isFinite(weight) || weight <= 0) {
        toast("Datos inválidos", "El peso debe ser mayor que cero.", "warn");
        return $("#p-weight").focus();
      }
      if ($("#p-barthel").value.trim() === "" || !Number.isInteger(barthel) || barthel < 0 || barthel > 100) {
        toast("Datos inválidos", "Barthel debe estar entre 0 y 100.", "warn");
        return $("#p-barthel").focus();
      }
      if (!Number.isInteger(braden) || braden < 6 || braden > 23) {
        toast("Datos inválidos", "Braden debe estar entre 6 y 23.", "warn");
        return $("#p-braden").focus();
      }
      if (STATE.patients.some(patient => patient.id === id)) {
        toast("Cama duplicada", `La cama ${id} ya existe.`, "warn");
        return $("#p-bed").focus();
      }

      STATE.patients.push({ id, name, weight, barthel, braden, broncoFlags: [...STATE.formBroncoFlags] });
      STATE.nextPatientId = Math.max(STATE.nextPatientId, id + 1);
      closeModal("patient-modal");
      const recalculated = shouldAutoRebalance();
      await renderAfterDataChange();
      const broncoCount = STATE.formBroncoFlags.filter(Boolean).length;
      toast("Paciente registrado", `${name} · cama ${id}${broncoCount >= 3 ? ` · EED ${broncoCount}/5` : ""}${recalculated ? " · distribución recalculada" : ""}`);
    }

    async function saveAux() {
      const id = $("#a-id").value.trim();
      const name = $("#a-name").value.trim();
      const weight = Number($("#a-weight").value);

      if (!id) {
        toast("Datos inválidos", "El ID es obligatorio.", "warn");
        return $("#a-id").focus();
      }
      if (id === "__proto__") {
        toast("ID no disponible", "Este identificador está reservado por el sistema. Usa otro ID.", "warn");
        return $("#a-id").focus();
      }
      if (!name) {
        toast("Datos inválidos", "El nombre es obligatorio.", "warn");
        return $("#a-name").focus();
      }
      if (!Number.isFinite(weight) || weight <= 0) {
        toast("Datos inválidos", "El peso debe ser mayor que cero.", "warn");
        return $("#a-weight").focus();
      }
      if (STATE.auxiliaries.some(auxiliary => auxiliary.id === id)) {
        toast("ID duplicado", "Usa un ID distinto.", "warn");
        return $("#a-id").focus();
      }

      STATE.auxiliaries.push({ id, name, weight });
      closeModal("aux-modal");
      const recalculated = shouldAutoRebalance();
      await renderAfterDataChange();
      toast("Auxiliar registrado", `${name} · ${(LAST_EVALUATION.auxiliary_profiles[id] || {type: "Desconocido"}).type}${recalculated ? " · distribución recalculada" : ""}`);
    }

    async function removePatient(id) {
      const p = STATE.patients.find(item => item.id === id);
      if (!confirm(`¿Estás seguro de que deseas eliminar al paciente ${p ? p.name : ""} del turno?`)) return;
      const recalculated = STATE.hasBalanced && STATE.patients.length > 1 && STATE.auxiliaries.length > 0;
      STATE.patients = STATE.patients.filter(patient => patient.id !== id);
      delete STATE.assignments[id];
      await renderAfterDataChange();
      toast("Paciente eliminado", recalculated ? "La distribución fue recalculada." : "El registro fue retirado del turno.");
    }

    async function removeAux(id) {
      const auxiliary = STATE.auxiliaries.find(item => item.id === id);
      if (!confirm(`¿Estás seguro de que deseas eliminar al auxiliar ${auxiliary ? auxiliary.name : ""} del turno?`)) return;
      const recalculated = STATE.hasBalanced && STATE.patients.length > 0 && STATE.auxiliaries.length > 1;
      STATE.auxiliaries = STATE.auxiliaries.filter(auxiliary => auxiliary.id !== id);
      Object.keys(STATE.assignments).forEach(patientId => {
        if (STATE.assignments[patientId] === id) delete STATE.assignments[patientId];
      });
      await renderAfterDataChange();
      toast("Auxiliar eliminado", auxiliary ? `${auxiliary.name} fue retirado${recalculated ? " y el turno fue rebalanceado." : "."}` : "El registro fue retirado.");
    }

    async function clearData() {
      if ((STATE.patients.length > 0 || STATE.auxiliaries.length > 0) && !confirm("¿Estás seguro de que deseas limpiar el turno? Todos los datos se perderán.")) {
        return;
      }
      STATE.patients = [];
      STATE.auxiliaries = [];
      STATE.assignments = {};
      STATE.nextPatientId = 101;
      STATE.hasBalanced = false;
      render();
      toast("Turno limpio", "La calculadora quedó lista para nuevos datos.");
    }

    function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
      const words = String(text || "").split(/\s+/).filter(Boolean);
      const lines = [];
      let line = "";
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width <= maxWidth) {
          line = testLine;
        } else {
          if (line) lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
      const visible = lines.slice(0, maxLines);
      visible.forEach((item, index) => ctx.fillText(index === maxLines - 1 && lines.length > maxLines ? `${item}...` : item, x, y + (index * lineHeight)));
      return visible.length * lineHeight;
    }

    function drawReportCard(ctx, x, y, width, height, label, value, meta, color = "#D4AF37") {
      ctx.save();
      ctx.fillStyle = "rgba(15, 27, 51, 0.92)";
      ctx.strokeStyle = "rgba(192, 197, 205, 0.24)";
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, width, height, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(244, 246, 248, 0.64)";
      ctx.font = "700 18px Inter, Arial, sans-serif";
      ctx.fillText(label, x + 24, y + 32);
      ctx.fillStyle = color;
      ctx.font = "300 48px Georgia, serif";
      ctx.fillText(String(value), x + 24, y + 86);
      ctx.fillStyle = "rgba(244, 246, 248, 0.55)";
      ctx.font = "600 16px Inter, Arial, sans-serif";
      ctx.fillText(meta, x + 24, y + 116);
      ctx.restore();
    }

    function createReportPages() {
      const metrics = LAST_EVALUATION.metrics || { loads: {} };
      const pages = [];
      const width = 1240;
      const height = 1754;
      const margin = 72;
      const contentWidth = width - (margin * 2);
      let pageNumber = 0;
      let canvas;
      let ctx;
      let y;

      function startPage() {
        pageNumber += 1;
        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext("2d");
        ctx.fillStyle = "#0A0F1F";
        ctx.fillRect(0, 0, width, height);
        const glow = ctx.createRadialGradient(160, 80, 0, 160, 80, 520);
        glow.addColorStop(0, "rgba(35, 51, 77, 0.82)");
        glow.addColorStop(1, "rgba(35, 51, 77, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#D4AF37";
        ctx.font = "900 18px Inter, Arial, sans-serif";
        ctx.fillText("NUMIA DE NEXO", margin, 58);
        ctx.fillStyle = "#F4F6F8";
        ctx.font = "300 56px Georgia, serif";
        ctx.fillText("Reporte visual de distribución", margin, 122);
        ctx.fillStyle = "rgba(244, 246, 248, 0.62)";
        ctx.font = "600 18px Inter, Arial, sans-serif";
        const shift = $("#current-shift")?.textContent || "Turno actual";
        ctx.fillText(`${shift} · ${new Date().toLocaleString("es-CO")}`, margin, 158);
        y = 205;
      }

      function finishPage() {
        ctx.fillStyle = "rgba(244, 246, 248, 0.42)";
        ctx.font = "600 15px Inter, Arial, sans-serif";
        ctx.fillText("PDF visual generado por Numia. No contiene código fuente, tokens, llaves ni información técnica secreta.", margin, height - 50);
        ctx.textAlign = "right";
        ctx.fillText(`Página ${pageNumber}`, width - margin, height - 50);
        ctx.textAlign = "left";
        pages.push(canvas);
      }

      function ensureSpace(requiredHeight) {
        if (y + requiredHeight > height - 110) {
          finishPage();
          startPage();
        }
      }

      function sectionTitle(title) {
        ensureSpace(54);
        ctx.fillStyle = "#D4AF37";
        ctx.font = "900 18px Inter, Arial, sans-serif";
        ctx.fillText(title.toUpperCase(), margin, y);
        y += 28;
      }

      startPage();

      const cardGap = 18;
      const cardWidth = (contentWidth - (cardGap * 3)) / 4;
      drawReportCard(ctx, margin, y, cardWidth, 134, "Pacientes", STATE.patients.length, `${metrics.unassigned} sin asignar`, "#D4AF37");
      drawReportCard(ctx, margin + (cardWidth + cardGap), y, cardWidth, 134, "Auxiliares", STATE.auxiliaries.length, `${metrics.full} al límite`, "#6FA8FF");
      drawReportCard(ctx, margin + ((cardWidth + cardGap) * 2), y, cardWidth, 134, "Cobertura", `${metrics.balance}%`, "distribución actual", "#C79DFF");
      drawReportCard(ctx, margin + ((cardWidth + cardGap) * 3), y, cardWidth, 134, "Alertas", metrics.alerts, metrics.alerts ? "requiere revisión" : "sin alertas", metrics.alerts ? "#FF6B6B" : "#5FE3A1");
      y += 170;

      sectionTitle("Mapa visual de coincidencia");
      ensureSpace(340);
      ctx.fillStyle = "rgba(15, 27, 51, 0.9)";
      ctx.strokeStyle = "rgba(192, 197, 205, 0.24)";
      roundRect(ctx, margin, y, contentWidth, 330, 20);
      ctx.fill();
      ctx.stroke();
      try {
        ctx.drawImage(mfCanvas, margin + 18, y + 18, contentWidth - 36, 294);
      } catch {
        ctx.fillStyle = "rgba(244, 246, 248, 0.58)";
        ctx.font = "600 20px Inter, Arial, sans-serif";
        ctx.fillText("Mapa visual no disponible en este instante.", margin + 28, y + 70);
      }
      y += 370;

      sectionTitle("Asignación paciente-auxiliar");
      ensureSpace(74);
      ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
      roundRect(ctx, margin, y, contentWidth, 42, 12);
      ctx.fill();
      ctx.fillStyle = "#D4AF37";
      ctx.font = "900 15px Inter, Arial, sans-serif";
      ctx.fillText("CAMA", margin + 16, y + 27);
      ctx.fillText("PACIENTE", margin + 120, y + 27);
      ctx.fillText("DEMANDA", margin + 470, y + 27);
      ctx.fillText("AUXILIAR ASIGNADO", margin + 670, y + 27);
      ctx.fillText("PUNTAJE", margin + 980, y + 27);
      y += 52;

      const sortedPatients = [...STATE.patients].sort((a, b) => {
        const scoreA = LAST_EVALUATION.patient_scores[a.id] || { riskValue: 0 };
        const scoreB = LAST_EVALUATION.patient_scores[b.id] || { riskValue: 0 };
        if (scoreB.riskValue !== scoreA.riskValue) return scoreB.riskValue - scoreA.riskValue;
        return Number(a.id) - Number(b.id);
      });

      for (const patient of sortedPatients) {
        ensureSpace(54);
        const score = LAST_EVALUATION.patient_scores[patient.id] || { risk: "INCOMPLETO", total: "-" };
        const auxiliary = STATE.auxiliaries.find(item => item.id === STATE.assignments[patient.id]);
        const isUnassigned = !auxiliary;
        ctx.fillStyle = isUnassigned ? "rgba(255, 107, 107, 0.09)" : "rgba(244, 246, 248, 0.045)";
        roundRect(ctx, margin, y, contentWidth, 44, 10);
        ctx.fill();
        ctx.fillStyle = "#F4F6F8";
        ctx.font = "700 16px Inter, Arial, sans-serif";
        ctx.fillText(String(patient.id), margin + 16, y + 28);
        ctx.fillText(patient.name, margin + 120, y + 28);
        ctx.fillStyle = score.risk === "SEVERO" ? "#FF6B6B" : score.risk === "MODERADO" ? "#FFB547" : "#5FE3A1";
        ctx.fillText(score.risk, margin + 470, y + 28);
        ctx.fillStyle = isUnassigned ? "#FF6B6B" : "#D4AF37";
        ctx.fillText(auxiliary ? auxiliary.name : "SIN AUXILIAR", margin + 670, y + 28);
        ctx.fillStyle = "rgba(244, 246, 248, 0.72)";
        ctx.fillText(String(score.total ?? "—"), margin + 980, y + 28);
        y += 52;
      }

      y += 22;
      sectionTitle("Equipo auxiliar y recomendaciones");
      for (const auxiliary of STATE.auxiliaries) {
        const profile = LAST_EVALUATION.auxiliary_profiles[auxiliary.id] || { type: "Desconocido", cap10: 0 };
          const load = metrics.loads[auxiliary.id] || { capacity: 0, count: 0, carePct: 0, status: 'libre', severe: 0, moderate: 0, mild: 0, heaviest: 0 };
          const pct = load.capacity > 0 ? Math.round((load.count / load.capacity) * 100) : 0;
          const carePct = Math.round((load.carePct || 0) * 100);
          const displayPct = Math.max(pct, carePct);
          const assigned = Object.entries(STATE.assignments)
            .filter(([, auxId]) => auxId === auxiliary.id)
            .map(([patientId]) => STATE.patients.find(patient => String(patient.id) === String(patientId)))
            .filter(Boolean);
          const initials = auxiliary.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase();
          const recommendation = LAST_EVALUATION.auxiliary_recommendations[auxiliary.id] || { tone: "good", title: "", text: "" };
        ensureSpace(128);
        ctx.fillStyle = recommendation.tone === "danger" ? "rgba(255, 107, 107, 0.10)" : recommendation.tone === "watch" ? "rgba(255, 181, 71, 0.10)" : "rgba(95, 227, 161, 0.08)";
        ctx.strokeStyle = recommendation.tone === "danger" ? "rgba(255, 107, 107, 0.34)" : recommendation.tone === "watch" ? "rgba(255, 181, 71, 0.28)" : "rgba(95, 227, 161, 0.24)";
        roundRect(ctx, margin, y, contentWidth, 112, 16);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#F4F6F8";
        ctx.font = "900 20px Inter, Arial, sans-serif";
        ctx.fillText(auxiliary.name, margin + 22, y + 32);
        ctx.fillStyle = "rgba(244, 246, 248, 0.65)";
        ctx.font = "700 15px Inter, Arial, sans-serif";
        ctx.fillText(`${profile.type} · ${auxiliary.weight} kg · cap. ${profile.cap10.toFixed(1)} kg`, margin + 22, y + 58);
        ctx.fillText(`Pacientes ${load.count}/${load.capacity} · Clínica ${Math.round((load.carePct || 0) * 100)}% · Demanda ${load.severe}S/${load.moderate}M/${load.mild}L`, margin + 22, y + 83);
        ctx.fillStyle = recommendation.tone === "danger" ? "#FF6B6B" : recommendation.tone === "watch" ? "#FFB547" : "#5FE3A1";
        ctx.font = "900 16px Inter, Arial, sans-serif";
        ctx.fillText(recommendation.title, margin + 630, y + 36);
        ctx.fillStyle = "rgba(244, 246, 248, 0.72)";
        ctx.font = "600 14px Inter, Arial, sans-serif";
        drawWrappedText(ctx, recommendation.text, margin + 630, y + 61, 430, 20, 2);
        y += 130;
      }

      finishPage();
      return pages;
    }

    function canvasToJpegBytes(canvas) {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      const binary = atob(dataUrl.split(",")[1]);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return { bytes, width: canvas.width, height: canvas.height };
    }

    function makePdfFromCanvases(canvases) {
      const encoder = new TextEncoder();
      const parts = [];
      const offsets = [];
      let offset = 0;

      function writeString(value) {
        const bytes = encoder.encode(value);
        parts.push(bytes);
        offset += bytes.length;
      }

      function writeBytes(bytes) {
        parts.push(bytes);
        offset += bytes.length;
      }

      function beginObject(id) {
        offsets[id] = offset;
        writeString(`${id} 0 obj\n`);
      }

      function endObject() {
        writeString("\nendobj\n");
      }

      function addObject(id, body) {
        beginObject(id);
        writeString(body);
        endObject();
      }

      function addStreamObject(id, dict, bytes) {
        beginObject(id);
        writeString(`<< ${dict} /Length ${bytes.length} >>\nstream\n`);
        writeBytes(bytes);
        writeString("\nendstream");
        endObject();
      }

      const images = canvases.map(canvasToJpegBytes);
      const pageIds = images.map((_, index) => 3 + (index * 3));
      const totalObjects = 2 + (images.length * 3);

      writeString("%PDF-1.4\n");
      addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
      addObject(2, `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`);

      images.forEach((image, index) => {
        const pageId = 3 + (index * 3);
        const imageId = pageId + 1;
        const contentId = pageId + 2;
        const imageName = `Im${index + 1}`;
        addObject(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /${imageName} ${imageId} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${contentId} 0 R >>`);
        addStreamObject(imageId, `/Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, image.bytes);
        addStreamObject(contentId, "", encoder.encode(`q\n595.28 0 0 841.89 0 0 cm\n/${imageName} Do\nQ\n`));
      });

      const xrefOffset = offset;
      writeString(`xref\n0 ${totalObjects + 1}\n`);
      writeString("0000000000 65535 f \n");
      for (let id = 1; id <= totalObjects; id += 1) {
        writeString(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
      }
      writeString(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
      return new Blob(parts, { type: "application/pdf" });
    }

    function exportReportPdf() {
      if (STATE.patients.length === 0 && STATE.auxiliaries.length === 0) {
        toast("Sin datos", "Agrega o carga datos antes de exportar el PDF.", "warn");
        return;
      }
      if (STATE.patients.length > 0 && STATE.auxiliaries.length > 0 && Object.keys(STATE.assignments).length === 0) {
        autoBalance({ silent: true });
      }
      const metrics = LAST_EVALUATION.metrics || { overloaded: 0 };
        let msg = "El PDF generado contendrá los datos clínicos y operativos del turno actual. ¿Deseas descargarlo?";
      if (metrics.overloaded > 0 || Object.keys(STATE.assignments).length < STATE.patients.length) {
        msg = "Atención: Hay auxiliares en sobrecarga o pacientes sin asignar. " + msg;
      }
      if (!confirm(msg)) return;
      const pages = createReportPages();
      const blob = makePdfFromCanvases(pages);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `numia-distribucion-${Date.now()}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast("PDF exportado", "Reporte visual descargado sin código fuente ni llaves internas.");
    }

    function toast(title, message, kind = "success") {
      const element = document.createElement("div");
      element.className = "toast";
      element.setAttribute("role", kind === "warn" ? "alert" : "status");
      element.setAttribute("aria-live", kind === "warn" ? "assertive" : "polite");
      element.innerHTML = `
        <div class="toast-icon ${kind === "warn" ? "warn" : ""}">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            ${kind === "warn" ? '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' : '<polyline points="20 6 9 17 4 12"/>'}
          </svg>
        </div>
        <div>
          <div class="toast-title">${escapeHtml(title)}</div>
          <div class="toast-msg">${escapeHtml(message)}</div>
        </div>
      `;
      $("#toast-container").appendChild(element);
      setTimeout(() => {
        element.style.opacity = "0";
        element.style.transform = "translateY(10px)";
        setTimeout(() => element.remove(), 250);
      }, 3200);
    }

    function goToScreen(name) {
      $$(".onboarding-screen").forEach(screen => {
        const current = screen.id === `screen-${name}`;
        screen.classList.toggle("active", current);
        screen.hidden = !current;
        screen.inert = !current;
        screen.setAttribute("aria-hidden", String(!current));
      });
      if (!$("#onboarding").hidden) focusDialog($("#onboarding"));
      if (name === "legal") {
        setTimeout(() => { $("#legal-scroll").scrollTop = 0; }, 50);
      }
    }

    function toggleConsent(id) {
      const check = $(`#${id}`);
      ONBOARDING_STATE.consent[id] = check.checked;
      check.parentElement.classList.toggle("checked", ONBOARDING_STATE.consent[id]);
      $("#btn-accept-legal").disabled = !(ONBOARDING_STATE.consent.c1 && ONBOARDING_STATE.consent.c2);
    }

    function acceptLegal() {
      if (!ONBOARDING_STATE.consent.c1 || !ONBOARDING_STATE.consent.c2) {
        toast("Acción requerida", "Debes aceptar términos y autorizar datos para continuar.", "warn");
        return;
      }
      ONBOARDING_STATE.acceptedAt = new Date().toISOString();
      goToScreen("tour");
    }

    async function finishOnboarding(loadSample) {
      if (loadSample && (STATE.patients.length > 0 || STATE.auxiliaries.length > 0)) {
        if (!confirm("Al cargar datos de ejemplo se sobrescribirá el turno actual. ¿Deseas continuar?")) {
          return;
        }
      }
      setModalState("onboarding", false);
      setTimeout(() => {
        if (loadSample) {
          STATE.patients = SAMPLE_PATIENTS.map(patient => ({ ...patient, broncoFlags: [...patient.broncoFlags] }));
          STATE.auxiliaries = SAMPLE_AUX.map(auxiliary => ({ ...auxiliary }));
          STATE.assignments = {};
          STATE.nextPatientId = 109;
          render();
          setTimeout(autoBalance, 360);
        } else {
          render();
          setTimeout(() => toast("Listo para comenzar", "Añade pacientes y auxiliares para iniciar el turno."), 320);
        }
      }, 260);
    }

    function showWelcome() {
      setModalState("onboarding", true);
      goToScreen("welcome");
    }

    function showHelp() {
      setModalState("help-modal", true);
    }

    const ambientCanvas = $("#ambient");
    const ambientCtx = ambientCanvas.getContext("2d");
    let ambientParticles = [];

    function resizeAmbient() {
      const dpr = window.devicePixelRatio || 1;
      ambientCanvas.width = window.innerWidth * dpr;
      ambientCanvas.height = window.innerHeight * dpr;
      ambientCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ambientParticles = [
        { x: window.innerWidth * 0.14, y: window.innerHeight * 0.12, r: 360, color: "35, 51, 77", vx: 0.08, vy: 0.05, alpha: 0.62 },
        { x: window.innerWidth * 0.86, y: window.innerHeight * 0.78, r: 420, color: "15, 27, 51", vx: -0.06, vy: -0.04, alpha: 0.72 },
        { x: window.innerWidth * 0.52, y: window.innerHeight * 0.45, r: 270, color: "212, 175, 55", vx: 0.04, vy: 0.06, alpha: 0.07 },
      ];
    }

    function drawAmbient() {
      if (isHidden) {
        requestAnimationFrame(drawAmbient);
        return;
      }
      ambientCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const particle of ambientParticles) {
        if (!isReducedMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
        }
        if (particle.x < -particle.r || particle.x > window.innerWidth + particle.r) particle.vx *= -1;
        if (particle.y < -particle.r || particle.y > window.innerHeight + particle.r) particle.vy *= -1;
        const gradient = ambientCtx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.r);
        gradient.addColorStop(0, `rgba(${particle.color}, ${particle.alpha})`);
        gradient.addColorStop(1, `rgba(${particle.color}, 0)`);
        ambientCtx.fillStyle = gradient;
        ambientCtx.beginPath();
        ambientCtx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ambientCtx.fill();
      }
      requestAnimationFrame(drawAmbient);
    }

    const mfCanvas = $("#matchfield-canvas");
    const mfCtx = mfCanvas.getContext("2d");
    let mfNodes = [];
    let mfTime = 0;
    let mfHoverNode = null;
    let isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", e => { isReducedMotion = e.matches; });
    let isHidden = document.visibilityState === "hidden";
    document.addEventListener("visibilitychange", () => { isHidden = document.visibilityState === "hidden"; });

    function resizeMatchfield() {
      const rect = mfCanvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      mfCanvas.width = rect.width * dpr;
      mfCanvas.height = rect.height * dpr;
      mfCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildMatchfieldNodes();
    }

    function rebuildMatchfieldNodes() {
      const rect = mfCanvas.getBoundingClientRect();
      const width = rect.width || 1;
      const height = rect.height || 1;
      mfNodes = [];
      const center = width / 2;
      const spread = width < 600 ? Math.min(width * 0.36, 125) : Math.min(width * 0.35, 330);
      const top = 48;
      const usable = Math.max(110, height - 82);

      STATE.patients.forEach((patient, index) => {
        const t = STATE.patients.length === 1 ? 0.5 : index / (STATE.patients.length - 1);
        const y = top + t * usable;
        const score = LAST_EVALUATION.patient_scores[patient.id] || { risk: "INCOMPLETO", total: "-" };
        mfNodes.push({ kind: "patient", ref: patient, score, x: center - spread, y, r: 6 + score.riskValue * 1.6, phase: Math.random() * Math.PI * 2 });
      });

      STATE.auxiliaries.forEach((auxiliary, index) => {
        const t = STATE.auxiliaries.length === 1 ? 0.5 : index / (STATE.auxiliaries.length - 1);
        const y = top + t * usable;
        mfNodes.push({ kind: "aux", ref: auxiliary, x: center + spread, y, r: 9, phase: Math.random() * Math.PI * 2 });
      });
    }

    mfCanvas.addEventListener("mousemove", event => {
      const rect = mfCanvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      let nearest = null;
      let distance = 24;
      for (const node of mfNodes) {
        const current = Math.hypot(node.x - x, node.y - y);
        if (current < distance) {
          distance = current;
          nearest = node;
        }
      }
      mfHoverNode = nearest;
      mfCanvas.style.cursor = nearest ? "pointer" : "default";
    });

    mfCanvas.addEventListener("mouseleave", () => {
      mfHoverNode = null;
      mfCanvas.style.cursor = "default";
    });

    function drawMatchfieldBackground(width, height) {
      const cx = width / 2;
      const cy = height / 2;
      const gradient = mfCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.72);
      gradient.addColorStop(0, "rgba(212, 175, 55, 0.05)");
      gradient.addColorStop(1, "rgba(10, 15, 31, 0)");
      mfCtx.fillStyle = gradient;
      mfCtx.fillRect(0, 0, width, height);

      mfCtx.strokeStyle = "rgba(212, 175, 55, 0.16)";
      mfCtx.setLineDash([2, 7]);
      mfCtx.beginPath();
      mfCtx.moveTo(cx, height * 0.14);
      mfCtx.lineTo(cx, height * 0.86);
      mfCtx.stroke();
      mfCtx.setLineDash([]);

      mfCtx.font = "700 10px Inter, sans-serif";
      mfCtx.textAlign = "center";
      mfCtx.textBaseline = "middle";
      mfCtx.fillStyle = "rgba(212, 175, 55, 0.8)";
      mfCtx.fillText(`PACIENTES · ${STATE.patients.length}`, Math.max(76, cx - Math.min(width * 0.35, 330)), 22);
      mfCtx.fillStyle = "rgba(111, 168, 255, 0.84)";
      mfCtx.fillText(`AUXILIARES · ${STATE.auxiliaries.length}`, Math.min(width - 80, cx + Math.min(width * 0.35, 330)), 22);
    }

    function nodeColor(node) {
      if (node.kind === "aux") return "#6FA8FF";
      if (node.score.risk === "SEVERO") return "#FF6B6B";
      if (node.score.risk === "MODERADO") return "#FFB547";
      if (node.score.risk === "LEVE") return "#5FE3A1";
      return "#C0C5CD";
    }

    function drawLine(from, to, assigned, highlighted) {
      const midX = (from.x + to.x) / 2;
      const sway = Math.sin(mfTime * 0.8 + from.y * 0.02) * 7;
      mfCtx.lineCap = "round";
      if (assigned) {
        const gradient = mfCtx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, highlighted ? "rgba(232, 199, 108, 0.98)" : "rgba(212, 175, 55, 0.62)");
        gradient.addColorStop(1, highlighted ? "rgba(212, 175, 55, 0.98)" : "rgba(212, 175, 55, 0.56)");
        mfCtx.strokeStyle = gradient;
        mfCtx.lineWidth = highlighted ? 2.7 : 1.7;
        mfCtx.shadowBlur = highlighted ? 12 : 0;
        mfCtx.shadowColor = "#D4AF37";
      } else {
        mfCtx.strokeStyle = "rgba(192, 197, 205, 0.07)";
        mfCtx.lineWidth = 1;
        mfCtx.setLineDash([1.5, 5]);
        mfCtx.shadowBlur = 0;
      }
      mfCtx.beginPath();
      mfCtx.moveTo(from.x, from.y);
      mfCtx.quadraticCurveTo(midX, (from.y + to.y) / 2 + sway, to.x, to.y);
      mfCtx.stroke();
      mfCtx.shadowBlur = 0;
      mfCtx.setLineDash([]);
    }

    function drawNode(node, highlighted, dimmed) {
      const color = nodeColor(node);
      const pulse = 0.9 + 0.1 * Math.sin(mfTime * 2 + node.phase);
      const radius = node.r * pulse;
      mfCtx.globalAlpha = dimmed ? 0.34 : 1;

      const glow = mfCtx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 3.2);
      glow.addColorStop(0, `${color}66`);
      glow.addColorStop(1, `${color}00`);
      mfCtx.fillStyle = glow;
      mfCtx.beginPath();
      mfCtx.arc(node.x, node.y, radius * 3.2, 0, Math.PI * 2);
      mfCtx.fill();

      mfCtx.fillStyle = "#0A0F1F";
      mfCtx.beginPath();
      mfCtx.arc(node.x, node.y, radius + 2.6, 0, Math.PI * 2);
      mfCtx.fill();

      mfCtx.strokeStyle = color;
      mfCtx.lineWidth = highlighted ? 2.2 : 1.4;
      mfCtx.beginPath();
      mfCtx.arc(node.x, node.y, radius + 1.4, 0, Math.PI * 2);
      mfCtx.stroke();

      if (node.kind === "aux") {
        mfCtx.fillStyle = color;
        mfCtx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const angle = (Math.PI * 2 * i) / 6 + mfTime * 0.18;
          const x = node.x + Math.cos(angle) * radius;
          const y = node.y + Math.sin(angle) * radius;
          if (i === 0) mfCtx.moveTo(x, y);
          else mfCtx.lineTo(x, y);
        }
        mfCtx.closePath();
        mfCtx.fill();
      } else {
        mfCtx.fillStyle = color;
        mfCtx.beginPath();
        mfCtx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        mfCtx.fill();

        if ((node.ref.broncoFlags || []).filter(Boolean).length >= 3) {
          mfCtx.fillStyle = "#C79DFF";
          mfCtx.shadowBlur = 10;
          mfCtx.shadowColor = "#C79DFF";
          mfCtx.beginPath();
          mfCtx.arc(node.x + Math.cos(mfTime * 1.6) * (radius + 5), node.y + Math.sin(mfTime * 1.6) * (radius + 5), 2.7, 0, Math.PI * 2);
          mfCtx.fill();
          mfCtx.shadowBlur = 0;
        }
      }

      if (highlighted) {
        mfCtx.strokeStyle = `${color}55`;
        mfCtx.lineWidth = 1;
        mfCtx.beginPath();
        mfCtx.arc(node.x, node.y, radius * 2.8, 0, Math.PI * 2);
        mfCtx.stroke();
      }
      mfCtx.globalAlpha = 1;
    }

    function drawTooltip(node, width) {
      if (!node) return;
      let title = "";
      let subtitle = "";
      if (node.kind === "patient") {
        title = `${node.ref.name} · Cama ${node.ref.id}`;
        subtitle = `${node.score.risk} · puntaje ${node.score.total ?? "—"}`;
      } else {
        const profile = LAST_EVALUATION.auxiliary_profiles[node.ref.id] || { type: "Desconocido", maxPatients: 0 };
        const count = Object.values(STATE.assignments).filter(auxId => auxId === node.ref.id).length;
        title = node.ref.name;
        subtitle = `${profile.type} · ${count}/${profile.maxPatients} pacientes`;
      }
      mfCtx.font = "700 11px Inter, sans-serif";
      const titleWidth = mfCtx.measureText(title).width;
      mfCtx.font = "600 10px Inter, sans-serif";
      const subtitleWidth = mfCtx.measureText(subtitle).width;
      const boxWidth = Math.max(titleWidth, subtitleWidth) + 24;
      const boxHeight = 40;
      let x = node.x - boxWidth / 2;
      let y = node.y - node.r - boxHeight - 16;
      if (y < 36) y = node.y + node.r + 16;
      x = Math.max(8, Math.min(width - boxWidth - 8, x));

      mfCtx.fillStyle = "rgba(15, 27, 51, 0.96)";
      mfCtx.strokeStyle = "rgba(212, 175, 55, 0.28)";
      roundRect(mfCtx, x, y, boxWidth, boxHeight, 8);
      mfCtx.fill();
      mfCtx.stroke();

      mfCtx.textAlign = "left";
      mfCtx.textBaseline = "middle";
      mfCtx.font = "700 11px Inter, sans-serif";
      mfCtx.fillStyle = "#F4F6F8";
      mfCtx.fillText(title, x + 12, y + 14);
      mfCtx.font = "600 10px Inter, sans-serif";
      mfCtx.fillStyle = "#D4AF37";
      mfCtx.fillText(subtitle, x + 12, y + 28);
    }

    function roundRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
    }

    function animateMatchfield() {
      if (isHidden) {
        requestAnimationFrame(animateMatchfield);
        return;
      }
      const rect = mfCanvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      mfCtx.clearRect(0, 0, width, height);
      if (!isReducedMotion) mfTime += 0.012;
      drawMatchfieldBackground(width, height);

      if (mfNodes.length === 0) {
        mfCtx.textAlign = "center";
        mfCtx.textBaseline = "middle";
        mfCtx.fillStyle = "rgba(244, 246, 248, 0.38)";
        mfCtx.font = "300 italic 18px Newsreader, serif";
        mfCtx.fillText("Esperando datos...", width / 2, height / 2 - 6);
        mfCtx.fillStyle = "rgba(244, 246, 248, 0.2)";
        mfCtx.font = "500 10px Inter, sans-serif";
        mfCtx.fillText("Registra pacientes y auxiliares para visualizar", width / 2, height / 2 + 16);
        requestAnimationFrame(animateMatchfield);
        return;
      }

      const patientNodes = mfNodes.filter(node => node.kind === "patient");
      const auxNodes = mfNodes.filter(node => node.kind === "aux");
      const highlightedConnections = new Set();

      if (mfHoverNode) {
        if (mfHoverNode.kind === "patient") {
          const auxId = STATE.assignments[mfHoverNode.ref.id];
          if (auxId) highlightedConnections.add(`${mfHoverNode.ref.id}:${auxId}`);
        } else {
          Object.entries(STATE.assignments).forEach(([patientId, auxId]) => {
            if (auxId === mfHoverNode.ref.id) highlightedConnections.add(`${patientId}:${auxId}`);
          });
        }
      }

      for (const patientNode of patientNodes) {
        for (const auxNode of auxNodes) {
          const assigned = STATE.assignments[patientNode.ref.id] === auxNode.ref.id;
          if (!assigned && (LAST_EVALUATION.eligibility && LAST_EVALUATION.eligibility[patientNode.ref.id] && LAST_EVALUATION.eligibility[patientNode.ref.id].includes(auxNode.ref.id))) drawLine(patientNode, auxNode, false, false);
        }
      }

      for (const patientNode of patientNodes) {
        for (const auxNode of auxNodes) {
          const assigned = STATE.assignments[patientNode.ref.id] === auxNode.ref.id;
          if (assigned) {
            const key = `${patientNode.ref.id}:${auxNode.ref.id}`;
            drawLine(patientNode, auxNode, true, highlightedConnections.has(key));
          }
        }
      }

      for (const node of mfNodes) {
        let highlighted = !mfHoverNode || node === mfHoverNode;
        let dimmed = false;
        if (mfHoverNode && node !== mfHoverNode) {
          if (mfHoverNode.kind === "patient") {
            highlighted = node.kind === "aux" && STATE.assignments[mfHoverNode.ref.id] === node.ref.id;
          } else if (node.kind === "patient") {
            highlighted = STATE.assignments[node.ref.id] === mfHoverNode.ref.id;
          } else {
            highlighted = false;
          }
          dimmed = !highlighted;
        }
        drawNode(node, highlighted, dimmed);
      }

      drawTooltip(mfHoverNode, width);
      requestAnimationFrame(animateMatchfield);
    }

    function configureShift() {
      const hour = new Date().getHours();
      const label = hour < 14 ? "Mañana · 06:00-14:00" : hour < 22 ? "Tarde · 14:00-22:00" : "Noche · 22:00-06:00";
      $("#current-shift").textContent = label;
      $("#nav-shift").textContent = label.split(" ")[0];
    }

    function init() {
      renderBroncoControls();
      ["p-weight", "p-barthel", "p-braden"].forEach(id => $(`#${id}`).addEventListener("input", updatePatientPreview));
      $("#a-weight").addEventListener("input", updateAuxPreview);
      $("#aux-list").addEventListener("click", event => {
        const button = event.target.closest("[data-remove-aux]");
        if (!button) return;
        removeAux(button.dataset.removeAux);
      });
      $$(".modal-backdrop").forEach(backdrop => {
        backdrop.addEventListener("click", event => {
          if (event.target === backdrop) closeModal(backdrop.id);
        });
      });
      document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          const activeModal = $(".modal-backdrop.active");
          if (activeModal) closeModal(activeModal.id);
        }
        if (event.key === "Tab") {
          const activeModal = activeDialog();
          if (activeModal) {
            const focusable = dialogFocusable(activeModal);
            if (focusable.length > 0) {
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (!activeModal.contains(document.activeElement)) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
              } else if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            } else {
              event.preventDefault();
              activeModal.focus();
            }
          }
        }
        if (activeDialog()) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
          event.preventDefault();
          autoBalance();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "p") {
          event.preventDefault();
          openPatientModal();
        }
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "u") {
          event.preventDefault();
          openAuxModal();
        }
      });
      document.addEventListener("focusin", event => {
        const dialog = activeDialog();
        if (dialog && !dialog.contains(event.target)) focusDialog(dialog);
      });
      let resizePending = false;
      window.addEventListener("resize", () => {
        if (!resizePending) {
          resizePending = true;
          requestAnimationFrame(() => {
            resizeAmbient();
            resizeMatchfield();
            resizePending = false;
          });
        }
      });
      configureShift();
      resizeAmbient();
      resizeMatchfield();
      render();
      setModalState("onboarding", true);
      drawAmbient();
      animateMatchfield();
    }

    init();
  
