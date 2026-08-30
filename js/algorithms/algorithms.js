// js/algorithms/algorithms.js  —  All algorithms in one file

// ─── FCFS ────────────────────────────────────────────────────────────────── //
class FCFS extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'FCFS - First Come First Serve';
    this.implemented = true;
    this.description = {
      title: 'FCFS — First Come First Serve',
      type: 'Non-Preemptive',
      complexity: 'O(n log n)',
      body: 'Processes execute strictly in arrival order. Once started, a process runs to completion.',
      pros: ['Simple and easy to implement', 'No starvation — every process eventually runs'],
      cons: ['Convoy Effect: long processes block shorter ones', 'High average waiting time possible'],
    };
  }

  schedule(processes) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const procs = this._cloneProcesses(processes);
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));

    let t = 0, sn = 1;

    const atZero = procs.filter(p => p.arrivalTime === 0);
    if (atZero.length) {
      result.steps.push({ n: sn++, type: 'arrive',
        html: `${atZero.map(p => `<em>${p.pid}</em>`).join(', ')} arrive${atZero.length > 1 ? '' : 's'} at time <b>0</b>.` });
    }

    procs.forEach((proc, i) => {
      if (proc.arrivalTime > 0) {
        result.steps.push({ n: sn++, type: 'arrive',
          html: `<em>${proc.pid}</em> arrives at time <b>${proc.arrivalTime}</b>.` });
      }
      if (t < proc.arrivalTime) {
        result.ganttBlocks.push(new GanttBlock('IDLE', t, proc.arrivalTime, true));
        result.steps.push({ n: sn++, type: 'idle',
          html: `CPU <span class="idle-chip">IDLE</span> from <b>${t}</b> → <b>${proc.arrivalTime}</b>.` });
        t = proc.arrivalTime;
      }
      proc.startTime = t;
      proc.completionTime = t + proc.burstTime;
      proc.computeMetrics();
      result.ganttBlocks.push(new GanttBlock(proc.pid, proc.startTime, proc.completionTime, false, proc.pid));
      result.steps.push({ n: sn++, type: 'execute',
        html: `<em>${proc.pid}</em> runs <b>${proc.startTime}→${proc.completionTime}</b>
               &nbsp;|&nbsp; TAT <span class="chip blue">${proc.turnaroundTime}</span>
               WT <span class="chip green">${proc.waitingTime}</span>
               RT <span class="chip purple">${proc.responseTime}</span>` });
      t = proc.completionTime;

      if (i + 1 < procs.length && procs[i + 1].arrivalTime <= t) {
        result.steps.push({ n: sn++, type: 'info',
          html: `<em>${procs[i+1].pid}</em> is waiting in the ready queue (arrived at <b>${procs[i+1].arrivalTime}</b>).` });
      }
    });

    result.steps.push({ n: sn, type: 'done', html: `✓ All processes completed at time <b>${t}</b>.` });
    result.processes = procs;
    result.stats = this._computeStatistics(procs, result.ganttBlocks);
    return result;
  }
}

// ─── Coming-soon stubs ───────────────────────────────────────────────────── //
function _stub(name, title, typeStr, complexity, body, pros, cons) {
  return class extends SchedulingAlgorithm {
    constructor() {
      super();
      this.name = name; this.implemented = false;
      this.description = { title, type: typeStr, complexity, body, pros, cons };
    }
    schedule() {
      const r = new ScheduleResult();
      r.steps = [{ n: 1, type: 'coming-soon', html: `<b>${this.name}</b> — Coming Soon! 🚧` }];
      return r;
    }
  };
}

const SJF = _stub(
  'SJF - Shortest Job First', 'SJF — Shortest Job First',
  'Non-Preemptive', 'O(n²)',
  'Picks the ready process with the <b>smallest burst time</b>.',
  ['Minimises average waiting time'],
  ['Starvation of long processes', 'Needs advance knowledge of burst times']
);

const SRTF = _stub(
  'SRTF - Shortest Remaining Time First', 'SRTF — Shortest Remaining Time First',
  'Preemptive', 'O(n log n)',
  'Preemptive SJF — a new arrival preempts if its burst is shorter than remaining time.',
  ['Optimal average waiting time'],
  ['High context-switch overhead', 'Starvation possible']
);

const PriorityNP = _stub(
  'Priority - Non Preemptive', 'Priority Scheduling (Non-Preemptive)',
  'Non-Preemptive', 'O(n²)',
  'Highest priority (lowest number) process runs to completion.',
  ['Important tasks served first'],
  ['Starvation of low-priority processes']
);

const PriorityP = _stub(
  'Priority - Preemptive', 'Priority Scheduling (Preemptive)',
  'Preemptive', 'O(n log n)',
  'A higher-priority arrival preempts the current process.',
  ['Dynamic prioritisation'],
  ['High overhead', 'Starvation possible']
);

const RoundRobin = _stub(
  'Round Robin', 'Round Robin',
  'Preemptive', 'O(n)',
  'Each process gets a fixed <b>time quantum</b>; rotated fairly.',
  ['Fair CPU sharing', 'Good for time-sharing systems'],
  ['Performance depends on quantum size', 'Higher average TAT than SJF']
);

// ─── Global registry ─────────────────────────────────────────────────────── //
const ALGORITHMS = {
  'FCFS - First Come First Serve':        new FCFS(),
  'SJF - Shortest Job First':             new SJF(),
  'SRTF - Shortest Remaining Time First': new SRTF(),
  'Priority - Non Preemptive':            new PriorityNP(),
  'Priority - Preemptive':                new PriorityP(),
  'Round Robin':                          new RoundRobin(),
};
