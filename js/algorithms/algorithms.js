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

// ─── SJF (Non-Preemptive) ────────────────────────────────────────────────── //
class SJF extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'SJF - Shortest Job First';
    this.implemented = true;
    this.description = {
      title: 'SJF — Shortest Job First',
      type: 'Non-Preemptive',
      complexity: 'O(n²)',
      body: 'At each scheduling point, the process with the <b>smallest burst time</b> in the ready queue is selected. Once started, the process runs to completion.',
      pros: ['Minimises average waiting time', 'Optimal for minimising average TAT'],
      cons: ['Starvation of long processes', 'Requires advance knowledge of burst times'],
    };
  }

  schedule(processes) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const remaining = this._cloneProcesses(processes);
    // Sort by arrival time initially so idle-gap detection is simple
    remaining.sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));

    let t = 0, sn = 1;
    const completed = [];

    // Announce all processes
    remaining.forEach(p => {
      result.steps.push({ n: sn++, type: 'arrive',
        html: `<em>${p.pid}</em> arrives at time <b>${p.arrivalTime}</b> with burst time <b>${p.burstTime}</b>.` });
    });

    while (remaining.length > 0) {
      // Find all processes that have arrived by time t
      const ready = remaining.filter(p => p.arrivalTime <= t);

      if (ready.length === 0) {
        // CPU idle — jump to the next process arrival
        const nextArrival = Math.min(...remaining.map(p => p.arrivalTime));
        result.ganttBlocks.push(new GanttBlock('IDLE', t, nextArrival, true));
        result.steps.push({ n: sn++, type: 'idle',
          html: `CPU <span class="idle-chip">IDLE</span> from <b>${t}</b> → <b>${nextArrival}</b>. No process in ready queue.` });
        t = nextArrival;
        continue;
      }

      // Pick process with shortest burst time; break ties by arrival time, then PID
      ready.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
      const proc = ready[0];

      // Show what's in the ready queue at this decision point
      if (ready.length > 1) {
        const queue = ready.map(p => `<em>${p.pid}</em>(BT=${p.burstTime})`).join(', ');
        result.steps.push({ n: sn++, type: 'info',
          html: `Ready queue at t=<b>${t}</b>: [${queue}] → <em>${proc.pid}</em> selected (shortest BT).` });
      }

      // Remove from remaining
      const idx = remaining.indexOf(proc);
      remaining.splice(idx, 1);

      proc.startTime      = t;
      proc.completionTime = t + proc.burstTime;
      proc.computeMetrics();

      result.ganttBlocks.push(new GanttBlock(proc.pid, proc.startTime, proc.completionTime, false, proc.pid));
      result.steps.push({ n: sn++, type: 'execute',
        html: `<em>${proc.pid}</em> runs <b>${proc.startTime}→${proc.completionTime}</b>
               &nbsp;|&nbsp; TAT <span class="chip blue">${proc.turnaroundTime}</span>
               WT <span class="chip green">${proc.waitingTime}</span>
               RT <span class="chip purple">${proc.responseTime}</span>` });

      t = proc.completionTime;
      completed.push(proc);

      // Announce any new arrivals during this burst
      const newArrivals = remaining.filter(p => p.arrivalTime > proc.startTime && p.arrivalTime <= t);
      newArrivals.forEach(p => {
        result.steps.push({ n: sn++, type: 'info',
          html: `<em>${p.pid}</em> joined the ready queue at t=<b>${p.arrivalTime}</b> while <em>${proc.pid}</em> was running.` });
      });
    }

    result.steps.push({ n: sn, type: 'done', html: `✓ All processes completed at time <b>${t}</b>.` });
    result.processes = completed;
    result.stats = this._computeStatistics(completed, result.ganttBlocks);
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
