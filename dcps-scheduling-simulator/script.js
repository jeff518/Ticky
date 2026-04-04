/**
 * DCPS Scheduling Simulator — vanilla JS
 * Security: strict input bounds, textContent-only for user data, schema-checked localStorage, no eval.
 */
'use strict';

// ---------------------------------------------------------------------------
// Security & limits
// ---------------------------------------------------------------------------
const LIMITS = {
  maxProcesses: 20,
  minProcesses: 1,
  maxTime: 50000,
  maxBurst: 10000,
  maxArrival: 10000,
  maxPriority: 1000,
  maxQuantum: 1000,
  minQuantum: 1,
  maxDiskRequests: 50,
  maxCylinder: 10000,
  maxQueueStringLen: 500,
  storageKey: 'dcps_simulator_v1',
  storageVersion: 1,
  bankMinN: 2,
  bankMaxN: 8,
  bankMinM: 1,
  bankMaxM: 6,
  bankMaxCell: 999,
  maxPageRequests: 100,
  maxPageFrames: 20,
};

/** @param {unknown} n */
function isSafeInt(n) {
  return typeof n === 'number' && Number.isFinite(n) && Math.floor(n) === n;
}

/**
 * Parse bounded non-negative integer from string input.
 */
function parseBoundedInt(raw, min, max) {
  if (typeof raw !== 'string') raw = String(raw ?? '');
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return { ok: false, error: 'Use digits only (no decimals or signs).' };
  const v = parseInt(t, 10);
  if (!isSafeInt(v) || v < min || v > max) return { ok: false, error: `Value must be between ${min} and ${max}.` };
  return { ok: true, value: v };
}

/**
 * Disk queue: comma-separated positive integers, max count.
 */
function parseDiskQueue(str) {
  if (typeof str !== 'string' || str.length > LIMITS.maxQueueStringLen) {
    return { ok: false, error: 'Queue string is too long.' };
  }
  const parts = str.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: 'Enter at least one cylinder request.' };
  if (parts.length > LIMITS.maxDiskRequests) return { ok: false, error: `At most ${LIMITS.maxDiskRequests} requests.` };
  const out = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return { ok: false, error: 'Queue must contain only non-negative integers.' };
    const v = parseInt(p, 10);
    if (v > LIMITS.maxCylinder) return { ok: false, error: `Each request must be ≤ ${LIMITS.maxCylinder}.` };
    out.push(v);
  }
  return { ok: true, value: out };
}

/**
 * Page queue: comma or space separated positive integers.
 */
function parsePageQueue(str) {
  if (typeof str !== 'string' || str.length > LIMITS.maxQueueStringLen) {
    return { ok: false, error: 'Page string is too long.' };
  }
  const parts = str.split(/[\s,]+/).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: 'Enter at least one page request.' };
  if (parts.length > LIMITS.maxPageRequests) return { ok: false, error: `At most ${LIMITS.maxPageRequests} requests.` };
  const out = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return { ok: false, error: 'Page string must contain only non-negative integers.' };
    out.push(parseInt(p, 10));
  }
  return { ok: true, value: out };
}

/** @param {HTMLElement} el @param {string} text */
function setText(el, text) {
  if (el) el.textContent = text;
}

/** @param {HTMLElement} el */
function clearEl(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

// ---------------------------------------------------------------------------
// CPU scheduling
// ---------------------------------------------------------------------------

function scheduleFCFS(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
  let t = 0;
  const gantt = [];
  const done = [];
  for (const p of sorted) {
    if (t < p.arrival) {
      gantt.push({ id: 'Idle', start: t, end: p.arrival });
      t = p.arrival;
    }
    gantt.push({ id: `P${p.pid}`, start: t, end: t + p.burst });
    t += p.burst;
    done.push({
      ...p,
      completion: t,
      tat: t - p.arrival,
      wt: t - p.arrival - p.burst,
    });
  }
  return { gantt, processes: done.sort((a, b) => a.pid - b.pid) };
}

function scheduleSJF_NP(processes) {
  const n = processes.length;
  const remaining = processes.map((p) => ({ ...p, left: p.burst, finished: false }));
  let t = 0;
  const gantt = [];
  const stats = new Map();
  let completed = 0;

  while (completed < n) {
    const ready = remaining.filter((p) => !p.finished && p.arrival <= t);
    if (ready.length === 0) {
      const pending = remaining.filter((p) => !p.finished);
      if (pending.length === 0) break;
      const nextT = Math.min(...pending.map((p) => p.arrival));
      if (t < nextT) gantt.push({ id: 'Idle', start: t, end: nextT });
      t = nextT;
      continue;
    }
    ready.sort((a, b) => a.left - b.left || a.arrival - b.arrival || a.pid - b.pid);
    const p = ready[0];
    gantt.push({ id: `P${p.pid}`, start: t, end: t + p.left });
    t += p.left;
    p.finished = true;
    completed++;
    stats.set(p.pid, {
      completion: t,
      tat: t - p.arrival,
      wt: t - p.arrival - p.burst,
    });
  }

  const procs = processes
    .map((p) => {
      const s = stats.get(p.pid);
      return { ...p, completion: s.completion, tat: s.tat, wt: s.wt };
    })
    .sort((a, b) => a.pid - b.pid);
  return { gantt, processes: procs };
}

function schedulePriority_NP(processes) {
  const n = processes.length;
  const remaining = processes.map((p) => ({ ...p, left: p.burst, finished: false }));
  let t = 0;
  const gantt = [];
  const stats = new Map();
  let completed = 0;

  while (completed < n) {
    const ready = remaining.filter((p) => !p.finished && p.arrival <= t);
    if (ready.length === 0) {
      const pending = remaining.filter((p) => !p.finished);
      if (pending.length === 0) break;
      const nextT = Math.min(...pending.map((p) => p.arrival));
      if (t < nextT) gantt.push({ id: 'Idle', start: t, end: nextT });
      t = nextT;
      continue;
    }
    ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.pid - b.pid);
    const p = ready[0];
    gantt.push({ id: `P${p.pid}`, start: t, end: t + p.left });
    t += p.left;
    p.finished = true;
    completed++;
    stats.set(p.pid, {
      completion: t,
      tat: t - p.arrival,
      wt: t - p.arrival - p.burst,
    });
  }

  const procs = processes
    .map((p) => {
      const s = stats.get(p.pid);
      return { ...p, completion: s.completion, tat: s.tat, wt: s.wt };
    })
    .sort((a, b) => a.pid - b.pid);
  return { gantt, processes: procs };
}

function scheduleRR(processes, quantum) {
  const procs = processes.map((p) => ({
    pid: p.pid,
    arrival: p.arrival,
    burst: p.burst,
    priority: p.priority,
    rem: p.burst,
    inQueue: false,
  }));
  const n = procs.length;
  let t = Math.min(...procs.map((p) => p.arrival));
  const ready = [];
  const gantt = [];
  let done = 0;
  const completion = {};

  function addNewArrivals() {
    const candidates = procs.filter((p) => p.rem > 0 && p.arrival <= t && !p.inQueue);
    candidates.sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
    for (const p of candidates) {
      p.inQueue = true;
      ready.push(p);
    }
  }

  addNewArrivals();

  while (done < n) {
    if (ready.length === 0) {
      const future = procs.filter((p) => p.rem > 0 && p.arrival > t);
      if (future.length === 0) break;
      const nextT = Math.min(...future.map((p) => p.arrival));
      gantt.push({ id: 'Idle', start: t, end: nextT });
      t = nextT;
      addNewArrivals();
      continue;
    }

    const p = ready.shift();
    p.inQueue = false;
    const run = Math.min(quantum, p.rem);
    const start = t;
    t += run;
    gantt.push({ id: `P${p.pid}`, start, end: t });
    p.rem -= run;

    const midArrivals = procs.filter(
      (o) => o.rem > 0 && o.arrival > start && o.arrival <= t && !o.inQueue
    );
    midArrivals.sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
    for (const o of midArrivals) {
      o.inQueue = true;
      ready.push(o);
    }

    if (p.rem > 0) {
      p.inQueue = true;
      ready.push(p);
    } else {
      completion[p.pid] = t;
      done++;
    }
  }

  const out = processes.map((orig) => {
    const c = completion[orig.pid];
    const tat = c - orig.arrival;
    const wt = tat - orig.burst;
    return { ...orig, completion: c, tat, wt };
  });
  return { gantt, processes: out.sort((a, b) => a.pid - b.pid) };
}

function scheduleSRTF(processes) {
  const rem = Object.fromEntries(processes.map((p) => [p.pid, p.burst]));
  let t = Math.min(...processes.map((p) => p.arrival));
  const gantt = [];
  let completed = 0;
  const n = processes.length;
  const completion = {};

  while (completed < n) {
    const ready = processes.filter((p) => rem[p.pid] > 0 && p.arrival <= t);
    if (ready.length === 0) {
      const pending = processes.filter((p) => rem[p.pid] > 0);
      if (pending.length === 0) break;
      const nextArr = Math.min(...pending.map((p) => p.arrival));
      if (nextArr > t) gantt.push({ id: 'Idle', start: t, end: nextArr });
      t = nextArr;
      continue;
    }
    ready.sort((a, b) => rem[a.pid] - rem[b.pid] || a.arrival - b.arrival || a.pid - b.pid);
    const p = ready[0];
    const nextArrCandidates = processes.filter(
      (o) => o.arrival > t && o.arrival < t + rem[p.pid] && rem[o.pid] > 0
    );
    if (nextArrCandidates.length > 0) {
      const nextArr = Math.min(...nextArrCandidates.map((o) => o.arrival));
      const slice = nextArr - t;
      gantt.push({ id: `P${p.pid}`, start: t, end: nextArr });
      rem[p.pid] -= slice;
      t = nextArr;
    } else {
      const end = t + rem[p.pid];
      gantt.push({ id: `P${p.pid}`, start: t, end });
      t = end;
      rem[p.pid] = 0;
      completion[p.pid] = t;
      completed++;
    }
  }

  const procs = processes
    .map((p) => ({
      ...p,
      completion: completion[p.pid],
      tat: completion[p.pid] - p.arrival,
      wt: completion[p.pid] - p.arrival - p.burst,
    }))
    .sort((a, b) => a.pid - b.pid);
  return { gantt, processes: procs };
}

function schedulePriority_Preemptive(processes) {
  const rem = Object.fromEntries(processes.map((p) => [p.pid, p.burst]));
  let t = Math.min(...processes.map((p) => p.arrival));
  const gantt = [];
  let completed = 0;
  const n = processes.length;
  const completion = {};

  while (completed < n) {
    const ready = processes.filter((p) => rem[p.pid] > 0 && p.arrival <= t);
    if (ready.length === 0) {
      const pending = processes.filter((p) => rem[p.pid] > 0);
      if (pending.length === 0) break;
      const nextArr = Math.min(...pending.map((p) => p.arrival));
      if (nextArr > t) gantt.push({ id: 'Idle', start: t, end: nextArr });
      t = nextArr;
      continue;
    }
    ready.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival || a.pid - b.pid);
    const p = ready[0];
    const nextArrCandidates = processes.filter(
      (o) => o.arrival > t && o.arrival < t + rem[p.pid] && rem[o.pid] > 0
    );
    if (nextArrCandidates.length > 0) {
      const nextArr = Math.min(...nextArrCandidates.map((o) => o.arrival));
      const slice = nextArr - t;
      gantt.push({ id: `P${p.pid}`, start: t, end: nextArr });
      rem[p.pid] -= slice;
      t = nextArr;
    } else {
      const end = t + rem[p.pid];
      gantt.push({ id: `P${p.pid}`, start: t, end });
      t = end;
      rem[p.pid] = 0;
      completion[p.pid] = t;
      completed++;
    }
  }

  const procs = processes
    .map((p) => ({
      ...p,
      completion: completion[p.pid],
      tat: completion[p.pid] - p.arrival,
      wt: completion[p.pid] - p.arrival - p.burst,
    }))
    .sort((a, b) => a.pid - b.pid);
  return { gantt, processes: procs };
}

function runCPU(processes, algo, quantum) {
  switch (algo) {
    case 'fcfs':
      return scheduleFCFS(processes);
    case 'sjf-np':
      return scheduleSJF_NP(processes);
    case 'sjf-p':
      return scheduleSRTF(processes);
    case 'priority':
      return schedulePriority_NP(processes);
    case 'priority-p':
      return schedulePriority_Preemptive(processes);
    case 'rr':
      return scheduleRR(processes, quantum);
    default:
      return scheduleFCFS(processes);
  }
}

// ---------------------------------------------------------------------------
// Disk scheduling
// ---------------------------------------------------------------------------

function pairwiseSeeks(path) {
  const seeks = [];
  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1];
    const to = path[i];
    seeks.push({ from, to, dist: Math.abs(to - from) });
  }
  return seeks;
}

function diskFCFS(requests, head) {
  const path = [head, ...requests];
  const seeks = pairwiseSeeks(path);
  const total = seeks.reduce((s, x) => s + x.dist, 0);
  return { path, seeks, total };
}

function diskSSTF(requests, head) {
  const pending = new Set(requests);
  const path = [head];
  let pos = head;
  while (pending.size) {
    let best = null;
    let bestD = Infinity;
    for (const r of pending) {
      const d = Math.abs(r - pos);
      if (d < bestD || (d === bestD && r < best)) {
        bestD = d;
        best = r;
      }
    }
    pending.delete(best);
    path.push(best);
    pos = best;
  }
  const seeks = pairwiseSeeks(path);
  const total = seeks.reduce((s, x) => s + x.dist, 0);
  return { path, seeks, total };
}

function diskSCAN(requests, head, maxCyl, goRight) {
  const left = requests.filter((r) => r < head).sort((a, b) => b - a);
  const right = requests.filter((r) => r >= head).sort((a, b) => a - b);
  const path = [head];
  let pos = head;
  let total = 0;
  function go(to) {
    total += Math.abs(to - pos);
    pos = to;
    path.push(to);
  }
  if (goRight) {
    for (const r of right) go(r);
    if (pos < maxCyl) go(maxCyl);
    for (const r of left) go(r);
  } else {
    for (const r of left) go(r);
    if (pos > 0) go(0);
    for (const r of right) go(r);
  }
  const seeks = pairwiseSeeks(path);
  return { path, seeks, total };
}

function diskCSCAN(requests, head, maxCyl, goRight) {
  const sorted = [...requests].sort((a, b) => a - b);
  const path = [head];
  let pos = head;
  let total = 0;
  const seeks = [];
  function move(to) {
    const d = Math.abs(to - pos);
    total += d;
    seeks.push({ from: pos, to, dist: d });
    pos = to;
    path.push(to);
  }
  function jump(to) {
    pos = to;
    path.push(to);
  }
  if (goRight) {
    const right = sorted.filter((r) => r >= head);
    const left = sorted.filter((r) => r < head);
    for (const r of right) move(r);
    if (pos < maxCyl) move(maxCyl);
    jump(0);
    for (const r of left) move(r);
  } else {
    const left = sorted.filter((r) => r <= head).sort((a, b) => b - a);
    const right = sorted.filter((r) => r > head).sort((a, b) => a - b);
    for (const r of left) move(r);
    if (pos > 0) move(0);
    jump(maxCyl);
    for (const r of right.sort((a, b) => b - a)) move(r);
  }
  return { path, seeks, total };
}

function diskLOOK(requests, head, goRight) {
  if (requests.length === 0) return { path: [head], seeks: [], total: 0 };
  const left = requests.filter((r) => r < head).sort((a, b) => b - a);
  const right = requests.filter((r) => r > head).sort((a, b) => a - b);
  const path = [head];
  let pos = head;
  let total = 0;
  function go(to) {
    total += Math.abs(to - pos);
    pos = to;
    path.push(to);
  }
  if (goRight) {
    for (const r of right) go(r);
    for (const r of left) go(r);
  } else {
    for (const r of left) go(r);
    for (const r of right) go(r);
  }
  const seeks = pairwiseSeeks(path);
  return { path, seeks, total };
}

function diskCLOOK(requests, head, goRight) {
  if (requests.length === 0) return { path: [head], seeks: [], total: 0 };
  const sorted = [...requests].sort((a, b) => a - b);
  const path = [head];
  let pos = head;
  let total = 0;
  const seeks = [];
  function move(to) {
    const d = Math.abs(to - pos);
    total += d;
    seeks.push({ from: pos, to, dist: d });
    pos = to;
    path.push(to);
  }
  function jump(to) {
    pos = to;
    path.push(to);
  }
  if (goRight) {
    const ge = sorted.filter((r) => r >= head);
    const lt = sorted.filter((r) => r < head);
    for (const r of ge) move(r);
    if (lt.length) {
      jump(lt[0]);
      for (let i = 1; i < lt.length; i++) move(lt[i]);
    }
  } else {
    const le = sorted.filter((r) => r <= head).sort((a, b) => b - a);
    const gt = sorted.filter((r) => r > head);
    for (const r of le) move(r);
    if (gt.length) {
      const hi = Math.max(...gt);
      jump(hi);
      const down = [...gt].sort((a, b) => b - a);
      for (const r of down) {
        if (r !== pos) move(r);
      }
    }
  }
  return { path, seeks, total };
}

function runDisk(queue, head, maxC, algo, goRight) {
  switch (algo) {
    case 'fcfs': return diskFCFS(queue, head);
    case 'sstf': return diskSSTF(queue, head);
    case 'scan': return diskSCAN(queue, head, maxC, goRight);
    case 'cscan': return diskCSCAN(queue, head, maxC, goRight);
    case 'look': return diskLOOK(queue, head, goRight);
    case 'clook': return diskCLOOK(queue, head, goRight);
    default: return diskFCFS(queue, head);
  }
}

// ---------------------------------------------------------------------------
// Page Replacement scheduling
// ---------------------------------------------------------------------------

function createPageTrace(pages, framesCount, algo) {
  let frames = new Array(framesCount).fill(null);
  let time = 0;
  let trace = [];
  let faults = 0;
  let hits = 0;
  let lastUsed = new Map(); // for LRU

  for (let i = 0; i < pages.length; i++) {
    let p = pages[i];
    time++;
    let isHit = false;
    let replaceIdx = -1;

    let existingIdx = frames.indexOf(p);
    if (existingIdx !== -1) {
      isHit = true;
      hits++;
      lastUsed.set(p, time);
    } else {
      faults++;
      let emptyIdx = frames.indexOf(null);
      if (emptyIdx !== -1) {
        replaceIdx = emptyIdx;
      } else {
        if (algo === 'fcfs') {
          // Circular queue replacing oldest frame
          replaceIdx = (faults - 1) % framesCount;
        } else if (algo === 'lru') {
          let minTime = Infinity;
          for (let j = 0; j < framesCount; j++) {
            if (lastUsed.get(frames[j]) < minTime) {
              minTime = lastUsed.get(frames[j]);
              replaceIdx = j;
            }
          }
        } else if (algo === 'optimal') {
          let maxNextUse = -1;
          for (let j = 0; j < framesCount; j++) {
            let nextUse = pages.indexOf(frames[j], i + 1);
            if (nextUse === -1) {
              replaceIdx = j; // This frame will not be used again, perfect victim.
              break;
            }
            if (nextUse > maxNextUse) {
              maxNextUse = nextUse;
              replaceIdx = j;
            }
          }
        }
      }
      frames[replaceIdx] = p;
      lastUsed.set(p, time);
    }
    trace.push({ page: p, frames: [...frames], isHit, replaceIdx: isHit ? -1 : replaceIdx });
  }
  return { faults, hits, trace, algo, framesCount };
}


// ---------------------------------------------------------------------------
// Banker's algorithm (safety check)
// ---------------------------------------------------------------------------

const BANKER_EXAMPLE_5x3 = {
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  alloc: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  avail: [3, 3, 2],
};

function bankersSafety(alloc, max, available) {
  const n = alloc.length;
  if (n === 0 || !alloc[0]) return { ok: false, error: 'Matrices are empty.' };
  const m = alloc[0].length;
  if (available.length !== m) return { ok: false, error: 'Available vector length must equal resource types (m).' };
  for (let i = 0; i < n; i++) {
    if (!alloc[i] || alloc[i].length !== m || !max[i] || max[i].length !== m) {
      return { ok: false, error: 'Allocation and Max must be n×m matrices.' };
    }
  }

  const need = alloc.map((row, i) => row.map((_, j) => max[i][j] - alloc[i][j]));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (need[i][j] < 0) {
        return { ok: false, error: `P${i}: allocation exceeds maximum (column ${j}).` };
      }
    }
  }

  const work = [...available];
  const finish = new Array(n).fill(false);
  const sequence = [];
  const trace = [];
  trace.push({
    type: 'init',
    work: [...work],
    finish: [...finish],
    need: need.map((r) => [...r]),
  });

  while (sequence.length < n) {
    let found = -1;
    for (let i = 0; i < n; i++) {
      if (!finish[i] && need[i].every((nj, j) => nj <= work[j])) {
        found = i;
        break;
      }
    }
    if (found === -1) {
      trace.push({
        type: 'blocked',
        work: [...work],
        finish: [...finish],
        need: need.map((r) => [...r]),
      });
      return { ok: true, safe: false, sequence: null, need, trace };
    }
    const workBefore = [...work];
    for (let j = 0; j < m; j++) work[j] += alloc[found][j];
    finish[found] = true;
    sequence.push(found);
    trace.push({
      type: 'release',
      process: found,
      workBefore,
      workAfter: [...work],
      finish: [...finish],
      sequence: [...sequence],
    });
  }
  return { ok: true, safe: true, sequence, need, trace };
}

function bankersRequestGrantSafe(alloc, max, available, pi, request) {
  const n = alloc.length;
  const m = alloc[0].length;
  if (pi < 0 || pi >= n) return { ok: false, error: 'Invalid process index.' };
  if (request.length !== m) return { ok: false, error: 'Request vector length must equal m.' };
  const need = alloc.map((row, i) => row.map((_, j) => max[i][j] - alloc[i][j]));
  for (let j = 0; j < m; j++) {
    if (request[j] < 0 || request[j] > LIMITS.bankMaxCell) return { ok: false, error: 'Request values must be valid non-negative integers.' };
    if (request[j] > need[pi][j]) return { ok: false, error: `Request exceeds remaining need for P${pi} (column ${j}).` };
    if (request[j] > available[j]) return { ok: false, error: `Not enough available resources (column ${j}).` };
  }
  const newAlloc = alloc.map((row) => [...row]);
  const newAvail = [...available];
  for (let j = 0; j < m; j++) {
    newAlloc[pi][j] += request[j];
    newAvail[j] -= request[j];
  }
  const res = bankersSafety(newAlloc, max, newAvail);
  if (!res.ok) return res;
  return { ok: true, safe: res.safe, sequence: res.sequence, need: res.need, trace: res.trace, hypothetical: true };
}

function formatBankerTraceLine(step) {
  if (step.type === 'init') {
    return `Start: Work = [${step.work.join(', ')}], Finish = [${step.finish.map((f) => (f ? 'T' : 'F')).join(', ')}]. Compare each unfinished process: Need ≤ Work?`;
  }
  if (step.type === 'blocked') {
    return `No unfinished process has Need ≤ Work. The state is UNSAFE — deadlock is possible if all hold and wait.`;
  }
  if (step.type === 'release') {
    const seq = step.sequence.map((p) => `P${p}`).join(' → ');
    return `Choose P${step.process} (smallest index among those with Need ≤ Work). Assume it runs to completion and releases its allocation: Work [${step.workBefore.join(', ')}] → [${step.workAfter.join(', ')}]. Order so far: ${seq}.`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// localStorage
// ---------------------------------------------------------------------------

function safeStorageGet() {
  try {
    const raw = localStorage.getItem(LIMITS.storageKey);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== LIMITS.storageVersion) return null;
    return data;
  } catch {
    return null;
  }
}

function safeStorageSet(payload) {
  try {
    localStorage.setItem(LIMITS.storageKey, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// UI Rendering Functions
// ---------------------------------------------------------------------------

const GANTT_PALETTE = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

function renderGantt(gantt, container, axisEl, highlightIndex) {
  clearEl(container);
  clearEl(axisEl);
  const total = gantt.length ? Math.max(...gantt.map((g) => g.end)) : 0;
  const scale = total > 0 ? 100 / total : 100;
  gantt.forEach((seg, i) => {
    const div = document.createElement('div');
    div.className = 'gantt-seg';
    const w = (seg.end - seg.start) * scale;
    div.style.flexBasis = `${Math.max(w, 0.5)}%`;
    const pid = seg.id;
    const idx = pid === 'Idle' ? -1 : parseInt(pid.replace(/^P/, ''), 10);
    const colorIdx = Number.isFinite(idx) && idx > 0 ? (idx - 1) % GANTT_PALETTE.length : 0;
    if (pid !== 'Idle') div.style.backgroundColor = GANTT_PALETTE[colorIdx];
    else div.classList.add('idle');
    if (highlightIndex === i) div.classList.add('current-step');
    const label = document.createElement('span');
    label.textContent = pid;
    div.appendChild(label);
    const sub = document.createElement('small');
    sub.style.fontSize = '0.6rem';
    sub.style.opacity = '0.9';
    sub.textContent = `${seg.start}–${seg.end}`;
    div.appendChild(sub);
    container.appendChild(div);
  });
  setText(axisEl, total ? `0 — ${total} time units` : 'Run a simulation to see the timeline.');
}

function executionOrderFromGantt(gantt) {
  const collapsed = [];
  for (const seg of gantt) {
    if (seg.id === 'Idle') continue;
    if (collapsed[collapsed.length - 1] !== seg.id) collapsed.push(seg.id);
  }
  return collapsed.length ? collapsed.join(' → ') : '—';
}

function completionOrderFromProcesses(processes) {
  if (!processes.length) return '—';
  return processes.slice().sort((a, b) => a.completion - b.completion || a.pid - b.pid).map((p) => `P${p.pid}`).join(' → ');
}

function renderCPUTable(tbody, rows, showPriority) {
  clearEl(tbody);
  const keys = showPriority
    ? ['pid', 'arrival', 'burst', 'priority', 'completion', 'tat', 'wt']
    : ['pid', 'arrival', 'burst', 'completion', 'tat', 'wt'];
  for (const r of rows) {
    const tr = document.createElement('tr');
    for (const key of keys) {
      const td = document.createElement('td');
      td.textContent = String(r[key]);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
}

function renderCPUMetrics(el, processes, avgTat, avgWt) {
  clearEl(el);
  const sumTat = processes.reduce((s, p) => s + p.tat, 0);
  const sumWt = processes.reduce((s, p) => s + p.wt, 0);
  const lines = [
    { label: 'Average turnaround time (TAT)', value: avgTat.toFixed(2) },
    { label: 'Average waiting time (WT)', value: avgWt.toFixed(2) },
    { label: 'Sum of TAT (all processes)', value: String(sumTat) },
    { label: 'Sum of WT (all processes)', value: String(sumWt) },
  ];
  for (const row of lines) {
    const p = document.createElement('p');
    p.className = 'metric-row';
    const lab = document.createElement('span');
    lab.className = 'metric-label';
    lab.textContent = row.label + ': ';
    const val = document.createElement('strong');
    val.textContent = row.value;
    p.appendChild(lab);
    p.appendChild(val);
    el.appendChild(p);
  }
}

function renderCPUOrderBlock(gantt, processes, block, execEl, completeEl) {
  block.hidden = false;
  setText(execEl, executionOrderFromGantt(gantt));
  setText(completeEl, completionOrderFromProcesses(processes));
}

function drawDiskChart(canvas, path, seeks, diskMaxCyl, captionEl) {
  const ctx = canvas.getContext('2d');
  if (!ctx || path.length < 1) return;

  const root = document.documentElement;
  const accent = getComputedStyle(root).getPropertyValue('--accent').trim() || '#2563eb';
  const border = getComputedStyle(root).getPropertyValue('--border').trim() || '#ccc';
  const text = getComputedStyle(root).getPropertyValue('--text').trim() || '#111';
  const muted = getComputedStyle(root).getPropertyValue('--text-muted').trim() || '#666';
  const elevated = getComputedStyle(root).getPropertyValue('--bg-elevated').trim() || '#fff';
  const jumpColor = '#c026d3';
  const startFill = '#059669';

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = Math.max(canvas.clientWidth || 920, 320);
  const cssH = 400;
  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssW, cssH);
  ctx.imageSmoothingEnabled = true;

  const padL = 58, padR = 22, padT = 44, padB = 62;
  const plotW = cssW - padL - padR;
  const plotH = cssH - padT - padB;

  const yMin = 0;
  const maxCInput = typeof diskMaxCyl === 'number' && Number.isFinite(diskMaxCyl) && diskMaxCyl > 0 ? diskMaxCyl : 0;
  const yMax = Math.max(maxCInput, ...path, 1);
  const ySpan = yMax - yMin || 1;
  const n = path.length;

  const xFor = (i) => padL + (i / Math.max(n - 1, 1)) * plotW;
  const yFor = (c) => padT + (1 - (c - yMin) / ySpan) * plotH;
  const seekList = Array.isArray(seeks) ? seeks : [];

  function niceGridStep(maxVal) {
    if (maxVal <= 10) return 2;
    if (maxVal <= 50) return 5;
    if (maxVal <= 200) return 20;
    if (maxVal <= 500) return 50;
    return Math.ceil(maxVal / 10 / 5) * 5;
  }
  const gridStep = niceGridStep(yMax);

  ctx.fillStyle = elevated;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  roundRect(ctx, padL - 6, padT - 6, plotW + 12, plotH + 12, 8);
  ctx.fill(); ctx.stroke();

  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.45;
  for (let g = 0; g <= yMax; g += gridStep) {
    const y = yFor(g);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(padL, padT + plotH); ctx.lineTo(padL + plotW, padT + plotH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, padT + plotH); ctx.stroke();

  ctx.fillStyle = muted;
  ctx.font = '600 11px system-ui, Segoe UI, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Visit step (order of head positions)', padL + plotW / 2, cssH - 18);

  ctx.save();
  ctx.translate(16, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Cylinder # (track)', 0, 0);
  ctx.restore();

  ctx.textAlign = 'right';
  ctx.font = '10px ui-monospace, Consolas, monospace';
  for (let g = 0; g <= yMax; g += gridStep) {
    const y = yFor(g);
    ctx.fillText(String(g), padL - 10, y + 4);
  }

  ctx.textAlign = 'center';
  ctx.font = '9px ui-monospace, Consolas, monospace';
  const stepEvery = n > 36 ? 3 : n > 20 ? 2 : 1;
  for (let i = 0; i < n; i += stepEvery) {
    ctx.fillText(String(i), xFor(i), padT + plotH + 17);
  }

  let seekIdx = 0;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  for (let i = 1; i < path.length; i++) {
    const c0 = path[i - 1], c1 = path[i];
    if (c0 === c1) continue;
    const x0 = xFor(i - 1), y0 = yFor(c0), x1 = xFor(i), y1 = yFor(c1);
    const sk = seekList[seekIdx];
    const physical = sk && sk.from === c0 && sk.to === c1;

    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    if (physical) {
      ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.stroke();
      seekIdx++;
    } else {
      ctx.strokeStyle = jumpColor; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.stroke();
      ctx.setLineDash([]);
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
      ctx.fillStyle = jumpColor; ctx.font = '600 9px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('jump', mx, my - 8);
    }
  }

  path.forEach((cyl, i) => {
    const x = xFor(i), y = yFor(cyl), r = i === 0 ? 8 : 7;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? startFill : elevated; ctx.fill();
    ctx.strokeStyle = i === 0 ? startFill : accent; ctx.lineWidth = i === 0 ? 3 : 2; ctx.stroke();

    ctx.fillStyle = text; ctx.font = '600 10px ui-monospace, Consolas, monospace';
    ctx.textAlign = 'center';
    const above = i % 2 === 0;
    ctx.fillText(String(cyl), x, above ? y - r - 6 : y + r + 14);

    ctx.fillStyle = muted; ctx.font = '600 9px system-ui, sans-serif';
    if (i === 0) ctx.fillText('START', x, above ? y + r + 16 : y - r - 18);
    else ctx.fillText(`#${i}`, x, above ? y + r + 16 : y - r - 18);
  });

  ctx.textAlign = 'left'; ctx.fillStyle = muted; ctx.font = '10px system-ui, sans-serif';
  ctx.fillText(`Cylinder scale: 0 … ${yMax}`, padL, padT - 22);

  const legY = padT + 12, legR = padL + plotW - 8;
  ctx.textAlign = 'right'; ctx.strokeStyle = accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(legR - 118, legY); ctx.lineTo(legR - 78, legY); ctx.stroke();
  ctx.fillStyle = text; ctx.font = '10px system-ui, sans-serif'; ctx.fillText('Seek', legR - 72, legY + 4);

  ctx.strokeStyle = jumpColor; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(legR - 48, legY); ctx.lineTo(legR - 8, legY); ctx.stroke();
  ctx.setLineDash([]); ctx.fillText('Jump', legR - 2, legY + 4);

  if (captionEl) {
    const jumps = Math.max(0, n - 1 - seekList.length);
    setText(captionEl, `${n} positions · ${seekList.length} physical seek${seekList.length === 1 ? '' : 's'}${jumps ? ` · ${jumps} jump${jumps === 1 ? '' : 's'}` : ''}`);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
}

function renderDiskSequence(seeks, highlightStep) {
  const container = document.getElementById('disk-sequence');
  if(!container) return;
  clearEl(container);
  seeks.forEach((s, i) => {
    const li = document.createElement('li');
    if (i === highlightStep) li.classList.add('current-step');
    li.textContent = `${s.from} → ${s.to}  (${s.dist} seeks)`;
    container.appendChild(li);
  });
}

function renderDiskResultSummary(path, total, seeks) {
  setText(document.getElementById('disk-visit-order'), `Cylinder visit order (head path): ${path.length ? path.join(' → ') : '—'}`);
  const hl = document.getElementById('disk-seek-highlight');
  if(hl) hl.hidden = false;
  setText(document.getElementById('disk-total-seek'), String(total));
  const n = seeks.length, avg = n > 0 ? total / n : 0;
  setText(document.getElementById('disk-avg-seek'), n > 0 ? `Average seek per movement: ${avg.toFixed(2)} (${n} physical movement${n === 1 ? '' : 's'})` : 'No movements.');
  const totFallback = document.getElementById('disk-total');
  if(totFallback) totFallback.hidden = true;
}

function renderPageTable(res, container) {
  clearEl(container);
  if (!res.trace || res.trace.length === 0) return;

  const table = document.createElement('table');
  table.className = 'data-table page-table';

  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const thReq = document.createElement('th');
  thReq.textContent = 'Ref String';
  trHead.appendChild(thReq);
  res.trace.forEach(step => {
    const th = document.createElement('th');
    th.textContent = String(step.page);
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  for (let f = 0; f < res.framesCount; f++) {
    const tr = document.createElement('tr');
    const tdLabel = document.createElement('th');
    tdLabel.scope = 'row';
    tdLabel.textContent = `Frame ${f + 1}`;
    tr.appendChild(tdLabel);

    res.trace.forEach(step => {
      const td = document.createElement('td');
      const val = step.frames[f];
      td.textContent = val !== null ? String(val) : '-';
      
      if (step.replaceIdx === f && !step.isHit) {
        td.classList.add('page-replaced');
        td.style.backgroundColor = 'var(--page-miss-bg, #fca5a5)';
        td.style.color = 'var(--page-miss-fg, #7f1d1d)';
      } else if (step.isHit && step.frames[f] === step.page) {
        td.classList.add('page-hit-frame');
        td.style.backgroundColor = 'var(--page-hit-bg, #bbf7d0)'; 
        td.style.color = 'var(--page-hit-fg, #14532d)';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  const trStatus = document.createElement('tr');
  const thStatus = document.createElement('th');
  thStatus.textContent = 'Status';
  trStatus.appendChild(thStatus);
  res.trace.forEach(step => {
    const td = document.createElement('td');
    if (step.isHit) {
      td.textContent = 'Hit';
      td.style.color = '#16a34a';
      td.style.fontWeight = 'bold';
    } else {
      td.textContent = 'Miss';
      td.style.color = '#dc2626';
      td.style.fontWeight = 'bold';
    }
    trStatus.appendChild(td);
  });
  tbody.appendChild(trStatus);

  table.appendChild(tbody);
  container.appendChild(table);
}

function buildBankerMatrix(n, m, preset) {
  const bankWrap = document.getElementById('banker-matrix-wrap');
  if(!bankWrap) return;
  clearEl(bankWrap);
  const wrap = document.createElement('div');
  wrap.className = 'banker-grid';

  function addSection(title, tableEl) {
    const h = document.createElement('h4');
    h.className = 'subheading';
    h.textContent = title;
    wrap.appendChild(h); wrap.appendChild(tableEl);
  }

  function cellVal(kind, i, j, def) {
    if (!preset) return def;
    if (kind === 'avail' && preset.avail) return preset.avail[j] ?? def;
    if (kind === 'max' && preset.max && preset.max[i]) return preset.max[i][j] ?? def;
    if (kind === 'alloc' && preset.alloc && preset.alloc[i]) return preset.alloc[i][j] ?? def;
    return def;
  }

  function makePmTable(kind, label) {
    const table = document.createElement('table');
    table.className = 'data-table banker-table';
    const thead = document.createElement('thead'), trh = document.createElement('tr');
    const thEmpty = document.createElement('th'); thEmpty.textContent = ''; trh.appendChild(thEmpty);
    for (let j = 0; j < m; j++) {
      const th = document.createElement('th'); th.textContent = 'R' + j; trh.appendChild(th);
    }
    thead.appendChild(trh); table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (let i = 0; i < n; i++) {
      const tr = document.createElement('tr'), th = document.createElement('th');
      th.scope = 'row'; th.textContent = 'P' + i; tr.appendChild(th);
      for (let j = 0; j < m; j++) {
        const td = document.createElement('td'), inp = document.createElement('input');
        inp.type = 'number'; inp.min = '0'; inp.max = String(LIMITS.bankMaxCell);
        inp.className = 'banker-cell'; inp.dataset.kind = kind; inp.dataset.i = String(i); inp.dataset.j = String(j);
        inp.value = String(cellVal(kind, i, j, 0)); inp.autocomplete = 'off'; inp.inputMode = 'numeric';
        td.appendChild(inp); tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody); addSection(label, table);
  }

  makePmTable('max', 'Maximum demand (Max)');
  makePmTable('alloc', 'Current allocation (Allocation)');

  const avTable = document.createElement('table');
  avTable.className = 'data-table banker-table banker-avail-row';
  const avTr = document.createElement('tr'), thLab = document.createElement('th');
  thLab.scope = 'row'; thLab.textContent = 'Avail'; avTr.appendChild(thLab);
  for (let j = 0; j < m; j++) {
    const td = document.createElement('td'), inp = document.createElement('input');
    inp.type = 'number'; inp.min = '0'; inp.max = String(LIMITS.bankMaxCell);
    inp.className = 'banker-cell'; inp.dataset.kind = 'avail'; inp.dataset.j = String(j);
    inp.value = String(cellVal('avail', 0, j, 0)); inp.autocomplete = 'off'; inp.inputMode = 'numeric';
    td.appendChild(inp); avTr.appendChild(td);
  }
  avTable.appendChild(avTr); addSection('Available (free resources)', avTable);
  bankWrap.appendChild(wrap);
}

function renderBankerNeed(need) {
  const head = document.getElementById('banker-need-head'), body = document.getElementById('banker-need-body');
  clearEl(head); clearEl(body);
  if (!need || !need.length) return;
  const trh = document.createElement('tr'), th0 = document.createElement('th');
  th0.textContent = ''; trh.appendChild(th0);
  for (let j = 0; j < need[0].length; j++) {
    const th = document.createElement('th'); th.textContent = 'R' + j; trh.appendChild(th);
  }
  head.appendChild(trh);
  need.forEach((row, i) => {
    const tr = document.createElement('tr'), th = document.createElement('th');
    th.scope = 'row'; th.textContent = 'P' + i; tr.appendChild(th);
    row.forEach((v) => { const td = document.createElement('td'); td.textContent = String(v); tr.appendChild(td); });
    body.appendChild(tr);
  });
}

function renderBankerBanner(safe, sequence, extraNote) {
  const banner = document.getElementById('banker-banner');
  banner.hidden = false; clearEl(banner);
  const div = document.createElement('div');
  div.className = safe ? 'banker-banner banker-banner--safe' : 'banker-banner banker-banner--unsafe';
  if (extraNote) {
    const note = document.createElement('p'); note.className = 'banker-banner-note'; note.textContent = extraNote; div.appendChild(note);
  }
  const h = document.createElement('strong'); h.className = 'banker-banner-title'; h.textContent = safe ? 'SAFE STATE' : 'UNSAFE STATE'; div.appendChild(h);
  const p = document.createElement('p'); p.className = 'banker-banner-desc';
  if (safe && sequence && sequence.length) p.textContent = `A safe completion order exists. Example: ${sequence.map((x) => 'P' + x).join(' → ')}.`;
  else if (safe) p.textContent = 'Safe.';
  else p.textContent = 'No completion order guarantees all processes finish. Deadlock may occur if processes block. This is not the same as “deadlocked now” — only that the state is not provably safe.';
  div.appendChild(p); banner.appendChild(div);
}

function renderBankerTraceList(trace, bankStateStepIdx) {
  const ul = document.getElementById('banker-trace');
  clearEl(ul);
  trace.forEach((step, idx) => {
    const li = document.createElement('li');
    li.textContent = formatBankerTraceLine(step);
    li.dataset.stepIdx = String(idx);
    if (idx === bankStateStepIdx) li.classList.add('current-step');
    ul.appendChild(li);
  });
}

function renderBankerRuntimeStep(bankState) {
  if (!bankState) return;
  const rt = document.getElementById('banker-runtime');
  clearEl(rt);
  if (bankState.requestNote) {
    const note = document.createElement('p'); note.className = 'banker-runtime-note'; note.textContent = bankState.requestNote; rt.appendChild(note);
  }
  const step = bankState.trace[bankState.stepIdx];
  if (!step) return;
  const p = document.createElement('p'); p.className = 'banker-runtime-text'; p.textContent = formatBankerTraceLine(step); rt.appendChild(p);
  const lis = document.getElementById('banker-trace').querySelectorAll('li');
  lis.forEach((li, idx) => { li.classList.toggle('current-step', idx === bankState.stepIdx); });
}

// ---------------------------------------------------------------------------
// App State & Event Handlers
// ---------------------------------------------------------------------------
let cpuState = null;
let diskState = null;
let bankState = null;
let pageState = null;

// The `els` object handles DOM references dynamically in the init block to ensure they exist.
const getEls = () => ({
  tabCpu: document.getElementById('tab-cpu'),
  tabDisk: document.getElementById('tab-disk'),
  tabPage: document.getElementById('tab-page'),
  tabBanker: document.getElementById('tab-banker'),

  panelCpu: document.getElementById('panel-cpu'),
  panelDisk: document.getElementById('panel-disk'),
  panelPage: document.getElementById('panel-page'),
  panelBanker: document.getElementById('panel-banker'),

  btnTheme: document.getElementById('btn-theme'),

  formCpu: document.getElementById('form-cpu'),
  cpuN: document.getElementById('cpu-n'),
  cpuAlgo: document.getElementById('cpu-algo'),
  cpuQuantum: document.getElementById('cpu-quantum'),
  cpuQuantumWrap: document.getElementById('cpu-quantum-wrap'),
  cpuProcessFields: document.getElementById('cpu-process-fields'),
  cpuError: document.getElementById('cpu-error'),
  cpuRun: document.getElementById('cpu-run'),
  cpuStep: document.getElementById('cpu-step'),
  cpuReset: document.getElementById('cpu-reset'),
  cpuGantt: document.getElementById('cpu-gantt'),
  cpuGanttAxis: document.getElementById('cpu-gantt-axis'),
  cpuTbody: document.getElementById('cpu-tbody'),
  cpuMetrics: document.getElementById('cpu-metrics'),
  cpuOrderBlock: document.getElementById('cpu-order-block'),
  cpuExecOrder: document.getElementById('cpu-exec-order'),
  cpuCompleteOrder: document.getElementById('cpu-complete-order'),
  cpuStepHint: document.getElementById('cpu-step-hint'),
  cpuCompareBtn: document.getElementById('cpu-compare-btn'),
  cpuCompareOut: document.getElementById('cpu-compare-out'),
  cpuSave: document.getElementById('cpu-save'),
  cpuLoad: document.getElementById('cpu-load'),
  cpuExport: document.getElementById('cpu-export-print'),

  formDisk: document.getElementById('form-disk'),
  diskAlgo: document.getElementById('disk-algo'),
  diskQueue: document.getElementById('disk-queue'),
  diskHead: document.getElementById('disk-head'),
  diskMax: document.getElementById('disk-max'),
  diskDir: document.getElementById('disk-dir'),
  diskError: document.getElementById('disk-error'),
  diskRun: document.getElementById('disk-run'),
  diskStep: document.getElementById('disk-step'),
  diskReset: document.getElementById('disk-reset'),
  diskSequence: document.getElementById('disk-sequence'),
  diskVisitOrder: document.getElementById('disk-visit-order'),
  diskSeekHighlight: document.getElementById('disk-seek-highlight'),
  diskTotalSeek: document.getElementById('disk-total-seek'),
  diskAvgSeek: document.getElementById('disk-avg-seek'),
  diskChartCaption: document.getElementById('disk-chart-caption'),
  diskCanvas: document.getElementById('disk-canvas'),
  diskCompareBtn: document.getElementById('disk-compare-btn'),
  diskCompareOut: document.getElementById('disk-compare-out'),
  diskSave: document.getElementById('disk-save'),
  diskLoad: document.getElementById('disk-load'),
  diskExport: document.getElementById('disk-export-print'),

  formPage: document.getElementById('form-page'),
  pageAlgo: document.getElementById('page-algo'),
  pageFrames: document.getElementById('page-frames'),
  pageQueue: document.getElementById('page-queue'),
  pageError: document.getElementById('page-error'),
  pageRun: document.getElementById('page-run'),
  pageReset: document.getElementById('page-reset'),
  pageFaultsOut: document.getElementById('page-faults-out'),
  pageHitsOut: document.getElementById('page-hits-out'),
  pageHitRatio: document.getElementById('page-hit-ratio'),
  pageTableWrap: document.getElementById('page-table-wrap'),

  bankN: document.getElementById('bank-n'),
  bankM: document.getElementById('bank-m'),
  formBankerSize: document.getElementById('form-banker-size'),
  bankLoadExample: document.getElementById('bank-load-example'),
  bankMatrixWrap: document.getElementById('banker-matrix-wrap'),
  bankRun: document.getElementById('bank-run'),
  bankStep: document.getElementById('bank-step'),
  bankReset: document.getElementById('bank-reset'),
  bankStepHint: document.getElementById('bank-step-hint'),
  bankerError: document.getElementById('banker-error'),
  formBankerRequest: document.getElementById('form-banker-request'),
  bankReqP: document.getElementById('bank-req-p'),
  bankReqVec: document.getElementById('bank-req-vec'),

  printRoot: document.getElementById('print-root'),
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('dcps_theme', theme); } catch { /* ignore */ }
}

function initTheme() {
  let t = 'light';
  try { t = localStorage.getItem('dcps_theme') || 'light'; } catch { t = 'light'; }
  if (t !== 'light' && t !== 'dark') t = 'light';
  applyTheme(t);
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(cur === 'dark' ? 'light' : 'dark');
}

function switchTab(name) {
  const els = getEls();
  const isCpu = name === 'cpu', isDisk = name === 'disk', isBank = name === 'banker', isPage = name === 'page';

  if (els.panelCpu) els.panelCpu.hidden = !isCpu;
  if (els.panelDisk) els.panelDisk.hidden = !isDisk;
  if (els.panelBanker) els.panelBanker.hidden = !isBank;
  if (els.panelPage) els.panelPage.hidden = !isPage;

  if (els.panelCpu) els.panelCpu.classList.toggle('active', isCpu);
  if (els.panelDisk) els.panelDisk.classList.toggle('active', isDisk);
  if (els.panelBanker) els.panelBanker.classList.toggle('active', isBank);
  if (els.panelPage) els.panelPage.classList.toggle('active', isPage);

  if (els.tabCpu) els.tabCpu.classList.toggle('active', isCpu);
  if (els.tabDisk) els.tabDisk.classList.toggle('active', isDisk);
  if (els.tabBanker) els.tabBanker.classList.toggle('active', isBank);
  if (els.tabPage) els.tabPage.classList.toggle('active', isPage);

  if (els.tabCpu) els.tabCpu.setAttribute('aria-selected', String(isCpu));
  if (els.tabDisk) els.tabDisk.setAttribute('aria-selected', String(isDisk));
  if (els.tabBanker) els.tabBanker.setAttribute('aria-selected', String(isBank));
  if (els.tabPage) els.tabPage.setAttribute('aria-selected', String(isPage));
}

// ---------------------------------------------------------------------------
// Main DOMContentLoaded Wrapper (All Bindings Happen Here)
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const els = getEls();
  initTheme();

  // --- Initializing Default CPU Rows ---
  const startCpuN = els.cpuN ? parseInt(els.cpuN.value, 10) : 3;
  
  function buildCpuProcessInputs(n) {
    if(!els.cpuProcessFields) return;
    clearEl(els.cpuProcessFields);
    for (let i = 1; i <= n; i++) {
      const row = document.createElement('div');
      row.className = 'proc-row';
      row.innerHTML = `
        <label>PID ${i}<input type="number" data-pid="${i}" value="${i}" readonly class="pid-input" /></label>
        <label>Arrival<input type="number" data-field="arrival" data-pid="${i}" min="0" max="${LIMITS.maxArrival}" value="0" inputmode="numeric" autocomplete="off" /></label>
        <label>Burst<input type="number" data-field="burst" data-pid="${i}" min="1" max="${LIMITS.maxBurst}" value="${3 + i}" inputmode="numeric" autocomplete="off" /></label>
        <label class="proc-field-priority">Priority<input type="number" data-field="priority" data-pid="${i}" min="0" max="${LIMITS.maxPriority}" value="${i}" inputmode="numeric" autocomplete="off" /></label>
      `;
      els.cpuProcessFields.appendChild(row);
    }
    syncCpuFormUi();
  }

  function syncCpuFormUi() {
    if(!els.cpuAlgo) return;
    const algo = els.cpuAlgo.value;
    const comparePri = Array.from(document.querySelectorAll('input[name="cpu-compare"]:checked')).some((cb) => cb.value === 'priority' || cb.value === 'priority-p');
    const compareQ = Array.from(document.querySelectorAll('input[name="cpu-compare"]:checked')).some((cb) => cb.value === 'rr');
    const showPri = ['priority', 'priority-p'].includes(algo) || comparePri;
    const showQ = algo === 'rr' || compareQ;

    if (els.cpuQuantumWrap) {
      els.cpuQuantumWrap.hidden = !showQ;
      if(els.cpuQuantum) els.cpuQuantum.setAttribute('aria-required', showQ ? 'true' : 'false');
    }
    if(els.cpuProcessFields){
      els.cpuProcessFields.querySelectorAll('.proc-field-priority').forEach((el) => { el.hidden = !showPri; });
    }
    const thPri = document.getElementById('cpu-th-priority');
    if (thPri) thPri.hidden = !showPri;
  }

  buildCpuProcessInputs(startCpuN);

  // --- Initializing Banker's Matrix ---
  buildBankerMatrix(5, 3, BANKER_EXAMPLE_5x3);

  // --- Core Tab Listeners ---
  if (els.btnTheme) els.btnTheme.addEventListener('click', toggleTheme);
  if (els.tabCpu) els.tabCpu.addEventListener('click', () => switchTab('cpu'));
  if (els.tabDisk) els.tabDisk.addEventListener('click', () => switchTab('disk'));
  if (els.tabPage) els.tabPage.addEventListener('click', () => switchTab('page'));
  if (els.tabBanker) els.tabBanker.addEventListener('click', () => switchTab('banker'));

  // --- CPU LISTENERS ---
  if (els.cpuAlgo) els.cpuAlgo.addEventListener('change', syncCpuFormUi);
  document.querySelectorAll('input[name="cpu-compare"]').forEach((el) => {
    el.addEventListener('change', syncCpuFormUi);
  });
  if (els.cpuN) els.cpuN.addEventListener('change', () => {
    const nRes = parseBoundedInt(els.cpuN.value, LIMITS.minProcesses, LIMITS.maxProcesses);
    const n = nRes.ok ? nRes.value : LIMITS.minProcesses;
    els.cpuN.value = String(n);
    buildCpuProcessInputs(n);
  });

  if (els.formCpu) els.formCpu.addEventListener('submit', (e) => {
    e.preventDefault();
    setText(els.cpuError, '');
    if(els.cpuError) els.cpuError.hidden = true;

    // Read CPU Inputs
    const algo = els.cpuAlgo.value;
    const n = parseInt(els.cpuN.value, 10);
    const processes = [];
    const needsPriority = ['priority', 'priority-p'].includes(algo);
    const needsQuantum = algo === 'rr';

    for (let i = 1; i <= n; i++) {
      const aEl = els.cpuProcessFields.querySelector(`[data-field="arrival"][data-pid="${i}"]`);
      const bEl = els.cpuProcessFields.querySelector(`[data-field="burst"][data-pid="${i}"]`);
      const pEl = els.cpuProcessFields.querySelector(`[data-field="priority"][data-pid="${i}"]`);
      
      const a = parseBoundedInt(aEl?.value, 0, LIMITS.maxArrival);
      if(!a.ok) { els.cpuError.hidden = false; setText(els.cpuError, `Process ${i}: ${a.error}`); return; }
      const b = parseBoundedInt(bEl?.value, 1, LIMITS.maxBurst);
      if(!b.ok) { els.cpuError.hidden = false; setText(els.cpuError, `Process ${i}: ${b.error}`); return; }
      
      let pri = 0;
      if(needsPriority) {
        const pr = parseBoundedInt(pEl?.value, 0, LIMITS.maxPriority);
        if(!pr.ok) { els.cpuError.hidden = false; setText(els.cpuError, `Process ${i}: ${pr.error}`); return; }
        pri = pr.value;
      }
      processes.push({ pid: i, arrival: a.value, burst: b.value, priority: pri });
    }

    let quantum = 1;
    if(needsQuantum) {
      const qRes = parseBoundedInt(els.cpuQuantum?.value, LIMITS.minQuantum, LIMITS.maxQuantum);
      if(!qRes.ok) { els.cpuError.hidden = false; setText(els.cpuError, `Quantum: ${qRes.error}`); return; }
      quantum = qRes.value;
    }

    const res = runCPU(processes, algo, quantum);
    cpuState = { gantt: res.gantt, processes: res.processes, algo, stepIdx: -1 };
    
    if(els.cpuStepHint) els.cpuStepHint.hidden = false;
    renderGantt(res.gantt, els.cpuGantt, els.cpuGanttAxis, undefined);
    renderCPUTable(els.cpuTbody, res.processes, needsPriority);
    
    const avgTat = res.processes.reduce((s, p) => s + p.tat, 0) / res.processes.length;
    const avgWt = res.processes.reduce((s, p) => s + p.wt, 0) / res.processes.length;
    renderCPUMetrics(els.cpuMetrics, res.processes, avgTat, avgWt);
    renderCPUOrderBlock(res.gantt, res.processes, els.cpuOrderBlock, els.cpuExecOrder, els.cpuCompleteOrder);
  });

  if (els.cpuStep) els.cpuStep.addEventListener('click', () => {
    if (!cpuState || !cpuState.gantt.length) return;
    cpuState.stepIdx = (cpuState.stepIdx + 1) % cpuState.gantt.length;
    renderGantt(cpuState.gantt, els.cpuGantt, els.cpuGanttAxis, cpuState.stepIdx);
  });

  if (els.cpuReset) els.cpuReset.addEventListener('click', () => {
    cpuState = null;
    if(els.cpuStepHint) els.cpuStepHint.hidden = true;
    if(els.cpuOrderBlock) els.cpuOrderBlock.hidden = true;
    setText(els.cpuExecOrder, '');
    setText(els.cpuCompleteOrder, '');
    clearEl(els.cpuGantt);
    clearEl(els.cpuGanttAxis);
    clearEl(els.cpuTbody);
    clearEl(els.cpuMetrics);
    setText(els.cpuError, '');
    if(els.cpuError) els.cpuError.hidden = true;
  });

  // --- DISK LISTENERS ---
  if (els.diskQueue) {
    els.diskQueue.addEventListener('input', () => {
      if (els.diskQueue.value.length > LIMITS.maxQueueStringLen) els.diskQueue.value = els.diskQueue.value.slice(0, LIMITS.maxQueueStringLen);
    });
  }

  if (els.formDisk) els.formDisk.addEventListener('submit', (e) => {
    e.preventDefault();
    if(els.diskError) { els.diskError.hidden = true; setText(els.diskError, ''); }
    
    const q = parseDiskQueue(els.diskQueue.value);
    if (!q.ok) { if(els.diskError){ els.diskError.hidden=false; setText(els.diskError, q.error); } return; }
    
    const head = parseBoundedInt(els.diskHead.value, 0, LIMITS.maxCylinder);
    if (!head.ok) { if(els.diskError){ els.diskError.hidden=false; setText(els.diskError, head.error); } return; }
    
    const maxC = parseBoundedInt(els.diskMax.value, 1, LIMITS.maxCylinder);
    if (!maxC.ok) { if(els.diskError){ els.diskError.hidden=false; setText(els.diskError, maxC.error); } return; }
    
    for (const r of q.value) {
      if (r > maxC.value) { if(els.diskError){ els.diskError.hidden=false; setText(els.diskError, 'Request exceeds max cylinder.'); } return; }
    }

    const algo = els.diskAlgo.value;
    const goRight = els.diskDir.value === 'right';
    const res = runDisk(q.value, head.value, maxC.value, algo, goRight);
    
    diskState = { path: res.path, seeks: res.seeks, total: res.total, stepIdx: -1, algo, maxCyl: maxC.value };
    renderDiskSequence(res.seeks, -1);
    renderDiskResultSummary(res.path, res.total, res.seeks);
    drawDiskChart(els.diskCanvas, res.path, res.seeks, maxC.value, els.diskChartCaption);
  });

  if (els.diskStep) els.diskStep.addEventListener('click', () => {
    if (!diskState || !diskState.seeks.length) return;
    diskState.stepIdx = (diskState.stepIdx + 1) % diskState.seeks.length;
    renderDiskSequence(diskState.seeks, diskState.stepIdx);
  });

  if (els.diskReset) els.diskReset.addEventListener('click', () => {
    diskState = null;
    clearEl(els.diskSequence);
    setText(els.diskVisitOrder, '');
    if(els.diskSeekHighlight) els.diskSeekHighlight.hidden = true;
    setText(els.diskTotalSeek, '');
    setText(els.diskAvgSeek, '');
    setText(els.diskChartCaption, '');
    const ctx = els.diskCanvas?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, els.diskCanvas.width, els.diskCanvas.height);
    if(els.diskError) { els.diskError.hidden = true; setText(els.diskError, ''); }
  });

  window.addEventListener('resize', () => {
    if (diskState && diskState.path.length && els.diskCanvas) {
      drawDiskChart(els.diskCanvas, diskState.path, diskState.seeks, diskState.maxCyl, els.diskChartCaption);
    }
  });

  // --- PAGE REPLACEMENT LISTENERS ---
  if (els.pageQueue) {
    els.pageQueue.addEventListener('input', () => {
      if (els.pageQueue.value.length > LIMITS.maxQueueStringLen) els.pageQueue.value = els.pageQueue.value.slice(0, LIMITS.maxQueueStringLen);
    });
  }

  if (els.formPage) els.formPage.addEventListener('submit', (e) => {
    e.preventDefault();
    if (els.pageError) { els.pageError.hidden = true; setText(els.pageError, ''); }
    
    const qRes = parsePageQueue(els.pageQueue.value);
    if (!qRes.ok) { if (els.pageError) { els.pageError.hidden = false; setText(els.pageError, qRes.error); } return; }
    
    const framesRes = parseBoundedInt(els.pageFrames.value, 1, LIMITS.maxPageFrames);
    if (!framesRes.ok) { if (els.pageError) { els.pageError.hidden = false; setText(els.pageError, framesRes.error); } return; }

    const algo = els.pageAlgo ? els.pageAlgo.value : 'fcfs';
    const result = createPageTrace(qRes.value, framesRes.value, algo);
    pageState = result;

    if (els.pageTableWrap) renderPageTable(result, els.pageTableWrap);
    
    if (els.pageFaultsOut) setText(els.pageFaultsOut, String(result.faults));
    if (els.pageHitsOut) setText(els.pageHitsOut, String(result.hits));
    if (els.pageHitRatio) {
      const total = result.faults + result.hits;
      setText(els.pageHitRatio, total > 0 ? ((result.hits / total) * 100).toFixed(2) + '%' : '0%');
    }
  });

  if (els.pageReset) els.pageReset.addEventListener('click', () => {
    pageState = null;
    clearEl(els.pageTableWrap);
    if (els.pageTableWrap) els.pageTableWrap.innerHTML = '<p style="color: var(--text-muted); padding: 1rem;">Run the simulation to view the memory trace.</p>';
    if (els.pageFaultsOut) setText(els.pageFaultsOut, '-');
    if (els.pageHitsOut) setText(els.pageHitsOut, '-');
    if (els.pageHitRatio) setText(els.pageHitRatio, '-');
    if (els.pageError) { els.pageError.hidden = true; setText(els.pageError, ''); }
  });

  // --- BANKER'S ALGORITHM LISTENERS ---
  function getBankerData() {
    const n = parseInt(els.bankN.value, 10);
    const m = parseInt(els.bankM.value, 10);
    const max = [], alloc = [], avail = [];
    for (let i = 0; i < n; i++) {
      max[i] = []; alloc[i] = [];
      for (let j = 0; j < m; j++) {
        const elMax = document.querySelector(`input[data-kind="max"][data-i="${i}"][data-j="${j}"]`);
        const elA = document.querySelector(`input[data-kind="alloc"][data-i="${i}"][data-j="${j}"]`);
        if(!elMax || !elA) return { ok: false, error: 'Grid error. Apply size again.'};
        max[i][j] = parseInt(elMax.value, 10) || 0;
        alloc[i][j] = parseInt(elA.value, 10) || 0;
      }
    }
    for (let j = 0; j < m; j++) {
      const elAv = document.querySelector(`input[data-kind="avail"][data-j="${j}"]`);
      avail.push(parseInt(elAv?.value || '0', 10));
    }
    return { ok: true, n, m, max, alloc, avail };
  }

  if (els.formBankerSize) els.formBankerSize.addEventListener('submit', (e) => {
    e.preventDefault();
    const nR = parseBoundedInt(els.bankN.value, LIMITS.bankMinN, LIMITS.bankMaxN);
    const mR = parseBoundedInt(els.bankM.value, LIMITS.bankMinM, LIMITS.bankMaxM);
    if (!nR.ok || !mR.ok) { if(els.bankerError) {els.bankerError.hidden=false; setText(els.bankerError, !nR.ok ? nR.error : mR.error);} return; }
    buildBankerMatrix(nR.value, mR.value, null);
    if (els.bankerError) els.bankerError.hidden = true;
  });

  if (els.bankLoadExample) els.bankLoadExample.addEventListener('click', () => {
    els.bankN.value = '5'; els.bankM.value = '3';
    buildBankerMatrix(5, 3, BANKER_EXAMPLE_5x3);
    if (els.bankerError) els.bankerError.hidden = true;
  });

  if (els.bankRun) els.bankRun.addEventListener('click', () => {
    const rd = getBankerData();
    if(!rd.ok) { if(els.bankerError){els.bankerError.hidden=false; setText(els.bankerError, rd.error);} return; }
    const res = bankersSafety(rd.alloc, rd.max, rd.avail);
    if (!res.ok) { if(els.bankerError){els.bankerError.hidden=false; setText(els.bankerError, res.error);} return; }
    if(els.bankerError) els.bankerError.hidden = true;
    
    bankState = { trace: res.trace, stepIdx: 0, safe: res.safe, sequence: res.sequence, need: res.need, requestNote: '' };
    renderBankerNeed(res.need);
    renderBankerBanner(res.safe, res.sequence || [], '');
    renderBankerTraceList(res.trace, 0);
    renderBankerRuntimeStep(bankState);
    if(els.bankStepHint) els.bankStepHint.hidden = false;
  });

  if (els.bankStep) els.bankStep.addEventListener('click', () => {
    if (!bankState || !bankState.trace.length) return;
    bankState.stepIdx = (bankState.stepIdx + 1) % bankState.trace.length;
    renderBankerRuntimeStep(bankState);
  });

  if (els.bankReset) els.bankReset.addEventListener('click', () => {
    bankState = null;
    if(els.bankStepHint) els.bankStepHint.hidden = true;
    clearEl(document.getElementById('banker-runtime'));
    clearEl(document.getElementById('banker-trace'));
    clearEl(document.getElementById('banker-need-head'));
    clearEl(document.getElementById('banker-need-body'));
    if(els.bankerBanner) els.bankerBanner.hidden = true;
    if(els.bankerError) els.bankerError.hidden = true;
  });

  if (els.formBankerRequest) els.formBankerRequest.addEventListener('submit', (e) => {
    e.preventDefault();
    const rd = getBankerData();
    if(!rd.ok) return;
    const pi = parseInt(els.bankReqP.value, 10);
    const parts = els.bankReqVec.value.split(/[\s,]+/).filter(Boolean);
    if(parts.length !== rd.m) { if(els.bankerError) {els.bankerError.hidden=false; setText(els.bankerError, `Request vector must have ${rd.m} parts.`);} return;}
    
    const req = parts.map(p => parseInt(p, 10));
    const res = bankersRequestGrantSafe(rd.alloc, rd.max, rd.avail, pi, req);
    if (!res.ok) { if(els.bankerError){els.bankerError.hidden=false; setText(els.bankerError, res.error);} return; }
    if(els.bankerError) els.bankerError.hidden = true;

    bankState = { trace: res.trace, stepIdx: 0, safe: res.safe, sequence: res.sequence, need: res.need, requestNote: `Hypothetical grant for P${pi}: [${req.join(',')}]` };
    renderBankerNeed(res.need);
    renderBankerBanner(res.safe, res.sequence || [], '');
    renderBankerTraceList(res.trace, 0);
    renderBankerRuntimeStep(bankState);
    if(els.bankStepHint) els.bankStepHint.hidden = false;
  });
});