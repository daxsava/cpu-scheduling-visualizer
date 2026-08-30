// js/algorithms/fcfs.js
// First Come First Serve — fully implemented

class FCFS extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name        = 'FCFS - First Come First Serve';
    this.implemented = true;
    this.description = {
      title: 'FCFS — First Come First Serve',
      body: `Processes are executed strictly in the order they arrive in the ready queue.
It is a <strong>non-preemptive</strong> algorithm — once a process starts, it runs to completion.`,
      pros: ['Simple and easy to implement', 'Every process eventually gets the CPU (no starvation)'],
      cons: ['Can cause the <strong>Convoy Effect</strong>', 'Long processes block shorter ones → high average waiting time'],
      complexity: 'O(n log n)',
      type: 'Non-Preemptive',
    };
  }

  schedule(processes) {
    const result = new ScheduleResult();
    if (!processes.length) return result;

    const procs = this._cloneProcesses(processes);
    procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));

    let currentTime = 0;
    let stepNum = 1;

    // Announce time-0 arrivals
    const atZero = procs.filter(p => p.arrivalTime === 0);
    if (atZero.length) {
      result.steps.push({
        n: stepNum++,
        text: `${atZero.map(p => `<span class="pid-tag">${p.pid}</span>`).join(', ')} arrive${atZero.length > 1 ? '' : 's'} at time <strong>0</strong>.`,
        type: 'arrive',
      });
    }

    procs.forEach((proc, idx) => {
      // Non-zero arrivals
      if (proc.arrivalTime > 0) {
        result.steps.push({
          n: stepNum++,
          text: `<span class="pid-tag">${proc.pid}</span> arrives at time <strong>${proc.arrivalTime}</strong>.`,
          type: 'arrive',
        });
      }

      // CPU idle gap
      if (currentTime < proc.arrivalTime) {
        result.ganttBlocks.push(new GanttBlock('IDLE', currentTime, proc.arrivalTime, true, ''));
        result.steps.push({
          n: stepNum++,
          text: `CPU is <span class="idle-tag">IDLE</span> from <strong>${currentTime}</strong> → <strong>${proc.arrivalTime}</strong>.`,
          type: 'idle',
        });
        currentTime = proc.arrivalTime;
      }

      // Execute
      proc.startTime      = currentTime;
      proc.completionTime = currentTime + proc.burstTime;
      proc.computeMetrics();

      result.ganttBlocks.push(new GanttBlock(proc.pid, proc.startTime, proc.completionTime, false, proc.pid));

      result.steps.push({
        n: stepNum++,
        text: `<span class="pid-tag">${proc.pid}</span> executes: <strong>${proc.startTime}</strong> → <strong>${proc.completionTime}</strong>
               &nbsp;|&nbsp; TAT: <span class="metric">+${proc.turnaroundTime}</span>&nbsp;
               WT: <span class="metric">${proc.waitingTime}</span>&nbsp;
               RT: <span class="metric">${proc.responseTime}</span>`,
        type: 'execute',
      });

      currentTime = proc.completionTime;

      // Next process already waiting?
      if (idx + 1 < procs.length && procs[idx + 1].arrivalTime <= currentTime) {
        result.steps.push({
          n: stepNum++,
          text: `<span class="pid-tag">${procs[idx+1].pid}</span> is waiting in the ready queue (arrived at <strong>${procs[idx+1].arrivalTime}</strong>).`,
          type: 'info',
        });
      }
    });

    result.steps.push({
      n: stepNum,
      text: `All processes completed. Total time: <strong>${currentTime}</strong>.`,
      type: 'done',
    });

    result.processes = procs;
    result.stats     = this._computeStatistics(procs, result.ganttBlocks);
    return result;
  }
}

// ── Coming-soon stubs ────────────────────────────────────────────────────── //

class SJF extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name        = 'SJF - Shortest Job First';
    this.implemented = false;
    this.description = {
      title: 'SJF — Shortest Job First',
      body: 'Selects the process with the <strong>smallest burst time</strong> from the ready queue. Non-preemptive.',
      pros: ['Minimises average waiting time'],
      cons: ['Starvation of long processes', 'Requires prior knowledge of burst times'],
      complexity: 'O(n²)',
      type: 'Non-Preemptive',
    };
  }
  schedule() { return comingSoon(this.name); }
}

class SRTF extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name        = 'SRTF - Shortest Remaining Time First';
    this.implemented = false;
    this.description = {
      title: 'SRTF — Shortest Remaining Time First',
      body: 'Preemptive version of SJF. A newly arriving process <strong>preempts</strong> the CPU if its burst time is shorter than the remaining time of the running process.',
      pros: ['Optimal average waiting time'],
      cons: ['High context-switch overhead', 'Starvation possible'],
      complexity: 'O(n log n)',
      type: 'Preemptive',
    };
  }
  schedule() { return comingSoon(this.name); }
}

class PriorityNP extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name        = 'Priority - Non Preemptive';
    this.implemented = false;
    this.description = {
      title: 'Priority Scheduling (Non-Preemptive)',
      body: 'Each process has a <strong>priority number</strong>. The CPU is allocated to the highest-priority process. Once started, the process runs to completion.',
      pros: ['Important tasks served first'],
      cons: ['Starvation of low-priority processes'],
      complexity: 'O(n²)',
      type: 'Non-Preemptive',
    };
  }
  schedule() { return comingSoon(this.name); }
}

class PriorityP extends SchedulingAlgorithm {
  constructor() {
    super();
    this.name        = 'Priority - Preemptive';
    this.implemented = false;
    this.description = {
      title: 'Priority Scheduling (Preemptive)',
      body: 'Like non-preemptive priority, but a higher-priority process that arrives will <strong>preempt</strong> the running process.',
      pros: ['Real-time task support'],
      cons: ['High overhead', 'Starvation possible'],
      complexity: 'O(n log n)',
      type: 'Preemptive',
    };
  }
  schedule() { return comingSoon(this.name); }
}

class RoundRobin extends SchedulingAlgorithm {
  constructor(quantum = 2) {
    super();
    this.name        = 'Round Robin';
    this.quantum     = quantum;
    this.implemented = false;
    this.description = {
      title: 'Round Robin',
      body: 'Each process is given a fixed <strong>time quantum</strong>. After the quantum expires, the process is moved to the back of the ready queue.',
      pros: ['Fair CPU allocation', 'Good for time-sharing'],
      cons: ['Performance depends on quantum size', 'Higher average TAT than SJF'],
      complexity: 'O(n)',
      type: 'Preemptive',
    };
  }
  schedule() { return comingSoon(this.name); }
}

function comingSoon(name) {
  const result = new ScheduleResult();
  result.steps = [{ n: 1, text: `<strong>${name}</strong> is coming soon.`, type: 'coming-soon' }];
  return result;
}

// Global registry
const ALGORITHMS = {
  'FCFS - First Come First Serve':        new FCFS(),
  'SJF - Shortest Job First':             new SJF(),
  'SRTF - Shortest Remaining Time First': new SRTF(),
  'Priority - Non Preemptive':            new PriorityNP(),
  'Priority - Preemptive':                new PriorityP(),
  'Round Robin':                          new RoundRobin(2),
};
