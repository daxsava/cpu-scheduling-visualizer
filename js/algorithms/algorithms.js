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

// ─── SRTF (Preemptive SJF) ──────────────────────────────────────────────── //
class SRTF extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'SRTF - Shortest Remaining Time First';
    this.implemented = true;
    this.description = {
      title: 'SRTF — Shortest Remaining Time First',
      type: 'Preemptive',
      complexity: 'O(n²)',
      body: 'Preemptive version of SJF. At every unit of time, the process with the <b>shortest remaining burst time</b> is executed. A new arrival can preempt the running process.',
      pros: ['Optimal average waiting time', 'Responsive to short jobs'],
      cons: ['High context-switch overhead', 'Starvation of long processes', 'Needs burst time knowledge'],
    };
  }

  schedule(processes) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const procs = this._cloneProcesses(processes);
    procs.forEach(p => { p.remainingTime = p.burstTime; p.startTime = null; });
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Announce all arrivals upfront
    let sn = 1;
    procs.forEach(p => result.steps.push({ n: sn++, type: 'arrive',
      html: `<em>${p.pid}</em> arrives at t=<b>${p.arrivalTime}</b>, BT=<b>${p.burstTime}</b>.` }));

    let t = 0, completed = 0, n = procs.length;
    let lastPid = null; // tracks which PID owns the current open gantt block

    while (completed < n) {
      const ready = procs.filter(p => p.arrivalTime <= t && p.remainingTime > 0);

      if (!ready.length) {
        // No process ready — CPU idle. Jump to next arrival.
        const nextArr = Math.min(...procs.filter(p => p.remainingTime > 0).map(p => p.arrivalTime));
        if (lastPid !== 'IDLE') {
          result.ganttBlocks.push(new GanttBlock('IDLE', t, nextArr, true));
          result.steps.push({ n: sn++, type: 'idle',
            html: `CPU <span class="idle-chip">IDLE</span> from <b>${t}</b> → <b>${nextArr}</b>.` });
          lastPid = 'IDLE';
        } else {
          // extend the existing IDLE block
          result.ganttBlocks[result.ganttBlocks.length - 1].end = nextArr;
        }
        t = nextArr;
        continue;
      }

      // Pick process with shortest remaining time; ties by arrival then PID
      ready.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
      const proc = ready[0];

      // Record first-time start
      if (proc.startTime === null) proc.startTime = t;

      if (proc.pid !== lastPid) {
        // Context switch — log preemption if something was running before
        if (lastPid !== null && lastPid !== 'IDLE') {
          const prev = procs.find(p => p.pid === lastPid);
          if (prev && prev.remainingTime > 0) {
            result.steps.push({ n: sn++, type: 'info',
              html: `<em>${proc.pid}</em> preempts <em>${lastPid}</em> at t=<b>${t}</b> (${lastPid} has ${prev.remainingTime} left).` });
          }
        }
        // Open a new gantt block for the incoming process
        result.ganttBlocks.push(new GanttBlock(proc.pid, t, t + 1, false, proc.pid));
        lastPid = proc.pid;
      } else {
        // Same process continues — just extend the current block
        result.ganttBlocks[result.ganttBlocks.length - 1].end = t + 1;
      }

      proc.remainingTime--;
      t++;

      if (proc.remainingTime === 0) {
        proc.completionTime = t;
        proc.computeMetrics();
        result.steps.push({ n: sn++, type: 'execute',
          html: `<em>${proc.pid}</em> completes at t=<b>${t}</b>
                 &nbsp;|&nbsp; TAT <span class="chip blue">${proc.turnaroundTime}</span>
                 WT <span class="chip green">${proc.waitingTime}</span>
                 RT <span class="chip purple">${proc.responseTime}</span>` });
        lastPid = null; // block is closed; next process will open a new one
        completed++;
      }
    }

    // Merge consecutive same-pid blocks for cleaner display
    const merged = [];
    result.ganttBlocks.forEach(b => {
      const last = merged[merged.length - 1];
      if (last && last.pid === b.pid && last.end === b.start && !b.isIdle) {
        last.end = b.end;
      } else {
        merged.push({ ...b });
      }
    });
    result.ganttBlocks = merged;

    result.steps.push({ n: sn, type: 'done', html: `✓ All processes completed at time <b>${t}</b>.` });
    result.processes = procs.filter(p => p.completionTime !== null);
    result.stats = this._computeStatistics(result.processes, result.ganttBlocks);
    return result;
  }
}

// ─── Priority Non-Preemptive ─────────────────────────────────────────────── //
class PriorityNP extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'Priority - Non Preemptive';
    this.implemented = true;
    this.description = {
      title: 'Priority Scheduling (Non-Preemptive)',
      type: 'Non-Preemptive',
      complexity: 'O(n²)',
      body: 'Each process has a <b>priority number</b> (lower = higher priority). The CPU is given to the highest-priority ready process. Once started, it runs to completion.',
      pros: ['Important tasks served first', 'Simple to implement'],
      cons: ['Starvation of low-priority processes', 'Priority inversion possible'],
    };
  }

  schedule(processes) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const remaining = this._cloneProcesses(processes);
    remaining.sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));

    let t = 0, sn = 1;
    const completed = [];

    remaining.forEach(p => result.steps.push({ n: sn++, type: 'arrive',
      html: `<em>${p.pid}</em> arrives at t=<b>${p.arrivalTime}</b>, BT=<b>${p.burstTime}</b>, Priority=<b>${p.priority}</b>.` }));

    while (remaining.length > 0) {
      const ready = remaining.filter(p => p.arrivalTime <= t);

      if (!ready.length) {
        const nextArr = Math.min(...remaining.map(p => p.arrivalTime));
        result.ganttBlocks.push(new GanttBlock('IDLE', t, nextArr, true));
        result.steps.push({ n: sn++, type: 'idle',
          html: `CPU <span class="idle-chip">IDLE</span> from <b>${t}</b> → <b>${nextArr}</b>.` });
        t = nextArr; continue;
      }

      // Lower priority number = higher priority; tie-break: arrival time then PID
      ready.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
      const proc = ready[0];

      if (ready.length > 1) {
        const q = ready.map(p => `<em>${p.pid}</em>(P=${p.priority})`).join(', ');
        result.steps.push({ n: sn++, type: 'info',
          html: `Ready queue at t=<b>${t}</b>: [${q}] → <em>${proc.pid}</em> selected (highest priority).` });
      }

      remaining.splice(remaining.indexOf(proc), 1);
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
      completed.push(proc);
    }

    result.steps.push({ n: sn, type: 'done', html: `✓ All processes completed at time <b>${t}</b>.` });
    result.processes = completed;
    result.stats = this._computeStatistics(completed, result.ganttBlocks);
    return result;
  }
}

// ─── Priority Preemptive ─────────────────────────────────────────────────── //
class PriorityP extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name = 'Priority - Preemptive';
    this.implemented = true;
    this.description = {
      title: 'Priority Scheduling (Preemptive)',
      type: 'Preemptive',
      complexity: 'O(n²)',
      body: 'Like non-preemptive priority, but if a <b>higher-priority process arrives</b>, it immediately preempts the running process.',
      pros: ['Highly responsive to critical tasks', 'Real-time system support'],
      cons: ['High context-switch overhead', 'Starvation of low-priority processes'],
    };
  }

  schedule(processes) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const procs = this._cloneProcesses(processes);
    procs.forEach(p => { p.remainingTime = p.burstTime; p.startTime = null; });
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let t = 0, sn = 1, completed = 0, n = procs.length;
    let lastPid = null, ganttStart = 0;

    procs.forEach(p => result.steps.push({ n: sn++, type: 'arrive',
      html: `<em>${p.pid}</em> arrives at t=<b>${p.arrivalTime}</b>, BT=<b>${p.burstTime}</b>, Priority=<b>${p.priority}</b>.` }));

    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) + procs[procs.length - 1].arrivalTime + 1;

    while (completed < n && t < maxTime) {
      const ready = procs.filter(p => p.arrivalTime <= t && p.remainingTime > 0);

      if (!ready.length) {
        const nextArr = Math.min(...procs.filter(p => p.remainingTime > 0).map(p => p.arrivalTime));
        if (lastPid !== null) { result.ganttBlocks.push(new GanttBlock(lastPid, ganttStart, t, false, lastPid)); }
        result.ganttBlocks.push(new GanttBlock('IDLE', t, nextArr, true));
        result.steps.push({ n: sn++, type: 'idle',
          html: `CPU <span class="idle-chip">IDLE</span> from <b>${t}</b> → <b>${nextArr}</b>.` });
        ganttStart = nextArr; lastPid = null; t = nextArr; continue;
      }

      ready.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
      const proc = ready[0];

      if (proc.startTime === null) proc.startTime = t;

      if (proc.pid !== lastPid) {
        if (lastPid !== null) {
          result.ganttBlocks.push(new GanttBlock(lastPid, ganttStart, t, false, lastPid));
          const prev = procs.find(p => p.pid === lastPid);
          if (prev && prev.remainingTime > 0)
            result.steps.push({ n: sn++, type: 'info',
              html: `<em>${proc.pid}</em> (priority <b>${proc.priority}</b>) preempts <em>${lastPid}</em> at t=<b>${t}</b>.` });
        }
        ganttStart = t; lastPid = proc.pid;
      }

      proc.remainingTime--; t++;

      if (proc.remainingTime === 0) {
        proc.completionTime = t;
        proc.computeMetrics();
        result.ganttBlocks.push(new GanttBlock(proc.pid, ganttStart, t, false, proc.pid));
        result.steps.push({ n: sn++, type: 'execute',
          html: `<em>${proc.pid}</em> completes at t=<b>${t}</b>
                 &nbsp;|&nbsp; TAT <span class="chip blue">${proc.turnaroundTime}</span>
                 WT <span class="chip green">${proc.waitingTime}</span>
                 RT <span class="chip purple">${proc.responseTime}</span>` });
        ganttStart = t; lastPid = null; completed++;
      }
    }

    // Merge consecutive Gantt blocks
    const merged = [];
    result.ganttBlocks.forEach(b => {
      const last = merged[merged.length - 1];
      if (last && last.pid === b.pid && last.end === b.start && !b.isIdle) last.end = b.end;
      else merged.push({ ...b });
    });
    result.ganttBlocks = merged;

    result.steps.push({ n: sn, type: 'done', html: `✓ All processes completed at time <b>${t}</b>.` });
    result.processes = procs.filter(p => p.completionTime !== null);
    result.stats = this._computeStatistics(result.processes, result.ganttBlocks);
    return result;
  }
}

// ─── Round Robin ─────────────────────────────────────────────────────────── //
class RoundRobin extends SchedulingAlgorithm {
  constructor(quantum = 2) {
    super();
    this.quantum = quantum;
    this.name = 'Round Robin';
    this.implemented = true;
    this.description = {
      title: 'Round Robin',
      type: 'Preemptive',
      complexity: 'O(n)',
      body: 'Each process is given a fixed <b>time quantum</b>. After the quantum expires, it goes to the back of the ready queue. Repeated until all processes finish.',
      pros: ['Fair — every process gets equal CPU time', 'Good response time for interactive systems'],
      cons: ['Performance heavily depends on quantum size', 'Higher average TAT than SJF'],
    };
  }

  schedule(processes, quantum) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const q = quantum || this.quantum;
    const procs = this._cloneProcesses(processes);
    procs.forEach(p => { p.remainingTime = p.burstTime; p.startTime = null; });
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));

    let t = 0, sn = 1;
    const queue = [];    // ready queue (ordered)
    const done = [];
    const inQueue = new Set();

    result.steps.push({ n: sn++, type: 'info',
      html: `Round Robin started with time quantum = <b>${q}</b>.` });

    procs.forEach(p => result.steps.push({ n: sn++, type: 'arrive',
      html: `<em>${p.pid}</em> arrives at t=<b>${p.arrivalTime}</b>, BT=<b>${p.burstTime}</b>.` }));

    // Enqueue processes that arrive at time 0
    procs.filter(p => p.arrivalTime <= t).forEach(p => { queue.push(p); inQueue.add(p.pid); });

    const maxTime = procs.reduce((s, p) => s + p.burstTime, 0) + procs[procs.length - 1].arrivalTime + 1;

    while ((queue.length > 0 || procs.some(p => p.remainingTime > 0)) && t < maxTime) {
      if (!queue.length) {
        // CPU idle
        const nextArr = Math.min(...procs.filter(p => p.remainingTime > 0 && !inQueue.has(p.pid)).map(p => p.arrivalTime));
        result.ganttBlocks.push(new GanttBlock('IDLE', t, nextArr, true));
        result.steps.push({ n: sn++, type: 'idle',
          html: `CPU <span class="idle-chip">IDLE</span> from <b>${t}</b> → <b>${nextArr}</b>.` });
        t = nextArr;
        procs.filter(p => p.arrivalTime <= t && p.remainingTime > 0 && !inQueue.has(p.pid))
             .forEach(p => { queue.push(p); inQueue.add(p.pid); });
        continue;
      }

      const proc = queue.shift();
      if (proc.startTime === null) proc.startTime = t;

      const execTime = Math.min(q, proc.remainingTime);
      const execEnd  = t + execTime;

      result.ganttBlocks.push(new GanttBlock(proc.pid, t, execEnd, false, proc.pid));

      // Enqueue arrivals during this slice
      procs.filter(p => p.arrivalTime > t && p.arrivalTime <= execEnd && p.remainingTime > 0 && !inQueue.has(p.pid))
           .forEach(p => { queue.push(p); inQueue.add(p.pid); });

      proc.remainingTime -= execTime;
      t = execEnd;

      if (proc.remainingTime === 0) {
        proc.completionTime = t;
        proc.computeMetrics();
        result.steps.push({ n: sn++, type: 'execute',
          html: `<em>${proc.pid}</em> runs slice <b>${t - execTime}→${t}</b> and <b>completes</b>.
                 &nbsp;|&nbsp; TAT <span class="chip blue">${proc.turnaroundTime}</span>
                 WT <span class="chip green">${proc.waitingTime}</span>
                 RT <span class="chip purple">${proc.responseTime}</span>` });
        done.push(proc);
      } else {
        result.steps.push({ n: sn++, type: 'execute',
          html: `<em>${proc.pid}</em> runs slice <b>${t - execTime}→${t}</b>, remaining=<b>${proc.remainingTime}</b> → back to queue.` });
        queue.push(proc);  // re-enqueue at back
      }
    }

    result.steps.push({ n: sn, type: 'done', html: `✓ All processes completed at time <b>${t}</b>.` });
    result.processes = done;
    result.stats = this._computeStatistics(done, result.ganttBlocks);
    return result;
  }
}

// ─── Global registry ─────────────────────────────────────────────────────── //
const ALGORITHMS = {
  'FCFS - First Come First Serve':        new FCFS(),
  'SJF - Shortest Job First':             new SJF(),
  'SRTF - Shortest Remaining Time First': new SRTF(),
  'Priority - Non Preemptive':            new PriorityNP(),
  'Priority - Preemptive':                new PriorityP(),
  'Round Robin':                          new RoundRobin(2),
};
