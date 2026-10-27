/* להציל את כוכב נוגה — app shell.
 * Runs the same .dc.html screens as the design canvas, with a small template renderer of our own.
 * Works on iPhone / iPad (Safari), Android (Chrome) and desktop. */
(function () {
  'use strict';
  const R = window.React, RD = window.ReactDOM, h = R.createElement;
  const W = 1180, H = 820;
  const RAIL = 72;   // px kept free at the left edge for the ☰ and ⏸ buttons (phones have this space anyway)
  const CFG = window.NOGA_CONFIG || { open: {}, start: 'Story', home: 'Main' };

  // ------------------------------------------------------------------ progress store
  // up to 5 children on one device: each has its own progress record; the first one keeps the original key
  // holidays: light decorations only (dates: Hanukkah 2026 = 4–12 Dec, 2027 = 24 Dec – 1 Jan); ?date=YYYY-MM-DD to preview
  const HOLI = (() => { let d = new Date(); try { const q = new URLSearchParams(location.search).get('date'); if (q) d = new Date(q + 'T12:00:00'); } catch (e) {}
    const t = d.getTime(), r = (a, b) => t >= new Date(a + 'T00:00:00').getTime() && t <= new Date(b + 'T23:59:59').getTime();
    return (r('2026-12-04', '2026-12-12') || r('2027-12-24', '2028-01-01')) ? 'hanukkah' : ''; })();
  window.__nogaHoliday = HOLI;
  const PKEY = 'noga.profiles', MAX_KIDS = 5;
  let PROF = null; try { PROF = JSON.parse(localStorage.getItem(PKEY)); } catch (e) {}
  if (!PROF || !Array.isArray(PROF.list) || !PROF.list.length) PROF = { list: [{ id: 'p1' }], active: 'p1' };
  if (!PROF.list.some(p => p.id === PROF.active)) PROF.active = PROF.list[0].id;
  const KEY = PROF.active === 'p1' ? 'noga.v1' : 'noga.v1.' + PROF.active;
  function saveProf() { try { localStorage.setItem(PKEY, JSON.stringify(PROF)); } catch (e) {} }
  function kidLabel(p, i) { return p.name ? p.name : p.g === 'p' ? 'כַּמָּה יְלָדִים' : 'יֶלֶד/ה ' + (i + 1); }
  function switchKid(id) { if (id === PROF.active) return; PROF.active = id; saveProf(); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} location.reload(); }
  function addKid() { if (PROF.list.length >= MAX_KIDS) return; let n = 2; while (PROF.list.some(p => p.id === 'p' + n)) n++; PROF.list.push({ id: 'p' + n }); switchKid('p' + n); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  // two tabs (or the home-screen app next to a browser tab) each hold a copy: merge with what is stored
  // instead of overwriting it, so stars earned in one copy are never erased by the other
  function merge(into, from) {
    if (!from) return into;
    const fr = from.resetAt || 0, ir = into.resetAt || 0;
    if (fr > ir) { ['done', 'opened', 'help', 'stickers', 'intake', 'time', 'seenStory', 'resetAt', 'last'].forEach(f => { into[f] = from[f]; }); into.done = into.done || {}; return into; }   // the other copy was reset later
    if (ir > fr) return into;
    for (const k in from.done || {}) { const a = into.done[k] || (into.done[k] = {}), b = from.done[k]; for (const g in b) a[g] = g === '_total' ? b[g] : Math.max(Number(a[g]) || 0, Number(b[g]) || 0); }
    ['opened', 'stickers', 'help'].forEach(f => { if (from[f]) into[f] = Object.assign({}, from[f], into[f] || {}); });
    return into;
  }
  function save(s) { try { merge(s, JSON.parse(localStorage.getItem(KEY))); localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  const S = Object.assign({ done: {}, seenStory: false }, load());
  function syncProf() { const me = PROF.list.find(p => p.id === PROF.active); if (me && S.kid && (me.name !== (S.kid.name || '') || me.g !== S.kid.g)) { me.name = S.kid.name || ''; me.g = S.kid.g; saveProf(); } }
  syncProf();
  window.addEventListener('storage', (e) => { if (e.key === KEY) { try { merge(S, JSON.parse(e.newValue)); } catch (err) {} } });

  // ------------------------------------------------------------------ pilot card: the child's name, and boy / girl / several children
  // names/names.json = the 500 most common first names (CBS, born 2019–2020) with the pronunciation Noga records;
  // names/avail.json = ids whose recording is already in names/<id>.mp3. The name stays on this device only.
  const FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' }, UNFIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  const normName = s => String(s || '').replace(/[֑-ׇ\s\-־'׳"״]/g, '').replace(/[ךםןףץ]/g, c => UNFIN[c]);
  const finalize = s => String(s || '').replace(/[ךםןףץ]/g, c => UNFIN[c]).replace(/[כמנפצ](?=$|\s)/g, c => FIN[c]);
  let NAMES = null, NAME_AUDIO = [];
  function kidFor(name, g) { const n = NAMES && name ? NAMES[normName(name)] : null; return { name: name || '', g: g || '', nid: n ? n[1] : null, audio: !!(n && NAME_AUDIO.indexOf(n[1]) >= 0) }; }
  const namesReady = Promise.all([
    fetch('names/names.json').then(r => r.json()).then(j => { NAMES = {}; (j.names || []).forEach(n => { if (!NAMES[n[0]]) NAMES[n[0]] = n; }); }).catch(() => {}),
    fetch('names/avail.json').then(r => r.json()).then(a => { NAME_AUDIO = Array.isArray(a) ? a : []; }).catch(() => {})
  ]).then(() => { if (S.kid) { const k = kidFor(S.kid.name, S.kid.g); if (k.nid !== S.kid.nid || k.audio !== S.kid.audio) { S.kid = k; save(S); } } });
  const KB = 'אבגדהוזחטיכלמנסעפצקרשת'.split('').concat(["'", ' ']);
  const PASS_STARS = 3;   // a game counts toward opening the next planet from 3 stars (random tapping ends with 1–2)
  const store = {
    getDone(k) { return S.done[k] || {}; },
    setDone(k, d, total) { S.done[k] = Object.assign({}, d, { _total: total }); save(S); },
    count(k) { const d = S.done[k]; return d ? Object.keys(d).filter(x => x !== '_total' && Number(d[x]) >= PASS_STARS).length : 0; },
    played(k) { const d = S.done[k]; return d ? Object.keys(d).filter(x => x !== '_total').length : 0; },
    isComplete(k) { const d = S.done[k]; if (!d) return false; return store.count(k) >= Math.min(CFG.pass || 5, d._total || 7); },
    isOpen(k) {
      const m = /^(Heb|Math|Eng)L(\d)$/.exec(k); if (!m) return true;
      const n = Number(m[2]), max = CFG.open[m[1]] || 0;
      if (S.openAll) return true;
      if (n > max) return false;
      if (S.opened && S.opened[k]) return true;   // a planet once opened stays open
      const st = (S.intake && S.intake.start && S.intake.start[m[1]]) || 1;
      const ok = n <= st || store.isComplete(m[1] + 'L' + (n - 1));
      if (ok && n > 1) { S.opened = Object.assign({}, S.opened, { [k]: true }); save(S); }
      return ok;
    },
    config() { return CFG; },
    get(k) { return S[k]; }, set(k, v) { S[k] = v; save(S); },
    // every mistake of the last round of each game, the practice question included, for the parents' report
    noteHelp(k, gi, n) { S.help = Object.assign({}, S.help); S.help[k] = Object.assign({}, S.help[k], { [gi]: n }); save(S); },
    reset() { S.done = {}; S.seenStory = false; S.last = null; S.time = 0; S.intake = null; S.opened = {}; S.help = {}; S.stickers = {}; S.coins = 0; S.shop = {}; S.resetAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} },
    // save everything for playing without internet (the service worker caches the files of this version)
    offline(cb) {
      const sw = navigator.serviceWorker;
      if (!sw || !sw.controller) { cb({ error: 'nosw' }); return; }
      fetch('files.json', { cache: 'no-store' }).then(r => r.json()).then(files => {
        const on = (e) => { const d = e.data || {}; if (d.type !== 'precache') return; if (d.finished) { sw.removeEventListener('message', on); if (!d.failed) { S.offlineV = CFG.v; save(S); } } cb(Object.assign({ total: files.length, mb: Math.round(files.reduce((a, f) => a + (f.s || 0), 0) / 1e6) }, d)); };
        sw.addEventListener('message', on); sw.controller.postMessage({ type: 'precache', files });
      }).catch(() => cb({ error: 'net' }));
    },
    addTime(sec) { S.time = (S.time || 0) + sec; S.lastPlay = Date.now(); save(S); },
  };
  // planets opened under the old rule (any 5 games) stay open for children who already reached them
  if (!S.openedV) {
    S.opened = Object.assign({}, S.opened);
    ['Heb', 'Math', 'Eng'].forEach(p => { for (let n = 2; n <= 7; n++) { const d = S.done[p + 'L' + (n - 1)]; if (d && Object.keys(d).filter(x => x !== '_total').length >= Math.min(CFG.pass || 5, d._total || 7)) S.opened[p + 'L' + n] = true; } });
    S.openedV = 1; save(S);
  }
  // play-time: 1 tick per 15s while the page is visible and a game screen is really on (not the start screen,
  // the parents' area, the questionnaire or a pause)
  let curScreen = 'Start';
  let sessionPlay = 0;
  setInterval(() => { if (document.visibilityState === 'visible' && !/^(Parent|Intake|Start|Pause)$/.test(curScreen)) { store.addTime(15); sessionPlay += 15; } }, 15000);

  // ------------------------------------------------------------------ template compiler
  const EVT = { onclick: 'onClick', onpointerdown: 'onPointerDown', onpointermove: 'onPointerMove', onpointerup: 'onPointerUp', onpointerleave: 'onPointerLeave', onpointercancel: 'onPointerCancel', oninput: 'onInput', onchange: 'onChange', onkeydown: 'onKeyDown' };
  const ATTR = { class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autoplay: 'autoPlay', playsinline: 'playsInline', crossorigin: 'crossOrigin', readonly: 'readOnly' };
  const SKIP = { 'hint-placeholder-count': 1, 'hint-placeholder-val': 1, 'hint-size': 1 };
  function camel(s) { return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase()); }
  function attrName(n, svg) {
    if (EVT[n]) return EVT[n];
    if (ATTR[n]) return ATTR[n];
    if (n.startsWith('data-') || n.startsWith('aria-')) return n;
    if (n.indexOf('-') > 0 && svg) return camel(n);
    if (n === 'xlink:href') return 'xlinkHref';
    return n;
  }
  function parseStyle(s) {
    const out = {}; let depth = 0, cur = '';
    const push = (decl) => { const i = decl.indexOf(':'); if (i < 0) return; const k = decl.slice(0, i).trim(); const v = decl.slice(i + 1).trim(); if (!k) return; out[k.startsWith('--') ? k : camel(k)] = v; };
    for (const ch of String(s)) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ';' && depth === 0) { push(cur); cur = ''; } else cur += ch; }
    push(cur); return out;
  }
  const WHOLE = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/, PART = /\{\{\s*([^{}]+?)\s*\}\}/g;
  function lookup(path, scope) {
    if (path === 'true') return true; if (path === 'false') return false; if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$/.test(path)) return path.slice(1, -1);
    const parts = path.split('.'); let v = scope[parts[0]];
    for (let i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  function val(raw, scope) {
    const m = WHOLE.exec(raw); if (m) return lookup(m[1], scope);
    if (raw.indexOf('{{') < 0) return raw;
    return raw.replace(PART, (_, p) => { const v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function compile(node, svg) {
    if (node.nodeType === 3) { const t = node.nodeValue; if (!t.trim() && /\n/.test(t)) return null; return { text: t }; }
    if (node.nodeType !== 1) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === 'helmet' || tag === 'script') return null;
    const isSvg = svg || tag === 'svg';
    const attrs = [];
    for (const a of node.attributes) { if (!SKIP[a.name]) attrs.push([a.name, a.value]); }
    const children = []; for (const c of node.childNodes) { const k = compile(c, isSvg); if (k) children.push(k); }
    return { tag: node.tagName.indexOf('-') > 0 ? tag : (isSvg ? node.tagName : tag), attrs, children, svg: isSvg };
  }
  function renderList(list, scope, nav) { const out = []; for (let i = 0; i < list.length; i++) { const r = renderNode(list[i], scope, nav, i); if (r != null) out.push(r); } return out; }
  function renderNode(n, scope, nav, key) {
    if (n.text != null) return n.text.indexOf('{{') >= 0 ? val(n.text, scope) : n.text;
    const A = {}; n.attrs.forEach(([k, v]) => { A[k] = v; });
    if (n.tag === 'sc-for') {
      const list = val(A.list || '[]', scope) || []; const as = A.as || 'item';
      return h(R.Fragment, { key }, list.map((it, i) => { const sc = Object.create(scope); sc[as] = it; sc.$index = i; return h(R.Fragment, { key: i }, renderList(n.children, sc, nav)); }));
    }
    if (n.tag === 'sc-if') { return val(A.value || 'false', scope) ? h(R.Fragment, { key }, renderList(n.children, scope, nav)) : null; }
    const props = { key };
    for (const [k, raw] of n.attrs) {
      const name = attrName(k, n.svg); let v = val(raw, scope);
      if (name === 'style') { props.style = parseStyle(v); continue; }
      if (EVT[k]) { if (typeof v === 'function') props[name] = v; continue; }
      props[name] = v;
    }
    if (n.tag === 'a' && typeof props.href === 'string' && /\.dc\.html$/.test(props.href)) {
      const target = props.href.replace(/^.*\//, '').replace('.dc.html', '');
      const prev = props.onClick;
      props.onClick = (e) => { e.preventDefault(); if (typeof prev === 'function') { try { prev(e); } catch (err) {} } nav(target); };
    }
    if (n.tag === 'img' && props.draggable == null) props.draggable = false;
    return h(n.tag, props, n.children.length ? renderList(n.children, scope, nav) : undefined);
  }

  // ------------------------------------------------------------------ board loading
  const boards = {};
  const injected = {};
  function injectHelmet(html) {
    const m = /<helmet>([\s\S]*?)<\/helmet>/.exec(html); if (!m) return;
    const doc = new DOMParser().parseFromString('<head>' + m[1] + '</head>', 'text/html');
    doc.head.childNodes.forEach(n => {
      if (n.nodeType !== 1) return;
      const sig = n.outerHTML; if (injected[sig]) return; injected[sig] = 1;
      // Google Fonts links in the boards are skipped: the fonts ship with the app (fonts/fonts.css), offline and with no outside request.
      if (n.tagName === 'LINK') return;
      if (n.tagName === 'STYLE') { const s = document.createElement('style'); s.textContent = n.textContent; document.head.appendChild(s); }
    });
  }
  class DCLogic extends R.Component {
    render() {
      let vals;
      try { vals = this.renderVals(); } catch (e) { console.error(e); return h('div', { style: { color: '#fff', padding: 40 } }, 'שגיאה במסך: ' + e.message); }
      const scope = Object.assign(Object.create(null), vals);
      const kids = renderList(this.__tpl.children, scope, this.props.nav);
      return kids.length === 1 ? kids[0] : h(R.Fragment, null, kids);
    }
  }
  async function getBoard(name) {
    if (boards[name]) return boards[name];
    const res = await fetch('boards/' + name + '.dc.html');
    if (!res.ok) throw new Error('missing board ' + name);
    const html = await res.text();
    injectHelmet(html);
    const xm = /<x-dc>([\s\S]*?)<\/x-dc>/.exec(html);
    const sm = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/.exec(html);
    const doc = new DOMParser().parseFromString('<!doctype html><html><body>' + (xm ? xm[1] : '') + '</body></html>', 'text/html');
    const tpl = compile(doc.body, false);
    const Base = class extends DCLogic {}; Base.prototype.__tpl = tpl;
    // board logic is precompiled into boards/NAME.js (no eval, works under strict security policies)
    let factory = (window.__DCB || {})[name];
    if (!factory) {
      await new Promise((ok, bad) => { const sc = document.createElement('script'); sc.src = 'boards/' + name + '.js?v=' + (CFG.v || ''); sc.onload = ok; sc.onerror = () => bad(new Error('missing logic ' + name)); document.head.appendChild(sc); }).catch(() => {});
      factory = (window.__DCB || {})[name];
    }
    if (!factory && sm && sm[1].trim()) factory = new Function('DCLogic', 'React', sm[1] + '\n;return Component;');
    const Comp = factory ? factory(Base, R) : class extends Base { renderVals() { return {}; } };
    boards[name] = Comp; return Comp;
  }

  // ------------------------------------------------------------------ shell
  function useFit() {
    const [s, setS] = R.useState(1);
    R.useEffect(() => {
      const f = () => { const vw = window.innerWidth, vh = window.innerHeight; setS(Math.min((vw - RAIL) / W, vh / H)); };
      f(); window.addEventListener('resize', f); window.addEventListener('orientationchange', f);
      return () => { window.removeEventListener('resize', f); window.removeEventListener('orientationchange', f); };
    }, []);
    return s;
  }
  function unlockAudio() {
    try { const a = window.__nogaAu || (window.__nogaAu = new Audio()); a.src = 'audio/silence.mp3'; a.volume = 1; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    try { const C = window.AudioContext || window.webkitAudioContext; if (C) { const c = new C(); const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } } catch (e) {}
  }
  function goFullscreen() {
    const el = document.documentElement;
    try { if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch (e) {}
    try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
  }
  function sendFeedback() {
    const fb = CFG.feedback || {}; const ua = navigator.userAgent.replace(/\).*$/, ')').slice(0, 80);
    const where = (location.hash || '').slice(1) || 'התחלה';
    const body = 'משוב על "להציל את כוכב נוגה"\nגרסה: ' + (CFG.v || '') + ' · מסך: ' + where + '\nמכשיר: ' + ua + '\n\nמה קרה / מה לא עבד:\n\nרעיון לשיפור:\n\nמה הילד/ה אהב/ה:\n';
    const url = fb.wa ? 'https://wa.me/' + fb.wa + '?text=' + encodeURIComponent(body) : 'mailto:' + (fb.mail || '') + '?subject=' + encodeURIComponent('משוב על כוכב נוגה') + '&body=' + encodeURIComponent(body);
    try { window.open(url, '_blank'); } catch (e) { location.href = url; }
  }
  // where the child stopped, in words for the start screen
  const SUBJ = { Heb: 'עִבְרִית', Math: 'חֶשְׁבּוֹן', Eng: 'אַנְגְּלִית' }, MAPS = { Map: 'Heb', MapMath: 'Math', MapEng: 'Eng' };
  function whereLabel(n) { const m = /^(Heb|Math|Eng)L(\d)$/.exec(n || ''); if (m) return SUBJ[m[1]] + ' · כּוֹכָב ' + m[2]; if (MAPS[n]) return 'הַמַּפָּה שֶׁל ' + SUBJ[MAPS[n]]; return 'גֶּשֶׁר הַחֲלָלִית'; }
  // ask the browser not to clear Noga's saved progress when space runs low (Chrome/Android; harmless elsewhere)
  function keepStorage() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {} }
  // in-app browsers (Facebook, Instagram, Line, Android web views) may keep their own short-lived storage
  const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Line\/|; wv\)|WhatsApp/i.test(navigator.userAgent || '');
  const STARS = Array.from({ length: 46 }, (_, i) => [(i * 37) % 100, (i * 53 + 11) % 100, 2 + (i % 3), (i % 7) * 0.35]);
  function App() {
    const scale = useFit();
    const hashName = (location.hash || '').slice(1);
    const initial = hashName && store.isOpen(hashName) ? hashName : '';
    const [started, setStarted] = R.useState(false);
    // coming back (later today or tomorrow) opens where the child stopped: the last planet, map or home screen; a parent reset starts over
    const [name, setName] = R.useState(initial || (S.last && store.isOpen(S.last) ? S.last : (S.seenStory ? CFG.home : CFG.start)));
    const [inGame, setInGame] = R.useState(false);      // a level is showing a game or the lesson (from the board)
    const [paused, setPaused] = R.useState(false);
    const [breakAsk, setBreakAsk] = R.useState(false);
    const inGameRef = R.useRef(false); inGameRef.current = inGame && started;
    curScreen = !started ? 'Start' : paused ? 'Pause' : name;
    const [Comp, setComp] = R.useState(null);
    const [err, setErr] = R.useState('');
    const [portrait, setPortrait] = R.useState(false);
    const [keepPortrait, setKeepPortrait] = R.useState(false);
    const [menu, setMenu] = R.useState(false);
    const [kidsOpen, setKidsOpen] = R.useState(false);
    const [guide, setGuide] = R.useState(false);
    const [kidOpen, setKidOpen] = R.useState(false);
    const [kidV, setKidV] = R.useState(0);
    const [kName, setKName] = R.useState('');
    const [kG, setKG] = R.useState('');
    const kRef = R.useRef({ n: '', g: '' });   // the latest name and choice, also for key handlers set up before a re-render
    const openKid = () => { setMenu(false); const n = (S.kid && S.kid.name) || '', g = (S.kid && S.kid.g) || ''; kRef.current = { n, g }; setKName(n); setKG(g); setKidOpen(true); };
    const kidDone = () => { const kName = kRef.current.n, kG = kRef.current.g; if (!kG || (kG !== 'p' && !kName.trim())) return;   // name and boy / girl are required (or 'several children')
      namesReady.then(() => { S.kid = kidFor(kG === 'p' ? '' : finalize(kName.trim()), kG); S.kidSkip = 0; save(S); syncProf(); setKidOpen(false); setKidV(v => v + 1); }); };
    const setKN = (t) => { kRef.current.n = t; setKName(t); };
    const kidKey = (c) => setKN((kRef.current.n.replace(/[ךםןףץ]/g, x => UNFIN[x]) + c).replace(/^\s+/, '').replace(/\s\s+/g, ' ').slice(0, 14));
    const kidBack = () => setKN(kRef.current.n.slice(0, -1));
    // parent gate: a grown-up question before the parent area (progress reset, open all levels); valid for 15 minutes
    const [parentOk, setParentOk] = R.useState(() => { try { return Number(sessionStorage.getItem('noga_gate') || 0) > Date.now(); } catch (e) { return false; } });
    const newQ = () => { const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4); return { a, b }; };
    const [gq, setGq] = R.useState(newQ);
    const [gAns, setGAns] = R.useState('');
    const [gErr, setGErr] = R.useState(false);
    const gateTry = () => {
      if (Number(gAns) === gq.a * gq.b) { try { sessionStorage.setItem('noga_gate', String(Date.now() + 15 * 60 * 1000)); } catch (e) {} setParentOk(true); setGAns(''); setGErr(false); return; }
      setGErr(true); setGAns(''); setGq(newQ());
    };
    const go = (target) => { setMenu(false); setPaused(false); setBreakAsk(false); unlockAudio(); setName(target); setStarted(true); history.pushState({ b: target }, '', '#' + target); };
    R.useEffect(() => {
      const f = (e) => { const g = e.detail === 'game' || e.detail === 'lesson'; setInGame(g); if (g && !(history.state && history.state.game)) history.pushState({ b: (location.hash || '').slice(1), game: 1 }, '', location.hash); };
      window.addEventListener('noga:screen', f); return () => window.removeEventListener('noga:screen', f);
    }, []);
    R.useEffect(() => { if (!/^(Heb|Math|Eng)L\d$/.test(name)) setInGame(false); setPaused(false); }, [name]);
    R.useEffect(() => { if (started && /^(Main|Map|MapMath|MapEng|(Heb|Math|Eng)L\d)$/.test(name) && S.last !== name) { S.last = name; save(S); } }, [started, name]);
    // the pilot card opens once, the first time the child reaches the home screen (after the story and the pilot choice)
    R.useEffect(() => { if (started && name === CFG.home && !S.kid) openKid(); }, [started, name]);
    R.useEffect(() => {
      if (!kidOpen) return;
      const f = (e) => { if (/^[א-ת' ]$/.test(e.key)) { e.preventDefault(); kidKey(e.key); } else if (e.key === 'Backspace') { e.preventDefault(); kidBack(); } else if (e.key === 'Enter') { e.preventDefault(); kidDone(); } };
      window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
    }, [kidOpen, kG, kName]);
    const pause = () => { setMenu(false); setPaused(true); window.dispatchEvent(new CustomEvent('noga:pause')); };
    const resume = () => { setPaused(false); window.dispatchEvent(new CustomEvent('noga:resume')); };
    const toHub = () => { setPaused(false); window.dispatchEvent(new CustomEvent('noga:hub')); };
    // a break after the daily minutes the parents chose (15 if they skipped the questionnaire), once per session
    R.useEffect(() => {
      const t = setInterval(() => { const goal = ((S.intake && S.intake.minutes) || 15) * 60; if (sessionPlay >= goal && !window.__nogaBreakAsked) { window.__nogaBreakAsked = true; setBreakAsk(true); window.dispatchEvent(new CustomEvent('noga:pause')); } }, 5000);
      return () => clearInterval(t);
    }, []);
    const GUIDE = [
      ['📱', 'מחזיקים את הטלפון לרוחב. בפעם הראשונה לוחצים "מתחילים" ונוגה מספרת את הסיפור.'],
      ['📝', 'שאלון של 2 דקות להורים קובע מאיפה הילד/ה מתחיל/ה בכל מקצוע. אפשר לדלג ולהתחיל מרמה 1.'],
      ['🪐', 'הילד/ה בוחר/ת תחום (עברית, חשבון, אנגלית) ואז כוכב. בכל כוכב: קודם "שיעור עם נוגה", אחר כך 7 משחקים.'],
      ['🔊', 'נוגה אומרת הכול בקול, לא צריך לדעת לקרוא. כשלא בטוחים לוחצים על הרמקול. אחרי טעויות נוגה עוזרת לבד.'],
      ['⭐', 'כל משחק מסתיים ב-1 עד 5 כוכבים, ותמיד אפשר לשחק שוב ולשפר. כוכב חדש נפתח אחרי 5 משחקים עם 3 כוכבים ומעלה, ונוגה מזמינה לטוס אליו.'],
      ['🪙', 'כל תשובה נכונה = מטבע, ועוד מטבעות לפי הכוכבים בסוף משחק. ב"חנות החללית" שבגשר החללית קונים צבע לחללית, אביזר לטייס וחיית מחמד. רק מראה: בלי יתרון במשחק ובלי כסף אמיתי.'],
      ['👧👦', 'כמה ילדים בבית? בתפריט ☰ ← "ילדים במכשיר": לכל ילד/ה כוכבים, מטבעות וכרטיס טייס משלו (עד 5). במסך הפתיחה בוחרים מי משחק.'],
      ['📥', 'לפני טיסה או נסיעה: באזור ההורים "שמירה לשימוש בלי אינטרנט". בלי רשת נוגה מופיעה בתמונות במקום בווידאו, והקול נשמע כרגיל.'],
      ['⏱️', '10–20 דקות ביום מספיקות. עדיף קצת כל יום מאשר הרבה בבת אחת.'],
      ['⏸', 'באמצע משחק: כפתור ⏸ בצד שמאל עוצר הכול — אפשר להמשיך, לבחור משחק אחר או לחזור הביתה.'],
      ['👨‍👩‍👧', 'אזור הורים (כפתור ☰ בצד שמאל למטה, נכנסים עם תרגיל כפל קטן כדי שהילדים לא ייכנסו בטעות): דוח קצר על ההתקדמות, שאלון מחדש, צלילים, פתיחת כל הרמות.'],
      ['🔒', 'הכול נשמר במכשיר הזה בלבד. האפליקציה לא אוספת ולא שולחת שום מידע.'],
    ];
    const guideOv = guide ? h('div', { className: 'ov', onClick: () => setGuide(false) },
      h('div', { className: 'guide', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'guide-head' }, h('span', null, 'איך משתמשים? מדריך קצר להורים'), h('button', { className: 'ov-x', 'aria-label': 'סגירה', onClick: () => setGuide(false) }, '✕')),
        h('ol', { className: 'guide-list' }, GUIDE.map((g, i) => h('li', { key: i }, h('span', { className: 'guide-ic' }, g[0]), h('span', null, g[1])))),
        h('button', { className: 'guide-ok', onClick: () => setGuide(false) }, 'הבנתי'))) : null;
    const gateOv = started && name === 'Parent' && !parentOk ? h('div', { className: 'ov' },
      h('form', { className: 'guide gate', onSubmit: (e) => { e.preventDefault(); gateTry(); } },
        h('div', { className: 'guide-head' }, h('span', null, '🔒 לְהוֹרִים בִּלְבַד'), h('button', { type: 'button', className: 'ov-x', 'aria-label': 'ביטול', onClick: () => go(CFG.home) }, '✕')),
        h('p', { className: 'gate-q' }, 'כדי להיכנס לאזור ההורים, כתבו את התוצאה:'),
        h('div', { className: 'gate-ex', dir: 'ltr' }, gq.a + ' × ' + gq.b + ' = ',
          h('input', { className: 'gate-in', type: 'text', inputMode: 'numeric', pattern: '[0-9]*', autoComplete: 'off', maxLength: 3, value: gAns, autoFocus: true, 'aria-label': 'התוצאה', onChange: (e) => setGAns(e.target.value.replace(/[^0-9]/g, '')) })),
        gErr ? h('p', { className: 'gate-err' }, 'לא נכון, הנה תרגיל אחר.') : null,
        h('div', { className: 'gate-btns' }, h('button', { type: 'submit', className: 'guide-ok' }, 'כניסה'), h('button', { type: 'button', className: 'gate-cancel', onClick: () => go(CFG.home) }, 'חזרה למשחק')))) : null;
    const menuOv = started ? h(R.Fragment, null,
      h('button', { className: 'fab', 'aria-label': 'תפריט', onClick: () => setMenu(m => !m) }, menu ? '✕' : '☰'),
      menu ? h('div', { className: 'menu' },
        h('button', { onClick: () => go(CFG.home) }, '🏠 מסך הבית'),
        h('button', { onClick: () => { setMenu(false); setStarted(false); history.pushState({ b: 'Start' }, '', '#'); } }, '▶ מסך הפתיחה'),
        h('button', { onClick: openKid }, '🧑‍🚀 כרטיס טייס: שם, ילד או ילדה'),
        h('button', { onClick: () => { setMenu(false); setKidsOpen(true); } }, '👧👦 ילדים במכשיר' + (PROF.list.length > 1 ? ' (' + PROF.list.length + ')' : '')),
        h('button', { onClick: () => go('Parent') }, '👨‍👩‍👧 אזור הורים'),
        h('button', { onClick: () => { setMenu(false); setGuide(true); } }, '❓ איך משתמשים'),
        h('button', { className: 'menu-fb', onClick: () => { setMenu(false); sendFeedback(); } }, '💬 שלחו לרן משוב'),
        h('div', { className: 'menu-ver' }, 'גרסה ' + (CFG.v || ''))) : null) : null;
    R.useEffect(() => { const f = () => setPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 900); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
    const nav = R.useCallback((target, replace) => {
      if (!store.isOpen(target)) return;
      if (target === 'Pilots' || target === CFG.home) { S.seenStory = true; save(S); }
      if (replace) history.replaceState({ b: target }, '', '#' + target); else history.pushState({ b: target }, '', '#' + target);
      setName(target);
    }, []);
    R.useEffect(() => {
      const f = (e) => {
        if (inGameRef.current && !(e.state && e.state.game)) { history.pushState({ b: (location.hash || '').slice(1), game: 1 }, '', location.hash); pause(); return; }
        const t = (e.state && e.state.b) || (location.hash || '').slice(1) || CFG.home;
        if (!store.isOpen(t)) { history.replaceState({ b: CFG.home }, '', '#' + CFG.home); setName(CFG.home); return; }
        setName(t);
      };
      window.addEventListener('popstate', f); return () => window.removeEventListener('popstate', f);
    }, []);
    const [tries, setTries] = R.useState(0);
    R.useEffect(() => { let alive = true; setComp(null); setErr(''); getBoard(name).then(C => { if (alive) setComp(() => C); }).catch(e => { if (alive) { console.warn(e); setErr(navigator.onLine === false ? 'offline' : 'load'); } }); return () => { alive = false; }; }, [name, tries]);
    // the space background continues past the game's edges on wide screens (phones held sideways, laptops):
    // near the game it is the same picture at the same scale (bg.jpg 1024×572, 'cover' on 1180×820), farther out a soft blur
    const sw = W * scale, sh = H * scale, sl = RAIL + Math.max(0, (window.innerWidth - RAIL - sw) / 2), stp = Math.max(0, (window.innerHeight - sh) / 2);
    const bgW = H * 1024 / 572 * scale;
    const backdrop = h('div', { className: 'backdrop', 'aria-hidden': 'true' },
      h('div', { className: 'backdrop-far' }),
      h('div', { className: 'backdrop-near', style: { left: sl + sw / 2 - bgW / 2, top: stp, width: bgW, height: sh } }));
    const stage = h('div', { id: 'stage', className: (window.innerWidth - RAIL - sw > 40 || window.innerHeight - sh > 40) ? 'stage-framed' : '', style: { width: W, height: H, transform: 'scale(' + scale + ')', transformOrigin: 'top left', position: 'absolute', left: RAIL + Math.max(0, (window.innerWidth - RAIL - W * scale) / 2), top: Math.max(0, (window.innerHeight - H * scale) / 2), overflow: 'hidden', background: 'transparent' } },
      started && Comp && !(name === 'Parent' && !parentOk) ? h(Comp, { key: name + ':' + kidV, nav, store }) : null,
      started && !Comp && !err ? h('div', { className: 'loading' }, h('div', { className: 'spinner' }), 'טוֹעֲנִים…') : null,
      null,
      !started ? h('div', { className: 'start' },
        STARS.map((st, i) => h('span', { key: 'st' + i, className: 'star', style: { left: st[0] + '%', top: st[1] + '%', width: st[2] + 'px', height: st[2] + 'px', animationDelay: st[3] + 's' } })),
        h('img', { src: 'assets/saturn.webp', alt: '', className: 'deco deco-planet', style: { left: '4%', top: '6%', width: '16vw', maxWidth: 200, animationDelay: '0s' } }),
        h('img', { src: 'assets/mars.webp', alt: '', className: 'deco deco-planet', style: { right: '6%', bottom: '8%', width: '9vw', maxWidth: 120, animationDelay: '-2s' } }),
        h('img', { src: 'assets/neptune.webp', alt: '', className: 'deco deco-planet', style: { right: '18%', top: '8%', width: '7vw', maxWidth: 90, animationDelay: '-4s' } }),
        h('img', { src: 'assets/zallon.webp', alt: '', className: 'deco deco-alien', style: { left: '12%', bottom: '10%', width: '15vw', maxWidth: 190 } }),
        h('img', { src: 'assets/alien.webp', alt: '', className: 'deco deco-alien', style: { right: '7%', top: '28%', width: '11vw', maxWidth: 140, animationDelay: '-1.1s' } }),
        h('img', { src: 'assets/math.webp', alt: '', className: 'deco deco-alien', style: { left: '26%', top: '12%', width: '9vw', maxWidth: 110, animationDelay: '-0.6s' } }),
        h('img', { src: 'assets/eng.webp', alt: '', className: 'deco deco-alien', style: { right: '24%', bottom: '6%', width: '9vw', maxWidth: 110, animationDelay: '-1.6s' } }),
        h('img', { src: 'assets/ship.webp', alt: '', className: 'deco deco-ship', style: { left: '22%', bottom: '32%', width: '12vw', maxWidth: 150 } }),
        h('img', { src: 'assets/noga_friendly.webp', alt: 'נוגה', className: 'start-noga' }),
        HOLI === 'hanukkah' ? h(R.Fragment, null,
          h('span', { className: 'holi holi-big', style: { right: '30%', top: '6%' } }, '🕎'),
          ['🍩', '✨', '🍩', '✨', '🍩'].map((e, i) => h('span', { key: 'hl' + i, className: 'holi', style: { left: (8 + i * 19) + '%', top: (18 + (i % 2) * 52) + '%', animationDelay: (i * 0.4) + 's' } }, e)),
          h('span', { className: 'holi-msg' }, 'חֲנֻכָּה שָׂמֵחַ! 🕎')) : null,
        h('h1', null, 'לְהַצִּיל אֶת כּוֹכַב נֹגַהּ'),
        (S.seenStory || S.last) ? h('div', { className: 'start-where' }, 'מַמְשִׁיכִים מֵאֵיפֹה שֶׁעָצַרְנוּ: ' + whereLabel(name)) : null,
        h('button', { className: 'start-btn', onClick: () => { unlockAudio(); goFullscreen(); keepStorage(); setStarted(true); history.replaceState({ b: name }, '', '#' + name); } }, (S.seenStory || S.last) ? '▶  מַמְשִׁיכִים' : '▶  מַתְחִילִים'),
        IN_APP ? h('div', { className: 'start-inapp' }, 'כְּדֵי שֶׁהַהִתְקַדְּמוּת תִּשָּׁמֵר, פִּתְחוּ אֶת הָאַפְּלִיקַצְיָה בַּדַּפְדְּפָן (Chrome אוֹ Safari) וְלֹא מִתּוֹךְ וָואטְסְאַפּ אוֹ פֵיְיסְבּוּק.') : null,
        PROF.list.length > 1 ? h('div', { className: 'start-kids', role: 'radiogroup', 'aria-label': 'מי משחק' }, h('span', { className: 'start-kids-q' }, 'מִי מְשַׂחֵק?'),
          PROF.list.map((p, i) => h('button', { key: p.id, role: 'radio', 'aria-checked': p.id === PROF.active ? 'true' : 'false', className: 'kchip' + (p.id === PROF.active ? ' on' : ''), onClick: () => switchKid(p.id) }, (p.g === 'f' ? '👧 ' : p.g === 'm' ? '👦 ' : '🧒 ') + kidLabel(p, i)))) : null,
        h('div', { className: 'start-parents' },
          h('button', { className: 'pbtn', onClick: () => go('Parent') }, '👨‍👩‍👧 אזור הורים'),
          !S.intake ? h('button', { className: 'pbtn pbtn-gold', onClick: () => go('Intake') }, '📝 שאלון לבחירת רמה (2 דק׳)') : null,
          h('button', { className: 'pbtn', onClick: () => setGuide(true) }, '❓ איך משתמשים'))) : null,
      null);
    const pauseOv = paused && !breakAsk ? h('div', { className: 'ov pause-ov' },
      h('div', { className: 'pause' },
        h('img', { src: 'assets/noga_friendly.webp', alt: 'נוגה', className: 'pause-noga' }),
        h('div', { className: 'pause-title' }, 'הַפְסָקָה'),
        h('button', { className: 'big-btn', onClick: resume }, '▶ מַמְשִׁיכִים לְשַׂחֵק'),
        h('div', { className: 'pause-row' },
          h('button', { className: 'big-btn big-btn-2', onClick: toHub }, '🪐 מִשְׂחָק אַחֵר'),
          h('button', { className: 'big-btn big-btn-2', onClick: () => go(CFG.home) }, '🏠 הַבַּיְתָה')))) : null;
    const breakOv = breakAsk ? h('div', { className: 'ov pause-ov' },
      h('div', { className: 'pause' },
        h('img', { src: 'assets/noga_clapping.webp', alt: 'נוגה', className: 'pause-noga' }),
        h('div', { className: 'pause-title' }, 'כׇּל הַכָּבוֹד! זֶה זְמַן טוֹב לְהַפְסָקָה'),
        h('div', { className: 'pause-sub' }, 'שִׂחַקְתֶּם הַיּוֹם ' + Math.round(sessionPlay / 60) + ' דַּקּוֹת. נוֹגָה תְּחַכֶּה לָכֶם מָחָר!'),
        h('div', { className: 'pause-row' },
          h('button', { className: 'big-btn', onClick: () => { setBreakAsk(false); setPaused(false); setStarted(false); history.pushState({ b: 'Start' }, '', '#'); } }, '🌙 סִיַּמְנוּ לְהַיּוֹם'),
          h('button', { className: 'big-btn big-btn-2', onClick: () => { setBreakAsk(false); resume(); } }, 'עוֹד קְצָת')))) : null;
    const errOv = err && started ? h('div', { className: 'ov pause-ov' }, h('div', { className: 'pause' },
        h('div', { style: { fontSize: 64 } }, '🛰️'),
        err === 'offline' ? 'אֵין חִבּוּר לָאִינְטֶרְנֶט, וְהַכּוֹכָב הַזֶּה עוֹד לֹא יָרַד לַמַּכְשִׁיר.' : 'הַכּוֹכָב לֹא נִטְעַן. נְנַסֶּה שׁוּב?',
        h('div', { style: { display: 'flex', gap: 16 } },
          h('button', { className: 'big-btn', onClick: () => { delete boards[name]; setTries(t => t + 1); } }, '↻ לְנַסּוֹת שׁוּב'),
          h('button', { className: 'big-btn big-btn-2', onClick: () => go(CFG.home) }, '🏠 הַבַּיְתָה')))) : null;
    const kidOv = kidOpen ? h('div', { className: 'ov kid-ov' },
      h('div', { className: 'kid', role: 'dialog', 'aria-label': 'כרטיס טייס' },
        h('div', { className: 'kid-head' },
          h('span', { className: 'kid-title' }, '🧑‍🚀 כַּרְטִיס טַיָּס'),
          h('div', { className: 'kid-acts' },
            h('button', { className: 'big-btn kid-ok', disabled: !kG || (kG !== 'p' && !kName.trim()), onClick: kidDone }, '✓ מוּכָן'))),
        h('div', { className: 'kid-g', role: 'radiogroup', 'aria-label': 'מי משחק' }, [['m', '👦', 'יֶלֶד'], ['f', '👧', 'יַלְדָּה'], ['p', '👫', 'כַּמָּה יְלָדִים']].map(o =>
          h('button', { key: o[0], role: 'radio', 'aria-checked': kG === o[0] ? 'true' : 'false', className: 'kid-gb' + (kG === o[0] ? ' on' : ''), onClick: () => { kRef.current.g = o[0]; setKG(o[0]); } }, h('span', { className: 'kid-ge', 'aria-hidden': 'true' }, o[1]), o[2]))),
        kG === 'p' ? h('div', { className: 'kid-many' }, 'נוֹגָה תְּדַבֵּר אֶל כֻּלְּכֶם יַחַד.') : h(R.Fragment, null,
          h('div', { className: 'kid-row' },
            h('div', { className: 'kid-name', 'aria-live': 'polite' }, kName ? finalize(kName) : h('span', { className: 'kid-ph' }, 'כּוֹתְבִים כָּאן אֶת הַשֵּׁם')),
            h('button', { className: 'kid-del', 'aria-label': 'מחיקת אות', onClick: kidBack }, '⌫')),
          h('div', { className: 'kid-kb' }, KB.map(c => h('button', { key: c, className: 'kid-k' + (c === ' ' ? ' kid-sp' : ''), 'aria-label': c === ' ' ? 'רווח' : c, onClick: () => kidKey(c) }, c === ' ' ? 'רֶוַח' : c)))))) : null;
    const pauseBtn = started && inGame && !paused && !breakAsk ? h('button', { className: 'pause-fab', 'aria-label': 'הַפְסָקָה', onClick: pause }, '⏸') : null;
    const kidsOv = kidsOpen ? h('div', { className: 'ov', onClick: () => setKidsOpen(false) },
      h('div', { className: 'guide kids-box', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'guide-head' }, h('span', null, '👧👦 יְלָדִים בַּמַּכְשִׁיר'), h('button', { className: 'ov-x', 'aria-label': 'סגירה', onClick: () => setKidsOpen(false) }, '✕')),
        h('p', { className: 'kids-note' }, 'לְכָל יֶלֶד וְיַלְדָּה כּוֹכָבִים, מַטְבְּעוֹת וְכַרְטִיס טַיָּס מִשֶּׁלָּהֶם. עַד ' + MAX_KIDS + ' יְלָדִים.'),
        h('div', { className: 'kids-list' }, PROF.list.map((p, i) => h('button', { key: p.id, className: 'kchip big' + (p.id === PROF.active ? ' on' : ''), onClick: () => { if (p.id === PROF.active) setKidsOpen(false); else switchKid(p.id); } },
          (p.g === 'f' ? '👧 ' : p.g === 'm' ? '👦 ' : '🧒 ') + kidLabel(p, i) + (p.id === PROF.active ? ' · מְשַׂחֵק עַכְשָׁו' : '')))),
        PROF.list.length < MAX_KIDS ? h('button', { className: 'guide-ok', onClick: addKid }, '➕ יֶלֶד אוֹ יַלְדָּה נוֹסָפִים') : null)) : null;
    return h(R.Fragment, null, backdrop, stage, kidsOv, pauseBtn, menuOv, guideOv, pauseOv, breakOv, errOv, gateOv, kidOv, portrait && !keepPortrait ? h('div', { className: 'rotate' }, h('div', { className: 'rotate-icon' }, '📱↻'), 'סוֹבְבוּ אֶת הַמַּכְשִׁיר לְרֹחַב', h('button', { className: 'rotate-skip', onClick: () => setKeepPortrait(true) }, 'לְהַמְשִׁיךְ בְּלִי לְסוֹבֵב')) : null);
  }
  RD.createRoot(document.getElementById('root')).render(h(App));
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || /[?&]sw=1/.test(location.search))) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
