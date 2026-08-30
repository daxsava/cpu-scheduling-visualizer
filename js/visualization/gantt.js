// js/visualization/gantt.js  —  Canvas-based Gantt chart renderer

const PALETTE = [
  { bg: '#6C63FF', fg: '#fff' },
  { bg: '#FF6584', fg: '#fff' },
  { bg: '#43B89C', fg: '#fff' },
  { bg: '#FF9F43', fg: '#fff' },
  { bg: '#54A0FF', fg: '#fff' },
  { bg: '#5F27CD', fg: '#fff' },
  { bg: '#01CBC6', fg: '#fff' },
  { bg: '#FF6B6B', fg: '#fff' },
  { bg: '#FECA57', fg: '#1a1a2e' },
  { bg: '#1DD1A1', fg: '#1a1a2e' },
];

class GanttRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this._colorMap = {};
    this._colorIdx = 0;
  }

  _getColor(pid) {
    if (!this._colorMap[pid]) {
      this._colorMap[pid] = PALETTE[this._colorIdx++ % PALETTE.length];
    }
    return this._colorMap[pid];
  }

  _darken(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.floor(((n >> 16) & 0xff) * 0.75);
    const g = Math.floor(((n >> 8)  & 0xff) * 0.75);
    const b = Math.floor(( n        & 0xff) * 0.75);
    return `rgb(${r},${g},${b})`;
  }

  draw(ganttBlocks) {
    this._colorMap = {};
    this._colorIdx = 0;
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!ganttBlocks || !ganttBlocks.length) {
      ctx.fillStyle = '#2a2a4a';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Run the algorithm to see the Gantt chart', W / 2, H / 2);
      return;
    }

    const PAD_L  = 30;
    const PAD_R  = 30;
    const TOP    = 24;
    const BH     = 54;   // block height
    const usable = W - PAD_L - PAD_R;
    const total  = ganttBlocks[ganttBlocks.length - 1].end - ganttBlocks[0].start;
    const scale  = total > 0 ? usable / total : 1;

    let x = PAD_L;

    ganttBlocks.forEach(block => {
      const bw = Math.max(block.duration * scale, 40);

      if (block.isIdle) {
        // IDLE block
        ctx.fillStyle = '#1e1e3a';
        ctx.strokeStyle = '#4a4a6a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        this._roundRect(ctx, x, TOP, bw, BH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#5c6bc0';
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('IDLE', x + bw / 2, TOP + BH / 2 + 4);
      } else {
        const c = this._getColor(block.pid);
        // Shadow
        ctx.shadowColor = c.bg + '66';
        ctx.shadowBlur  = 8;
        ctx.fillStyle   = c.bg;
        ctx.strokeStyle = this._darken(c.bg);
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        this._roundRect(ctx, x, TOP, bw, BH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = c.fg;
        ctx.font = 'bold 13px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(block.label, x + bw / 2, TOP + BH / 2 + 4);
      }

      // Tick + time label
      ctx.strokeStyle = '#a8b2d8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, TOP + BH);
      ctx.lineTo(x, TOP + BH + 8);
      ctx.stroke();

      ctx.fillStyle = '#a8b2d8';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(block.start, x, TOP + BH + 18);

      x += bw;
    });

    // Final tick + time
    const lastBlock = ganttBlocks[ganttBlocks.length - 1];
    ctx.strokeStyle = '#a8b2d8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, TOP + BH);
    ctx.lineTo(x, TOP + BH + 8);
    ctx.stroke();
    ctx.fillStyle = '#a8b2d8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lastBlock.end, x, TOP + BH + 18);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
