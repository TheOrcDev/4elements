#!/usr/bin/env node
// Headless screenshot + console capture for the scene, with the real GPU.
// Zero dependencies: drives Chrome over the DevTools protocol with Node's built-in WebSocket.
//
//   node tools/shot.mjs --url "http://localhost:5195/?solo=fire&t=8" --out /abs/path/fire.png
//
// Options
//   --url <url>        page to open (required)
//   --out <file.png>   where to write the screenshot (required unless --no-shot)
//   --width <px>       viewport width in CSS px            (default 1280)
//   --height <px>      viewport height in CSS px           (default 720)
//   --dpr <n>          device pixel ratio                  (default 1)
//   --wait <ms>        how long to wait for window.__ready (default 30000)
//   --timeout <ms>     give up on the whole run after this long (default 180000)
//   --no-lock          do not wait for other runs of this tool (see below)
//   --advance <sec>    after ready, step the simulation forward by this many seconds
//   --settle <ms>      after ready, let the page run in real time for this long
//   --frames <n>       take n screenshots (file-01.png, file-02.png, ...)
//   --interval <sec>   simulation seconds between those screenshots (default 0.5)
//   --eval <js>        evaluate an expression in the page after ready and print the result
//   --bench <n>        print the average GPU-synced frame time over n frames
//   --clip x,y,w,h     only capture this CSS-pixel rectangle
//   --no-shot          skip the screenshot (console / eval / bench only)
//
// Runs take turns: only one headless Chrome uses the GPU at a time, however many shells call
// this tool at once, so captures do not starve each other and timings mean something.
// The page it opens ignores the dev server's hot updates, so saving a source file while a run
// is in progress does not reload the scene under it.
//
// Every console message and page error is printed. The exit code is 1 when the page
// threw, a shader failed to compile, or window.__ready never became true.

import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.url || (!args.out && !args['no-shot'])) {
  console.error('usage: node tools/shot.mjs --url <url> --out <file.png> [options]  (see the header of this file)');
  process.exit(2);
}
const width = Number(args.width || 1280);
const height = Number(args.height || 720);
const dpr = Number(args.dpr || 1);
const waitMs = Number(args.wait || 30000);
const frames = Math.max(1, Number(args.frames || 1));
const interval = Number(args.interval || 0.5);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let failed = false;

// ---- one run at a time ------------------------------------------------------------
// A directory is the lock (mkdir is atomic); it holds the owner's pid so that a lock left
// behind by a killed run is recognised and taken over.
const lockDir = path.join(tmpdir(), 'elementa-shot.lock');
let haveLock = false;
function releaseLock() {
  if (!haveLock) return;
  haveLock = false;
  try { rmSync(lockDir, { recursive: true, force: true }); } catch {}
}
function ownerAlive() {
  try {
    const pid = Number(readFileSync(path.join(lockDir, 'pid'), 'utf8'));
    if (!pid) return false;
    process.kill(pid, 0);
    return true;
  } catch (err) {
    if (err.code === 'EPERM') return true;
    // No pid file yet: the owner may be between mkdir and writing it.
    try { return err.code === 'ENOENT' && Date.now() - statSync(lockDir).mtimeMs < 2000; } catch { return false; }
  }
}
if (!args['no-lock']) {
  const lockStart = Date.now();
  for (;;) {
    try {
      mkdirSync(lockDir);
      writeFileSync(path.join(lockDir, 'pid'), String(process.pid));
      haveLock = true;
      break;
    } catch (err) {
      if (err.code !== 'EEXIST') break;                       // cannot lock here: run unlocked
      if (!ownerAlive()) { try { rmSync(lockDir, { recursive: true, force: true }); } catch {} continue; }
      if (Date.now() - lockStart > 15 * 60 * 1000) { console.log('[shot] waited 15 min for other runs; going ahead'); break; }
      await sleep(150 + Math.random() * 200);
    }
  }
}
process.on('exit', releaseLock);

const userDataDir = mkdtempSync(path.join(tmpdir(), 'elementa-shot-'));

// A headless Chrome that never comes up, or a capture that never returns, must not hang the caller.
const watchdog = setTimeout(() => {
  console.log(`[shot] gave up after ${Number(args.timeout || 180000)} ms`);
  process.exit(1);
}, Number(args.timeout || 180000));
watchdog.unref();

const chrome = spawn(CHROME, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDir}`,
  '--use-angle=metal',
  '--enable-gpu',
  '--ignore-gpu-blocklist',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-networking',
  '--disable-component-update',
  '--disable-extensions',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--hide-scrollbars',
  '--mute-audio',
  '--autoplay-policy=no-user-gesture-required',
  `--window-size=${width},${height}`,
  'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

function cleanup() {
  try { chrome.kill('SIGKILL'); } catch {}
  try { rmSync(userDataDir, { recursive: true, force: true }); } catch {}
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  const timer = setTimeout(() => reject(new Error('Chrome did not start within 20 s')), 20000);
  chrome.stderr.on('data', (d) => {
    buf += d.toString();
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(timer); resolve(m[1]); }
  });
  chrome.on('exit', (code) => reject(new Error(`Chrome exited early (code ${code})`)));
});

const ws = new WebSocket(wsUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('WebSocket failed')); });

let nextId = 1;
const pending = new Map();
const listeners = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(`${msg.error.message}`)); else resolve(msg.result);
  } else if (msg.method && listeners.has(msg.method)) {
    listeners.get(msg.method)(msg.params);
  }
};
function send(method, params = {}, sessionId) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
}

function describe(arg) {
  if (arg.type === 'string') return arg.value;
  if ('value' in arg) return typeof arg.value === 'object' ? JSON.stringify(arg.value) : String(arg.value);
  return arg.description || arg.type;
}

listeners.set('Runtime.consoleAPICalled', (p) => {
  const text = p.args.map(describe).join(' ');
  if (/^\[vite\]/.test(text)) return;
  if (p.type === 'error' || /Shader Error|WebGL: INVALID|GL_INVALID|ERROR: \d+:\d+/.test(text)) failed = true;
  console.log(`[console.${p.type}] ${text}`);
});
listeners.set('Runtime.exceptionThrown', (p) => {
  failed = true;
  const d = p.exceptionDetails;
  console.log(`[page error] ${d.exception?.description || d.text} (${d.url || ''}:${d.lineNumber ?? ''})`);
});
listeners.set('Log.entryAdded', (p) => {
  if (p.entry.level === 'error') {
    failed = true;
    console.log(`[log.error] ${p.entry.text} ${p.entry.url || ''}`);
  }
});

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const S = (method, params) => send(method, params, sessionId);
await S('Page.enable');
await S('Runtime.enable');
await S('Log.enable');
await S('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile: false });

// The dev server tells every open page to reload when a source file is saved. A reload in the
// middle of a run would restart the scene under the capture, so this page's hot-update socket is
// replaced by one that never says anything: the page keeps the code it loaded.
await S('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    const Native = window.WebSocket;
    class Silent extends EventTarget {
      constructor() { super(); this.OPEN = 1; this.readyState = 1; }
      send() {}
      close() {}
    }
    window.WebSocket = new Proxy(Native, {
      construct(target, [url, protocols]) {
        const list = [].concat(protocols || []);
        return list.some((p) => /^vite-/.test(p)) ? new Silent() : new target(url, protocols);
      },
    });
  })();`,
});

async function evaluate(expression) {
  const r = await S('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) {
    failed = true;
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r.result.value;
}

async function capture(file) {
  await evaluate('window.__app && window.__app.render ? (window.__app.render(), 1) : 0').catch(() => {});
  const params = { format: 'png', captureBeyondViewport: false };
  if (typeof args.clip === 'string') {
    const [x, y, w, h] = args.clip.split(',').map(Number);
    params.clip = { x, y, width: w, height: h, scale: 1 };
  }
  const { data } = await S('Page.captureScreenshot', params);
  mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  writeFileSync(file, Buffer.from(data, 'base64'));
  console.log(`[shot] ${path.resolve(file)}`);
}

try {
  await S('Page.navigate', { url: args.url });
  const start = Date.now();
  let ready = false;
  while (Date.now() - start < waitMs) {
    ready = await evaluate('window.__ready === true').catch(() => false);
    if (ready) break;
    await sleep(120);
  }
  if (!ready) {
    failed = true;
    console.log(`[shot] window.__ready was not set within ${waitMs} ms`);
  }
  if (ready && args.advance) await evaluate(`window.__app.advance(${Number(args.advance)})`);
  if (args.settle) await sleep(Number(args.settle));
  if (typeof args.eval === 'string') {
    const value = await evaluate(args.eval);
    console.log(`[eval] ${typeof value === 'object' ? JSON.stringify(value) : value}`);
  }
  if (ready && args.bench) {
    const ms = await evaluate(`window.__app.bench(${Number(args.bench)})`);
    console.log(`[bench] ${typeof ms === 'object' ? JSON.stringify(ms) : ms}`);
  }
  if (!args['no-shot']) {
    if (frames === 1) {
      await capture(args.out);
    } else {
      const ext = path.extname(args.out);
      const base = args.out.slice(0, -ext.length);
      // Hold the page's own clock so the frames are exactly `interval` apart whatever the machine is doing.
      if (ready) await evaluate('window.__app.setPaused(true)');
      for (let i = 0; i < frames; i++) {
        if (i > 0 && ready) await evaluate(`window.__app.advance(${interval})`);
        await capture(`${base}-${String(i + 1).padStart(2, '0')}${ext}`);
      }
    }
  }
} catch (err) {
  failed = true;
  console.log(`[shot] ${err.message}`);
} finally {
  try { await send('Browser.close'); } catch {}
  ws.close();
  cleanup();
}
process.exit(failed ? 1 : 0);
