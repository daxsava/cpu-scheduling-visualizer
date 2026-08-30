// js/models/process.js
class Process {
  constructor(pid, arrivalTime, burstTime, priority = 0) {
    this.pid = pid;
    this.arrivalTime = arrivalTime;
    this.burstTime = burstTime;
    this.priority = priority;
    this.startTime = null;
    this.completionTime = null;
    this.turnaroundTime = null;
    this.waitingTime = null;
    this.responseTime = null;
    this.remainingTime = burstTime;
  }
  computeMetrics() {
    this.turnaroundTime = this.completionTime - this.arrivalTime;
    this.waitingTime    = this.turnaroundTime - this.burstTime;
    this.responseTime   = this.startTime - this.arrivalTime;
  }
  clone() {
    return new Process(this.pid, this.arrivalTime, this.burstTime, this.priority);
  }
}
