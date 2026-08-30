// js/algorithms/base.js
class GanttBlock {
  constructor(label, start, end, isIdle = false, pid = '') {
    this.label = label; this.start = start; this.end = end;
    this.isIdle = isIdle; this.pid = pid;
  }
  get duration() { return this.end - this.start; }
}

class Statistics {
  constructor() {
    this.avgWaitingTime = 0; this.avgTurnaroundTime = 0;
    this.avgResponseTime = 0; this.cpuUtilization = 0; this.throughput = 0;
  }
}

class ScheduleResult {
  constructor() {
    this.processes = []; this.ganttBlocks = [];
    this.steps = []; this.stats = new Statistics();
  }
}

class SchedulingAlgorithm {
  constructor() { this.name = ''; this.description = {}; this.implemented = false; }
  schedule() { throw new Error('Not implemented'); }
  _cloneProcesses(ps) { return ps.map(p => p.clone()); }
  _computeStatistics(processes, ganttBlocks) {
    const n = processes.length;
    if (!n) return new Statistics();
    const s = new Statistics();
    s.avgWaitingTime    = processes.reduce((a, p) => a + p.waitingTime, 0) / n;
    s.avgTurnaroundTime = processes.reduce((a, p) => a + p.turnaroundTime, 0) / n;
    s.avgResponseTime   = processes.reduce((a, p) => a + p.responseTime, 0) / n;
    const total = ganttBlocks.length ? ganttBlocks[ganttBlocks.length - 1].end : 0;
    const busy  = ganttBlocks.filter(b => !b.isIdle).reduce((a, b) => a + b.duration, 0);
    s.cpuUtilization = total > 0 ? (busy / total) * 100 : 0;
    s.throughput     = total > 0 ? n / total : 0;
    return s;
  }
}
