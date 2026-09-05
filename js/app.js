// js/app.js  —  Main application controller

const EXAMPLE = [
  { pid: 'P1', at: 0, bt: 6, pr: 0 },
  { pid: 'P2', at: 1, bt: 4, pr: 0 },
  { pid: 'P3', at: 2, bt: 2, pr: 0 },
  { pid: 'P4', at: 3, bt: 5, pr: 0 },
];

let processRows = [];
let nextPid = 1;
let ganttRenderer = null;

// ── Boot ────────────────────────────────────────────────────────────────── //
document.addEventListener('DOMContentLoaded', () => {
  buildAlgoDropdown();
  ganttRenderer = new GanttRenderer(document.getElementById('gantt-canvas'));
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  selectAlgorithm();
  document.getElementById('at-input').addEventListener('keydown', e => e.key === 'Enter' && addProcess());
  document.getElementById('bt-input').addEventListener('keydown', e => e.key === 'Enter' && addProcess());
  document.getElementById('pr-input').addEventListener('keydown', e => e.key === 'Enter' && addProcess());
});

function resizeCanvas() {
  const canvas = document.getElementById('gantt-canvas');
  canvas.width  = canvas.parentElement.clientWidth - 32;
  canvas.height = 110;
  if (ganttRenderer) ganttRenderer.draw(null);
}

// ── Algorithm dropdown ───────────────────────────────────────────────────── //
function buildAlgoDropdown() {
  const sel = document.getElementById('algo-select');
  Object.keys(ALGORITHMS).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
}

function selectAlgorithm() {
  const name = document.getElementById('algo-select').value;
  const algo = ALGORITHMS[name];
  if (!algo) return;
  updateInfoPanel(algo);
  const badge = document.getElementById('status-badge');
  const qrow  = document.getElementById('quantum-row');
  if (algo.implemented) {
    badge.textContent = '● ACTIVE';
    badge.className = 'badge badge-green';
  } else {
    badge.textContent = '⏳ COMING SOON';
    badge.className = 'badge badge-orange';
  }
  // Show quantum input only for Round Robin
  if (name === 'Round Robin') {
    qrow.classList.remove('hidden');
  } else {
    qrow.classList.add('hidden');
  }
}

function updateInfoPanel(algo) {
  const d = algo.description;
  document.getElementById('info-title').textContent = d.title || algo.name;
  document.getElementById('info-body').innerHTML  = d.body || '';
  document.getElementById('info-type').textContent = d.type || '—';
  document.getElementById('info-complexity').textContent = d.complexity || '—';

  const prosList = document.getElementById('info-pros');
  prosList.innerHTML = (d.pros || []).map(p => `<li>${p}</li>`).join('');
  const consList = document.getElementById('info-cons');
  consList.innerHTML = (d.cons || []).map(c => `<li>${c}</li>`).join('');
}

// ── Process table ────────────────────────────────────────────────────────── //
function addProcess() {
  const atEl = document.getElementById('at-input');
  const btEl = document.getElementById('bt-input');
  const prEl = document.getElementById('pr-input');

  const at = atEl.value.trim();
  const bt = btEl.value.trim();
  const pr = prEl.value.trim() || '0';

  const errors = [];
  if (at === '' || isNaN(at) || parseInt(at) < 0) errors.push('Arrival Time must be ≥ 0');
  if (bt === '' || isNaN(bt) || parseInt(bt) <= 0) errors.push('Burst Time must be > 0');
  if (isNaN(pr)) errors.push('Priority must be a number');
  if (errors.length) { showError(errors.join(' | ')); return; }

  clearError();
  const pid = `P${nextPid++}`;
  processRows.push({ pid, at: parseInt(at), bt: parseInt(bt), pr: parseInt(pr) });
  renderTable();
  atEl.value = ''; btEl.value = ''; prEl.value = '0';
  atEl.focus();
}

function removeSelected() {
  const sel = document.querySelectorAll('.proc-row.selected');
  if (!sel.length) { showError('Select a row to remove'); return; }
  const ids = Array.from(sel).map(r => r.dataset.pid);
  processRows = processRows.filter(p => !ids.includes(p.pid));
  renderTable();
  clearError();
}

function clearAll() {
  if (!processRows.length) return;
  if (!confirm('Remove all processes?')) return;
  processRows = []; nextPid = 1; renderTable(); clearError();
}

function loadExample() {
  processRows = EXAMPLE.map(e => ({ ...e }));
  nextPid = EXAMPLE.length + 1;
  renderTable(); clearError();
}

function renderTable() {
  const tbody = document.getElementById('proc-tbody');
  tbody.innerHTML = '';
  processRows.forEach(p => {
    const tr = document.createElement('tr');
    tr.className = 'proc-row';
    tr.dataset.pid = p.pid;
    tr.innerHTML = `
      <td>${p.pid}</td>
      <td contenteditable="true" class="editable" onblur="editCell(this,'${p.pid}','at')">${p.at}</td>
      <td contenteditable="true" class="editable" onblur="editCell(this,'${p.pid}','bt')">${p.bt}</td>
      <td contenteditable="true" class="editable" onblur="editCell(this,'${p.pid}','pr')">${p.pr}</td>
      <td><button class="icon-btn" onclick="deleteRow('${p.pid}')" title="Delete">✕</button></td>
    `;
    tr.addEventListener('click', () => {
      document.querySelectorAll('.proc-row').forEach(r => r.classList.remove('selected'));
      tr.classList.add('selected');
    });
    tbody.appendChild(tr);
  });
  document.getElementById('proc-count').textContent = `${processRows.length} process${processRows.length !== 1 ? 'es' : ''}`;
}

function editCell(el, pid, field) {
  const val = parseInt(el.textContent.trim());
  const row = processRows.find(p => p.pid === pid);
  if (!row) return;
  if (field === 'at' && (isNaN(val) || val < 0)) { el.textContent = row.at; return; }
  if (field === 'bt' && (isNaN(val) || val <= 0))  { el.textContent = row.bt; return; }
  row[field] = isNaN(val) ? row[field] : val;
}

function deleteRow(pid) {
  processRows = processRows.filter(p => p.pid !== pid);
  renderTable();
}

// ── Calculate ────────────────────────────────────────────────────────────── //
function calculate() {
  clearError();
  if (!processRows.length) { showError('Add at least one process first.'); return; }

  const name = document.getElementById('algo-select').value;
  const algo = ALGORITHMS[name];
  if (!algo) return;

  if (!algo.implemented) {
    showComingSoon(algo.name);
    return;
  }

  const procs = processRows.map(r => new Process(r.pid, r.at, r.bt, r.pr));
  let result;
  try {
    const name = document.getElementById('algo-select').value;
    if (name === 'Round Robin') {
      const q = parseInt(document.getElementById('quantum-input').value) || 2;
      result = algo.schedule(procs, q);
    } else {
      result = algo.schedule(procs);
    }
  } catch (e) { showError('Calculation error: ' + e.message); return; }

  displayResults(result);
}

function reset() {
  clearResults();
  ganttRenderer.draw(null);
  clearError();
}

// ── Display results ───────────────────────────────────────────────────────── //
function displayResults(result) {
  // Results table
  const tbody = document.getElementById('results-tbody');
  tbody.innerHTML = '';
  result.processes.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.className = i % 2 === 0 ? 'row-even' : 'row-odd';
    tr.innerHTML = `
      <td><span class="pid-chip">${p.pid}</span></td>
      <td>${p.arrivalTime}</td><td>${p.burstTime}</td>
      <td>${p.startTime}</td><td>${p.completionTime}</td>
      <td>${p.turnaroundTime}</td><td>${p.waitingTime}</td><td>${p.responseTime}</td>
    `;
    tbody.appendChild(tr);
  });

  // Stats
  const s = result.stats;
  document.getElementById('stat-awt').textContent   = s.avgWaitingTime.toFixed(2);
  document.getElementById('stat-atat').textContent  = s.avgTurnaroundTime.toFixed(2);
  document.getElementById('stat-art').textContent   = s.avgResponseTime.toFixed(2);
  document.getElementById('stat-cpu').textContent   = s.cpuUtilization.toFixed(2) + '%';
  document.getElementById('stat-tp').textContent    = s.throughput.toFixed(4) + ' proc/unit';

  // Gantt
  resizeCanvas();
  ganttRenderer.draw(result.ganttBlocks);

  // Steps
  const stepsDiv = document.getElementById('steps-list');
  stepsDiv.innerHTML = '';
  result.steps.forEach(step => {
    const div = document.createElement('div');
    div.className = `step-item step-${step.type}`;
    div.innerHTML = `<span class="step-num">Step ${step.n}</span><span class="step-text">${step.html}</span>`;
    stepsDiv.appendChild(div);
  });

  // Show results sections
  document.getElementById('results-section').classList.remove('hidden');
  document.getElementById('gantt-section').classList.remove('hidden');
  document.getElementById('steps-section').classList.remove('hidden');
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

function showComingSoon(name) {
  clearResults();
  document.getElementById('steps-section').classList.remove('hidden');
  document.getElementById('steps-list').innerHTML = `
    <div class="step-item step-coming-soon">
      <span class="step-text">⏳ <b>${name}</b> is not yet implemented — Coming Soon!</span>
    </div>`;
}

function clearResults() {
  document.getElementById('results-tbody').innerHTML = '';
  ['stat-awt','stat-atat','stat-art','stat-cpu','stat-tp'].forEach(id => {
    document.getElementById(id).textContent = '—';
  });
  document.getElementById('steps-list').innerHTML = '';
  ['results-section','gantt-section','steps-section'].forEach(id =>
    document.getElementById(id).classList.add('hidden')
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────── //
function showError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('hidden');
}
function clearError() {
  const el = document.getElementById('error-msg');
  el.textContent = '';
  el.classList.add('hidden');
}
